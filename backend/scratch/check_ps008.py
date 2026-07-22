import asyncio
from app.core.database import AsyncSessionLocal
from app.models.order import Order
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        q = select(Order).where(Order.order_number == "PS-2026-008")
        order = (await db.execute(q)).scalar_one_or_none()
        if order:
            print("ORDER PS-2026-008 DETAILS:")
            print("  Order Number:", order.order_number)
            print("  Customer:", order.customer_name)
            print("  Payment Method:", order.payment_method)
            print("  Payment Status:", order.payment_status)
            print("  Carrier:", order.carrier)
            print("  Tracking Number (AWB):", order.tracking_number)
            print("  Payment Details:", order.payment_details)

if __name__ == "__main__":
    asyncio.run(main())
