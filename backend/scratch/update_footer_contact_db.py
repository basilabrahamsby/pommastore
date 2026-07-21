import asyncio
import sys
sys.path.append('/app')
from app.core.database import AsyncSessionLocal
from app.models.system import SystemSettings
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(SystemSettings).where(SystemSettings.key == 'storefront_layout'))
        setting = res.scalar_one_or_none()
        if setting:
            val = dict(setting.value or {})
            fs = dict(val.get('footer_settings') or {})
            fs['email'] = 'sales@poshgallery.ae'
            fs['phone'] = '+971 4 453 9119'
            fs['aboutText'] = 'Your destination for 100% original luxury fragrances. We bring international perfumes directly from Dubai, ensuring premium quality and authenticity with every single spray.'
            fs['aboutText_ar'] = 'وجهتك للعطور الفاخرة الأصلية 100%. نحن نجلب العطور العالمية مباشرة من دبي، مما يضمن الجودة العالية والأصالة مع كل رشة.'
            val['footer_settings'] = fs
            setting.value = val
            db.add(setting)
            await db.commit()
            print("SUCCESSFULLY UPDATED FOOTER CONTACT SETTINGS IN DATABASE")

if __name__ == '__main__':
    asyncio.run(main())
