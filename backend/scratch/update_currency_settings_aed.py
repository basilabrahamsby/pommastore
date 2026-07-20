import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        # Update globalization setting
        await conn.execute(text("""
            INSERT INTO system_settings (id, key, value)
            VALUES (gen_random_uuid(), 'globalization', '{"currency": "AED"}'::jsonb)
            ON CONFLICT (key) DO UPDATE SET value = '{"currency": "AED"}'::jsonb;
        """))

        # Update geo exchange rates setting
        await conn.execute(text("""
            INSERT INTO system_settings (id, key, value)
            VALUES (gen_random_uuid(), 'geo', '{"exchangeRates": {"USD": 0.27, "EUR": 0.25, "GBP": 0.21, "INR": 22.7}, "restrictedRegions": "IR, KP, SY"}'::jsonb)
            ON CONFLICT (key) DO UPDATE SET value = '{"exchangeRates": {"USD": 0.27, "EUR": 0.25, "GBP": 0.21, "INR": 22.7}, "restrictedRegions": "IR, KP, SY"}'::jsonb;
        """))

        print("=== SYSTEM SETTINGS UPDATED TO AED & UAE TRN SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(main())
