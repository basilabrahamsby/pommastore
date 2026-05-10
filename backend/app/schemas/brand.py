from pydantic import BaseModel, field_validator
from datetime import datetime
from uuid import UUID
from typing import Optional
import re


def make_slug(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_-]+", "-", name)
    return name.strip("-")


class BrandCreate(BaseModel):
    name: str
    slug: str | None = None
    origin_country: str | None = None
    description: str | None = None
    logo_url: str | None = None
    is_active: bool = True

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v and info.data.get("name"):
            return make_slug(info.data["name"])
        return v


class BrandUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    origin_country: str | None = None
    description: str | None = None
    logo_url: str | None = None
    is_active: bool | None = None


class BrandOut(BaseModel):
    id: UUID
    name: str
    slug: str
    origin_country: str | None
    description: str | None
    logo_url: str | None
    is_active: bool
    created_at: datetime
    product_count: int = 0

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    slug: str | None = None
    parent_id: UUID | None = None
    scent_family: str | None = None
    description: str | None = None

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v and info.data.get("name"):
            return make_slug(info.data["name"])
        return v


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    scent_family: str | None = None
    description: str | None = None


class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str
    scent_family: str | None
    description: str | None
    parent_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
