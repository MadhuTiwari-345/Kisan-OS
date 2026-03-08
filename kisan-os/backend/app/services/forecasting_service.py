from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime

from app.core.models import CropListing, Order, PriceIndex


SEASONAL_FACTORS = {
    "tomato": {"kharif": 0.96, "rabi": 1.08, "zaid": 1.12},
    "onion": {"kharif": 0.98, "rabi": 1.06, "zaid": 1.03},
    "wheat": {"kharif": 0.92, "rabi": 1.1, "zaid": 0.95},
    "rice": {"kharif": 1.09, "rabi": 0.97, "zaid": 0.94},
    "cotton": {"kharif": 1.07, "rabi": 0.95, "zaid": 0.91},
}


def predict_price(
    crop_name: str,
    state: str | None,
    season: str | None,
    historical_prices: list[PriceIndex],
    weather_risk: float = 0.0,
    demand_score: float = 0.5,
) -> dict:
    rows = sorted(historical_prices, key=lambda row: row.recorded_at)
    if not rows:
        return {
            "crop": crop_name,
            "state": state,
            "recommended_price_per_kg": 0.0,
            "predicted_price_per_kg": 0.0,
            "confidence": 0.2,
            "trend": "unknown",
            "basis": "No historical mandi prices available",
        }

    prices = [row.price_per_kg for row in rows]
    baseline = sum(prices) / len(prices)
    momentum = prices[-1] - prices[0] if len(prices) > 1 else 0.0
    slope = momentum / max(len(prices) - 1, 1)
    season_key = (season or "").lower()
    seasonal_multiplier = SEASONAL_FACTORS.get(crop_name.lower(), {}).get(season_key, 1.0)
    weather_multiplier = max(0.9, 1 - (weather_risk * 0.08))
    demand_multiplier = 0.95 + min(max(demand_score, 0.0), 1.0) * 0.12
    predicted = (prices[-1] + slope * 2) * seasonal_multiplier * weather_multiplier * demand_multiplier

    trend = "stable"
    if slope > 0.15:
        trend = "rising"
    elif slope < -0.15:
        trend = "falling"

    confidence = min(0.92, 0.45 + (min(len(prices), 7) * 0.05))
    return {
        "crop": crop_name.lower(),
        "state": state,
        "recommended_price_per_kg": round(predicted * 0.98, 2),
        "predicted_price_per_kg": round(predicted, 2),
        "current_average_price_per_kg": round(baseline, 2),
        "trend": trend,
        "confidence": round(confidence, 2),
        "basis": "Historical mandi prices, seasonality, demand score, and weather risk",
        "observations": len(prices),
    }


def forecast_demand(
    crop_name: str | None,
    orders: list[Order],
    listings: list[CropListing],
    lookahead_days: int = 14,
) -> dict:
    listing_map = {listing.id: listing for listing in listings}
    demand_by_crop = Counter()
    supply_by_crop = defaultdict(float)

    for order in orders:
        listing = listing_map.get(order.listing_id)
        if listing:
            demand_by_crop[listing.crop_name] += order.quantity_kg

    for listing in listings:
        if listing.status == "active":
            supply_by_crop[listing.crop_name] += listing.quantity_kg

    items = []
    crop_names = [crop_name.lower()] if crop_name else sorted(set(demand_by_crop) | set(supply_by_crop))
    for crop in crop_names:
        demand_kg = demand_by_crop.get(crop, 0.0)
        supply_kg = supply_by_crop.get(crop, 0.0)
        demand_ratio = demand_kg / max(supply_kg, 1.0)
        forecast_quantity = demand_kg * (1 + min(lookahead_days / 60, 0.35))
        signal = "steady"
        if demand_ratio > 0.8:
            signal = "high"
        elif demand_ratio < 0.35:
            signal = "moderate"
        best_window = "sell within 3-5 days" if signal == "high" else "hold for price discovery"
        planting_signal = "increase acreage" if signal == "high" else "maintain current acreage"
        items.append(
            {
                "crop": crop,
                "historical_demand_kg": round(demand_kg, 2),
                "active_supply_kg": round(supply_kg, 2),
                "projected_demand_kg": round(forecast_quantity, 2),
                "demand_supply_ratio": round(demand_ratio, 2),
                "demand_signal": signal,
                "best_action": best_window,
                "planting_signal": planting_signal,
            }
        )

    items.sort(key=lambda item: item["projected_demand_kg"], reverse=True)
    return {
        "generated_at": datetime.utcnow(),
        "lookahead_days": lookahead_days,
        "items": items,
    }
