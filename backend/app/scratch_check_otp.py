import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.redis import redis_service

async def check():
    otp = await redis_service.get_otp("basilabrahamsby@gmail.com")
    print("CURRENT REDIS OTP FOR GMAIL:", otp)

asyncio.run(check())
