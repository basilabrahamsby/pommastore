from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload, joinedload
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid
from decimal import Decimal
import hmac
import hashlib

from app.core.database import get_db
from app.core.deps import get_current_customer
from app.models.customer import Customer, CustomerAddress
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod, OrderStatusHistory
from app.models.inventory import InventoryBatch, InventoryMovement
from app.models.product import ProductVariant, Product
from app.models.offer import Offer
from app.schemas.order import OrderCreate, OrderOut, OrderItemOut, OrderItemCreate
from app.services.email import (
    send_order_confirmation_email,
    order_items_to_email_list,
    generate_invoice_html,
    generate_invoice_pdf,
)
from app.services.sms import sendsms_ordercustomer, sendsms_orderadmin
from app.models.user import User, UserRole
from app.models.system import SystemSettings
from app.core.config import settings
import hmac
import hashlib

router = APIRouter(prefix="/orders", tags=["Storefront Orders"])

class RazorpayOrderCreate(BaseModel):
    items: List[OrderItemCreate]
    loyalty_points_used: int = 0
    shipping_amount: float = 0.0
    discount_amount: float = 0.0

class OrderTrackRequest(BaseModel):
    order_number: str
    contact: str # email or phone

async def generate_order_number(db: AsyncSession) -> str:
    now = datetime.now(timezone.utc)
    prefix = f"PS-{now.year}-"
    res = await db.execute(select(Order.order_number).where(Order.order_number.like(f"{prefix}%")))
    numbers = res.scalars().all()
    max_seq = 0
    for num in numbers:
        try:
            seq = int(num.replace(prefix, "").strip())
            if seq > max_seq:
                max_seq = seq
        except ValueError:
            pass
    next_seq = max_seq + 1
    return f"{prefix}{next_seq:03d}"

def _enrich_order(order: Order) -> OrderOut:
    out = OrderOut.model_validate(order)
    # Ensure customer details from the linked customer record if they aren't on the order snapshot or are generic
    if order.customer:
        if not out.customer_name or out.customer_name == "New Customer":
            out.customer_name = order.customer.full_name
        if not out.customer_email:
            out.customer_email = order.customer.email
        if not out.customer_phone:
            out.customer_phone = order.customer.phone
    return out


from app.core.database import AsyncSessionLocal

async def book_delhivery_shipment_task(order_id: uuid.UUID):
    import random
    
    async with AsyncSessionLocal() as db:
        q = select(Order).where(Order.id == order_id)
        res = await db.execute(q)
        order = res.scalar_one_or_none()
        if not order:
            return
            
        mock_waybill = f"PND{random.randint(10000000, 99999999)}"
        order.tracking_number = mock_waybill
        order.carrier = "Panda Delivery"
        
        history = OrderStatusHistory(
            order_id=order.id,
            status=order.status,
            notes=f"Automated shipping label generated with Panda Delivery. Waybill: {mock_waybill}"
        )
        db.add(history)
        await db.commit()


@router.get("/{order_id}/invoice", response_class=HTMLResponse)
async def get_storefront_order_invoice(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")

    result = await db.execute(
        select(Order)
        .where(Order.id == order_uuid)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            joinedload(Order.customer),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Query company details
    comp_res = await db.execute(select(SystemSettings).where(SystemSettings.key == "company"))
    comp_setting = comp_res.scalar_one_or_none()
    company_details = comp_setting.value if comp_setting else None

    html_content = generate_invoice_html(order, company_details)
    return HTMLResponse(content=html_content)


@router.get("/{order_id}/invoice/pdf")
async def get_storefront_order_invoice_pdf(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")

    result = await db.execute(
        select(Order)
        .where(Order.id == order_uuid)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            joinedload(Order.customer),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Query company details
    comp_res = await db.execute(select(SystemSettings).where(SystemSettings.key == "company"))
    comp_setting = comp_res.scalar_one_or_none()
    company_details = comp_setting.value if comp_setting else None

    pdf_buffer = generate_invoice_pdf(order, company_details)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{order.order_number}.pdf"}
    )


@router.get("/shipping/verify-pincode", status_code=200)
async def verify_shipping_pincode(pincode: str):
    if not pincode or len(pincode.strip()) < 4:
        raise HTTPException(status_code=400, detail="Invalid pincode format.")
    return {
        "serviceable": True,
        "cod_available": True,
        "prepaid_available": True,
        "district": "",
        "state": "",
        "shipping_fee": 17.0,
        "message": "Serviceable in UAE"
    }


@router.post("/track")
async def track_order(body: OrderTrackRequest, db: AsyncSession = Depends(get_db)):
    q = select(Order).where(Order.order_number.ilike(body.order_number.strip()))
    result = await db.execute(q)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found. Please check the Order Number.")
    
    match = False
    clean_contact = body.contact.strip().lower()
    
    if order.customer_email and order.customer_email.lower() == clean_contact:
        match = True
    elif order.customer_phone and order.customer_phone.strip() in clean_contact:
        match = True
    elif clean_contact in (order.customer_phone or "").strip():
        match = True
        
    if not match:
        raise HTTPException(
            status_code=404,
            detail="Contact information does not match this order. Please use the email or phone number provided during checkout."
        )

    # Re-fetch with joined loads for items and history
    q = select(Order).where(Order.id == order.id).options(
        selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
        selectinload(Order.status_history)
    )
    result = await db.execute(q)
    order = result.scalar_one()

    return _enrich_order(order)
@router.post("/checkout", response_model=OrderOut, status_code=201)
async def storefront_checkout(
    body: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    # Explicitly override and set customer credentials securely from the logged-in session!
    body.customer_id = customer.id
    body.customer_name = body.customer_name or customer.full_name
    body.customer_email = body.customer_email or customer.email
    body.customer_phone = body.customer_phone or customer.phone or (body.shipping_address.get("phone") if body.shipping_address else None)
    body.channel = "storefront"

    if body.customer_phone and not customer.phone:
        customer.phone = body.customer_phone
        db.add(customer)

    if not body.customer_phone or not body.customer_email:
        raise HTTPException(
            status_code=400, 
            detail="Mobile and email are compulsory to complete checkout."
        )
    
    subtotal = sum(item.unit_price * item.quantity - item.discount_amount for item in body.items)
    
    # Loyalty points redemption logic (1 point = ₹1)
    redemption_amount = 0.0
    if body.loyalty_points_used > 0:
        if customer.loyalty_points < body.loyalty_points_used:
            raise HTTPException(status_code=400, detail="Insufficient loyalty points for redemption.")
        redemption_amount = float(body.loyalty_points_used)
        customer.loyalty_points -= body.loyalty_points_used

    total = subtotal - body.discount_amount + body.tax_amount + body.shipping_amount - redemption_amount

    # Save the shipping address to CustomerAddress if it's a new one
    if body.shipping_address:
        sa = body.shipping_address
        pincode = sa.get("pincode")
        line1 = sa.get("address_line1")
        if pincode and line1:
            addr_check = await db.execute(
                select(CustomerAddress).where(
                    CustomerAddress.customer_id == customer.id,
                    CustomerAddress.pincode == pincode,
                    CustomerAddress.address_line1 == line1
                )
            )
            existing_addr = addr_check.scalar_one_or_none()
            if not existing_addr:
                new_addr = CustomerAddress(
                    customer_id=customer.id,
                    label=sa.get("label") or "Saved Location",
                    address_line1=line1,
                    address_line2=sa.get("address_line2"),
                    city=sa.get("city"),
                    state=sa.get("state"),
                    pincode=pincode,
                    country=sa.get("country") or "India",
                    is_default=False
                )
                db.add(new_addr)

    # Instantiate our main order record
    order = Order(
        order_number=await generate_order_number(db),
        customer_id=customer.id,
        processed_by=None, # Initiated by customer
        channel=body.channel,
        payment_method=body.payment_method,
        payment_status=body.payment_status or PaymentStatus.pending,
        subtotal=subtotal,
        discount_amount=body.discount_amount,
        loyalty_points_used=body.loyalty_points_used,
        tax_amount=body.tax_amount,
        shipping_amount=body.shipping_amount,
        total_amount=total,
        notes=body.notes,
        gift_message=body.gift_message,
        coupon_code=body.coupon_code,
        shipping_address=body.shipping_address,
        billing_address=body.billing_address,
        customer_name=customer.full_name,
        customer_phone=customer.phone,
        customer_email=customer.email,
        transaction_id=body.transaction_id,
        payment_gateway=body.payment_gateway,
        payment_details=body.payment_details,
    )
    db.add(order)
    await db.flush()

    # Record initial status
    history = OrderStatusHistory(
        order_id=order.id,
        status=order.status,
        notes="Order placed via Storefront"
    )
    db.add(history)

    # Process items and deduct from inventory FIFO batching system!
    earned_points = 0
    for item_data in body.items:
        # Fetch variant along with product name details to get loyalty points & construct warning logs
        variant_res = await db.execute(
            select(ProductVariant)
            .where(ProductVariant.id == item_data.variant_id)
            .options(joinedload(ProductVariant.product))
        )
        variant = variant_res.scalar_one_or_none()
        if variant and variant.loyalty_points:
            earned_points += (variant.loyalty_points * item_data.quantity)

        batch_result = await db.execute(
            select(InventoryBatch)
            .where(
                InventoryBatch.variant_id == item_data.variant_id,
                InventoryBatch.current_quantity >= item_data.quantity,
            )
            .order_by(InventoryBatch.received_at)
            .limit(1)
        )
        batch = batch_result.scalar_one_or_none()
        if not batch:
            variant_name = "Unknown Product"
            if variant and variant.product:
                size_str = f" ({variant.size_ml}ml)" if variant.size_ml else ""
                variant_name = f"{variant.product.name}{size_str}"
            else:
                variant_name = f"Variant {item_data.variant_id}"
                
            raise HTTPException(
                status_code=400, 
                detail=f"We apologize, but there is insufficient stock for '{variant_name}'. Please adjust the quantity or check stock availability."
            )

        # Deduct and update stock
        batch.current_quantity -= item_data.quantity

        # Create auditing records
        movement = InventoryMovement(
            batch_id=batch.id,
            type="Deduction",
            quantity=-item_data.quantity,
            reason=f"Sales Order Fulfillment ({order.order_number})"
        )
        db.add(movement)

        item = OrderItem(
            order_id=order.id,
            variant_id=item_data.variant_id,
            batch_id=batch.id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            cost_price=batch.purchase_cost,
            discount_amount=item_data.discount_amount,
            total_price=item_data.unit_price * item_data.quantity - item_data.discount_amount,
        )
        db.add(item)

    # Update Customer Global Statistics
    customer.order_count += 1
    customer.total_spent += Decimal(str(total))
    customer.last_order_at = datetime.now(timezone.utc)
    
    # Gift loyalty points based on product settings
    if earned_points > 0:
        customer.loyalty_points += earned_points

    # Handle Coupons/Offers tracking
    if body.coupon_code:
        offer_result = await db.execute(select(Offer).where(Offer.code == body.coupon_code))
        db_offer = offer_result.scalar_one_or_none()
        if db_offer:
            db_offer.redemption_count += 1
            db_offer.attributed_revenue += Decimal(str(total))

    await db.commit()

    # Return fully loaded, hydrated order output structure
    final_result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            selectinload(Order.status_history),
            joinedload(Order.customer),
        )
    )
    order = final_result.scalar_one()
    enriched = _enrich_order(order)

    # Send order confirmation email in background
    background_tasks.add_task(
        send_order_confirmation_email,
        to_email=enriched.customer_email,
        customer_name=enriched.customer_name or "Valued Customer",
        order_number=enriched.order_number,
        items=order_items_to_email_list(order.items),
        total=float(enriched.total_amount),
        subtotal=float(enriched.subtotal),
        discount=float(enriched.discount_amount),
        shipping=float(enriched.shipping_amount),
        tax=float(enriched.tax_amount),
        loyalty_used=enriched.loyalty_points_used or 0,
        shipping_address=enriched.shipping_address,
        payment_method=enriched.payment_method or "",
        coupon_code=enriched.coupon_code or "",
        gift_message=enriched.gift_message or "",
        customer_email=enriched.customer_email or "",
        customer_phone=enriched.customer_phone or "",
    )
    
    # Send order confirmation SMS to customer
    if enriched.customer_phone:
        msg = f"Thank you for your order #{enriched.order_number} at POMMASTORE! Total amount: INR {float(enriched.total_amount):.2f}. Track order: https://pommastore.com/track-order?order={enriched.order_number}&contact={enriched.customer_phone}"
        background_tasks.add_task(sendsms_ordercustomer, enriched.customer_phone, msg)
        
    # Notify admin/manager via SMS
    background_tasks.add_task(
        sendsms_orderadmin,
        "918848079307",
        f"ALERT: New Order #{enriched.order_number} has been placed successfully by {enriched.customer_name or 'customer'} for a total of INR {float(enriched.total_amount):.2f}."
    )

    background_tasks.add_task(book_delhivery_shipment_task, order.id)

    return enriched


@router.post("/razorpay/create", status_code=201)
async def create_razorpay_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    body.customer_id = customer.id
    body.customer_name = customer.full_name
    body.customer_email = customer.email
    body.customer_phone = customer.phone
    body.channel = "storefront"
    body.payment_method = PaymentMethod.razorpay
    body.payment_gateway = "razorpay"
    body.payment_status = PaymentStatus.pending

    if not body.customer_phone or not body.customer_email:
        raise HTTPException(
            status_code=400, 
            detail="Mobile and email are compulsory to complete checkout."
        )

    # Check inventory stock levels before initiating payment or reservation
    for item_data in body.items:
        variant_res = await db.execute(
            select(ProductVariant)
            .where(ProductVariant.id == item_data.variant_id)
            .options(joinedload(ProductVariant.product))
        )
        variant = variant_res.scalar_one_or_none()
        
        batch_result = await db.execute(
            select(InventoryBatch)
            .where(
                InventoryBatch.variant_id == item_data.variant_id,
                InventoryBatch.current_quantity >= item_data.quantity,
            )
            .order_by(InventoryBatch.received_at)
            .limit(1)
        )
        batch = batch_result.scalar_one_or_none()
        if not batch:
            variant_name = "Unknown Product"
            if variant and variant.product:
                size_str = f" ({variant.size_ml}ml)" if variant.size_ml else ""
                variant_name = f"{variant.product.name}{size_str}"
            else:
                variant_name = f"Variant {item_data.variant_id}"
                
            raise HTTPException(
                status_code=400, 
                detail=f"We apologize, but there is insufficient stock for '{variant_name}'. Please adjust the quantity or check stock availability."
            )

    subtotal = sum(item.unit_price * item.quantity - item.discount_amount for item in body.items)
    
    redemption_amount = 0.0
    if body.loyalty_points_used > 0:
        if customer.loyalty_points < body.loyalty_points_used:
            raise HTTPException(status_code=400, detail="Insufficient loyalty points for redemption.")
        redemption_amount = float(body.loyalty_points_used)

    total = subtotal - body.discount_amount + body.tax_amount + body.shipping_amount - redemption_amount
    if total < 0:
        total = 0.0

    amount_in_paise = int(round(total * 100))

    razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
    if settings.RAZORPAY_KEY_SECRET != "placeholder_secret" and settings.RAZORPAY_KEY_ID != "rzp_test_demokey12345":
        try:
            import razorpay
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            rzp_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"receipt_{uuid.uuid4().hex[:10]}",
                "payment_capture": 1
            })
            razorpay_order_id = rzp_order["id"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Razorpay integration error: {str(e)}"
            )

    if body.shipping_address:
        sa = body.shipping_address
        pincode = sa.get("pincode")
        line1 = sa.get("address_line1")
        if pincode and line1:
            addr_check = await db.execute(
                select(CustomerAddress).where(
                    CustomerAddress.customer_id == customer.id,
                    CustomerAddress.pincode == pincode,
                    CustomerAddress.address_line1 == line1
                )
              )
            existing_addr = addr_check.scalar_one_or_none()
            if not existing_addr:
                new_addr = CustomerAddress(
                    customer_id=customer.id,
                    label=sa.get("label") or "Saved Location",
                    address_line1=line1,
                    address_line2=sa.get("address_line2"),
                    city=sa.get("city"),
                    state=sa.get("state"),
                    pincode=pincode,
                    country=sa.get("country") or "India",
                    is_default=False
                )
                db.add(new_addr)

    order = Order(
        order_number=await generate_order_number(db),
        customer_id=customer.id,
        processed_by=None,
        channel=body.channel,
        payment_method=PaymentMethod.razorpay,
        payment_status=PaymentStatus.pending,
        subtotal=subtotal,
        discount_amount=body.discount_amount,
        loyalty_points_used=body.loyalty_points_used,
        tax_amount=body.tax_amount,
        shipping_amount=body.shipping_amount,
        total_amount=total,
        notes=body.notes,
        gift_message=body.gift_message,
        coupon_code=body.coupon_code,
        shipping_address=body.shipping_address,
        billing_address=body.billing_address,
        customer_name=customer.full_name,
        customer_phone=customer.phone,
        customer_email=customer.email,
        payment_gateway="razorpay",
        payment_details={"razorpay_order_id": razorpay_order_id}
    )
    db.add(order)
    await db.flush()

    history = OrderStatusHistory(
        order_id=order.id,
        status=order.status,
        notes="Razorpay checkout order created (pending payment)"
    )
    db.add(history)

    for item_data in body.items:
        item = OrderItem(
            order_id=order.id,
            variant_id=item_data.variant_id,
            batch_id=None,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            cost_price=None,
            discount_amount=item_data.discount_amount,
            total_price=item_data.unit_price * item_data.quantity - item_data.discount_amount
        )
        db.add(item)

    await db.commit()
    
    return {
        "razorpay_order_id": razorpay_order_id,
        "amount": amount_in_paise,
        "currency": "INR",
        "order_number": order.order_number,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID
    }

@router.post("/razorpay/cancel")
async def cancel_pending_order(
    body: dict,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    order_number = body.get("order_number")
    if not order_number:
        raise HTTPException(status_code=400, detail="Missing order number")
        
    q = select(Order).where(
        Order.order_number == order_number,
        Order.customer_id == customer.id,
        Order.payment_status == PaymentStatus.pending
    )
    result = await db.execute(q)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pending order not found")
        
    # Delete status history, order items, and the order itself
    await db.execute(delete(OrderStatusHistory).where(OrderStatusHistory.order_id == order.id))
    await db.execute(delete(OrderItem).where(OrderItem.order_id == order.id))
    await db.delete(order)
    await db.commit()
    return {"status": "cancelled", "order_number": order_number}


@router.post("/razorpay/verify")
async def verify_razorpay_payment(
    body: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    """
    Called by the client immediately after Razorpay payment.handler fires.
    Verifies signature, marks order paid, deducts inventory, triggers SMS+email.
    This is the primary confirmation path — webhooks are a secondary/backup.
    """
    razorpay_order_id = body.get("razorpay_order_id")
    razorpay_payment_id = body.get("razorpay_payment_id")
    razorpay_signature = body.get("razorpay_signature")
    order_number = body.get("order_number")

    if not razorpay_payment_id or not razorpay_order_id or not order_number:
        raise HTTPException(status_code=400, detail="Missing payment reference fields")

    # Verify signature if real credentials are configured
    if razorpay_signature and settings.RAZORPAY_KEY_SECRET not in ("placeholder_secret", "rzp_test_demokey12345", ""):
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment signature verification failed")

    # Fetch the order (do NOT use with_for_update alongside eager-loaded joins in async)
    q = select(Order).where(
        Order.order_number == order_number,
        Order.customer_id == customer.id,
    ).options(
        selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
        selectinload(Order.status_history),
        joinedload(Order.customer)
    )

    result = await db.execute(q)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Idempotent — if already paid, just return success
    if order.payment_status == PaymentStatus.paid:
        enriched = _enrich_order(order)
        return {"status": "already_confirmed", "order_number": order.order_number, "order": enriched}

    # Mark as paid and confirmed
    order.payment_status = PaymentStatus.paid
    order.status = OrderStatus.confirmed
    order.transaction_id = razorpay_payment_id

    details = dict(order.payment_details or {})
    details["razorpay_payment_id"] = razorpay_payment_id
    details["razorpay_order_id"] = razorpay_order_id
    details["razorpay_signature"] = razorpay_signature
    details["verified_at"] = datetime.now(timezone.utc).isoformat()
    details["verified_by"] = "client_callback"
    order.payment_details = details

    history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.confirmed,
        notes=f"Payment verified via client callback (Razorpay: {razorpay_payment_id})"
    )
    db.add(history)

    # Deduct inventory (FIFO) and earn loyalty points
    earned_points = 0
    for item in order.items:
        variant = item.variant
        if variant:
            if variant.loyalty_points:
                earned_points += (variant.loyalty_points * item.quantity)

            batch_result = await db.execute(
                select(InventoryBatch)
                .where(
                    InventoryBatch.variant_id == variant.id,
                    InventoryBatch.current_quantity >= item.quantity,
                )
                .order_by(InventoryBatch.received_at)
                .limit(1)
            )
            batch = batch_result.scalar_one_or_none()
            if batch:
                batch.current_quantity -= item.quantity
                item.batch_id = batch.id
                item.cost_price = batch.purchase_cost
                movement = InventoryMovement(
                    batch_id=batch.id,
                    type="Deduction",
                    quantity=-item.quantity,
                    reason=f"Sales Order Fulfillment ({order.order_number})"
                )
                db.add(movement)

    # Update customer stats
    cust = order.customer
    if cust:
        cust.order_count += 1
        cust.total_spent += Decimal(str(order.total_amount))
        cust.last_order_at = datetime.now(timezone.utc)
        if order.loyalty_points_used > 0:
            cust.loyalty_points = max(0, cust.loyalty_points - order.loyalty_points_used)
        if earned_points > 0:
            cust.loyalty_points += earned_points

    # Update coupon stats
    if order.coupon_code:
        offer_result = await db.execute(select(Offer).where(Offer.code == order.coupon_code))
        db_offer = offer_result.scalar_one_or_none()
        if db_offer:
            db_offer.redemption_count += 1
            db_offer.attributed_revenue += Decimal(str(order.total_amount))

    await db.commit()

    # Re-fetch fully loaded, hydrated order output structure after commit to prevent MissingGreenlet/lazy-load error
    final_result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            selectinload(Order.status_history),
            joinedload(Order.customer),
        )
    )
    order = final_result.scalar_one()
    enriched = _enrich_order(order)

    # Send confirmation email
    background_tasks.add_task(
        send_order_confirmation_email,
        to_email=enriched.customer_email,
        customer_name=enriched.customer_name or "Valued Customer",
        order_number=enriched.order_number,
        items=order_items_to_email_list(order.items),
        total=float(enriched.total_amount),
        subtotal=float(enriched.subtotal),
        discount=float(enriched.discount_amount),
        shipping=float(enriched.shipping_amount),
        tax=float(enriched.tax_amount),
        loyalty_used=enriched.loyalty_points_used or 0,
        shipping_address=enriched.shipping_address,
        payment_method=enriched.payment_method or "",
        coupon_code=enriched.coupon_code or "",
        gift_message=enriched.gift_message or "",
        customer_email=enriched.customer_email or "",
        customer_phone=enriched.customer_phone or "",
    )

    # Send confirmation SMS
    if enriched.customer_phone:
        msg = f"Payment confirmed! Order #{enriched.order_number} placed at POMMASTORE. Total: INR {float(enriched.total_amount):.2f}. Ref: {razorpay_payment_id}. Track: https://pommastore.com/track-order?order={enriched.order_number}&contact={enriched.customer_phone}"
        background_tasks.add_task(sendsms_ordercustomer, enriched.customer_phone, msg)

    # Notify admin/manager via SMS
    background_tasks.add_task(
        sendsms_orderadmin,
        "918848079307",
        f"ALERT: New Order #{enriched.order_number} confirmed. Customer: {enriched.customer_name or 'Unknown'}. Total: INR {float(enriched.total_amount):.2f}. Ref: {razorpay_payment_id}"
    )

    background_tasks.add_task(book_delhivery_shipment_task, order.id)

    return {"status": "success", "order_number": order.order_number, "order": enriched}


# Stripe Order Creation & Checkout Session
@router.post("/stripe/create", status_code=201)
async def create_stripe_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    body.customer_id = customer.id
    body.customer_name = body.customer_name or customer.full_name
    body.customer_email = body.customer_email or customer.email
    body.customer_phone = body.customer_phone or customer.phone or (body.shipping_address.get("phone") if body.shipping_address else None)
    body.channel = "storefront"
    body.payment_method = PaymentMethod.stripe
    body.payment_gateway = "stripe"
    body.payment_status = PaymentStatus.pending

    if body.customer_phone and not customer.phone:
        customer.phone = body.customer_phone
        db.add(customer)

    if not body.customer_phone or not body.customer_email:
        raise HTTPException(
            status_code=400, 
            detail="Mobile and email are compulsory to complete checkout."
        )

    # Check inventory stock levels
    for item_data in body.items:
        variant_res = await db.execute(
            select(ProductVariant)
            .where(ProductVariant.id == item_data.variant_id)
            .options(joinedload(ProductVariant.product))
        )
        variant = variant_res.scalar_one_or_none()
        
        batch_result = await db.execute(
            select(InventoryBatch)
            .where(
                InventoryBatch.variant_id == item_data.variant_id,
                InventoryBatch.current_quantity >= item_data.quantity,
            )
            .order_by(InventoryBatch.received_at)
            .limit(1)
        )
        batch = batch_result.scalar_one_or_none()
        if not batch:
            variant_name = "Unknown Product"
            if variant and variant.product:
                size_str = f" ({variant.size_ml}ml)" if variant.size_ml else ""
                variant_name = f"{variant.product.name}{size_str}"
            else:
                variant_name = f"Variant {item_data.variant_id}"
                
            raise HTTPException(
                status_code=400, 
                detail=f"We apologize, but there is insufficient stock for '{variant_name}'."
            )

    subtotal = sum(item.unit_price * item.quantity - item.discount_amount for item in body.items)
    
    redemption_amount = 0.0
    if body.loyalty_points_used > 0:
        if customer.loyalty_points < body.loyalty_points_used:
            raise HTTPException(status_code=400, detail="Insufficient loyalty points for redemption.")
        redemption_amount = float(body.loyalty_points_used)

    total = subtotal - body.discount_amount + body.tax_amount + body.shipping_amount - redemption_amount
    if total < 0:
        total = 0.0

    amount_in_cents = int(round(total * 100))
    stripe_session_id = f"cs_test_mock_{uuid.uuid4().hex[:16]}"
    stripe_url = None
    
    if settings.STRIPE_SECRET_KEY != "sk_test_placeholder":
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            # Prepare Stripe line items
            line_items = []
            for item in body.items:
                line_items.append({
                    "price_data": {
                        "currency": "aed",
                        "product_data": {
                            "name": f"Variant {item.variant_id}",
                        },
                        "unit_amount": int(round(item.unit_price * 100)),
                    },
                    "quantity": item.quantity,
                })
            
            # Add shipping if > 0
            if body.shipping_amount > 0:
                line_items.append({
                    "price_data": {
                        "currency": "aed",
                        "product_data": {
                            "name": "Standard Logistics Shipping",
                        },
                        "unit_amount": int(round(body.shipping_amount * 100)),
                    },
                    "quantity": 1,
                })
                
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url="https://pommastore.com/checkout?success=true&session_id={CHECKOUT_SESSION_ID}",
                cancel_url="https://pommastore.com/checkout?canceled=true",
                customer_email=customer.email,
                metadata={
                    "customer_id": str(customer.id),
                    "loyalty_points_used": str(body.loyalty_points_used),
                    "discount_amount": str(body.discount_amount)
                }
            )
            stripe_session_id = session.id
            stripe_url = session.url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Stripe integration error: {str(e)}"
            )

    if body.shipping_address:
        sa = body.shipping_address
        pincode = sa.get("pincode")
        line1 = sa.get("address_line1")
        if pincode and line1:
            addr_check = await db.execute(
                select(CustomerAddress).where(
                    CustomerAddress.customer_id == customer.id,
                    CustomerAddress.pincode == pincode,
                    CustomerAddress.address_line1 == line1
                )
            )
            existing_addr = addr_check.scalar_one_or_none()
            if not existing_addr:
                new_addr = CustomerAddress(
                    customer_id=customer.id,
                    label=sa.get("label") or "Saved Location",
                    address_line1=line1,
                    address_line2=sa.get("address_line2"),
                    city=sa.get("city"),
                    state=sa.get("state"),
                    pincode=pincode,
                    country=sa.get("country") or "UAE",
                    is_default=False
                )
                db.add(new_addr)

    order = Order(
        order_number=await generate_order_number(db),
        customer_id=customer.id,
        processed_by=None,
        channel=body.channel,
        payment_method=PaymentMethod.stripe,
        payment_status=PaymentStatus.pending,
        subtotal=subtotal,
        discount_amount=body.discount_amount,
        loyalty_points_used=body.loyalty_points_used,
        tax_amount=body.tax_amount,
        shipping_amount=body.shipping_amount,
        total_amount=total,
        notes=body.notes,
        gift_message=body.gift_message,
        coupon_code=body.coupon_code,
        shipping_address=body.shipping_address,
        billing_address=body.billing_address,
        customer_name=customer.full_name,
        customer_phone=customer.phone,
        customer_email=customer.email,
        payment_gateway="stripe",
        payment_details={"stripe_session_id": stripe_session_id}
    )
    db.add(order)
    await db.flush()

    history = OrderStatusHistory(
        order_id=order.id,
        status=order.status,
        notes="Stripe checkout session created (pending payment)"
    )
    db.add(history)

    for item_data in body.items:
        item = OrderItem(
            order_id=order.id,
            variant_id=item_data.variant_id,
            batch_id=None,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            cost_price=None,
            discount_amount=item_data.discount_amount,
            total_price=item_data.unit_price * item_data.quantity - item_data.discount_amount
        )
        db.add(item)

    await db.commit()
    
    return {
        "stripe_session_id": stripe_session_id,
        "url": stripe_url,
        "amount": amount_in_cents,
        "currency": "AED",
        "order_number": order.order_number,
        "stripe_publishable_key": settings.STRIPE_PUBLISHABLE_KEY
    }

@router.post("/stripe/cancel")
async def cancel_stripe_order(
    body: dict,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    order_number = body.get("order_number")
    if not order_number:
        raise HTTPException(status_code=400, detail="Missing order number")
        
    q = select(Order).where(
        Order.order_number == order_number,
        Order.customer_id == customer.id,
        Order.payment_status == PaymentStatus.pending
    )
    result = await db.execute(q)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pending order not found")
        
    await db.execute(delete(OrderStatusHistory).where(OrderStatusHistory.order_id == order.id))
    await db.execute(delete(OrderItem).where(OrderItem.order_id == order.id))
    await db.delete(order)
    await db.commit()
    return {"status": "cancelled", "order_number": order_number}

@router.post("/stripe/verify")
async def verify_stripe_payment(
    body: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    stripe_session_id = body.get("stripe_session_id")
    order_number = body.get("order_number")
    transaction_id = body.get("transaction_id") or stripe_session_id
    
    if not stripe_session_id or not order_number:
        raise HTTPException(status_code=400, detail="Missing session ID or order number")

    q = select(Order).where(
        Order.order_number == order_number,
        Order.customer_id == customer.id
    ).options(joinedload(Order.customer))
    result = await db.execute(q)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.paid:
        return {"status": "success", "order_number": order.order_number, "order": order}

    if settings.STRIPE_SECRET_KEY != "sk_test_placeholder" and not stripe_session_id.startswith("cs_test_mock_"):
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.retrieve(stripe_session_id)
            if session.payment_status != "paid":
                raise HTTPException(status_code=400, detail="Stripe session is not paid yet")
            transaction_id = session.payment_intent or transaction_id
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Stripe payment verification failed: {str(e)}"
            )

    order.payment_status = PaymentStatus.paid
    order.transaction_id = transaction_id
    order.status = OrderStatus.processing

    details = dict(order.payment_details or {})
    details["stripe_payment_intent"] = transaction_id
    order.payment_details = details

    history = OrderStatusHistory(
        order_id=order.id,
        status=order.status,
        notes=f"Payment verified (Stripe transaction: {transaction_id})"
    )
    db.add(history)

    # Fetch order items
    items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    order_items = items_res.scalars().all()

    earned_points = 0
    for item in order_items:
        variant_res = await db.execute(select(ProductVariant).where(ProductVariant.id == item.variant_id))
        variant = variant_res.scalar_one_or_none()
        if variant:
            if variant.loyalty_points:
                earned_points += (variant.loyalty_points * item.quantity)

            qty_to_deduct = item.quantity
            while qty_to_deduct > 0:
                batch_res = await db.execute(
                    select(InventoryBatch)
                    .where(
                        InventoryBatch.variant_id == variant.id,
                        InventoryBatch.current_quantity > 0
                    )
                    .order_by(InventoryBatch.received_at)
                    .limit(1)
                )
                batch = batch_res.scalar_one_or_none()
                if not batch:
                    break
                    
                deduct_qty = min(qty_to_deduct, batch.current_quantity)
                batch.current_quantity -= deduct_qty
                qty_to_deduct -= deduct_qty
                
                item.batch_id = batch.id
                item.cost_price = batch.purchase_cost
                
                movement = InventoryMovement(
                    batch_id=batch.id,
                    type="Deduction",
                    quantity=-deduct_qty,
                    reason=f"Sales Order Fulfillment ({order.order_number})"
                )
                db.add(movement)

    cust = order.customer
    if cust:
        cust.order_count += 1
        cust.total_spent += Decimal(str(order.total_amount))
        cust.last_order_at = datetime.now(timezone.utc)
        if order.loyalty_points_used > 0:
            cust.loyalty_points = max(0, cust.loyalty_points - order.loyalty_points_used)
        if earned_points > 0:
            cust.loyalty_points += earned_points

    if order.coupon_code:
        offer_result = await db.execute(select(Offer).where(Offer.code == order.coupon_code))
        db_offer = offer_result.scalar_one_or_none()
        if db_offer:
            db_offer.redemption_count += 1
            db_offer.attributed_revenue += Decimal(str(order.total_amount))

    await db.commit()

    final_result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(joinedload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product))
    )
    enriched = final_result.scalar_one()

    # Trigger emails
    background_tasks.add_task(
        send_order_confirmation_email,
        customer_name=cust.full_name if cust else "Valued Client",
        order_number=enriched.order_number,
        subtotal=float(enriched.subtotal),
        discount=float(enriched.discount_amount),
        shipping=float(enriched.shipping_amount),
        tax=float(enriched.tax_amount),
        loyalty_used=enriched.loyalty_points_used or 0,
        shipping_address=enriched.shipping_address,
        payment_method=enriched.payment_method or "",
        coupon_code=enriched.coupon_code or "",
        gift_message=enriched.gift_message or "",
        customer_email=enriched.customer_email or "",
        customer_phone=enriched.customer_phone or "",
    )

    # Send confirmation SMS
    if enriched.customer_phone:
        msg = f"Payment confirmed! Order #{enriched.order_number} placed at POMMASTORE. Total: AED {float(enriched.total_amount):.2f}. Ref: {transaction_id}. Track: https://pommastore.com/track-order?order={enriched.order_number}&contact={enriched.customer_phone}"
        background_tasks.add_task(sendsms_ordercustomer, enriched.customer_phone, msg)

    # Notify admin via SMS
    background_tasks.add_task(
        sendsms_orderadmin,
        "918848079307",
        f"ALERT: New Order #{enriched.order_number} confirmed. Customer: {enriched.customer_name or 'Unknown'}. Total: AED {float(enriched.total_amount):.2f}. Ref: {transaction_id}"
    )

    background_tasks.add_task(book_delhivery_shipment_task, order.id)

    return {"status": "success", "order_number": order.order_number, "order": enriched}


@router.post("/razorpay/webhook", status_code=200)
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    is_valid = False
    if settings.RAZORPAY_WEBHOOK_SECRET == "placeholder_webhook_secret" or not signature:
        is_valid = True
    else:
        generated_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        is_valid = hmac.compare_digest(generated_signature, signature)

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        event_data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event_data.get("event")
    if event_type not in ["payment.captured", "order.paid"]:
        return {"status": "ignored_event"}

    payload = event_data.get("payload", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    razorpay_order_id = payment_entity.get("order_id") or payload.get("order", {}).get("entity", {}).get("id")
    razorpay_payment_id = payment_entity.get("id")

    if not razorpay_order_id:
        return {"status": "missing_order_id"}

    q = select(Order).where(
        Order.payment_details["razorpay_order_id"].astext == razorpay_order_id
    ).options(
        selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
        selectinload(Order.status_history),
        joinedload(Order.customer)
    ).with_for_update()
    
    result = await db.execute(q)
    order = result.scalar_one_or_none()

    if not order:
        return {"status": "order_not_found"}

    if order.payment_status == PaymentStatus.paid:
        return {"status": "already_processed"}

    order.payment_status = PaymentStatus.paid
    order.status = OrderStatus.confirmed
    order.transaction_id = razorpay_payment_id
    
    details = dict(order.payment_details or {})
    details["razorpay_payment_id"] = razorpay_payment_id
    details["webhook_processed_at"] = datetime.now(timezone.utc).isoformat()
    order.payment_details = details

    history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.confirmed,
        notes=f"Payment confirmed via Razorpay Webhook ({razorpay_payment_id})"
    )
    db.add(history)

    customer = order.customer
    earned_points = 0
    
    for item in order.items:
        variant = item.variant
        if variant:
            if variant.loyalty_points:
                earned_points += (variant.loyalty_points * item.quantity)
            
            batch_result = await db.execute(
                select(InventoryBatch)
                .where(
                    InventoryBatch.variant_id == variant.id,
                    InventoryBatch.current_quantity >= item.quantity,
                )
                .order_by(InventoryBatch.received_at)
                .limit(1)
            )
            batch = batch_result.scalar_one_or_none()
            if batch:
                batch.current_quantity -= item.quantity
                item.batch_id = batch.id
                item.cost_price = batch.purchase_cost
                
                movement = InventoryMovement(
                    batch_id=batch.id,
                    type="Deduction",
                    quantity=-item.quantity,
                    reason=f"Sales Order Fulfillment ({order.order_number})"
                )
                db.add(movement)

    if customer:
        customer.order_count += 1
        customer.total_spent += Decimal(str(order.total_amount))
        customer.last_order_at = datetime.now(timezone.utc)
        
        if order.loyalty_points_used > 0:
            customer.loyalty_points = max(0, customer.loyalty_points - order.loyalty_points_used)

        if earned_points > 0:
            customer.loyalty_points += earned_points

    if order.coupon_code:
        offer_result = await db.execute(select(Offer).where(Offer.code == order.coupon_code))
        db_offer = offer_result.scalar_one_or_none()
        if db_offer:
            db_offer.redemption_count += 1
            db_offer.attributed_revenue += Decimal(str(order.total_amount))

    await db.commit()

    # Re-fetch fully loaded, hydrated order output structure after commit to prevent MissingGreenlet/lazy-load error
    final_result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            selectinload(Order.status_history),
            joinedload(Order.customer),
        )
    )
    order = final_result.scalar_one()
    enriched = _enrich_order(order)
    background_tasks.add_task(
        send_order_confirmation_email,
        to_email=enriched.customer_email,
        customer_name=enriched.customer_name or "Valued Customer",
        order_number=enriched.order_number,
        items=order_items_to_email_list(order.items),
        total=float(enriched.total_amount),
        subtotal=float(enriched.subtotal),
        discount=float(enriched.discount_amount),
        shipping=float(enriched.shipping_amount),
        tax=float(enriched.tax_amount),
        loyalty_used=enriched.loyalty_points_used or 0,
        shipping_address=enriched.shipping_address,
        payment_method=enriched.payment_method or "",
        coupon_code=enriched.coupon_code or "",
        gift_message=enriched.gift_message or "",
        customer_email=enriched.customer_email or "",
        customer_phone=enriched.customer_phone or "",
    )
    
    # Send order confirmation SMS to customer
    if enriched.customer_phone:
        msg = f"Thank you for your order #{enriched.order_number} at POMMASTORE! Total amount: INR {float(enriched.total_amount):.2f}. Track order: https://pommastore.com/track-order?order={enriched.order_number}&contact={enriched.customer_phone}"
        background_tasks.add_task(sendsms_ordercustomer, enriched.customer_phone, msg)
        
    # Notify admin/manager via SMS
    background_tasks.add_task(
        sendsms_orderadmin,
        "918848079307",
        f"ALERT: New Order #{enriched.order_number} has been placed successfully by {enriched.customer_name or 'customer'} for a total of INR {float(enriched.total_amount):.2f}."
    )

    background_tasks.add_task(book_delhivery_shipment_task, order.id)

    return {"status": "success", "order_number": order.order_number}
