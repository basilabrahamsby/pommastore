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
        
        posh_company_info = {
            "companyName": "POSH NICHE PERFUMES & COSMETICS TRADING LLC",
            "registeredAddress": "Office No. C-81, Al Muteena, Dubai, United Arab Emirates",
            "gstin": "104349616300003",
            "trn": "104349616300003",
            "phone": "+971 4 453 9119",
            "email": "sales@poshgallery.ae",
            "logoUrl": "https://pommaholidays.com/pommastore/logo.png"
        }
        
        if comp:
            comp.value = posh_company_info
        else:
            comp = SystemSettings(key='company', value=posh_company_info)
            db.add(comp)
            
        await db.commit()
        print('SUCCESSFULLY PERSISTED COMPANY SETTINGS TO DB:', posh_company_info)

if __name__ == '__main__':
    asyncio.run(main())
