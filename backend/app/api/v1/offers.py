from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.offer import Offer
from app.schemas.offer import OfferCreate, OfferUpdate, OfferOut
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[OfferOut])
async def get_offers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Offer).order_by(Offer.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_offer = Offer(**offer_in.model_dump())
    db.add(db_offer)
    await db.commit()
    await db.refresh(db_offer)
    return db_offer

@router.get("/{offer_id}", response_model=OfferOut)
async def get_offer(offer_id: UUID, db: AsyncSession = Depends(get_db)):
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
    current_user = Depends(get_current_user)
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
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    await db.delete(offer)
    await db.commit()
    return {"detail": "Offer deleted successfully"}
