import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
        tables = [row[0] for row in res.all()]
        print(f"Existing DB tables: {tables}")

        tables_to_truncate = [
            'order_items', 'order_status_history', 'order_audit_logs', 
            'orders', 'inventory_batches', 'stock_movements', 
            'loyalty_transactions', 'customer_transactions'
        ]
        for t in tables_to_truncate:
            if t in tables:
                await conn.execute(text(f"TRUNCATE TABLE {t} CASCADE;"))
                print(f"Truncated table: {t}")

        if 'customers' in tables:
            res_cust = await conn.execute(text("UPDATE customers SET loyalty_points = 0;"))
            print(f"Reset loyalty points for {res_cust.rowcount} customers.")

        print("=== ALL TRANSACTIONS AND STOCK WIPED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(main())
