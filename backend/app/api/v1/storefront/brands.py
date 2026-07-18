from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.product import Brand, Product
from app.schemas.brand import BrandOut
from app.api.v1.storefront.products import get_lang

router = APIRouter(prefix="/brands", tags=["Storefront Brands"])


@router.get("")
async def list_active_brands(
    lang: str | None = Query(None),
    accept_language: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    locale = get_lang(accept_language, lang)
    # Select only active brands that have published products
    q = select(Brand).where(Brand.is_active == True).order_by(Brand.name)
    result = await db.execute(q)
    brands = result.scalars().all()

    # Direct count query for stability
    counts = {}
    try:
        from sqlalchemy import text
        res_counts = await db.execute(text("SELECT brand_id, COUNT(*) FROM products GROUP BY brand_id"))
        for row in res_counts.all():
            if row[0]:
                counts[str(row[0])] = row[1]
    except Exception as count_err:
        print(f"Product count analytics skipped: {count_err}")

    out = []
    try:
        for b in brands:
            # Safe serialization
            try:
                brand_data = BrandOut.model_validate(b).model_dump()
                brand_data["product_count"] = counts.get(str(b.id), 0)
                if locale == "ar":
                    if getattr(b, "name_ar", None):
                        brand_data["name"] = b.name_ar
                    if getattr(b, "description_ar", None):
                        brand_data["description"] = b.description_ar
                out.append(brand_data)
            except Exception as ser_err:
                print(f"Skipping brand {b.name} due to serialization issue: {ser_err}")
                continue
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery Error: {str(e)}")
    return out

@router.get("/{slug}", response_model=BrandOut)
async def get_brand_by_slug(
    slug: str,
    lang: str | None = Query(None),
    accept_language: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    locale = get_lang(accept_language, lang)
    result = await db.execute(select(Brand).where(Brand.slug == slug, Brand.is_active == True))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    brand_out = BrandOut.model_validate(brand)
    if locale == "ar":
        if getattr(brand, "name_ar", None):
            brand_out.name = brand.name_ar
        if getattr(brand, "description_ar", None):
            brand_out.description = brand.description_ar
    return brand_out
