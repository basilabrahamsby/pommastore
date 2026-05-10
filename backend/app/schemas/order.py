from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict, Any
from app.models.order import OrderStatus, PaymentMethod, PaymentStatus


class OrderItemCreate(BaseModel):
    variant_id: UUID
    quantity: int
    unit_price: float
    discount_amount: float = 0.0


class OrderCreate(BaseModel):
    customer_id: UUID | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_email: str | None = None
    channel: str = "pos"
    payment_method: PaymentMethod | None = None
    discount_amount: float = 0.0
    loyalty_points_used: int = 0
    tax_amount: float = 0.0
    shipping_amount: float = 0.0
    notes: str | None = None
    gift_message: str | None = None
    coupon_code: str | None = None
    shipping_address: Dict[str, Any] | None = None
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    tracking_number: str | None = None
    carrier: str | None = None
    notes: str | None = None


class OrderItemOut(BaseModel):
    id: UUID
    variant_id: UUID
    sku: str = ""
    product_name: str = ""
    quantity: int
    unit_price: float
    discount_amount: float
    total_price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: UUID
    order_number: str
    customer_id: UUID | None
    customer_name: str | None = None
    channel: str
    status: OrderStatus
    payment_method: PaymentMethod | None
    payment_status: PaymentStatus
    subtotal: float
    discount_amount: float
    loyalty_points_used: int
    tax_amount: float
    shipping_amount: float
    total_amount: float
    notes: str | None
    coupon_code: str | None
    tracking_number: str | None
    carrier: str | None
    items: List[OrderItemOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerCreate(BaseModel):
    email: str | None = None
    phone: str | None = None
    full_name: str | None = None
    gender: str | None = None
    acquisition_source: str | None = None


class CustomerOut(BaseModel):
    id: UUID
    email: str | None
    phone: str | None
    full_name: str | None
    gender: str | None
    loyalty_tier: str
    loyalty_points: int
    total_spent: float
    order_count: int
    last_order_at: datetime | None
    acquisition_source: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
