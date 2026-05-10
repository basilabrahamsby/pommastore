from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.inventory import InventoryBatch, Supplier, Warehouse
from app.models.product import ProductVariant, Product
from app.models.user import User
from app.schemas.inventory import BatchCreate, BatchOut, SupplierCreate, SupplierUpdate, SupplierOut, WarehouseOut, StockSummary, StockAdjustSchema

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/warehouses", response_model=list[WarehouseOut])
async def list_warehouses(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Warehouse).where(Warehouse.is_active == True))
    return [WarehouseOut.model_validate(w) for w in result.scalars().all()]


@router.get("/suppliers", response_model=list[SupplierOut])
async def list_suppliers(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Supplier).order_by(Supplier.company_name))
    return [SupplierOut.model_validate(s) for s in result.scalars().all()]


@router.post("/suppliers", response_model=SupplierOut, status_code=201)
async def create_supplier(body: SupplierCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_manager)):
    supplier = Supplier(**body.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


@router.patch("/suppliers/{supplier_id}", response_model=SupplierOut)
async def update_supplier(supplier_id: str, body: SupplierUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(require_manager)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(supplier, field, value)
    await db.commit()
    await db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


@router.get("/batches", response_model=list[BatchOut])
async def list_batches(
    variant_id: str | None = Query(None),
    supplier_id: str | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(InventoryBatch).options(
        selectinload(InventoryBatch.variant).selectinload(ProductVariant.product),
        selectinload(InventoryBatch.warehouse),
        selectinload(InventoryBatch.supplier),
    )
    if variant_id:
        q = q.where(InventoryBatch.variant_id == variant_id)
    if supplier_id:
        q = q.where(InventoryBatch.supplier_id == supplier_id)
    q = q.order_by(InventoryBatch.received_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    batches = result.scalars().all()

    out = []
    for b in batches:
        data = BatchOut.model_validate(b)
        if b.variant:
            data.variant_sku = b.variant.sku
            data.product_name = b.variant.product.name if b.variant.product else ""
        if b.warehouse:
            data.warehouse_name = b.warehouse.name
        if b.supplier:
            data.supplier_name = b.supplier.company_name
        out.append(data)
    return out


@router.post("/batches", response_model=BatchOut, status_code=201)
async def receive_batch(
    body: BatchCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    # Get default warehouse
    wh_result = await db.execute(select(Warehouse).where(Warehouse.is_default == True))
    warehouse = wh_result.scalar_one_or_none()
    if not warehouse:
        wh_result = await db.execute(select(Warehouse).limit(1))
        warehouse = wh_result.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=400, detail="No warehouse configured")

    batch = InventoryBatch(
        warehouse_id=warehouse.id,
        current_quantity=body.initial_quantity,
        **body.model_dump(),
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)

    result = await db.execute(
        select(InventoryBatch)
        .where(InventoryBatch.id == batch.id)
        .options(
            selectinload(InventoryBatch.variant).selectinload(ProductVariant.product),
            selectinload(InventoryBatch.warehouse),
            selectinload(InventoryBatch.supplier),
        )
    )
    batch = result.scalar_one()
    data = BatchOut.model_validate(batch)
    if batch.variant:
        data.variant_sku = batch.variant.sku
        data.product_name = batch.variant.product.name if batch.variant.product else ""
    if batch.warehouse:
        data.warehouse_name = batch.warehouse.name
    if batch.supplier:
        data.supplier_name = batch.supplier.company_name
    return data


@router.get("/stock", response_model=list[StockSummary])
async def get_stock_summary(
    low_stock_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    stock_result = await db.execute(
        select(
            InventoryBatch.variant_id,
            func.sum(InventoryBatch.current_quantity).label("total_stock"),
        ).group_by(InventoryBatch.variant_id)
    )
    stock_map = {row[0]: int(row[1]) for row in stock_result.all()}

    variant_result = await db.execute(
        select(ProductVariant).options(selectinload(ProductVariant.product))
    )
    variants = variant_result.scalars().all()

    out = []
    for v in variants:
        current = stock_map.get(v.id, 0)
        is_low = current <= v.min_stock_alert
        if low_stock_only and not is_low:
            continue
        out.append(StockSummary(
            variant_id=v.id,
            sku=v.sku,
            product_name=v.product.name if v.product else "",
            current_stock=current,
            min_stock_alert=v.min_stock_alert,
            is_low_stock=is_low,
            selling_price=float(v.selling_price or 0.0),
            cost_price=float(v.cost_price or 0.0),
        ))
    return out


@router.post("/adjust", status_code=200)
async def adjust_stock(
    body: StockAdjustSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager),
):
    if body.adjustment_type == "add":
        wh_result = await db.execute(select(Warehouse).where(Warehouse.is_default == True))
        warehouse = wh_result.scalar_one_or_none()
        if not warehouse:
            wh_result = await db.execute(select(Warehouse).limit(1))
            warehouse = wh_result.scalar_one_or_none()
        if not warehouse:
            raise HTTPException(status_code=400, detail="No warehouse configured")

        batch = InventoryBatch(
            variant_id=body.variant_id,
            warehouse_id=warehouse.id,
            initial_quantity=body.quantity,
            current_quantity=body.quantity,
            batch_code=body.batch_id or "ADJUST-ADD",
            notes=body.reason
        )
        db.add(batch)
        await db.commit()
        return {"detail": "Stock added successfully"}

    elif body.adjustment_type == "deduct":
        result = await db.execute(
            select(InventoryBatch)
            .where(InventoryBatch.variant_id == body.variant_id)
            .where(InventoryBatch.current_quantity > 0)
            .order_by(InventoryBatch.received_at.asc())
        )
        batches = result.scalars().all()
        to_deduct = body.quantity
        total_avail = sum(b.current_quantity for b in batches)
        if total_avail < to_deduct:
            raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {total_avail}, Requested deduction: {to_deduct}")

        for b in batches:
            if to_deduct <= 0:
                break
            if b.current_quantity >= to_deduct:
                b.current_quantity -= to_deduct
                to_deduct = 0
            else:
                to_deduct -= b.current_quantity
                b.current_quantity = 0

        await db.commit()
        return {"detail": "Stock deducted successfully via FIFO"}

    elif body.adjustment_type == "override":
        result = await db.execute(
            select(InventoryBatch)
            .where(InventoryBatch.variant_id == body.variant_id)
            .where(InventoryBatch.current_quantity > 0)
        )
        batches = result.scalars().all()
        for b in batches:
            b.current_quantity = 0

        wh_result = await db.execute(select(Warehouse).where(Warehouse.is_default == True))
        warehouse = wh_result.scalar_one_or_none()
        if not warehouse:
            wh_result = await db.execute(select(Warehouse).limit(1))
            warehouse = wh_result.scalar_one_or_none()
        if not warehouse:
            raise HTTPException(status_code=400, detail="No warehouse configured")

        batch = InventoryBatch(
            variant_id=body.variant_id,
            warehouse_id=warehouse.id,
            initial_quantity=body.quantity,
            current_quantity=body.quantity,
            batch_code=body.batch_id or "ADJUST-OVERRIDE",
            notes=body.reason
        )
        db.add(batch)
        await db.commit()
        return {"detail": "Stock override completed successfully"}
