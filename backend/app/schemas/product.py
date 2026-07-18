from pydantic import BaseModel, field_validator
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from app.models.product import GenderType, ConcentrationType
import re


def make_slug(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_-]+", "-", name)
    return name.strip("-")


class ScentNotes(BaseModel):
    top: List[str] = []
    heart: List[str] = []
    base: List[str] = []


class VariantCreate(BaseModel):
    sku: str
    barcode: str | None = None
    size_ml: int | None = None
    concentration: ConcentrationType | None = None
    selling_price: float
    compare_at_price: float | None = None
    cost_price: float | None = None
    weight_grams: int | None = None
    min_stock_alert: int = 5
    loyalty_points: int = 0
    is_active: bool = True


class VariantUpdate(BaseModel):
    sku: str | None = None
    barcode: str | None = None
    size_ml: int | None = None
    concentration: ConcentrationType | None = None
    selling_price: float | None = None
    compare_at_price: float | None = None
    cost_price: float | None = None
    weight_grams: int | None = None
    min_stock_alert: int | None = None
    loyalty_points: int | None = None
    is_active: bool | None = None


class VariantOut(BaseModel):
    id: UUID
    product_id: UUID
    sku: str
    barcode: str | None
    size_ml: int | None
    concentration: ConcentrationType | None
    selling_price: float
    compare_at_price: float | None
    cost_price: float | None
    weight_grams: int | None
    min_stock_alert: int
    loyalty_points: int
    is_active: bool
    current_stock: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    name_ar: str | None = None
    slug: str | None = None
    brand_id: UUID
    category_id: UUID | None = None
    gender: GenderType | None = None
    scent_notes: ScentNotes = ScentNotes()
    scent_notes_ar: ScentNotes = ScentNotes()
    longevity_hours: int | None = None
    sillage_rating: int | None = None
    occasion_tags: List[str] = []
    season_tags: List[str] = []
    short_description: str | None = None
    short_description_ar: str | None = None
    full_description: str | None = None
    full_description_ar: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    is_active: bool = True
    is_featured: bool = False
    is_new_arrival: bool = False
    priority: int = 0
    shipping_zones_excluded: List[str] = []
    variants: List[VariantCreate] = []
    images: List[str] = []
    gallery_images: List[dict] = []

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v and info.data.get("name"):
            return make_slug(info.data["name"])
        return v


class ProductUpdate(BaseModel):
    name: str | None = None
    name_ar: str | None = None
    slug: str | None = None
    brand_id: UUID | None = None
    category_id: UUID | None = None
    gender: GenderType | None = None
    scent_notes: ScentNotes | None = None
    scent_notes_ar: ScentNotes | None = None
    longevity_hours: int | None = None
    sillage_rating: int | None = None
    occasion_tags: List[str] | None = None
    season_tags: List[str] | None = None
    short_description: str | None = None
    short_description_ar: str | None = None
    full_description: str | None = None
    full_description_ar: str | None = None
    meta_title: str | None = None
    images: List[str] | None = None
    meta_description: str | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    is_new_arrival: bool | None = None
    priority: int | None = None
    shipping_zones_excluded: List[str] | None = None
    gallery_images: List[dict] | None = None


class ProductOut(BaseModel):
    id: UUID
    name: str
    name_ar: str | None = None
    slug: str
    brand_id: UUID
    brand_name: str = ""
    brand_name_ar: str | None = None
    category_id: UUID | None
    category_name: str | None = None
    category_name_ar: str | None = None
    gender: GenderType | None
    scent_notes: dict
    scent_notes_ar: dict | None = None
    longevity_hours: int | None
    sillage_rating: int | None
    occasion_tags: list
    season_tags: list
    short_description: str | None
    short_description_ar: str | None = None
    full_description: str | None = None
    full_description_ar: str | None = None
    is_active: bool
    is_featured: bool
    is_new_arrival: bool
    priority: int
    shipping_zones_excluded: list = []
    variants: List[VariantOut] = []
    images: List[str] = []
    gallery_images: list = []
    created_at: datetime
    updated_at: datetime

    @field_validator("images", mode="before")
    @classmethod
    def validate_images(cls, v):
        if v is None:
            return []
        # If it's a list of ProductImage objects (from SQLAlchemy), extract URLs
        if isinstance(v, list) and len(v) > 0 and not isinstance(v[0], str):
            return [getattr(img, "url", str(img)) for img in v]
        return v

    model_config = {"from_attributes": True}

    @field_validator("scent_notes", "scent_notes_ar", mode="before")
    @classmethod
    def validate_scent_notes(cls, v):
        if v is None:
            return {"top": [], "heart": [], "base": []}
        return v

    @field_validator("occasion_tags", "season_tags", "shipping_zones_excluded", "gallery_images", mode="before")
    @classmethod
    def validate_list_fields(cls, v):
        if v is None:
            return []
        return v


class ProductDetailOut(ProductOut):
    full_description: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None
