from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_customer
from app.models.customer import Customer, CustomerAddress
from app.models.order import Order, OrderItem
from app.models.product import ProductVariant, Product
from app.schemas.customer import CustomerOut, CustomerAddressOut, CustomerAddressBase, CustomerUpdate
from app.schemas.order import OrderOut

router = APIRouter(prefix="/account", tags=["Storefront Account"])


@router.get("/me", response_model=CustomerOut)
async def get_me(customer: Customer = Depends(get_current_customer)):
    return CustomerOut.model_validate(customer)


@router.patch("/me", response_model=CustomerOut)
async def update_me(
    body: CustomerUpdate,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    db.add(customer)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile update failed. The provided phone number may already be registered to another account."
        )
    
    await db.refresh(customer)
    return CustomerOut.model_validate(customer)


from sqlalchemy.orm import selectinload, joinedload

@router.get("/orders", response_model=List[OrderOut])
async def list_my_orders(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items)
            .joinedload(OrderItem.variant)
            .joinedload(ProductVariant.product)
            .selectinload(Product.images),
            selectinload(Order.status_history)
        )
        .where(Order.customer_id == customer.id)
        .order_by(Order.created_at.desc())
    )
    return [OrderOut.model_validate(o) for o in result.scalars().all()]


@router.get("/addresses", response_model=List[CustomerAddressOut])
async def list_addresses(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CustomerAddress).where(CustomerAddress.customer_id == customer.id)
    )
    return [CustomerAddressOut.model_validate(a) for a in result.scalars().all()]


@router.post("/addresses", response_model=CustomerAddressOut, status_code=201)
async def add_address(
    body: CustomerAddressBase,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    address = CustomerAddress(customer_id=customer.id, **body.model_dump())
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return CustomerAddressOut.model_validate(address)


@router.delete("/addresses/{address_id}", status_code=204)
async def delete_address(
    address_id: str,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CustomerAddress)
        .where(CustomerAddress.id == address_id, CustomerAddress.customer_id == customer.id)
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(address)
    await db.commit()

@router.get("/cart", response_model=List[dict])
async def get_cart(customer: Customer = Depends(get_current_customer)):
    return customer.cart_data or []

@router.put("/cart", response_model=List[dict])
async def update_cart(
    items: List[dict],
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    customer.cart_data = items
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer.cart_data or []
