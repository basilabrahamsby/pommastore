from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.product import Category
from app.schemas.brand import CategoryOut
from app.api.v1.storefront.products import get_lang

router = APIRouter(prefix="/categories", tags=["Storefront Categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    lang: str | None = Query(None),
    accept_language: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    locale = get_lang(accept_language, lang)
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
    return out
