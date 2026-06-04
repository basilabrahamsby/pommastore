import asyncio
import sys
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from app.models.product import Category, Brand, Product
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        cats = (await db.execute(select(Category))).scalars().all()
        brands = (await db.execute(select(Brand))).scalars().all()
        products = (await db.execute(select(Product))).scalars().all()
        print(f"Categories: {len(cats)}")
        for c in cats:
            print(f" - Category: {c.name} (id: {c.id})")
        print(f"Brands: {len(brands)}")
        for b in brands:
            print(f" - Brand: {b.name} (id: {b.id})")
        print(f"Products: {len(products)}")

if __name__ == "__main__":
    asyncio.run(main())
