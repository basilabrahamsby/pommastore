import uuid
import enum
from datetime import datetime
from typing import List
from sqlalchemy import (
    String, Boolean, Integer, Numeric, Text, DateTime, ForeignKey,
    SmallInteger, Enum as SAEnum, ARRAY, func, text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class GenderType(str, enum.Enum):
    men = "Men"
    women = "Women"
    unisex = "Unisex"


class ConcentrationType(str, enum.Enum):
    parfum = "Parfum"
    edp = "EDP"
    edt = "EDT"
    edc = "EDC"
    mist = "Mist"
    oil = "Oil"
    other = "Other"


class Brand(Base):
    __tablename__ = "brands"
    

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    origin_country: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(Text)
    gallery: Mapped[List[str] | None] = mapped_column(JSONB, default=[])
    banner_url: Mapped[str | None] = mapped_column(Text)
    video_url: Mapped[str | None] = mapped_column(Text)
    
    # 3D & AI Assets
    three_d_source_image: Mapped[str | None] = mapped_column(Text)
    is_3d_active: Mapped[bool] = mapped_column(Boolean, default=False)
    remove_background: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Heritage & Authority
    founding_year: Mapped[str | None] = mapped_column(String(50))
    lead_perfumer: Mapped[str | None] = mapped_column(String(255))
    philosophy: Mapped[str | None] = mapped_column(Text)
    instagram_url: Mapped[str | None] = mapped_column(Text)
    tiktok_url: Mapped[str | None] = mapped_column(Text)
    fragrantica_url: Mapped[str | None] = mapped_column(Text)
    
    # Visual Identity
    brand_icon: Mapped[str | None] = mapped_column(Text)
    brand_banner: Mapped[str | None] = mapped_column(Text)
    primary_color: Mapped[str | None] = mapped_column(String(20), default="#d4af37")
    secondary_color: Mapped[str | None] = mapped_column(String(20), default="#000000")
    font_preference: Mapped[str | None] = mapped_column(String(50), default="Serif")
    brand_keywords: Mapped[str | None] = mapped_column(Text)
    default_hashtags: Mapped[str | None] = mapped_column(Text)
    
    # ERP & Logistics
    trademark_number: Mapped[str | None] = mapped_column(String(100))
    manufacturer_info: Mapped[str | None] = mapped_column(Text)
    brand_commission: Mapped[float | None] = mapped_column(Numeric(5, 2))
    exclusivity_toggle: Mapped[bool] = mapped_column(Boolean, default=False)
    brand_tier: Mapped[str | None] = mapped_column(String(50), default="Niche")
    gst_category: Mapped[str | None] = mapped_column(String(100), default="Perfumes (18% GST)")
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    seo_title: Mapped[str | None] = mapped_column(String(70))
    meta_description: Mapped[str | None] = mapped_column(String(165))
    keywords: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    products: Mapped[List["Product"]] = relationship("Product", back_populates="brand", lazy="select")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    scent_family: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    seo_title: Mapped[str | None] = mapped_column(String(70))
    meta_description: Mapped[str | None] = mapped_column(String(165))
    keywords: Mapped[str | None] = mapped_column(Text)
    
    # Media & Rich Content
    image_url: Mapped[str | None] = mapped_column(Text)
    banner_url: Mapped[str | None] = mapped_column(Text)
    video_url: Mapped[str | None] = mapped_column(Text)
    images: Mapped[list | None] = mapped_column(JSONB, default=list)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    products: Mapped[List["Product"]] = relationship("Product", back_populates="category", lazy="select")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"))
    gender: Mapped[GenderType | None] = mapped_column(SAEnum(GenderType, name="gendertype"))
    # {"top": ["Bergamot", "Lemon"], "heart": ["Rose", "Jasmine"], "base": ["Oud", "Musk"]}
    scent_notes: Mapped[dict] = mapped_column(JSONB, default=lambda: {"top": [], "heart": [], "base": []})
    longevity_hours: Mapped[int | None] = mapped_column(SmallInteger)
    sillage_rating: Mapped[int | None] = mapped_column(SmallInteger)  # 1-5
    occasion_tags: Mapped[list | None] = mapped_column(JSONB, default=list)
    season_tags: Mapped[list | None] = mapped_column(JSONB, default=list)
    short_description: Mapped[str | None] = mapped_column(Text)
    full_description: Mapped[str | None] = mapped_column(Text)
    meta_title: Mapped[str | None] = mapped_column(String(70))
    meta_description: Mapped[str | None] = mapped_column(String(165))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    shipping_zones_excluded: Mapped[list | None] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    brand: Mapped["Brand"] = relationship("Brand", back_populates="products")
    category: Mapped["Category | None"] = relationship("Category", back_populates="products")
    variants: Mapped[List["ProductVariant"]] = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images: Mapped[List["ProductImage"]] = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    barcode: Mapped[str | None] = mapped_column(String(100), unique=True)
    size_ml: Mapped[int | None] = mapped_column(Integer)
    concentration: Mapped[ConcentrationType | None] = mapped_column(SAEnum(ConcentrationType, name="concentrationtype"))
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    cost_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    weight_grams: Mapped[int | None] = mapped_column(Integer)
    min_stock_alert: Mapped[int] = mapped_column(Integer, default=5)
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    batches: Mapped[List["InventoryBatch"]] = relationship("InventoryBatch", back_populates="variant", lazy="select")


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    variant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("product_variants.id"))
    url: Mapped[str] = mapped_column(Text, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="images")


# Circular import resolved by importing here
from app.models.inventory import InventoryBatch  # noqa: E402, F401
