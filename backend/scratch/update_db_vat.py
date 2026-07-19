import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50) DEFAULT 'Exclusive';"))
        await conn.execute(text("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS gst_slab VARCHAR(50) DEFAULT '5';"))
        await conn.execute(text("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(100) DEFAULT '3303.00';"))
        await conn.execute(text("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100) DEFAULT 'Dubai';"))
        
        await conn.execute(text("UPDATE product_variants SET tax_type = 'Exclusive' WHERE tax_type IS NULL;"))
        await conn.execute(text("UPDATE product_variants SET gst_slab = '5' WHERE gst_slab IS NULL;"))
        await conn.execute(text("UPDATE product_variants SET hsn_code = '3303.00' WHERE hsn_code IS NULL;"))
        await conn.execute(text("UPDATE product_variants SET place_of_supply = 'Dubai' WHERE place_of_supply IS NULL;"))
        
        print("Successfully added tax_type, gst_slab, hsn_code, place_of_supply to product_variants table!")

if __name__ == "__main__":
    asyncio.run(main())
