from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import xml.etree.ElementTree as ET
from io import BytesIO

from app.core.database import get_db
from app.models.product import Product, Brand, Category

router = APIRouter()

def format_xml(elem):
    """Return a pretty-printed XML string for the Element."""
    rough_string = ET.tostring(elem, 'utf-8')
    return b'<?xml version="1.0" encoding="UTF-8"?>' + rough_string

@router.get("/sitemap.xml")
async def get_sitemap(db: AsyncSession = Depends(get_db)):
    """Generate dynamic XML sitemap of active entities."""
    base_url = "https://kozmocart.in"  # Ideally fetched from settings, defaulting here
    
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    
    def add_url(loc, lastmod=None, changefreq="daily", priority="0.8"):
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = loc
        if lastmod:
            ET.SubElement(url, "lastmod").text = lastmod
        ET.SubElement(url, "changefreq").text = changefreq
        ET.SubElement(url, "priority").text = priority

    # 1. Get active categories
    cat_result = await db.execute(select(Category.slug).where(Category.is_active == True))
    for slug in cat_result.scalars():
        add_url(f"{base_url}/category/{slug}", priority="0.9")
        
    # 2. Get active brands
    brand_result = await db.execute(select(Brand.slug).where(Brand.is_active == True))
    for slug in brand_result.scalars():
        add_url(f"{base_url}/brand/{slug}", priority="0.9")

    # 3. Get active products
    prod_result = await db.execute(
        select(Product.slug, Product.updated_at).where(Product.is_active == True)
    )
    for slug, updated_at in prod_result.all():
        lastmod = updated_at.strftime("%Y-%m-%d") if updated_at else datetime.now().strftime("%Y-%m-%d")
        add_url(f"{base_url}/product/{slug}", lastmod=lastmod, priority="1.0")

    xml_data = format_xml(urlset)
    return Response(content=xml_data, media_type="application/xml")
