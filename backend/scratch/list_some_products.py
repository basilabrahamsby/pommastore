import asyncio
import sys
sys.path.append('c:\\Developer\\Kozmocart\\backend')

from app.core.database import AsyncSessionLocal
from app.models.product import Product
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Product).limit(10))
        prods = res.scalars().all()
        print("--- PRODUCTS ---")
        for p in prods:
            print(f"ID: {p.id} | Name: {p.name} | Slug: {p.slug} | Active: {p.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
