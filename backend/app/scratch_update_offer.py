import asyncio
import sys
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as session:
        # Update offer 0988427 flat_discount_amount to 0.00
        await session.execute(text("""
            UPDATE offers 
            SET flat_discount_amount = 0.00, 
                updated_at = NOW()
            WHERE code = '0988427' OR title LIKE '%INDEPENDENCE%'
        """))
        await session.commit()
        print("✓ Updated offer 0988427: flat_discount_amount = 0.00")

        res = await session.execute(text("SELECT id, title, code, discount_type, flat_discount_amount, discount_percentage FROM offers WHERE code = '0988427'"))
        row = res.fetchone()
        if row:
            print("UPDATED OFFER:", dict(row._mapping))

if __name__ == "__main__":
    asyncio.run(main())
