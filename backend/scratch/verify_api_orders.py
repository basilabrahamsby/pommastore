import asyncio
from app.api.v1.orders import list_orders
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        u = (await db.execute(select(User))).scalars().first()
        orders = await list_orders(
            status=None,
            channel=None,
            search=None,
            include_unpaid=False,
            start_date=None,
            end_date=None,
            skip=0,
            limit=50,
            db=db,
            _=u
        )
        print("VERIFICATION SUCCESS! TOTAL ORDERS:", len(orders))
        for o in orders:
            print(f"  Order: {o.order_number} | Customer: {o.customer_name} | Payment: {o.payment_method} | Status: {o.status} | PaymentStatus: {o.payment_status}")

if __name__ == "__main__":
    asyncio.run(main())
