from fastapi import APIRouter
from app.api.v1.storefront import auth, products, account, categories, brands, offers, settings, wishlist, orders, loyalty

router = APIRouter(prefix="/storefront")

router.include_router(auth.router)
router.include_router(products.router)
router.include_router(account.router)
router.include_router(categories.router)
router.include_router(brands.router)
router.include_router(offers.router)
router.include_router(settings.router)
router.include_router(wishlist.router)
router.include_router(orders.router)
router.include_router(loyalty.router)
