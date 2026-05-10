import uuid
from datetime import datetime
from typing import List
from sqlalchemy import (
    String, Boolean, Integer, Numeric, Text, DateTime, Date,
    ForeignKey, func, text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255))
    hashed_password: Mapped[str | None] = mapped_column(String)
    date_of_birth: Mapped[datetime | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(20))
    scent_profile: Mapped[dict | None] = mapped_column(JSONB)
    loyalty_tier: Mapped[str] = mapped_column(String(20), default="Bronze")
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0)
    total_spent: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    order_count: Mapped[int] = mapped_column(Integer, default=0)
    last_order_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    acquisition_source: Mapped[str | None] = mapped_column(String(100))
    referral_code: Mapped[str | None] = mapped_column(String(50), unique=True)
    referred_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    addresses: Mapped[List["CustomerAddress"]] = relationship("CustomerAddress", back_populates="customer", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="customer", lazy="select")


class CustomerAddress(Base):
    __tablename__ = "customer_addresses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str | None] = mapped_column(String(50))
    address_line1: Mapped[str] = mapped_column(Text, nullable=False)
    address_line2: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    pincode: Mapped[str | None] = mapped_column(String(20))
    country: Mapped[str] = mapped_column(String(100), default="India")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="addresses")


from app.models.order import Order  # noqa: E402, F401
