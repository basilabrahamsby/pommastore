from pydantic import BaseModel
from datetime import datetime, date
from uuid import UUID
from typing import Optional


class WarehouseOut(BaseModel):
    id: UUID
    name: str
    location: str | None
    is_active: bool
    is_default: bool

    model_config = {"from_attributes": True}


class SupplierCreate(BaseModel):
    company_name: str
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    gst_number: str | None = None
    is_active: bool = True


class SupplierUpdate(BaseModel):
    company_name: str | None = None
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    gst_number: str | None = None
    is_active: bool | None = None


class SupplierOut(BaseModel):
    id: UUID
    company_name: str
    contact_name: str | None
    email: str | None
    phone: str | None
    address: str | None
    gst_number: str | None
    is_active: bool
    created_at: datetime
    outstanding: float = 0.0
    total_invoiced: float = 0.0
    ledger: list = []

    model_config = {"from_attributes": True}


class BatchCreate(BaseModel):
    variant_id: UUID
    supplier_id: UUID | None = None
    batch_code: str | None = None
    initial_quantity: int
    purchase_cost: float | None = None
    manufacture_date: date | None = None
    expiry_date: date | None = None
    notes: str | None = None


class BatchOut(BaseModel):
    id: UUID
    variant_id: UUID
    variant_sku: str = ""
    product_name: str = ""
    warehouse_id: UUID
    warehouse_name: str = ""
    supplier_id: UUID | None
    supplier_name: str | None = None
    batch_code: str | None
    initial_quantity: int
    current_quantity: int
    purchase_cost: float | None
    manufacture_date: date | None
    expiry_date: date | None
    notes: str | None
    received_at: datetime

    model_config = {"from_attributes": True}


class StockSummary(BaseModel):
    variant_id: UUID
    sku: str
    product_name: str
    brand_name: str = ""
    category_name: str = ""
    current_stock: int
    min_stock_alert: int
    is_low_stock: bool
    selling_price: float = 0.0
    cost_price: float = 0.0


class StockAdjustSchema(BaseModel):
    variant_id: UUID
    adjustment_type: str  # 'add' | 'deduct' | 'override'
    quantity: int
    reason: str
    warehouse_location: str | None = None
    batch_id: str | None = None


class MovementOut(BaseModel):
    id: UUID
    batch_id: UUID
    sku: str = ""
    product_name: str = ""
    type: str
    quantity: int
    reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
