from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.system import SystemSettings

router = APIRouter(prefix="/settings", tags=["Storefront Settings"])

@router.get("/storefront_layout")
async def get_storefront_layout(db: AsyncSession = Depends(get_db)):
    """Fetch the public branding, banners and content configured by admin."""
    result = await db.execute(
        select(SystemSettings).where(SystemSettings.key.in_(["storefront_layout", "company", "seo", "geo", "return_policy", "privacy_policy", "terms_conditions"]))
    )
    settings_list = result.scalars().all()
    
    settings_map = {s.key: s.value for s in settings_list}
    layout = settings_map.get("storefront_layout", {})
    company = settings_map.get("company", {})
    seo = settings_map.get("seo", {})
    geo = settings_map.get("geo", {})
    return_policy = settings_map.get("return_policy", {
        "title": "Returns & Exchange Policy",
        "lastUpdated": "Last updated June 2026",
        "authenticityTitle": "100% Authenticity",
        "authenticityDesc": "Every fragrance dispatched from Pommastore is completely sealed and sourced directly. We guarantee absolute authenticity.",
        "windowTitle": "7-Day Window",
        "windowDesc": "Requests for returns or replacements due to transit damage or shipping errors are accepted within 7 days of delivery.",
        "contentHtml": "<h2>1. General Overview</h2><p>At Pommastore, we specialize in premium, personal-care items namely liquid luxury perfumes and colognes. Due to hygiene protocols, the strict personal nature of fragrances, and safety mandates surrounding flammable liquids, <strong>products cannot be returned once the primary seal or outer cellophane wrap has been broken or altered</strong>.</p><p>We highly recommend our clients to be thoroughly satisfied and verified with their olfactory selection before breaking the security seals.</p><h2>2. Valid Grounds for Return or Exchange</h2><p>Pommastore handles exceptions under very strict quality controls. We will issue replacements, exchanges, or full refunds if:</p><ul><li>The received product suffered severe physical breakage/leakage during transit.</li><li>The physical item, volume (ml), or fragrance differs completely from your ordered invoice.</li><li>The atomiser mechanism is proven defective upon the very first attempted use.</li></ul><h2>3. Process to Initiate</h2><p>Should your package meet the valid criteria outlined above, please proceed as follows:</p><ol><li><strong>Contact Concierge:</strong> Email us at concierge@pommastore.com within 48 hours of delivery. Include your Order Number and the Unboxing Video.</li><li><strong>Internal Review:</strong> Our warehouse auditing team will analyze the footage within 48 business hours.</li><li><strong>Reverse Logistics:</strong> If approved, we will schedule our partners to safely secure the return consignment from your address.</li><li><strong>Resolution:</strong> Once our inspectors verify the physical return matches the video, we will dispatch the replacement.</li></ol><h2>4. Non-Returnable Scenarios</h2><p>We absolutely cannot accept returns based on olfactory preferences, reformulation issues, or subjective projection on skin.</p>"
    })
    privacy_policy = settings_map.get("privacy_policy", {
        "title": "Privacy Policy",
        "lastUpdated": "Last updated June 2026",
        "authenticityTitle": "100% Secure Data",
        "authenticityDesc": "All personal identifiers and transactions are protected via AES-256 standard encryption protocols. Your data is private.",
        "windowTitle": "Zero Third-Party Sharing",
        "windowDesc": "We do not sell, rent, or lease your private personal information, olfactory profiles, or browsing habits under any conditions.",
        "contentHtml": "<h2>1. Collection of Personal Information</h2><p>At Pommastore, we collect necessary customer details to fulfill orders and provide tailored luxury fragrances recommendations. This includes identity details (name, email), shipping descriptors, contact numbers, and billing data.</p><h2>2. Protection Protocols</h2><p>We implement standard, high-grade security patches and database isolation frameworks to shield details from unauthorized breaches.</p><h2>3. Tracking & Cookies</h2><p>We utilize operational cookies to maintain secure persistent shopping baskets, authenticate user sessions, and preserve custom theme choices.</p>"
    })
    terms_conditions = settings_map.get("terms_conditions", {
        "title": "Terms & Conditions",
        "lastUpdated": "Last updated June 2026",
        "authenticityTitle": "Age Mandate",
        "authenticityDesc": "By utilizing Pommastore storefront, you affirm you are at least 18 years of age or accessing under familial supervision.",
        "windowTitle": "Commercial Fair Use",
        "windowDesc": "We prohibit automated bot crawlers or resellers from executing speculative bulk orders. We reserve cancellation rights.",
        "contentHtml": "<h2>1. Terms of Use</h2><p>Welcome to Pommastore. By using this storefront or subscribing to our concierge, you agree to comply with our commercial terms and local statutory mandates.</p><h2>2. Purchase Agreements & Cancellations</h2><p>Due to the exclusive nature of limited luxury fragrances, catalog prices are subject to dynamic correction. We reserve full rights to cancel suspicious bulk transactions.</p><h2>3. Intellectual Assets</h2><p>All brand titles, custom product photography, fluid obsidian illustrations, and Nelphim type styles are protected under national copyright regulations.</p>"
    })
    
    # Provide intelligent defaults if DB hasn't been seeded yet
    if not layout:
        layout = {
            "hero_slides": [
                {"image": "/hero-1.png", "subtitle": "PREMIUM COLLECTION", "title": "The Signature Scent", "desc": "Discover the ultimate expression of refinement and grace.", "cta": "Shop Now"}
            ],
            "split_banners": {"men": "/banner-men.png", "women": "/banner-women.png"},
            "mid_quote": {"text": "Perfume follows you; it chases you and lingers behind you.", "author": "The Essence of Beauty"}
        }
    
    # Push aggregated public definitions into composite payload
    return {
        **layout, 
        "company": company,
        "seo": seo,
        "geo": geo,
        "return_policy": return_policy,
        "privacy_policy": privacy_policy,
        "terms_conditions": terms_conditions
    }
