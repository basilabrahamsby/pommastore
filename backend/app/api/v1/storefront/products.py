from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.product import Product, ProductVariant, ProductImage
from app.models.inventory import InventoryBatch
from app.schemas.product import ProductOut, ProductDetailOut
router = APIRouter(prefix="/products", tags=["Storefront Products"])

async def enrich_product(product: Product, db: AsyncSession, detail: bool = False) -> ProductOut | ProductDetailOut:
    # Get stock per variant
    stock_result = await db.execute(
        select(InventoryBatch.variant_id, func.sum(InventoryBatch.current_quantity))
        .where(InventoryBatch.variant_id.in_([v.id for v in product.variants]))
        .group_by(InventoryBatch.variant_id)
    )
    stock_map = {row[0]: int(row[1]) for row in stock_result.all()}

    schema = ProductDetailOut if detail else ProductOut
    out = schema.model_validate(product)
    out.brand_name = product.brand.name if product.brand else ""
    out.category_name = product.category.name if product.category else None
    out.images = [img.url for img in product.images]
    for v_out in out.variants:
        v_out.current_stock = stock_map.get(v_out.id, 0)
    return out


async def enrich_products_bulk(products: list[Product], db: AsyncSession) -> list[ProductOut]:
    if not products:
        return []

    # Collect all variant IDs
    variant_ids = [v.id for p in products for v in p.variants]

    stock_map = {}
    if variant_ids:
        stock_result = await db.execute(
            select(InventoryBatch.variant_id, func.sum(InventoryBatch.current_quantity))
            .where(InventoryBatch.variant_id.in_(variant_ids))
            .group_by(InventoryBatch.variant_id)
        )
        stock_map = {row[0]: int(row[1]) for row in stock_result.all()}

    enriched = []
    for p in products:
        out = ProductOut.model_validate(p)
        out.brand_name = p.brand.name if p.brand else ""
        out.category_name = p.category.name if p.category else None
        out.images = [img.url for img in p.images]
        for v_out in out.variants:
            v_out.current_stock = stock_map.get(v_out.id, 0)
        enriched.append(out)

    return enriched


@router.get("", response_model=list[ProductOut])
async def list_products(
    search: str | None = Query(None),
    brand_id: str | None = Query(None),
    category_id: str | None = Query(None),
    gender: str | None = Query(None),
    is_featured: bool | None = Query(None),
    is_new_arrival: bool | None = Query(None),
    on_sale: bool | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Product)
        .where(Product.is_active == True)
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
    if gender:
        q = q.where(Product.gender == gender)
    if is_featured is not None:
        q = q.where(Product.is_featured == is_featured)
    if is_new_arrival is not None:
        q = q.where(Product.is_new_arrival == is_new_arrival)
    if on_sale:
        q = q.where(Product.variants.any(ProductVariant.compare_at_price > ProductVariant.selling_price))
    
    q = q.order_by(case((Product.priority == 0, 999999), else_=Product.priority).asc(), Product.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    products = result.scalars().all()
    return await enrich_products_bulk(products, db)
@router.get("/{slug}", response_model=ProductDetailOut)
async def get_product_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .where(Product.slug == slug, Product.is_active == True)
        .options(
            selectinload(Product.variants),
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.images),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return await enrich_product(product, db, detail=True)
