from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.offer import Offer
from app.models.order import Order
from app.models.user import User
from app.schemas.offer import OfferCreate, OfferUpdate, OfferOut
from app.core.deps import get_current_user, require_manager

router = APIRouter(prefix="/offers", tags=["Offers"])

@router.get("", response_model=List[OfferOut])
async def get_offers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    # Get Global AOV
    global_aov_res = await db.execute(select(func.avg(Order.total_amount)))
    global_aov = float(global_aov_res.scalar() or 0)

    result = await db.execute(select(Offer).order_by(Offer.created_at.desc()))
    offers = result.scalars().all()

    for o in offers:
        if o.redemption_count > 0:
            offer_aov = float(o.attributed_revenue) / o.redemption_count
            if global_aov > 0:
                lift = ((offer_aov - global_aov) / global_aov) * 100
                o.aov_lift = f"{'+' if lift >= 0 else ''}{lift:.1f}%"
            else:
                o.aov_lift = "+0%"
        else:
            o.aov_lift = "+0%"
            
    return offers

@router.post("", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager)
):
    data = offer_in.model_dump()
    if not data.get("active_until"):
        data["active_until"] = None
    
    db_offer = Offer(**data)
    db.add(db_offer)
    await db.commit()
    await db.refresh(db_offer)
    return db_offer

@router.get("/{offer_id}", response_model=OfferOut)
async def get_offer(
    offer_id: UUID, 
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer

@router.patch("/{offer_id}", response_model=OfferOut)
async def update_offer(
    offer_id: UUID,
    offer_in: OfferUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager)
):
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    db_offer = result.scalar_one_or_none()
    if not db_offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    update_data = offer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_offer, field, value)
    
    await db.commit()
    await db.refresh(db_offer)
    return db_offer

@router.delete("/{offer_id}")
async def delete_offer(
    offer_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager)
):
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    await db.delete(offer)
    await db.commit()
    return {"detail": "Offer deleted successfully"}
