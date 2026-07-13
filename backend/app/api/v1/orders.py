from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from datetime import datetime, timezone
from decimal import Decimal
import uuid

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, OrderStatusHistory
from app.models.customer import Customer, CustomerAddress
from app.models.product import ProductVariant, Product
from app.models.inventory import InventoryBatch, InventoryMovement
from app.models.offer import Offer
from app.models.user import User
from app.models.system import SystemSettings
from app.schemas.order import OrderCreate, OrderOut, OrderItemOut, OrderStatusUpdate, OrderContactUpdate, CustomerCreate, CustomerOut
from app.services.email import (
    send_order_confirmation_email,
    send_order_processing_email,
    send_order_packed_email,
    send_order_shipped_email,
    send_out_for_delivery_email,
    send_order_delivered_email,
    send_order_completed_email,
    send_order_cancelled_email,
    send_return_requested_email,
    send_order_returned_email,
    order_items_to_email_list,
    generate_invoice_html,
    generate_invoice_pdf,
)
from app.services.sms import sendsms_status, sendsms_orderadmin

router = APIRouter(prefix="/orders", tags=["Orders"])
public_router = APIRouter(prefix="/orders", tags=["Orders"])


def generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    suffix = str(uuid.uuid4().int)[:6]
    return f"KZM-{now.year}-{suffix}"


@router.get("", response_model=list[OrderOut])
async def list_orders(
    status: str | None = Query(None),
    channel: str | None = Query(None),
    search: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Order).options(
        selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
        selectinload(Order.status_history),
        joinedload(Order.customer),
    )
    if status:
        q = q.where(Order.status == status)
    if channel:
        q = q.where(Order.channel == channel)
    if search:
        q = q.where(Order.order_number.ilike(f"%{search}%"))
    if start_date:
        q = q.where(Order.created_at >= start_date)
    if end_date:
        q = q.where(Order.created_at <= end_date)
    q = q.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    orders = result.scalars().all()
    return [_enrich_order(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            selectinload(Order.status_history),
            joinedload(Order.customer),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _enrich_order(order)


@public_router.get("/{order_id}/invoice", response_class=HTMLResponse)
async def get_order_invoice(
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


@public_router.get("/{order_id}/invoice/pdf")
async def get_order_invoice_pdf(
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

from pydantic import BaseModel

class DelhiveryPickupRequest(BaseModel):
    pickup_date: str  # YYYY-MM-DD
    pickup_time: str  # HH:MM:SS or slot
    pickup_location: str
    expected_package_count: int = 1

@public_router.get("/{order_id}/delhivery-label", response_class=HTMLResponse)
async def get_delhivery_label(
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

    from app.services.delhivery import fetch_delhivery_packing_slip, generate_delhivery_label_html
    
    pkg = None
    if order.tracking_number:
        pkg = await fetch_delhivery_packing_slip(order.tracking_number)
        
    html_content = generate_delhivery_label_html(order, pkg)
    return HTMLResponse(content=html_content)

@router.post("/delhivery-pickup")
async def create_delhivery_pickup(
    body: DelhiveryPickupRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    from app.services.delhivery import schedule_delhivery_pickup
    
    res = await schedule_delhivery_pickup(
        pickup_date=body.pickup_date,
        pickup_time=body.pickup_time,
        pickup_location=body.pickup_location,
        expected_count=body.expected_package_count
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
        
    return res


@router.post("", response_model=OrderOut, status_code=201)
async def create_order(
    body: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.customer_phone or not body.customer_email:
        raise HTTPException(
            status_code=400, 
            detail="Mobile and email are compulsory to complete checkout."
        )
    subtotal = sum(item.unit_price * item.quantity - item.discount_amount for item in body.items)
    
    # Loyalty points redemption logic (1 point = ₹1)
    redemption_amount = 0.0
    if body.loyalty_points_used > 0:
        # Redemption only possible for identified customers
        if not body.customer_id:
            raise HTTPException(status_code=400, detail="Loyalty points can only be redeemed for identified customers.")
        
        # We need to fetch the customer to check points
        res_redemption_cust = await db.execute(select(Customer).where(Customer.id == body.customer_id))
        redemption_cust = res_redemption_cust.scalar_one_or_none()
        if not redemption_cust or redemption_cust.loyalty_points < body.loyalty_points_used:
            raise HTTPException(status_code=400, detail="Insufficient loyalty points for redemption.")
        
        redemption_amount = float(body.loyalty_points_used)
        redemption_cust.loyalty_points -= body.loyalty_points_used

    total = subtotal - body.discount_amount + body.tax_amount + body.shipping_amount - redemption_amount

    customer_id = body.customer_id
    if not customer_id and (body.customer_name or body.customer_phone or body.customer_email):
        # Look up existing customer by phone or email to prevent duplicates
        existing_cust = None
        if body.customer_phone:
            res_p = await db.execute(select(Customer).where(Customer.phone == body.customer_phone))
            existing_cust = res_p.scalar_one_or_none()
        if not existing_cust and body.customer_email:
            res_e = await db.execute(select(Customer).where(Customer.email == body.customer_email))
            existing_cust = res_e.scalar_one_or_none()
            
        if existing_cust:
            customer_id = existing_cust.id
        else:
            # Create a brand new Customer record automatically!
            new_cust = Customer(
                full_name=body.customer_name or "Walk-In Guest",
                phone=body.customer_phone,
                email=body.customer_email,
                loyalty_tier="Bronze",
                loyalty_points=10, # Gift 10 points on signup
                total_spent=Decimal('0'),
                order_count=0,
                acquisition_source="pos"
            )
            db.add(new_cust)
            await db.flush()
            customer_id = new_cust.id
    elif customer_id:
        # Just verify existence
        res_cust = await db.execute(select(Customer).where(Customer.id == customer_id))
        if not res_cust.scalar_one_or_none():
            customer_id = None

    # Automatically save unique addresses to CustomerAddress table
    if customer_id and body.shipping_address:
        sa = body.shipping_address
        pincode = sa.get("pincode")
        line1 = sa.get("address_line1")
        if pincode and line1:
            addr_check = await db.execute(
                select(CustomerAddress).where(
                    CustomerAddress.customer_id == customer_id,
                    CustomerAddress.pincode == pincode,
                    CustomerAddress.address_line1 == line1
                )
            )
            existing_addr = addr_check.scalar_one_or_none()
            if not existing_addr:
                new_addr = CustomerAddress(
                    customer_id=customer_id,
                    label="Saved Location",
                    address_line1=line1,
                    address_line2=sa.get("address_line2"),
                    city=sa.get("city"),
                    state=sa.get("state"),
                    pincode=pincode,
                    country="India",
                    is_default=False
                )
                db.add(new_addr)

    order = Order(
        order_number=generate_order_number(),
        customer_id=customer_id,
        processed_by=current_user.id,
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
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        customer_email=body.customer_email,
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
        notes="Order placed"
    )
    db.add(history)

    for item_data in body.items:
        # Get FIFO batch
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
            raise HTTPException(status_code=400, detail=f"Insufficient stock for variant {item_data.variant_id}")

        # Deduct stock
        batch.current_quantity -= item_data.quantity

        # Log movement
        movement = InventoryMovement(
            batch_id=batch.id,
            type="Deduction",
            quantity=-item_data.quantity,
            reason=f"Sales Order Fulfilment ({order.order_number})"
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

    # Update customer stats and earn points
    if customer_id:
        cust_result = await db.execute(select(Customer).where(Customer.id == customer_id))
        customer = cust_result.scalar_one_or_none()
        if customer:
            customer.order_count += 1
            customer.total_spent += Decimal(str(total))
            customer.last_order_at = datetime.now(timezone.utc)
            # Earn points on net amount spent
            earned_points = int(total // 100)
            if earned_points > 0:
                customer.loyalty_points += earned_points

    # Update Offer Performance Stats
    if body.coupon_code:
        offer_result = await db.execute(select(Offer).where(Offer.code == body.coupon_code))
        db_offer = offer_result.scalar_one_or_none()
        if db_offer:
            db_offer.redemption_count += 1
            db_offer.attributed_revenue += Decimal(str(total))

    await db.commit()

    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            selectinload(Order.status_history),
            joinedload(Order.customer),
        )
    )
    order = result.scalar_one()
    enriched = _enrich_order(order)

    # Send order confirmation email
    to_email = enriched.customer_email
    background_tasks.add_task(
        send_order_confirmation_email,
        to_email=to_email,
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

    # Notify admin/manager via SMS
    background_tasks.add_task(
        sendsms_orderadmin,
        "918848079307",
        f"ALERT: New POS Order #{enriched.order_number} has been created successfully for a total of INR {float(enriched.total_amount):.2f}."
    )

    return enriched


async def cancel_delhivery_shipment_task(order_id: uuid.UUID):
    from app.services.delhivery import cancel_delhivery_shipment
    from app.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        q = select(Order).where(Order.id == order_id)
        res = await db.execute(q)
        order = res.scalar_one_or_none()
        if not order or not order.tracking_number:
            return
            
        result = await cancel_delhivery_shipment(order.tracking_number)
        if result.get("success"):
            history = OrderStatusHistory(
                order_id=order.id,
                status=order.status,
                notes=f"Delhivery shipment cancelled. Waybill: {order.tracking_number}. Response: {result['message']}"
            )
            db.add(history)
            await db.commit()


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            selectinload(Order.status_history),
            joinedload(Order.customer),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    status_actually_changed = (order.status != body.status)

    if status_actually_changed:
        order.status = body.status
        # Record status change
        history = OrderStatusHistory(
            order_id=order.id,
            status=body.status,
            notes=body.notes or f"Status changed to {body.status}"
        )
        db.add(history)
        
        # Cancel Delhivery delivery in background if order is cancelled
        if body.status == OrderStatus.cancelled and order.tracking_number and order.carrier == "Delhivery":
            background_tasks.add_task(cancel_delhivery_shipment_task, order.id)

    if body.tracking_number:
        order.tracking_number = body.tracking_number
    if body.carrier:
        order.carrier = body.carrier
    if body.status == OrderStatus.shipped:
        order.shipped_at = datetime.now(timezone.utc)
    if body.status == OrderStatus.delivered:
        order.delivered_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(order)
    enriched = _enrich_order(order)

    # Send status-specific email notification
    to_email = enriched.customer_email
    customer_name = enriched.customer_name or "Valued Customer"
    if to_email and status_actually_changed:
        status = body.status
        items_list = order_items_to_email_list(order.items)
        if status == OrderStatus.confirmed:
            background_tasks.add_task(send_order_processing_email, to_email, customer_name, enriched.order_number)
        elif status == OrderStatus.processing:
            background_tasks.add_task(send_order_processing_email, to_email, customer_name, enriched.order_number)
        elif status == OrderStatus.packed:
            background_tasks.add_task(send_order_packed_email, to_email, customer_name, enriched.order_number)
        elif status == OrderStatus.shipped:
            background_tasks.add_task(
                send_order_shipped_email,
                to_email, customer_name, enriched.order_number,
                carrier=body.carrier or enriched.carrier or "",
                tracking_number=body.tracking_number or enriched.tracking_number or "",
                items=items_list,
            )
        elif status == OrderStatus.out_for_delivery:
            background_tasks.add_task(
                send_out_for_delivery_email,
                to_email, customer_name, enriched.order_number,
                shipping_address=enriched.shipping_address,
            )
        elif status == OrderStatus.delivered:
            background_tasks.add_task(send_order_delivered_email, to_email, customer_name, enriched.order_number, items_list)
        elif status == OrderStatus.completed:
            background_tasks.add_task(send_order_completed_email, to_email, customer_name, enriched.order_number)
        elif status == OrderStatus.cancelled:
            background_tasks.add_task(
                send_order_cancelled_email,
                to_email, customer_name, enriched.order_number,
                reason=body.notes or "",
                total=float(enriched.total_amount),
            )
        elif status == OrderStatus.return_requested:
            background_tasks.add_task(
                send_return_requested_email,
                to_email, customer_name, enriched.order_number,
                reason=body.notes or "",
            )
        elif status == OrderStatus.returned:
            background_tasks.add_task(
                send_order_returned_email,
                to_email, customer_name, enriched.order_number,
                total=float(enriched.total_amount),
            )

    # Send status-specific SMS notification
    to_phone = enriched.customer_phone
    if to_phone and status_actually_changed:
        status = body.status
        if status == OrderStatus.confirmed:
            msg = f"Your order #{enriched.order_number} has been confirmed at KOZMOCART. We are preparing it for shipping."
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.processing:
            msg = f"Your order #{enriched.order_number} is now being processed and packed at KOZMOCART warehouse."
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.packed:
            msg = f"Your order #{enriched.order_number} is packed and ready for courier pickup at KOZMOCART. Shipping soon!"
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.shipped:
            carrier = body.carrier or enriched.carrier or "Delhivery"
            tracking_number = body.tracking_number or enriched.tracking_number or ""
            msg = f"Good news! Your order #{enriched.order_number} has been shipped via {carrier}. AWB: {tracking_number}. Track: https://kozmocart.com/track-order?order={enriched.order_number}&contact={to_phone}"
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.out_for_delivery:
            msg = f"Your order #{enriched.order_number} is out for delivery today! Our delivery executive will arrive soon."
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.delivered:
            msg = f"Delivered! Your order #{enriched.order_number} has arrived. Thank you for shopping with KOZMOCART!"
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.completed:
            msg = f"Your order #{enriched.order_number} is now complete. Thank you for shopping at KOZMOCART! Loyalty points updated."
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.cancelled:
            reason = body.notes or "No reason specified"
            msg = f"Your order #{enriched.order_number} has been cancelled. Reason: {reason}. Contact: support@kozmocart.com."
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.return_requested:
            msg = f"Return request received for order #{enriched.order_number}. Our team will review in 24-48 hours and contact you."
            background_tasks.add_task(sendsms_status, to_phone, msg)
        elif status == OrderStatus.returned:
            msg = f"Return confirmed for order #{enriched.order_number}. Refund of INR {float(enriched.total_amount):.2f} will be processed in 5-7 business days."
            background_tasks.add_task(sendsms_status, to_phone, msg)

    return enriched


@router.patch("/{order_id}/contact", response_model=OrderOut)
async def update_order_contact(
    order_id: str,
    body: OrderContactUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.variant).joinedload(ProductVariant.product).selectinload(Product.images),
            joinedload(Order.customer),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if body.customer_name is not None:
        order.customer_name = body.customer_name
    if body.customer_phone is not None:
        order.customer_phone = body.customer_phone
    if body.customer_email is not None:
        order.customer_email = body.customer_email

    await db.commit()
    await db.refresh(order)
    return _enrich_order(order)


def _enrich_order(order: Order) -> OrderOut:
    out = OrderOut.model_validate(order)
    if order.customer:
        if not out.customer_name or out.customer_name == "New Customer":
            out.customer_name = order.customer.full_name
        if not out.customer_email:
            out.customer_email = order.customer.email
        if not out.customer_phone:
            out.customer_phone = order.customer.phone
    return out


# Customer endpoints
customers_router = APIRouter(prefix="/customers", tags=["Customers"])


@customers_router.get("", response_model=list[CustomerOut])
async def list_customers(
    search: str | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Customer)
    if search:
        q = q.where(
            Customer.full_name.ilike(f"%{search}%") |
            Customer.email.ilike(f"%{search}%") |
            Customer.phone.ilike(f"%{search}%")
        )
    q = q.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return [CustomerOut.model_validate(c) for c in result.scalars().all()]


@customers_router.post("", response_model=CustomerOut, status_code=201)
async def create_customer(body: CustomerCreate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    customer = Customer(**body.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return CustomerOut.model_validate(customer)


@customers_router.get("/{customer_id}/addresses")
async def get_customer_addresses(customer_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(
        select(CustomerAddress).where(CustomerAddress.customer_id == uuid.UUID(customer_id))
    )
    return [
        {
            "id": str(a.id),
            "pincode": a.pincode,
            "city": a.city,
            "state": a.state,
            "address_line1": a.address_line1,
            "address_line2": a.address_line2,
        }
        for a in result.scalars().all()
    ]
