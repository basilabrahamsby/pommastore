from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.product import Product, ProductVariant, Brand, Category, ProductImage
from app.models.inventory import InventoryBatch
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, VariantCreate, VariantUpdate, VariantOut

router = APIRouter(prefix="/products", tags=["Products"])


async def enrich_product(product: Product, db: AsyncSession) -> ProductOut:
    # Get stock per variant
    stock_result = await db.execute(
        select(InventoryBatch.variant_id, func.sum(InventoryBatch.current_quantity))
        .where(InventoryBatch.variant_id.in_([v.id for v in product.variants]))
        .group_by(InventoryBatch.variant_id)
    )
    stock_map = {row[0]: int(row[1]) for row in stock_result.all()}

    out = ProductOut.model_validate(product)
    out.brand_name = product.brand.name if product.brand else ""
    out.category_name = product.category.name if product.category else None
    out.images = [img.url for img in product.images]
    for v_out in out.variants:
        v_out.current_stock = stock_map.get(v_out.id, 0)
    return out


@router.get("", response_model=list[ProductOut])
async def list_products(
    search: str | None = Query(None),
    brand_id: str | None = Query(None),
    category_id: str | None = Query(None),
    is_active: bool | None = Query(None),
    is_featured: bool | None = Query(None),
    is_new_arrival: bool | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = (
        select(Product)
        .options(
            selectinload(Product.variants),
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.images),
        )
    )
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if brand_id:
        q = q.where(Product.brand_id == brand_id)
    if category_id:
        q = q.where(Product.category_id == category_id)
    if is_active is not None:
        q = q.where(Product.is_active == is_active)
    if is_featured is not None:
        q = q.where(Product.is_featured == is_featured)
    if is_new_arrival is not None:
        q = q.where(Product.is_new_arrival == is_new_arrival)
    q = q.order_by(case((Product.priority == 0, 999999), else_=Product.priority).asc(), Product.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    products = result.scalars().all()
    return [await enrich_product(p, db) for p in products]


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.variants), 
            selectinload(Product.brand), 
            selectinload(Product.category),
            selectinload(Product.images)
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return await enrich_product(product, db)


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    existing = await db.execute(select(Product).where(Product.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Product with this slug already exists")

    product_data = body.model_dump(exclude={"variants", "images"})
    product_data["scent_notes"] = body.scent_notes.model_dump()
    product = Product(**product_data)
    db.add(product)
    await db.flush()

    for v in body.variants:
        variant = ProductVariant(product_id=product.id, **v.model_dump())
        db.add(variant)

    for img_url in body.images:
        db.add(ProductImage(product_id=product.id, url=img_url))

    await db.commit()
    await db.refresh(product)

    result = await db.execute(
        select(Product)
        .where(Product.id == product.id)
        .options(
            selectinload(Product.variants), 
            selectinload(Product.brand), 
            selectinload(Product.category),
            selectinload(Product.images)
        )
    )
    product = result.scalar_one()
    return await enrich_product(product, db)


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id)
        .options(
            selectinload(Product.variants), 
            selectinload(Product.brand), 
            selectinload(Product.category),
            selectinload(Product.images)
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    data = body.model_dump(exclude_none=True)
    if "scent_notes" in data and body.scent_notes:
        data["scent_notes"] = body.scent_notes.model_dump()
    for field, value in data.items():
        if field == "images":
            from sqlalchemy import delete
            # Full sync: remove old, add new
            await db.execute(delete(ProductImage).where(ProductImage.product_id == product.id))
            for img_url in value:
                db.add(ProductImage(product_id=product.id, url=img_url))
        else:
            setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return await enrich_product(product, db)


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()


# Variant endpoints
@router.post("/{product_id}/variants", response_model=VariantOut, status_code=201)
async def add_variant(
    product_id: str,
    body: VariantCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")
    variant = ProductVariant(product_id=product_id, **body.model_dump())
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return VariantOut.model_validate(variant)


@router.patch("/variants/{variant_id}", response_model=VariantOut)
async def update_variant(
    variant_id: str,
    body: VariantUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    result = await db.execute(select(ProductVariant).where(ProductVariant.id == variant_id))
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(variant, field, value)
    await db.commit()
    await db.refresh(variant)
    return VariantOut.model_validate(variant)
