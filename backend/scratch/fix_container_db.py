import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def fix():
    engine = create_async_engine("postgresql+asyncpg://kozmocart:kozmocart_dev_2026@postgres:5432/kozmocart_db")
    async with engine.begin() as conn:
        print("Adding reward_metadata to loyalty_rewards...")
        try:
            await conn.execute(text("ALTER TABLE loyalty_rewards ADD COLUMN reward_metadata JSONB DEFAULT '{}'"))
        except Exception as e:
            print(f"Error adding reward_metadata: {e}")

        print("Adding loyalty_points to product_variants...")
        try:
            await conn.execute(text("ALTER TABLE product_variants ADD COLUMN loyalty_points INTEGER DEFAULT 0"))
        except Exception as e:
            print(f"Error adding loyalty_points: {e}")
            
    await engine.dispose()

asyncio.run(fix())
