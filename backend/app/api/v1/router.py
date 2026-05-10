from fastapi import APIRouter
from app.api.v1 import auth, brands, categories, products, inventory, orders, dashboard, offers

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(brands.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(inventory.router)
api_router.include_router(orders.router)
api_router.include_router(orders.customers_router)
api_router.include_router(dashboard.router)
api_router.include_router(offers.router, prefix="/offers", tags=["offers"])
