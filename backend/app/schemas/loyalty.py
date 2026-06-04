from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime

class LoyaltyRewardBase(BaseModel):
    name: str
    description: Optional[str] = None
    point_cost: int
    reward_type: str = "product"
    variant_id: Optional[UUID] = None
    voucher_value: Optional[float] = None
    image_url: Optional[str] = None
    reward_metadata: Optional[dict] = {}
    is_active: bool = True
    stock_available: Optional[int] = None

class LoyaltyRewardCreate(LoyaltyRewardBase):
    pass

class LoyaltyRewardOut(LoyaltyRewardBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
