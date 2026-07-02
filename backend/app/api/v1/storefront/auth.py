from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerTokenResponse

from app.core.config import settings
import random
from app.core.redis import redis_service
from app.schemas.storefront_auth import OTPSendRequest, OTPVerifyRequest, GoogleAuthRequest
from app.services.email import send_otp_email
from app.services.sms import sendsms_otp, sendsms_welcome

router = APIRouter(prefix="/auth", tags=["Storefront Auth"])

@router.post("/otp/send")
async def send_otp(body: OTPSendRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    identifier = body.email or body.phone
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone is required")
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Store in Redis for 5 minutes
    await redis_service.set_otp(identifier, otp, expire=300)
    
    # Send via SMS/Email
    print(f"OTP for {identifier}: {otp}")
    
    if body.email:
        background_tasks.add_task(send_otp_email, body.email, otp)
    elif body.phone:
        background_tasks.add_task(sendsms_otp, body.phone, otp)
    
    return {"message": "OTP sent successfully"}


@router.post("/otp/verify", response_model=CustomerTokenResponse)
async def verify_otp(body: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    identifier = body.email or body.phone
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone is required")
    
    stored_otp = await redis_service.get_otp(identifier)
    if not stored_otp or stored_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # OTP verified, delete it
    await redis_service.delete_otp(identifier)
    
    # Find or create customer
    if body.email:
        result = await db.execute(select(Customer).where(Customer.email == body.email))
    else:
        result = await db.execute(select(Customer).where(Customer.phone == body.phone))
        
    customer = result.scalar_one_or_none()
    
    if not customer:
        # Derive name from email prefix if name is missing
        derived_name = body.email.split('@')[0].replace('.', ' ').replace('_', ' ').capitalize() if body.email else "New Customer"
        
        customer = Customer(
            email=body.email,
            phone=body.phone,
            full_name=derived_name,
            is_active=True
        )
        db.add(customer)
        await db.commit()
        await db.refresh(customer)
    
    if not customer.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")

    token = create_access_token(str(customer.id))
    return CustomerTokenResponse(access_token=token, customer=CustomerOut.model_validate(customer))


@router.post("/register", response_model=CustomerOut, status_code=201)
async def register(body: CustomerCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Customer).where(Customer.email == str(body.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Derive name from email if missing
    final_name = body.full_name
    if not final_name or final_name.lower() == "new customer":
        final_name = str(body.email).split('@')[0].replace('.', ' ').replace('_', ' ').capitalize()

    customer = Customer(
        email=str(body.email),
        hashed_password=hash_password(body.password),
        full_name=final_name,
        phone=body.phone,
        date_of_birth=body.date_of_birth,
        gender=body.gender,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)

    # Send welcome SMS if phone number is available
    if customer.phone:
        welcome_msg = f"Welcome to KOZMOCART, {customer.full_name or 'Valued Customer'}! Discover exclusive premium fragrances at kozmocart.com. Thank you for joining us!"
        background_tasks.add_task(sendsms_welcome, customer.phone, welcome_msg)

    return CustomerOut.model_validate(customer)


@router.post("/login", response_model=CustomerTokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.email == form_data.username))
    customer = result.scalar_one_or_none()
    
    if not customer or not verify_password(form_data.password, customer.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    if not customer.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is disabled")

    token = create_access_token(str(customer.id))
    return CustomerTokenResponse(access_token=token, customer=CustomerOut.model_validate(customer))

@router.post("/google", response_model=CustomerTokenResponse)
async def google_auth(body: GoogleAuthRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Support seamless auto-registration and authentication for Gmail OAuth payloads
    email = body.email.strip().lower()
    
    result = await db.execute(select(Customer).where(Customer.email == email))
    customer = result.scalar_one_or_none()
    is_new = False

    if not customer:
        # Derive name from email if not provided by Google
        final_name = body.name
        if not final_name:
            final_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').capitalize()

        customer = Customer(
            email=email,
            full_name=final_name,
            is_active=True
        )
        db.add(customer)
        await db.commit()
        await db.refresh(customer)
        is_new = True
        
    if not customer.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is disabled")

    # Welcome SMS for newly registered Google customers who have a phone
    if is_new and customer.phone:
        welcome_msg = f"Welcome to KOZMOCART, {customer.full_name or 'Valued Customer'}! Discover exclusive premium fragrances at kozmocart.com. Thank you for joining us!"
        background_tasks.add_task(sendsms_welcome, customer.phone, welcome_msg)

    token = create_access_token(str(customer.id))
    return CustomerTokenResponse(access_token=token, customer=CustomerOut.model_validate(customer))
