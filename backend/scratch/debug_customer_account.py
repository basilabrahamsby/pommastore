import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        print("--- ALL CUSTOMERS ---")
        c_res = await conn.execute(text("SELECT id, email, phone, full_name, created_at FROM customers;"))
        customers = c_res.all()
        for c in customers:
            print(dict(c._mapping))

        print("\n--- ALL ADDRESSES ---")
        a_res = await conn.execute(text("SELECT id, customer_id, label, address_line1, city, state, pincode FROM customer_addresses;"))
        addresses = a_res.all()
        for a in addresses:
            print(dict(a._mapping))

        print("\n--- ALL ORDERS ---")
        o_res = await conn.execute(text("SELECT id, order_number, customer_id, customer_email, customer_phone, payment_gateway, shipping_address FROM orders;"))
        orders = o_res.all()
        for o in orders:
            print(dict(o._mapping))

if __name__ == "__main__":
    asyncio.run(main())
