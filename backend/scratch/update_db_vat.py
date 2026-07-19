import asyncio
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db.session import engine

async def main():
    async with engine.begin() as conn:
        result = await conn.execute(text("UPDATE product_variants SET gst_slab = '5', place_of_supply = 'Dubai' WHERE gst_slab IS NULL OR gst_slab = '18' OR gst_slab = '12' OR gst_slab = '28' OR place_of_supply LIKE '%Intrastate%';"))
        print(f"Updated {result.rowcount} product variants to 5% UAE VAT and Dubai Emirate!")

if __name__ == "__main__":
    asyncio.run(main())
