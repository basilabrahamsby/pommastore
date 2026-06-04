import asyncio
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.inventory import Supplier
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        result = await session.execute(select(Supplier))
        suppliers = result.scalars().all()
        print(f"Found {len(suppliers)} suppliers")
        for s in suppliers:
            print(f"- {s.company_name} (ID: {s.id})")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
