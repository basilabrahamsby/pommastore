from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from decimal import Decimal
import uuid

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.order import Order, OrderItem, OrderStatus
from app.models.customer import Customer, CustomerAddress
from app.models.product import ProductVariant, Product
from app.models.inventory import InventoryBatch
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderItemOut, OrderStatusUpdate, CustomerCreate, CustomerOut

router = APIRouter(prefix="/orders", tags=["Orders"])


def generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    suffix = str(uuid.uuid4().int)[:6]
    return f"KZM-{now.year}-{suffix}"


@router.get("", response_model=list[OrderOut])
async def list_orders(
    status: str | None = Query(None),
    channel: str | None = Query(None),
    search: str | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product),
        selectinload(Order.customer),
    )
    if status:
        q = q.where(Order.status == status)
    if channel:
        q = q.where(Order.channel == channel)
    if search:
        q = q.where(Order.order_number.ilike(f"%{search}%"))
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
            selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product),
            selectinload(Order.customer),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _enrich_order(order)


@router.post("", response_model=OrderOut, status_code=201)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subtotal = sum(item.unit_price * item.quantity - item.discount_amount for item in body.items)
    total = subtotal - body.discount_amount + body.tax_amount + body.shipping_amount

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
            existing_cust.order_count += 1
            existing_cust.total_spent += Decimal(str(total))
            existing_cust.last_order_at = datetime.now(timezone.utc)
        else:
            # Create a brand new Customer record automatically!
            new_cust = Customer(
                full_name=body.customer_name or "Walk-In Guest",
                phone=body.customer_phone,
                email=body.customer_email,
                loyalty_tier="Bronze",
                loyalty_points=10, # Gift 10 points on signup
                total_spent=Decimal(str(total)),
                order_count=1,
                last_order_at=datetime.now(timezone.utc),
                acquisition_source="pos"
            )
            db.add(new_cust)
            await db.flush()
            customer_id = new_cust.id
    elif customer_id:
        res_cust = await db.execute(select(Customer).where(Customer.id == customer_id))
        cust = res_cust.scalar_one_or_none()
        if cust:
            cust.order_count += 1
            cust.total_spent += Decimal(str(total))
            cust.last_order_at = datetime.now(timezone.utc)

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
    )
    db.add(order)
    await db.flush()

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

    # Update customer stats
    if body.customer_id:
        cust_result = await db.execute(select(Customer).where(Customer.id == body.customer_id))
        customer = cust_result.scalar_one_or_none()
        if customer:
            customer.order_count += 1
            customer.total_spent += Decimal(str(total))
            customer.last_order_at = datetime.now(timezone.utc)

    await db.commit()

    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product),
            selectinload(Order.customer),
        )
    )
    order = result.scalar_one()
    return _enrich_order(order)


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product),
            selectinload(Order.customer),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = body.status
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
    return _enrich_order(order)


def _enrich_order(order: Order) -> OrderOut:
    out = OrderOut.model_validate(order)
    if order.customer:
        out.customer_name = order.customer.full_name
    for i, item_model in enumerate(order.items):
        if i < len(out.items) and item_model.variant:
            out.items[i].sku = item_model.variant.sku
            if item_model.variant.product:
                out.items[i].product_name = item_model.variant.product.name
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
