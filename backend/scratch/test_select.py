import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import sys
import os

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.loyalty import LoyaltyReward

async def test_select():
    engine = create_async_engine("postgresql+asyncpg://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        try:
            res = await db.execute(select(LoyaltyReward).limit(1))
            print("Success!")
        except Exception as e:
            print(f"Error: {e}")
    await engine.dispose()

asyncio.run(test_select())
