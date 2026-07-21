import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import AsyncSessionLocal
from app.models.system import SystemSettings
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(SystemSettings).where(SystemSettings.key == 'company'))
        comp = res.scalar_one_or_none()
        
        uae_company_info = {
            "companyName": "POMMASTORE TRADING L.L.C",
            "registeredAddress": "Business Bay, Dubai, United Arab Emirates",
            "trn": "100489201900003",
            "tradeLicense": "1184920",
            "phone": "+971 4 288 9200",
            "email": "support@pommastore.com",
            "logoUrl": "https://pommaholidays.com/pommastore/logo.png"
        }
        
        if comp:
            comp.value = uae_company_info
        else:
            comp = SystemSettings(key='company', value=uae_company_info)
            db.add(comp)
            
        await db.commit()
        print('SUCCESSFULLY UPDATED DB COMPANY SETTINGS:', uae_company_info)

if __name__ == '__main__':
    asyncio.run(main())
