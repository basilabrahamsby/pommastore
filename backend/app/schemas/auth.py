from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    phone: str | None = None
    role: UserRole = UserRole.salesperson


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


TokenResponse.model_rebuild()
