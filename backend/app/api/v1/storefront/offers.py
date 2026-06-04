from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.offer import Offer
from app.models.product import Product, ProductVariant
from app.schemas.offer import OfferOut
from app.schemas.product import ProductOut
from app.api.v1.storefront.products import enrich_product

router = APIRouter(prefix="/offers", tags=["Storefront Offers"])

class OfferWithProductsOut(OfferOut):
    products: List[ProductOut] = []

@router.get("", response_model=List[OfferWithProductsOut])
async def list_storefront_offers(
    db: AsyncSession = Depends(get_db)
):
    # Fetch active campaigns eligible for storefront display
    query = select(Offer).where(
        (Offer.status == "Active") | (Offer.status == "active")
    ).order_by(Offer.created_at.desc())
    
    result = await db.execute(query)
    offers = result.scalars().all()
    
    now = datetime.utcnow()
    valid_offers = []
    all_target_skus = set()
    
    for off in offers:
        if off.active_until and off.active_until.replace(tzinfo=None) < now:
            continue
        
        # Accumulate all SKUs present in this offer config
        combined_skus = (off.buy_skus or []) + (off.get_skus or []) + (off.target_skus or [])
        for sku in combined_skus:
            if sku:
                all_target_skus.add(sku)
        valid_offers.append(off)
        
    # Fetch matching catalog objects en-masse
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
        raw_prods = prod_res.scalars().all()
        
        for p in raw_prods:
            enriched = await enrich_product(p, db)
            # Associate with every variant SKU
            for v in p.variants:
                mapped_products_by_sku[v.sku] = enriched

    # Attach products back to offer structures
    final_out = []
    for offer in valid_offers:
        out_obj = OfferWithProductsOut.model_validate(offer)
        
        # Find which enriched products are actually relevant to this offer
        relevant_prods = {}
        check_skus = (offer.buy_skus or []) + (offer.get_skus or []) + (offer.target_skus or [])
        for sku in check_skus:
            if sku in mapped_products_by_sku:
                prod_data = mapped_products_by_sku[sku]
                relevant_prods[str(prod_data.id)] = prod_data
        
        out_obj.products = list(relevant_prods.values())
        final_out.append(out_obj)
        
    return final_out
