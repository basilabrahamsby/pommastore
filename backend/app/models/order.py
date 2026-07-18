import uuid
import enum
from datetime import datetime
from typing import List
from sqlalchemy import (
    String, Boolean, Integer, Numeric, Text, DateTime,
    ForeignKey, Enum as SAEnum, func, text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    packed = "packed"
    shipped = "shipped"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
    return_requested = "return_requested"
    returned = "returned"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    upi = "upi"
    bank_transfer = "bank_transfer"
    cod = "cod"
    razorpay = "razorpay"
    stripe = "stripe"
    loyalty_points = "loyalty_points"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    partially_paid = "partially_paid"
    refunded = "refunded"
    failed = "failed"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), index=True)
    processed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    channel: Mapped[str] = mapped_column(String(50), default="pos")
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus, name="orderstatus"), default=OrderStatus.pending, index=True)
    payment_method: Mapped[PaymentMethod | None] = mapped_column(SAEnum(PaymentMethod, name="paymentmethod"))
    payment_status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus, name="paymentstatus"), default=PaymentStatus.pending)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    loyalty_points_used: Mapped[int] = mapped_column(Integer, default=0)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    shipping_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Contact Info (Snapshot for historical accuracy & guest checkout)
    customer_name: Mapped[str | None] = mapped_column(String(255))
    customer_phone: Mapped[str | None] = mapped_column(String(20))
    customer_email: Mapped[str | None] = mapped_column(String(255))

    # Delivery & Billing
    shipping_address: Mapped[dict | None] = mapped_column(JSONB)
    billing_address: Mapped[dict | None] = mapped_column(JSONB)

    # Payment Section
    transaction_id: Mapped[str | None] = mapped_column(String(255))
    payment_gateway: Mapped[str | None] = mapped_column(String(100))
    payment_details: Mapped[dict | None] = mapped_column(JSONB)

    notes: Mapped[str | None] = mapped_column(Text)
    gift_message: Mapped[str | None] = mapped_column(Text)
    coupon_code: Mapped[str | None] = mapped_column(String(100))
    carrier: Mapped[str | None] = mapped_column(String(100))
    tracking_number: Mapped[str | None] = mapped_column(String(255))
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history: Mapped[List["OrderStatusHistory"]] = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan", order_by="OrderStatusHistory.created_at")
    customer: Mapped["Customer | None"] = relationship("Customer", back_populates="orders", lazy="select")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=False, index=True)
    batch_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("inventory_batches.id"))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    cost_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    variant: Mapped["ProductVariant"] = relationship("ProductVariant", lazy="joined")

    @property
    def product_name(self) -> str:
        if self.variant and self.variant.product:
            return self.variant.product.name
        return ""

    @property
    def sku(self) -> str:
        if self.variant:
            return self.variant.sku
        return ""

    @property
    def product_image(self) -> str | None:
        if self.variant and self.variant.product and self.variant.product.images:
            # Try to find primary image for this variant first
            variant_image = next((img for img in self.variant.product.images if img.variant_id == self.variant_id and img.is_primary), None)
            if variant_image:
                return variant_image.url
            # Fallback to any image for this variant
            variant_image_any = next((img for img in self.variant.product.images if img.variant_id == self.variant_id), None)
            if variant_image_any:
                return variant_image_any.url
            # Fallback to primary image for the product
            primary_image = next((img for img in self.variant.product.images if img.is_primary), None)
            if primary_image:
                return primary_image.url
            # Final fallback to first image
            return self.variant.product.images[0].url
        return None

    @property
    def size_ml(self) -> int | None:
        if self.variant:
            return self.variant.size_ml
        return None


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus, name="orderstatus"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship("Order", back_populates="status_history")


from app.models.customer import Customer  # noqa: E402, F401
from app.models.product import ProductVariant  # noqa: E402, F401
from app.models.inventory import InventoryBatch  # noqa: E402, F401
