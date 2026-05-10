import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check_counts():
    tables = [
        "users", "categories", "brands", "products", 
        "product_variants", "suppliers", "inventory_batches", 
        "orders", "order_items", "customers", "offers"
    ]
    async with engine.connect() as conn:
        for tbl in tables:
            try:
                res = await conn.execute(text(f'SELECT COUNT(*) FROM "{tbl}"'))
                cnt = res.scalar()
                print(f"{tbl}: {cnt}")
            except Exception as e:
                print(f"{tbl}: ERROR {e}")

if __name__ == "__main__":
    asyncio.run(check_counts())
