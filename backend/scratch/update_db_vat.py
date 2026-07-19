import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        res_brands = await conn.execute(text("UPDATE brands SET gst_category = 'Perfumes (5% UAE VAT)';"))
        print(f"Updated {res_brands.rowcount} brands to 'Perfumes (5% UAE VAT)'!")

if __name__ == "__main__":
    asyncio.run(main())
