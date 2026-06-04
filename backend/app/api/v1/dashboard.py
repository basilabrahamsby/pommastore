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

    # Movement & Expiry Insights
    fast_moving_items: list
    slow_moving_items: list
    upcoming_expiries: list
    customer_source_breakdown: list


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=6)
    month_start = today_start - timedelta(days=30)

    # Total revenue & orders
    rev_result = await db.execute(
        select(func.sum(Order.total_amount), func.count(Order.id))
        .where(Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )
    row = rev_result.one()
    safe_revenue = float(row[0] or 0)
    safe_orders = int(row[1] or 0)

    # Today
    today_result = await db.execute(
        select(func.sum(Order.total_amount), func.count(Order.id))
        .where(Order.created_at >= today_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
    )
    today_row = today_result.one()
    revenue_today = float(today_row[0] or 0)
    orders_today = int(today_row[1] or 0)

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
            func.date_trunc('day', Order.created_at).label("day"),
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
    prof_row = profit_result.one()
    safe_sales = float(prof_row[0] or 0)
    safe_cost = float(prof_row[1] or 0)
    gross_profit = safe_sales - safe_cost
    gross_margin = (gross_profit / safe_sales * 100) if safe_sales > 0 else 0

    # Monthly Revenue (last 30 days)
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

    # Fulfillment Rate
    fulfilled_result = await db.execute(
        select(func.count(Order.id))
        .where(Order.status.in_([OrderStatus.shipped, OrderStatus.delivered, OrderStatus.completed]))
    )
    fulfilled_orders = fulfilled_result.scalar() or 0
    fulfillment_rate = (fulfilled_orders / safe_orders * 100) if safe_orders > 0 else 0

    # Profit Timeline (Last 7 Days)
    profit_daily_stmt = (
        select(
            func.date_trunc('day', Order.created_at).label("day"),
            func.sum(OrderItem.total_price).label("revenue"),
            func.sum(OrderItem.cost_price * OrderItem.quantity).label("cost")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= week_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
        .group_by(text("day"))
        .order_by(text("day"))
    )
    
    profit_daily_result = await db.execute(profit_daily_stmt)
    
    profit_timeline = [
        {
            "day": row[0].strftime("%a"), 
            "profit": float((row[1] or 0) - (row[2] or 0)), 
            "revenue": float(row[1] or 0)
        }
        for row in profit_daily_result.all()
    ]

    # Channel Performance
    channel_result = await db.execute(
        select(Order.channel, func.count(Order.id), func.sum(Order.total_amount))
        .where(Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
        .group_by(Order.channel)
    )
    channel_performance = [
        {"name": row[0] or "Direct", "orders": int(row[1] or 0), "revenue": float(row[2] or 0)}
        for row in channel_result.all()
    ]

    # Fast Moving Items (Last 30 Days)
    fast_result = await db.execute(
        select(Product.name, func.sum(OrderItem.quantity).label("units"))
        .join(ProductVariant, ProductVariant.id == OrderItem.variant_id)
        .join(Product, Product.id == ProductVariant.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= month_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
        .group_by(Product.name)
        .order_by(text("units DESC"))
        .limit(5)
    )
    fast_moving_items = [{"name": row[0], "units": int(row[1])} for row in fast_result.all()]

    # Slow Moving Items (Lowest sales last 30 days, but has stock)
    # 1. Get all variants with stock
    active_variants_res = await db.execute(
        select(ProductVariant.id, Product.name)
        .join(Product, Product.id == ProductVariant.product_id)
        .where(ProductVariant.is_active == True)
    )
    variant_info = active_variants_res.all()
    
    # 2. Get sales for each in last 30 days
    sales_res = await db.execute(
        select(OrderItem.variant_id, func.sum(OrderItem.quantity))
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= month_start, Order.status.notin_([OrderStatus.cancelled, OrderStatus.returned]))
        .group_by(OrderItem.variant_id)
    )
    sales_map = {row[0]: int(row[1]) for row in sales_res.all()}

    slow_moving_items = []
    for vid, name in variant_info:
        stock = stock_map.get(vid, 0)
        if stock > 0:
            sales = sales_map.get(vid, 0)
            slow_moving_items.append({"name": name, "sales": sales, "stock": stock})
    
    slow_moving_items.sort(key=lambda x: x["sales"])
    slow_moving_items = slow_moving_items[:5]

    # Upcoming Expiries (Next 90 days)
    expiry_limit = now + timedelta(days=90)
    expiry_result = await db.execute(
        select(Product.name, InventoryBatch.batch_code, InventoryBatch.expiry_date, InventoryBatch.current_quantity)
        .join(ProductVariant, ProductVariant.id == InventoryBatch.variant_id)
        .join(Product, Product.id == ProductVariant.product_id)
        .where(InventoryBatch.expiry_date.isnot(None), InventoryBatch.expiry_date <= expiry_limit, InventoryBatch.current_quantity > 0)
        .order_by(InventoryBatch.expiry_date.asc())
        .limit(5)
    )
    upcoming_expiries = [
        {"name": row[0], "batch": row[1], "date": row[2].isoformat(), "qty": row[3]}
        for row in expiry_result.all()
    ]

    # Customer Source Breakdown
    source_result = await db.execute(
        select(Customer.acquisition_source, func.count(Customer.id))
        .group_by(Customer.acquisition_source)
    )
    customer_source_breakdown = [
        {"source": (row[0] or "Direct").capitalize(), "count": int(row[1] or 0)}
        for row in source_result.all()
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
        fast_moving_items=fast_moving_items,
        slow_moving_items=slow_moving_items,
        upcoming_expiries=upcoming_expiries,
        customer_source_breakdown=customer_source_breakdown,
    )
