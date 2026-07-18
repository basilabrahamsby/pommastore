from pydantic import BaseModel, field_validator
from datetime import datetime
from uuid import UUID
from typing import Optional, List
import re


def make_slug(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_-]+", "-", name)
    return name.strip("-")


class BrandCreate(BaseModel):
    name: str
    name_ar: str | None = None
    slug: str | None = None
    origin_country: str | None = None
    description: str | None = None
    description_ar: str | None = None
    logo_url: str | None = None
    is_active: bool = True
    seo_title: str | None = None
    meta_description: str | None = None
    keywords: str | None = None
    gallery: List[str] | None = []
    banner_url: str | None = None
    video_url: str | None = None
    three_d_source_image: str | None = None
    is_3d_active: bool = False
    remove_background: bool = True
    founding_year: str | None = None
    lead_perfumer: str | None = None
    philosophy: str | None = None
    instagram_url: str | None = None
    tiktok_url: str | None = None
    fragrantica_url: str | None = None
    brand_icon: str | None = None
    brand_banner: str | None = None
    primary_color: str | None = "#d4af37"
    secondary_color: str | None = "#000000"
    font_preference: str | None = "Serif"
    brand_keywords: str | None = None
    default_hashtags: str | None = None
    trademark_number: str | None = None
    manufacturer_info: str | None = None
    brand_commission: float | None = None
    exclusivity_toggle: bool = False
    brand_tier: str | None = "Niche"
    gst_category: str | None = "Perfumes (18% GST)"

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v and info.data.get("name"):
            return make_slug(info.data["name"])
        return v


class BrandUpdate(BaseModel):
    name: str | None = None
    name_ar: str | None = None
    slug: str | None = None
    origin_country: str | None = None
    description: str | None = None
    description_ar: str | None = None
    logo_url: str | None = None
    is_active: bool | None = None
    seo_title: str | None = None
    meta_description: str | None = None
    keywords: str | None = None
    gallery: List[str] | None = None
    banner_url: str | None = None
    video_url: str | None = None
    three_d_source_image: str | None = None
    is_3d_active: bool | None = None
    remove_background: bool | None = None
    founding_year: str | None = None
    lead_perfumer: str | None = None
    philosophy: str | None = None
    instagram_url: str | None = None
    tiktok_url: str | None = None
    fragrantica_url: str | None = None
    brand_icon: str | None = None
    brand_banner: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    font_preference: str | None = None
    brand_keywords: str | None = None
    default_hashtags: str | None = None
    trademark_number: str | None = None
    manufacturer_info: str | None = None
    brand_commission: float | None = None
    exclusivity_toggle: bool | None = None
    brand_tier: str | None = None
    gst_category: str | None = None


class BrandOut(BaseModel):
    id: UUID
    name: str
    name_ar: str | None = None
    slug: str
    origin_country: str | None
    description: str | None
    description_ar: str | None = None
    logo_url: str | None
    is_active: bool
    seo_title: str | None = None
    meta_description: str | None = None
    keywords: str | None = None
    gallery: List[str] | None = []
    banner_url: str | None = None
    video_url: str | None = None
    three_d_source_image: str | None = None
    is_3d_active: bool = False
    remove_background: bool = True
    founding_year: str | None = None
    lead_perfumer: str | None = None
    philosophy: str | None = None
    instagram_url: str | None = None
    tiktok_url: str | None = None
    fragrantica_url: str | None = None
    brand_icon: str | None = None
    brand_banner: str | None = None
    primary_color: str | None = "#d4af37"
    secondary_color: str | None = "#000000"
    font_preference: str | None = "Serif"
    brand_keywords: str | None = None
    default_hashtags: str | None = None
    trademark_number: str | None = None
    manufacturer_info: str | None = None
    brand_commission: float | None = None
    exclusivity_toggle: bool = False
    brand_tier: str | None = "Niche"
    gst_category: str | None = "Perfumes (18% GST)"
    created_at: datetime
    product_count: int = 0

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    name_ar: str | None = None
    slug: str | None = None
    parent_id: UUID | None = None
    scent_family: str | None = None
    description: str | None = None
    description_ar: str | None = None
    is_active: bool = True
    seo_title: str | None = None
    meta_description: str | None = None
    keywords: str | None = None
    image_url: str | None = None
    banner_url: str | None = None
    video_url: str | None = None
    images: List[str] | None = None

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v and info.data.get("name"):
            return make_slug(info.data["name"])
        return v


class CategoryUpdate(BaseModel):
    name: str | None = None
    name_ar: str | None = None
    slug: str | None = None
    scent_family: str | None = None
    description: str | None = None
    description_ar: str | None = None
    is_active: bool | None = None
    seo_title: str | None = None
    meta_description: str | None = None
    keywords: str | None = None
    image_url: str | None = None
    banner_url: str | None = None
    video_url: str | None = None
    images: List[str] | None = None


class CategoryOut(BaseModel):
    id: UUID
    name: str
    name_ar: str | None = None
    slug: str
    scent_family: str | None
    description: str | None
    description_ar: str | None = None
    parent_id: UUID | None
    is_active: bool
    seo_title: str | None
    meta_description: str | None
    keywords: str | None
    image_url: str | None
    banner_url: str | None
    video_url: str | None
    images: List[str] | None = []
    created_at: datetime

    model_config = {"from_attributes": True}
