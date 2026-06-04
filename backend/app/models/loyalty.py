import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, Integer, Boolean, DateTime, func, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class LoyaltyReward(Base):
    __tablename__ = "loyalty_rewards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String)
    point_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # product, voucher, trip, occasion, activity
    reward_type: Mapped[str] = mapped_column(String(50), default="product") 
    
    # If it's a product, which variant is gifted?
    variant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("product_variants.id"))
    
    # If it's a voucher, how much is it worth?
    voucher_value: Mapped[float | None] = mapped_column(Numeric(12, 2))
    
    # JSON metadata for trips, occasions, etc. 
    # {"location": "Goa", "duration": "3 days", "pax": 4}
    reward_metadata: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    
    image_url: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    stock_available: Mapped[int | None] = mapped_column(Integer) # For physical gifts

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    variant = relationship("ProductVariant")
