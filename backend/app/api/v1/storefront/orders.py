from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid
from decimal import Decimal

from app.core.database import get_db
from app.core.deps import get_current_customer
from app.models.customer import Customer, CustomerAddress
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod, OrderStatusHistory
from app.models.inventory import InventoryBatch, InventoryMovement
from app.models.product import ProductVariant, Product
from app.models.offer import Offer
from app.schemas.order import OrderCreate, OrderOut, OrderItemOut

router = APIRouter(prefix="/orders", tags=["Storefront Orders"])

class OrderTrackRequest(BaseModel):
    order_number: str
    contact: str # email or phone

def generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    suffix = str(uuid.uuid4().int)[:6]
    return f"KZM-{now.year}-{suffix}"

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
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer)
):
    # Explicitly override and set customer credentials securely from the logged-in session!
    body.customer_id = customer.id
    body.customer_name = customer.full_name
    body.customer_email = customer.email
    body.customer_phone = customer.phone
    body.channel = "storefront"

    if not body.customer_phone or not body.customer_email:
        raise HTTPException(
            status_code=400, 
            detail="Mobile and email are compulsory to complete checkout. Please ensure both are registered in your account profile."
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
        order_number=generate_order_number(),
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
    return _enrich_order(order)
