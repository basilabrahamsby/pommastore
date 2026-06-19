import sys
import asyncio
sys.path.append('C:\\Developer\\Kozmocart\\backend')

from app.core.database import AsyncSessionLocal
from app.models.product import Brand, Category

async def main():
    async with AsyncSessionLocal() as db:
        # Create brands
        brand1 = Brand(name="POMMA", slug="pomma")
        brand2 = Brand(name="HAPPYLIFE EMOJI", slug="happylife-emoji")
        db.add(brand1)
        db.add(brand2)
        
        # Create categories
        cat1 = Category(name="Citrus", slug="citrus")
        cat2 = Category(name="Woody", slug="woody")
        cat3 = Category(name="Floral", slug="floral")
        cat4 = Category(name="Oriental", slug="oriental")
        cat5 = Category(name="Fresh", slug="fresh")
        cat6 = Category(name="Leather", slug="leather")
        cat7 = Category(name="Chypre", slug="chypre")
        
        db.add_all([cat1, cat2, cat3, cat4, cat5, cat6, cat7])
        await db.commit()
        print("Successfully seeded categories and brands!")

if __name__ == "__main__":
    asyncio.run(main())
