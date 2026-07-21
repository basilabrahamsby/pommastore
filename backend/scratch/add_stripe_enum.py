import asyncio
import sys
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as db:
        try:
            await db.execute(text("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'stripe';"))
            await db.commit()
            print("SUCCESSFULLY ADDED 'stripe' TO paymentmethod ENUM IN POSTGRES")
        except Exception as e:
            print("ERROR ADDING ENUM VALUE:", e)

if __name__ == '__main__':
    asyncio.run(main())
