from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.models import Farmer, Mandi, PriceIndex


router = APIRouter()


def _price_payload(price: PriceIndex, mandi_map: dict[int, Mandi]) -> dict:
    mandi = mandi_map[price.mandi_id]
    return {
        "crop_name": price.commodity_name,
        "crop": price.commodity_name,
        "mandi": mandi.name,
        "state": mandi.state,
        "price": round(price.price_per_quintal, 2),
        "price_per_kg": round(price.price_per_kg, 2),
        "arrival": round(price.arrival_quantity_quintals, 2),
        "arrival_tons": round(price.arrival_quantity_quintals / 10, 2),
        "trend": price.trend,
        "price_date": price.recorded_at,
        "data_freshness": price.data_freshness,
    }


@router.get("/prices")
async def prices(
    crop: str = Query(...),
    state: str | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=90),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    price_rows = (
        (
            await db.execute(
                select(PriceIndex).where(PriceIndex.commodity_name == crop.lower()).order_by(PriceIndex.recorded_at.desc())
            )
        )
        .scalars()
        .all()
    )
    mandis = {mandi.id: mandi for mandi in (await db.execute(select(Mandi))).scalars().all()}
    rows = [_price_payload(row, mandis) for row in price_rows]
    if state:
        rows = [row for row in rows if row["state"].lower() == state.lower()]
    rows = rows[: max(1, min(days, len(rows) or 1))]
    average = round(sum(row["price_per_kg"] for row in rows) / max(len(rows), 1), 2) if rows else 0.0
    trend = rows[0]["trend"] if rows else "stable"
    return {
        "request_id": str(uuid4()),
        "language": current_user.language.value,
        "data_freshness": datetime.utcnow(),
        "source_system": "agmarknet-adapter",
        "is_offline_fallback": False,
        "crop": crop.lower(),
        "average_price": average,
        "trend": trend,
        "prices": rows,
    }


@router.get("/compare")
async def compare(
    crop: str = Query(...),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    price_rows = (
        (
            await db.execute(
                select(PriceIndex).where(PriceIndex.commodity_name == crop.lower()).order_by(PriceIndex.price_per_quintal.desc())
            )
        )
        .scalars()
        .all()
    )
    mandis = {mandi.id: mandi for mandi in (await db.execute(select(Mandi))).scalars().all()}
    markets = [_price_payload(row, mandis) for row in price_rows]
    best = markets[0] if markets else None
    recommendation = (
        f"Best mandi is {best['mandi']} with transport-adjusted upside highest among current records."
        if best
        else "No market data available."
    )
    return {
        "request_id": str(uuid4()),
        "language": current_user.language.value,
        "data_freshness": datetime.utcnow(),
        "source_system": "agmarknet-adapter",
        "is_offline_fallback": False,
        "crop": crop.lower(),
        "markets": markets,
        "best_mandi": best["mandi"] if best else None,
        "best_price": best["price"] if best else 0,
        "price_trend": best["trend"] if best else "stable",
        "recommendation": recommendation,
    }


@router.get("/best-mandi")
async def best_mandi(
    crop: str = Query(...),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comparison = await compare(crop=crop, current_user=current_user, db=db)
    best = comparison["markets"][0] if comparison["markets"] else None
    alternatives = [
        {
            "mandi": market["mandi"],
            "price_per_kg": market["price_per_kg"],
            "state": market["state"],
        }
        for market in comparison["markets"][1:4]
    ]
    return {
        "crop": crop.lower(),
        "best_mandi": best["mandi"] if best else None,
        "best_price": best["price_per_kg"] if best else 0,
        "best_state": best["state"] if best else None,
        "alternatives": alternatives,
        "recommendation": comparison["recommendation"],
    }
