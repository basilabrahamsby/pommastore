import asyncio
import sys
sys.path.append('c:\\Developer\\Pommastore\\backend')

from app.core.database import AsyncSessionLocal
from app.models.product import Brand, Category
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res_cats = await db.execute(select(Category))
        cats = res_cats.scalars().all()
        print("--- CATEGORIES ---")
        for c in cats:
            print(f"ID: {c.id} | Name: {c.name} | Slug: {c.slug}")
            
        res_brands = await db.execute(select(Brand))
        brands = res_brands.scalars().all()
        print("\n--- BRANDS ---")
        for b in brands:
            print(f"ID: {b.id} | Name: {b.name} | Slug: {b.slug}")

if __name__ == "__main__":
    asyncio.run(main())
