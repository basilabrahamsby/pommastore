import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, Integer, Boolean, DateTime, func, text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    discount_type: Mapped[str] = mapped_column(String(100), nullable=False) # BOGO, Percentage, Flat
    discount_percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))
    flat_discount_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    
    buy_skus: Mapped[list[str] | None] = mapped_column(JSONB, default=[])
    get_skus: Mapped[list[str] | None] = mapped_column(JSONB, default=[])
    
    target_scope: Mapped[str | None] = mapped_column(String(50), default="all") # all, items, brand_category
    target_skus: Mapped[list[str] | None] = mapped_column(JSONB, default=[])
    target_brands: Mapped[list[str] | None] = mapped_column(JSONB, default=[])
    target_categories: Mapped[list[str] | None] = mapped_column(JSONB, default=[])
    
    min_purchase_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    banner_url: Mapped[str | None] = mapped_column(String)
    images: Mapped[list[str] | None] = mapped_column(JSONB, default=[])
    
    active_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(50), default="Active")
    
    # Performance Tracking
    redemption_count: Mapped[int] = mapped_column(Integer, default=0)
    usage_limit: Mapped[int | None] = mapped_column(Integer)
    attributed_revenue: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    aov_lift: Mapped[str | None] = mapped_column(String(10), default="+0%")
    ctr: Mapped[str | None] = mapped_column(String(10), default="0.0%")
    
    is_stackable: Mapped[bool] = mapped_column(Boolean, default=False)
    customer_segment: Mapped[str | None] = mapped_column(String(100), default="All Users")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
