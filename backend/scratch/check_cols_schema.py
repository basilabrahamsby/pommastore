import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine("postgresql+asyncpg://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE column_name = 'reward_metadata'"))
        for row in res:
            print(row)
    await engine.dispose()

asyncio.run(check())
