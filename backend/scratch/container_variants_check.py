import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine("postgresql+asyncpg://kozmocart:kozmocart_dev_2026@postgres:5432/kozmocart_db")
    async with engine.connect() as conn:
        print("--- Product Variant Columns ---")
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'product_variants'"))
        for row in res:
            print(row[0])
            
    await engine.dispose()

asyncio.run(check())
