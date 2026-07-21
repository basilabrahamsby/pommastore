import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import AsyncSessionLocal
from app.models.order import Order
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Order))
        orders = res.scalars().all()
        for idx, o in enumerate(orders, start=1):
            old_num = o.order_number
            o.order_number = f"PS-{idx:05d}"
            print(f"UPDATED ORDER {o.id}: {old_num} -> {o.order_number}")
        await db.commit()

if __name__ == '__main__':
    asyncio.run(main())
