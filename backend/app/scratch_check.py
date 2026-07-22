import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.order import Order
from app.api.v1.storefront.orders import book_panda_shipment_task

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Order).where(Order.order_number == "PS-2026-013")
        )
        o = res.scalar_one_or_none()
        if o:
            print(f"Triggering Panda booking for order {o.order_number}...")
            await book_panda_shipment_task(o.id)
            
            res2 = await db.execute(
                select(Order).where(Order.order_number == "PS-2026-013")
            )
            o2 = res2.scalar_one_or_none()
            print("UPDATED ORDER DETAILS:")
            print(f"Order: {o2.order_number}")
            print(f"Carrier: {o2.carrier}")
            print(f"Tracking: {o2.tracking_number}")
            print(f"Status: {o2.status}")
            print(f"Payment Status: {o2.payment_status}")
        else:
            print("Order not found")

if __name__ == "__main__":
    asyncio.run(check())
