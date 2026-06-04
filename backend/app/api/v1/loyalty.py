from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.loyalty import LoyaltyReward
from app.schemas.loyalty import LoyaltyRewardOut, LoyaltyRewardCreate

router = APIRouter(prefix="/loyalty", tags=["Loyalty Rewards"])

@router.get("/rewards", response_model=List[LoyaltyRewardOut])
async def admin_list_rewards(
    db: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user)
):
    result = await db.execute(select(LoyaltyReward).order_by(LoyaltyReward.point_cost.asc()))
    return result.scalars().all()

@router.post("/rewards", response_model=LoyaltyRewardOut, status_code=201)
async def admin_create_reward(
    body: LoyaltyRewardCreate,
    db: AsyncSession = Depends(get_db),
    _: any = Depends(require_manager)
):
    reward = LoyaltyReward(**body.model_dump())
    db.add(reward)
    await db.commit()
    await db.refresh(reward)
    return reward

@router.patch("/rewards/{reward_id}", response_model=LoyaltyRewardOut)
async def admin_update_reward(
    reward_id: uuid.UUID,
    body: LoyaltyRewardCreate, # Reusing create schema for simplicity in this ERP context
    db: AsyncSession = Depends(get_db),
    _: any = Depends(require_manager)
):
    result = await db.execute(select(LoyaltyReward).where(LoyaltyReward.id == reward_id))
    reward = result.scalar_one_or_none()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reward, key, value)
    
    await db.commit()
    await db.refresh(reward)
    return reward

@router.delete("/rewards/{reward_id}", status_code=204)
async def admin_delete_reward(
    reward_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: any = Depends(require_manager)
):
    result = await db.execute(select(LoyaltyReward).where(LoyaltyReward.id == reward_id))
    reward = result.scalar_one_or_none()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    await db.delete(reward)
    await db.commit()
