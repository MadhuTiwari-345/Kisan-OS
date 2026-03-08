from __future__ import annotations

from fastapi import APIRouter, FastAPI

from app.api import advisory, ai, analytics, auth, farmers, farms, listings, logistics, market, orders, voice


api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(advisory.router, prefix="/advisory", tags=["advisory"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(farmers.router, prefix="/farmers", tags=["farmers"])
api_router.include_router(farms.router, prefix="/farms", tags=["farms"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["logistics"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])


def register_routes(app: FastAPI) -> None:
    app.include_router(api_router)
