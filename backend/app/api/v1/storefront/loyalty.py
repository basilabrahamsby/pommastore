from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.loyalty import LoyaltyReward
from app.schemas.loyalty import LoyaltyRewardOut

router = APIRouter(prefix="/loyalty", tags=["Storefront Loyalty"])

@router.get("/rewards", response_model=List[LoyaltyRewardOut])
async def list_loyalty_rewards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LoyaltyReward).where(LoyaltyReward.is_active == True).order_by(LoyaltyReward.point_cost.asc())
    )
    return result.scalars().all()
