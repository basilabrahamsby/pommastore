import asyncio
import sys
sys.path.append('/app')
from app.core.database import AsyncSessionLocal
from app.models.product import Product, ProductVariant
from sqlalchemy import select
from sqlalchemy.orm import joinedload

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ProductVariant).options(joinedload(ProductVariant.product)))
        variants = res.scalars().all()
        for v in variants:
            p_name = v.product.name if v.product else 'No Product'
            print(f'PRODUCT: {p_name} | VARIANT SKU: {v.sku} | PRICE: {v.selling_price} | TAX_TYPE: {v.tax_type} | GST_SLAB: {v.gst_slab}')

if __name__ == '__main__':
    asyncio.run(main())
