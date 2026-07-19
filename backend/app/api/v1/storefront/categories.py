from fastapi import APIRouter, Depends, Query, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.cache import meta_cache
from app.models.product import Category
from app.schemas.brand import CategoryOut
from app.api.v1.storefront.products import get_lang

router = APIRouter(prefix="/categories", tags=["Storefront Categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    response: Response,
    lang: str | None = Query(None),
    accept_language: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    locale = get_lang(accept_language, lang)
    cache_key = f"categories:{locale}"
    cached = meta_cache.get(cache_key)
    if cached is not None:
        response.headers["Cache-Control"] = "public, max-age=300, s-maxage=300"
        response.headers["X-Cache"] = "HIT"
        return cached

    result = await db.execute(select(Category).where(Category.is_active == True).order_by(Category.name))
    cat_objs = result.scalars().all()
    
    out = []
    for c in cat_objs:
        cat_out = CategoryOut.model_validate(c)
        if locale == "ar":
            if getattr(c, "name_ar", None):
                cat_out.name = c.name_ar
            if getattr(c, "description_ar", None):
                cat_out.description = c.description_ar
        out.append(cat_out)

    meta_cache.set(cache_key, out)
    response.headers["Cache-Control"] = "public, max-age=300, s-maxage=300"
    response.headers["X-Cache"] = "MISS"
    return out
