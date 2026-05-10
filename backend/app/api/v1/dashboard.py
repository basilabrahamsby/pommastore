from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductVariant
from app.models.inventory import InventoryBatch
from app.models.customer import Customer
from app.models.user import User
from app.models.order import OrderItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    total_products: int
    low_stock_count: int
    revenue_today: float
    orders_today: int
    orders_pending: int
    
    # Advanced Analytics
    average_order_value: float
    monthly_revenue: float
    weekly_growth: float
    fulfillment_rate: float
    gross_profit: float
    gross_margin: float
    
    top_products: list
    recent_orders: list
    revenue_last_7_days: list
    profit_timeline: list
    channel_performance: list


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=6)

    # Total revenue & orders
    rev_result = await db.execute(
        select(func.sum(Order.total_amount), func.count(Order.id))
        .where(Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )
    total_revenue, total_orders = rev_result.one()

    # Today
    today_result = await db.execute(
        select(func.sum(Order.total_amount), func.count(Order.id))
        .where(Order.created_at >= today_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )
    revenue_today, orders_today = today_result.one()

    # Pending orders
    pending_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.pending)
    )
    orders_pending = pending_result.scalar() or 0

    # Totals
    customers_count = (await db.execute(select(func.count(Customer.id)))).scalar() or 0
    products_count = (await db.execute(select(func.count(Product.id)).where(Product.is_active == True))).scalar() or 0

    # Low stock
    stock_result = await db.execute(
        select(InventoryBatch.variant_id, func.sum(InventoryBatch.current_quantity).label("total"))
        .group_by(InventoryBatch.variant_id)
    )
    stock_map = {row[0]: int(row[1]) for row in stock_result.all()}
    variants_result = await db.execute(select(ProductVariant.id, ProductVariant.min_stock_alert))
    low_stock_count = sum(
        1 for vid, alert in variants_result.all()
        if stock_map.get(vid, 0) <= alert
    )

    # Revenue last 7 days
    daily_result = await db.execute(
        select(
            func.date_trunc("day", Order.created_at).label("day"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .where(Order.created_at >= week_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
        .group_by(text("day"))
        .order_by(text("day"))
    )
    revenue_last_7_days = [
        {"date": row[0].strftime("%Y-%m-%d"), "revenue": float(row[1] or 0), "orders": int(row[2] or 0)}
        for row in daily_result.all()
    ]

    # Recent orders (last 5)
    recent_result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(5)
    )
    recent_orders = [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "total_amount": float(o.total_amount),
            "status": o.status.value,
            "created_at": o.created_at.isoformat(),
        }
        for o in recent_result.scalars().all()
    ]

    # Calculate Gross Profit for completed orders
    profit_result = await db.execute(
        select(func.sum(OrderItem.total_price), func.sum(OrderItem.cost_price * OrderItem.quantity))
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )
    total_sales, total_cost = profit_result.one()
    safe_sales = float(total_sales or 0)
    safe_cost = float(total_cost or 0)
    gross_profit = safe_sales - safe_cost
    gross_margin = (gross_profit / safe_sales * 100) if safe_sales > 0 else 0

    # Monthly Revenue (last 30 days)
    month_start = today_start - timedelta(days=30)
    month_result = await db.execute(
        select(func.sum(Order.total_amount))
        .where(Order.created_at >= month_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )
    monthly_revenue = float(month_result.scalar() or 0)

    # Weekly Growth (last 7 days vs previous 7 days)
    prev_week_start = week_start - timedelta(days=7)
    this_week_rev = float((await db.execute(
        select(func.sum(Order.total_amount))
        .where(Order.created_at >= week_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )).scalar() or 0)
    prev_week_rev = float((await db.execute(
        select(func.sum(Order.total_amount))
        .where(Order.created_at >= prev_week_start, Order.created_at < week_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )).scalar() or 0)
    
    if prev_week_rev > 0:
        weekly_growth = ((this_week_rev - prev_week_rev) / prev_week_rev) * 100
    else:
        weekly_growth = 100.0 if this_week_rev > 0 else 0.0

    # Fulfillment Rate (percent of orders that are shipped/delivered/completed out of non-cancelled)
    fulfilled_result = await db.execute(
        select(func.count(Order.id))
        .where(Order.status.in_([OrderStatus.shipped, OrderStatus.delivered, OrderStatus.completed]))
    )
    fulfilled_orders = fulfilled_result.scalar() or 0
    valid_orders = safe_orders # from earlier
    fulfillment_rate = (fulfilled_orders / valid_orders * 100) if valid_orders > 0 else 0

    # Profit Timeline (Last 7 Days)
    profit_daily_result = await db.execute(
        select(
            func.date_trunc("day", Order.created_at).label("day"),
            func.sum(OrderItem.total_price).label("revenue"),
            func.sum(OrderItem.cost_price * OrderItem.quantity).label("cost")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= week_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
        .group_by(func.date_trunc("day", Order.created_at))
        .order_by(func.date_trunc("day", Order.created_at))
    )
    profit_timeline = [
        {
            "day": row[0].strftime("%a"), 
            "profit": float((row[1] or 0) - (row[2] or 0)), 
            "revenue": float(row[1] or 0)
        }
        for row in profit_daily_result.all()
    ]

    # Channel Performance (Sales by Channel)
    channel_result = await db.execute(
        select(Order.channel, func.count(Order.id), func.sum(Order.total_amount))
        .where(Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
        .group_by(Order.channel)
    )
    channel_performance = [
        {"name": row[0] or "Direct", "orders": int(row[1] or 0), "revenue": float(row[2] or 0)}
        for row in channel_result.all()
    ]

    return DashboardStats(
        total_revenue=safe_revenue,
        total_orders=safe_orders,
        total_customers=int(customers_count),
        total_products=int(products_count),
        low_stock_count=int(low_stock_count),
        revenue_today=float(revenue_today or 0),
        orders_today=int(orders_today or 0),
        orders_pending=int(orders_pending),
        average_order_value=safe_revenue / safe_orders if safe_orders > 0 else 0,
        monthly_revenue=monthly_revenue,
        weekly_growth=round(weekly_growth, 1),
        fulfillment_rate=round(fulfillment_rate, 1),
        gross_profit=gross_profit,
        gross_margin=round(gross_margin, 1),
        top_products=[],
        recent_orders=recent_orders,
        revenue_last_7_days=revenue_last_7_days,
        profit_timeline=profit_timeline,
        channel_performance=channel_performance,
    )
