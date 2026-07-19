import asyncio
from app.core.database import AsyncSessionLocal
from app.models.customer import Customer
from sqlalchemy import select
import json

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Customer.cart_data).where(Customer.email == 'basilabrahamsby@gmail.com'))
        cart_data = res.scalar()
        print(json.dumps(cart_data, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
