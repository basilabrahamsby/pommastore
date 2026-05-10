from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List

class OfferBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    code: str
    discount_type: str
    discount_percentage: Optional[float] = None
    flat_discount_amount: Optional[float] = None
    
    buy_skus: List[str] = []
    get_skus: List[str] = []
    target_scope: str = "all"
    target_skus: List[str] = []
    target_brands: List[str] = []
    target_categories: List[str] = []
    
    min_purchase_amount: Optional[float] = None
    banner_url: Optional[str] = None
    images: List[str] = []
    
    active_until: Optional[datetime] = None
    status: str = "Active"
    usage_limit: Optional[int] = None
    is_stackable: bool = False
    customer_segment: str = "All Users"

class OfferCreate(OfferBase):
    pass

class OfferUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_percentage: Optional[float] = None
    flat_discount_amount: Optional[float] = None
    buy_skus: Optional[List[str]] = None
    get_skus: Optional[List[str]] = None
    target_scope: Optional[str] = None
    target_skus: Optional[List[str]] = None
    target_brands: Optional[List[str]] = None
    target_categories: Optional[List[str]] = None
    min_purchase_amount: Optional[float] = None
    banner_url: Optional[str] = None
    images: Optional[List[str]] = None
    active_until: Optional[datetime] = None
    status: Optional[str] = None
    usage_limit: Optional[int] = None
    is_stackable: Optional[bool] = None
    customer_segment: Optional[str] = None

class OfferOut(OfferBase):
    id: UUID
    redemption_count: int
    attributed_revenue: float
    aov_lift: Optional[str]
    ctr: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
