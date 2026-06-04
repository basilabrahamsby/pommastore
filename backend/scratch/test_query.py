import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine("postgresql+asyncpg://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
    async with engine.connect() as conn:
        query = """
        SELECT loyalty_rewards.id, loyalty_rewards.name, loyalty_rewards.description, loyalty_rewards.point_cost, loyalty_rewards.reward_type, loyalty_rewards.variant_id, loyalty_rewards.voucher_value, loyalty_rewards.reward_metadata, loyalty_rewards.image_url, loyalty_rewards.is_active, loyalty_rewards.stock_available, loyalty_rewards.created_at, loyalty_rewards.updated_at 
        FROM loyalty_rewards 
        LIMIT 1
        """
        try:
            res = await conn.execute(text(query))
            print("Query Success!")
            for row in res:
                print(row)
        except Exception as e:
            print(f"Query Failed: {e}")
            
    await engine.dispose()

asyncio.run(check())
