from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.product import Category
from app.models.user import User
from app.schemas.brand import CategoryCreate, CategoryUpdate, CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Category).order_by(Category.name))
    return [CategoryOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=CategoryOut, status_code=201)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    existing = await db.execute(select(Category).where(Category.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Category with this slug already exists")
    cat = Category(**body.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.patch("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: str,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.commit()
