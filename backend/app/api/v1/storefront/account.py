from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List
import random
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.deps import get_current_customer
from app.models.customer import Customer, CustomerAddress
from app.models.order import Order, OrderItem
from app.models.product import ProductVariant, Product
from app.schemas.customer import CustomerOut, CustomerAddressOut, CustomerAddressBase, CustomerUpdate
from app.schemas.order import OrderOut
from app.core.redis import redis_service
from app.services.email import send_otp_email
from app.services.sms import sendsms_otp

router = APIRouter(prefix="/account", tags=["Storefront Account"])


class VerifySendRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None


class VerifyConfirmRequest(BaseModel):
    email_otp: str | None = None
    phone_otp: str | None = None
    full_name: str | None = None


@router.post("/verify/send")
async def send_verification(
    body: VerifySendRequest,
    background_tasks: BackgroundTasks,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="Either email or phone is required to verify")

    res_data = {}

    if body.email:
        email = body.email.strip().lower()
        # Verify email is not already taken by another account
        existing = await db.execute(
            select(Customer).where(Customer.email == email, Customer.id != customer.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email address is already linked to another account")

        otp = str(random.randint(100000, 999999))
        await redis_service.redis.setex(f"verify_email_otp:{customer.id}", 300, otp)
        await redis_service.redis.setex(f"verify_email_val:{customer.id}", 300, email)
        background_tasks.add_task(send_otp_email, email, otp)
        res_data["email_sent"] = True

    if body.phone:
        phone = body.phone.strip()
        # Verify phone is not already taken by another account
        existing = await db.execute(
            select(Customer).where(Customer.phone == phone, Customer.id != customer.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Mobile number is already linked to another account")

        otp = str(random.randint(100000, 999999))
        await redis_service.redis.setex(f"verify_phone_otp:{customer.id}", 300, otp)
        await redis_service.redis.setex(f"verify_phone_val:{customer.id}", 300, phone)
        background_tasks.add_task(sendsms_otp, phone, otp)
        res_data["phone_sent"] = True

    return {"message": "Verification code(s) sent successfully", **res_data}


@router.post("/verify/confirm", response_model=CustomerOut)
async def confirm_verification(
    body: VerifyConfirmRequest,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    updated = False

    if body.email_otp:
        stored_otp = await redis_service.redis.get(f"verify_email_otp:{customer.id}")
        target_email = await redis_service.redis.get(f"verify_email_val:{customer.id}")
        if not stored_otp or stored_otp != body.email_otp.strip():
            raise HTTPException(status_code=400, detail="Invalid or expired Email verification code")
        if not target_email:
            raise HTTPException(status_code=400, detail="Verification session expired. Please request a new code.")
        
        # Verify not already taken by another account (race condition check)
        existing = await db.execute(
            select(Customer).where(Customer.email == target_email, Customer.id != customer.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email address is already linked to another account")

        customer.email = target_email
        updated = True
        await redis_service.redis.delete(f"verify_email_otp:{customer.id}")
        await redis_service.redis.delete(f"verify_email_val:{customer.id}")

    if body.phone_otp:
        stored_otp = await redis_service.redis.get(f"verify_phone_otp:{customer.id}")
        target_phone = await redis_service.redis.get(f"verify_phone_val:{customer.id}")
        if not stored_otp or stored_otp != body.phone_otp.strip():
            raise HTTPException(status_code=400, detail="Invalid or expired Mobile verification code")
        if not target_phone:
            raise HTTPException(status_code=400, detail="Verification session expired. Please request a new code.")

        # Verify not already taken by another account (race condition check)
        existing = await db.execute(
            select(Customer).where(Customer.phone == target_phone, Customer.id != customer.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Mobile number is already linked to another account")

        customer.phone = target_phone
        updated = True
        await redis_service.redis.delete(f"verify_phone_otp:{customer.id}")
        await redis_service.redis.delete(f"verify_phone_val:{customer.id}")

    if body.full_name:
        customer.full_name = body.full_name.strip()
        updated = True

    if updated:
        db.add(customer)
        await db.commit()
        await db.refresh(customer)

    return CustomerOut.model_validate(customer)


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
