from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from typing import List
import random
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.deps import get_current_customer
from app.models.customer import Customer, CustomerAddress
from app.models.order import Order, OrderItem
from app.models.product import ProductVariant, Product
from app.schemas.customer import CustomerOut, CustomerAddressOut, CustomerAddressBase, CustomerUpdate, CustomerTokenResponse
from app.schemas.order import OrderOut
from app.core.redis import redis_service
from app.services.email import send_otp_email
from app.services.sms import sendsms_otp
from app.core.security import create_access_token

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
        otp = str(random.randint(100000, 999999))
        await redis_service.redis.setex(f"verify_email_otp:{customer.id}", 300, otp)
        await redis_service.redis.setex(f"verify_email_val:{customer.id}", 300, email)
        background_tasks.add_task(send_otp_email, email, otp)
        res_data["email_sent"] = True

    if body.phone:
        phone = body.phone.strip()
        otp = str(random.randint(100000, 999999))
        await redis_service.redis.setex(f"verify_phone_otp:{customer.id}", 300, otp)
        await redis_service.redis.setex(f"verify_phone_val:{customer.id}", 300, phone)
        background_tasks.add_task(sendsms_otp, phone, otp)
        res_data["phone_sent"] = True

    return {"message": "Verification code(s) sent successfully", **res_data}


@router.post("/verify/confirm", response_model=CustomerTokenResponse)
async def confirm_verification(
    body: VerifyConfirmRequest,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    updated = False
    new_customer = customer
    access_token = None

    if body.email_otp:
        stored_otp_bytes = await redis_service.redis.get(f"verify_email_otp:{customer.id}")
        target_email_bytes = await redis_service.redis.get(f"verify_email_val:{customer.id}")
        stored_otp = stored_otp_bytes.decode("utf-8") if hasattr(stored_otp_bytes, "decode") else stored_otp_bytes
        target_email = target_email_bytes.decode("utf-8") if hasattr(target_email_bytes, "decode") else target_email_bytes

        if not stored_otp or stored_otp != body.email_otp.strip():
            raise HTTPException(status_code=400, detail="Invalid or expired Email verification code")
        if not target_email:
            raise HTTPException(status_code=400, detail="Verification session expired. Please request a new code.")
        
        # Check if target email belongs to another customer
        existing_res = await db.execute(
            select(Customer).where(Customer.email == target_email, Customer.id != customer.id)
        )
        existing_customer = existing_res.scalar_one_or_none()

        if existing_customer:
            # Merge current phone-only profile into existing customer profile
            cart_b = customer.cart_data or []
            cart_a = existing_customer.cart_data or []
            merged_cart = {item.get('variant_id'): item for item in cart_a}
            for item in cart_b:
                v_id = item.get('variant_id')
                if v_id in merged_cart:
                    merged_cart[v_id]['quantity'] += item.get('quantity', 1)
                else:
                    merged_cart[v_id] = item
            existing_customer.cart_data = list(merged_cart.values())
            existing_customer.loyalty_points += customer.loyalty_points

            if customer.phone:
                existing_customer.phone = customer.phone
            if body.full_name:
                existing_customer.full_name = body.full_name.strip()

            db.add(existing_customer)
            await db.delete(customer)  # Remove the temporary phone-only profile

            new_customer = existing_customer
            access_token = create_access_token(str(existing_customer.id))
            updated = True
        else:
            customer.email = target_email
            if body.full_name:
                customer.full_name = body.full_name.strip()
            db.add(customer)
            new_customer = customer
            updated = True

        await redis_service.redis.delete(f"verify_email_otp:{customer.id}")
        await redis_service.redis.delete(f"verify_email_val:{customer.id}")

    elif body.phone_otp:
        stored_otp_bytes = await redis_service.redis.get(f"verify_phone_otp:{customer.id}")
        target_phone_bytes = await redis_service.redis.get(f"verify_phone_val:{customer.id}")
        stored_otp = stored_otp_bytes.decode("utf-8") if hasattr(stored_otp_bytes, "decode") else stored_otp_bytes
        target_phone = target_phone_bytes.decode("utf-8") if hasattr(target_phone_bytes, "decode") else target_phone_bytes

        if not stored_otp or stored_otp != body.phone_otp.strip():
            raise HTTPException(status_code=400, detail="Invalid or expired Mobile verification code")
        if not target_phone:
            raise HTTPException(status_code=400, detail="Verification session expired. Please request a new code.")

        # Check if target phone belongs to another customer
        existing_res = await db.execute(
            select(Customer).where(Customer.phone == target_phone, Customer.id != customer.id)
        )
        existing_customer = existing_res.scalar_one_or_none()

        if existing_customer:
            # Merge current email profile into existing customer profile
            cart_b = customer.cart_data or []
            cart_a = existing_customer.cart_data or []
            merged_cart = {item.get('variant_id'): item for item in cart_a}
            for item in cart_b:
                v_id = item.get('variant_id')
                if v_id in merged_cart:
                    merged_cart[v_id]['quantity'] += item.get('quantity', 1)
                else:
                    merged_cart[v_id] = item
            existing_customer.cart_data = list(merged_cart.values())
            existing_customer.loyalty_points += customer.loyalty_points

            if customer.email:
                existing_customer.email = customer.email
            if body.full_name:
                existing_customer.full_name = body.full_name.strip()

            db.add(existing_customer)
            await db.delete(customer)

            new_customer = existing_customer
            access_token = create_access_token(str(existing_customer.id))
            updated = True
        else:
            customer.phone = target_phone
            if body.full_name:
                customer.full_name = body.full_name.strip()
            db.add(customer)
            new_customer = customer
            updated = True

        await redis_service.redis.delete(f"verify_phone_otp:{customer.id}")
        await redis_service.redis.delete(f"verify_phone_val:{customer.id}")

    else:
        if body.full_name:
            customer.full_name = body.full_name.strip()
            db.add(customer)
            new_customer = customer
            updated = True

    if updated:
        await db.commit()
        await db.refresh(new_customer)

    return CustomerTokenResponse(
        access_token=access_token or create_access_token(str(new_customer.id)),
        customer=CustomerOut.model_validate(new_customer)
    )


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
        .where(
            Order.customer_id == customer.id,
            # Exclude unpaid Razorpay draft orders (payment not completed)
            or_(
                Order.payment_gateway != "razorpay",
                Order.payment_status != "pending"
            )
        )
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
