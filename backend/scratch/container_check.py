import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine("postgresql+asyncpg://pommastore:pommastore_dev_2026@postgres:5432/pommastore_db")
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT * FROM loyalty_rewards LIMIT 0"))
        print(list(res.keys()))
    await engine.dispose()

asyncio.run(check())
