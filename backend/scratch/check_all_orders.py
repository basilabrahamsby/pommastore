import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, order_number, customer_id, customer_email, customer_phone, payment_gateway, payment_status, total_amount, created_at FROM orders;"))
        orders = res.all()
        print(f"TOTAL ORDERS IN DB: {len(orders)}")
        for r in orders:
            print(dict(r._mapping))

        cust_res = await conn.execute(text("SELECT id, email, phone, full_name FROM customers;"))
        print("\nCUSTOMERS IN DB:")
        for c in cust_res.all():
            print(dict(c._mapping))

if __name__ == "__main__":
    asyncio.run(main())
