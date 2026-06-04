import redis.asyncio as redis
from app.core.config import settings

class RedisService:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def set_otp(self, key: str, otp: str, expire: int = 300):
        await self.redis.setex(f"otp:{key}", expire, otp)

    async def get_otp(self, key: str):
        return await self.redis.get(f"otp:{key}")

    async def delete_otp(self, key: str):
        await self.redis.delete(f"otp:{key}")

redis_service = RedisService()
