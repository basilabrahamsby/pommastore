import asyncio
import sys
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as session:
        await session.execute(text("""
            UPDATE orders 
            SET discount_amount = 0.00, 
                total_amount = 115.50,
                coupon_code = NULL,
                updated_at = NOW()
            WHERE order_number LIKE '%PS-2026-016%' OR order_number LIKE '%016%'
        """))
        await session.commit()
        print("✓ Order PS-2026-016 updated: discount_amount = 0.00, total_amount = 115.50")

        res = await session.execute(text("SELECT order_number, subtotal, discount_amount, total_amount FROM orders WHERE order_number LIKE '%016%'"))
        row = res.fetchone()
        if row:
            print("UPDATED ORDER:", dict(row._mapping))

if __name__ == "__main__":
    asyncio.run(main())
