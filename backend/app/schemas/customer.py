from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from uuid import UUID
from typing import Optional, List


class CustomerAddressBase(BaseModel):
    label: str | None = None
    address_line1: str
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    phone: str | None = None
    country: str = "India"
    is_default: bool = False


class CustomerAddressOut(CustomerAddressBase):
    id: UUID
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class CustomerBase(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    full_name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None


class CustomerCreate(CustomerBase):
    password: str


class CustomerUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None


class CustomerOut(CustomerBase):
    id: UUID
    loyalty_tier: str
    loyalty_points: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerOut
