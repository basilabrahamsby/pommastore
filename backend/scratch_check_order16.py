import sys
import asyncio
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("""
            SELECT id, order_number, subtotal, discount_amount, total_amount, coupon_code, loyalty_points_used, notes, created_at
            FROM orders WHERE order_number LIKE '%016%'
        """))
        rows = res.fetchall()
        for r in rows:
            m = dict(r._mapping)
            print("ORDER RECORD:", m)
            items = await session.execute(text("SELECT * FROM order_items WHERE order_id = :oid"), {"oid": m["id"]})
            print("ORDER ITEMS:", [dict(i._mapping) for i in items.fetchall()])

        tables = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        print("\n=== TABLES ===")
        print([t[0] for t in tables.fetchall()])

        offers = await session.execute(text("SELECT * FROM offers"))
        print("\n=== OFFERS ===")
        for o in offers.fetchall():
            print(dict(o._mapping))

if __name__ == "__main__":
    asyncio.run(check())
