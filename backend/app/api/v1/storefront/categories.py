from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.product import Category
from app.schemas.brand import CategoryOut

router = APIRouter(prefix="/categories", tags=["Storefront Categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).where(Category.is_active == True).order_by(Category.name))
    return [CategoryOut.model_validate(c) for c in result.scalars().all()]
