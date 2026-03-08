from __future__ import annotations

from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import require_admin
from app.core.database import get_db
from app.core.models import (
    Bid,
    CropListing,
    Farmer,
    LogisticsPool,
    Order,
    PaymentTransaction,
    PriceIndex,
    TransportRequest,
    UserRole,
)
from app.services.forecasting_service import forecast_demand


router = APIRouter()


def _enum_value(value):
    return value.value if hasattr(value, "value") else value


@router.get("/revenue")
async def revenue(
    _: Farmer = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    orders = (await db.execute(select(Order))).scalars().all()
    total_revenue = round(sum(order.total_amount for order in orders), 2)
    paid_revenue = round(sum(order.total_amount for order in orders if order.payment_status == "paid"), 2)
    return {
        "total_revenue": total_revenue,
        "paid_revenue": paid_revenue,
        "pending_revenue": round(total_revenue - paid_revenue, 2),
        "orders_count": len(orders),
    }


@router.get("/crop-trends")
async def crop_trends(
    _: Farmer = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    listings = (await db.execute(select(CropListing))).scalars().all()
    by_crop = defaultdict(lambda: {"active_listings": 0, "quantity_kg": 0.0, "avg_price_per_kg": 0.0, "count": 0})
    for listing in listings:
        bucket = by_crop[listing.crop_name]
        bucket["active_listings"] += 1 if listing.status == "active" else 0
        bucket["quantity_kg"] += listing.quantity_kg
        bucket["avg_price_per_kg"] += listing.price_per_kg
        bucket["count"] += 1
    items = []
    for crop_name, bucket in by_crop.items():
        count = bucket.pop("count")
        items.append(
            {
                "crop": crop_name,
                "active_listings": bucket["active_listings"],
                "quantity_kg": round(bucket["quantity_kg"], 2),
                "avg_price_per_kg": round(bucket["avg_price_per_kg"] / max(count, 1), 2),
            }
        )
    items.sort(key=lambda item: item["quantity_kg"], reverse=True)
    return {"items": items}


@router.get("/market-demand")
async def market_demand(
    _: Farmer = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    orders = (await db.execute(select(Order))).scalars().all()
    listings = (await db.execute(select(CropListing))).scalars().all()
    listing_map = {listing.id: listing for listing in listings}
    demand_counter = Counter()
    for order in orders:
        listing = listing_map.get(order.listing_id)
        if listing:
            demand_counter[listing.crop_name] += order.quantity_kg

    current_prices = (await db.execute(select(PriceIndex))).scalars().all()
    price_by_crop = {}
    for price in current_prices:
        price_by_crop.setdefault(price.commodity_name, price.price_per_kg)

    items = [
        {
            "crop": crop,
            "demand_kg": quantity,
            "recommended_price_per_kg": round(price_by_crop.get(crop, 0), 2),
        }
        for crop, quantity in demand_counter.most_common()
    ]
    return {"items": items}


@router.get("/dashboard")
async def dashboard(
    _: Farmer = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    farmers = (await db.execute(select(Farmer))).scalars().all()
    listings = (await db.execute(select(CropListing))).scalars().all()
    orders = (await db.execute(select(Order))).scalars().all()
    bids = (await db.execute(select(Bid))).scalars().all()
    transactions = (await db.execute(select(PaymentTransaction))).scalars().all()
    transport_requests = (await db.execute(select(TransportRequest))).scalars().all()
    logistics_pools = (await db.execute(select(LogisticsPool))).scalars().all()
    prices = (await db.execute(select(PriceIndex))).scalars().all()

    total_revenue = round(sum(order.total_amount for order in orders), 2)
    paid_revenue = round(sum(txn.amount for txn in transactions if _enum_value(txn.status) == "success"), 2)
    farmer_count = sum(1 for farmer in farmers if farmer.role == UserRole.FARMER)
    buyer_count = sum(1 for farmer in farmers if farmer.role == UserRole.BUYER)
    active_listings = [listing for listing in listings if listing.status == "active"]
    demand_snapshot = forecast_demand(crop_name=None, orders=orders, listings=listings, lookahead_days=14)

    top_prices: dict[str, float] = {}
    for price in prices:
        top_prices[price.commodity_name] = max(top_prices.get(price.commodity_name, 0.0), price.price_per_kg)

    return {
        "users": {
            "farmers": farmer_count,
            "buyers": buyer_count,
            "total_accounts": len(farmers),
        },
        "marketplace": {
            "active_listings": len(active_listings),
            "open_bids": sum(1 for bid in bids if _enum_value(bid.status) == "open"),
            "orders_count": len(orders),
            "gross_merchandise_value": total_revenue,
        },
        "transactions": {
            "paid_revenue": paid_revenue,
            "pending_revenue": round(total_revenue - paid_revenue, 2),
            "successful_transactions": sum(1 for txn in transactions if _enum_value(txn.status) == "success"),
        },
        "logistics": {
            "transport_requests": len(transport_requests),
            "pooled_shipments": len(logistics_pools),
            "pooled_quantity_kg": round(sum(pool.total_quantity_kg for pool in logistics_pools), 2),
        },
        "market_intelligence": {
            "top_price_per_kg": top_prices,
            "demand_forecast": demand_snapshot["items"][:5],
        },
    }
