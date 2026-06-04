import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_customer
from app.models.customer import Customer, WishlistItem
from app.models.product import Product
from app.schemas.product import ProductOut

router = APIRouter(prefix="/wishlist", tags=["Storefront Wishlist"])

@router.get("")
async def get_wishlist(
    db: AsyncSession = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    """Fetch authenticated customer's bookmarked catalog references."""
    stmt = (
        select(Product)
        .join(WishlistItem, WishlistItem.product_id == Product.id)
        .where(WishlistItem.customer_id == current_customer.id)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{product_id}")
async def toggle_wishlist(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    """Atomic insertion or excision logic depending on antecedent state."""
    # Check existing
    stmt = select(WishlistItem).where(
        WishlistItem.customer_id == current_customer.id,
        WishlistItem.product_id == product_id
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"status": "removed", "product_id": str(product_id)}
    
    # Verify product physically exists
    prod_stmt = select(Product).where(Product.id == product_id)
    prod_res = await db.execute(prod_stmt)
    if not prod_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Targeted artifact not contained in repository")

    new_item = WishlistItem(customer_id=current_customer.id, product_id=product_id)
    db.add(new_item)
    await db.commit()
    return {"status": "added", "product_id": str(product_id)}
