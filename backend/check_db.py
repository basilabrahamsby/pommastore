import asyncio
import sys
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from app.models.product import Product, Brand
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res_b = await db.execute(select(Brand))
        brands = res_b.scalars().all()
        print('=== BRANDS ===')
        for b in brands:
            print(f'id: {b.id}, name: {b.name}')
            
        res_p = await db.execute(select(Product))
        prods = res_p.scalars().all()
        print('=== PRODUCTS ===')
        for p in prods:
            print(f'name: {p.name}, brand_id: {p.brand_id}, images: {p.images}')

if __name__ == '__main__':
    asyncio.run(main())
