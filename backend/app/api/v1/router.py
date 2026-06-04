from fastapi import APIRouter, Depends
from app.api.v1 import auth, brands, categories, products, inventory, orders, dashboard, offers, analytics, settings, seo, uploads, loyalty
from app.api.v1.storefront import router as storefront_router
from app.core.deps import get_current_user

api_router = APIRouter(prefix="/api/v1")

# Public routes
api_router.include_router(auth.router)
api_router.include_router(seo.router, prefix="/seo", tags=["SEO"])
api_router.include_router(storefront_router.router)

# Protected routes (require JWT)
protected_router = APIRouter(dependencies=[Depends(get_current_user)])

protected_router.include_router(auth.users_router)
protected_router.include_router(brands.router)
protected_router.include_router(categories.router)
protected_router.include_router(products.router)
protected_router.include_router(inventory.router)
protected_router.include_router(orders.router)
protected_router.include_router(orders.customers_router)
protected_router.include_router(dashboard.router)
protected_router.include_router(offers.router)
protected_router.include_router(loyalty.router)
protected_router.include_router(analytics.router)
protected_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
protected_router.include_router(uploads.router)

api_router.include_router(protected_router)
