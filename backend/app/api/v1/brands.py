from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.product import Brand, Product, ProductVariant
from app.models.user import User
from app.schemas.brand import BrandCreate, BrandUpdate, BrandOut

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("", response_model=list[BrandOut])
async def list_brands(
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Brand)
    if search:
        q = q.where(Brand.name.ilike(f"%{search}%"))
    if is_active is not None:
        q = q.where(Brand.is_active == is_active)
    q = q.order_by(Brand.name).offset(skip).limit(limit)
    result = await db.execute(q)
    brands = result.scalars().all()

    # Count products per brand
    counts_result = await db.execute(
        select(Product.brand_id, func.count(Product.id)).group_by(Product.brand_id)
    )
    counts = {row[0]: row[1] for row in counts_result.all()}

    out = []
    for b in brands:
        data = BrandOut.model_validate(b)
        data.product_count = counts.get(b.id, 0)
        out.append(data)
    return out


@router.get("/{brand_id}", response_model=BrandOut)
async def get_brand(brand_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return BrandOut.model_validate(brand)


@router.post("", response_model=BrandOut, status_code=201)
async def create_brand(
    body: BrandCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    existing = await db.execute(select(Brand).where(Brand.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Brand with this slug already exists")
    brand = Brand(**body.model_dump())
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return BrandOut.model_validate(brand)


@router.patch("/{brand_id}", response_model=BrandOut)
async def update_brand(
    brand_id: str,
    body: BrandUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    data = body.model_dump(exclude_none=True)
    
    # Check if is_active is being changed to False
    if data.get("is_active") is False and brand.is_active is True:
        # Cascade deactivation to products
        await db.execute(
            update(Product)
            .where(Product.brand_id == brand.id)
            .values(is_active=False)
        )
        # Cascade deactivation to variants of those products
        product_ids_subquery = select(Product.id).where(Product.brand_id == brand.id)
        await db.execute(
            update(ProductVariant)
            .where(ProductVariant.product_id.in_(product_ids_subquery))
            .values(is_active=False)
        )

    for field, value in data.items():
        setattr(brand, field, value)
    await db.commit()
    await db.refresh(brand)
    return BrandOut.model_validate(brand)


@router.delete("/{brand_id}", status_code=204)
async def delete_brand(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    await db.delete(brand)
    await db.commit()
