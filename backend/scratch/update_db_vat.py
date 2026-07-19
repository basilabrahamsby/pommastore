import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        result = await conn.execute(text("UPDATE product_variants SET gst_slab = '5', place_of_supply = 'Dubai' WHERE gst_slab IS NULL OR gst_slab = '18' OR gst_slab = '12' OR gst_slab = '28' OR place_of_supply LIKE '%Intrastate%';"))
        print(f"Updated {result.rowcount} product variants to 5% UAE VAT and Dubai Emirate!")

if __name__ == "__main__":
    asyncio.run(main())
