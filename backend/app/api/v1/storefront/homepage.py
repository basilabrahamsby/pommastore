from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, case
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.models.product import Category, Product, ProductVariant, Brand
from app.models.system import SystemSettings
from app.models.offer import Offer
from app.models.loyalty import LoyaltyReward
from app.api.v1.storefront.products import enrich_products_bulk
from app.schemas.brand import CategoryOut, BrandOut
from app.schemas.offer import OfferOut
from app.schemas.product import ProductOut
from app.schemas.loyalty import LoyaltyRewardOut

router = APIRouter(prefix="/homepage", tags=["Storefront Homepage"])

class OfferWithProductsOut(OfferOut):
    products: List[ProductOut] = []

@router.get("")
async def get_homepage_data(db: AsyncSession = Depends(get_db)):
    """Consolidated endpoint fetching all homepage layouts and product curation data en-masse."""
    
    # 1. Fetch system layouts & settings
    settings_result = await db.execute(
        select(SystemSettings).where(SystemSettings.key.in_(["storefront_layout", "company", "seo", "geo"]))
    )
    settings_map = {s.key: s.value for s in settings_result.scalars().all()}
    layout = settings_map.get("storefront_layout", {})
    company = settings_map.get("company", {})
    seo = settings_map.get("seo", {})
    geo = settings_map.get("geo", {})
    
    if not layout:
        layout = {
            "hero_slides": [
                {"image": "/hero-1.png", "subtitle": "PREMIUM COLLECTION", "title": "The Signature Scent", "desc": "Discover the ultimate expression of refinement and grace.", "cta": "Shop Now"}
            ],
            "split_banners": {"men": "/banner-men.png", "women": "/banner-women.png"},
            "mid_quote": {"text": "Perfume follows you; it chases you and lingers behind you.", "author": "The Essence of Beauty"}
        }

    # 2. Fetch categories
    cats_result = await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.name)
    )
    categories = [CategoryOut.model_validate(c) for c in cats_result.scalars().all()]

    # 3. Fetch brands
    brands_result = await db.execute(
        select(Brand).order_by(Brand.name)
    )
    brands = [BrandOut.model_validate(b) for b in brands_result.scalars().all()]

    # 4. Fetch loyalty rewards
    rewards_result = await db.execute(
        select(LoyaltyReward).order_by(LoyaltyReward.created_at.desc())
    )
    rewards = [LoyaltyRewardOut.model_validate(r) for r in rewards_result.scalars().all()]

    # 5. Fetch product curations en-masse
    # 5a. New arrivals
    res_new = await db.execute(
        select(Product)
        .where(Product.is_active == True, Product.is_new_arrival == True)
        .options(
            selectinload(Product.variants),
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.images),
        )
        .order_by(case((Product.priority == 0, 999999), else_=Product.priority).asc(), Product.created_at.desc())
        .limit(20)
    )
    new_arrivals_list = res_new.scalars().all()

    # 5b. Featured bestsellers
    res_feat = await db.execute(
        select(Product)
        .where(Product.is_active == True, Product.is_featured == True)
        .options(
            selectinload(Product.variants),
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.images),
        )
        .order_by(case((Product.priority == 0, 999999), else_=Product.priority).asc(), Product.created_at.desc())
        .limit(10)
    )
    featured_list = res_feat.scalars().all()

    # 5c. Favorites/Fallbacks
    res_fav = await db.execute(
        select(Product)
        .where(Product.is_active == True, Product.is_featured == False, Product.is_new_arrival == False)
        .options(
            selectinload(Product.variants),
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.images),
        )
        .order_by(case((Product.priority == 0, 999999), else_=Product.priority).asc(), Product.created_at.desc())
        .limit(20)
    )
    favorites_list = res_fav.scalars().all()

    # 5d. Perform bulk serialization and stock loading for all curation lists
    combined_raw_products = new_arrivals_list + featured_list + favorites_list
    unique_products_map = {p.id: p for p in combined_raw_products}
    unique_products = list(unique_products_map.values())
    
    enriched_products = await enrich_products_bulk(unique_products, db)
    enriched_map = {ep.id: ep for ep in enriched_products}

    new_arrivals_out = [enriched_map[p.id] for p in new_arrivals_list if p.id in enriched_map]
    featured_out = [enriched_map[p.id] for p in featured_list if p.id in enriched_map]
    favorites_out = [enriched_map[p.id] for p in favorites_list if p.id in enriched_map]

    # 6. Fetch offers and match corresponding catalog items
    res_offers = await db.execute(
        select(Offer)
        .where((Offer.status == "Active") | (Offer.status == "active"))
        .order_by(Offer.created_at.desc())
    )
    offers_list = res_offers.scalars().all()
    
    now = datetime.utcnow()
    valid_offers = []
    all_target_skus = set()
    
    for off in offers_list:
        if off.active_until and off.active_until.replace(tzinfo=None) < now:
            continue
        combined_skus = (off.buy_skus or []) + (off.get_skus or []) + (off.target_skus or [])
        for sku in combined_skus:
            if sku:
                all_target_skus.add(sku)
        valid_offers.append(off)
        
    mapped_products_by_sku = {}
    if all_target_skus:
        prod_query = (
            select(Product)
            .join(ProductVariant)
            .where(ProductVariant.sku.in_(list(all_target_skus)))
            .options(
                selectinload(Product.variants),
                selectinload(Product.brand),
                selectinload(Product.category),
                selectinload(Product.images)
            )
            .distinct()
        )
        prod_res = await db.execute(prod_query)
        raw_offer_prods = prod_res.scalars().all()
        
        enriched_offer_prods = await enrich_products_bulk(raw_offer_prods, db)
        for ep in enriched_offer_prods:
            for v in ep.variants:
                mapped_products_by_sku[v.sku] = ep

    offers_out = []
    for offer in valid_offers:
        out_obj = OfferWithProductsOut.model_validate(offer)
        relevant_prods = {}
        check_skus = (offer.buy_skus or []) + (offer.get_skus or []) + (offer.target_skus or [])
        for sku in check_skus:
            if sku in mapped_products_by_sku:
                prod_data = mapped_products_by_sku[sku]
                relevant_prods[str(prod_data.id)] = prod_data
        out_obj.products = list(relevant_prods.values())
        offers_out.append(out_obj)

    # 7. Package and return the aggregated payload
    return {
        "layout": {
            **layout,
            "company": company,
            "seo": seo,
            "geo": geo,
        },
        "categories": categories,
        "brands": brands,
        "rewards": rewards,
        "new_arrivals": new_arrivals_out,
        "bestsellers": featured_out,
        "favorites": favorites_out,
        "offers": offers_out
    }
