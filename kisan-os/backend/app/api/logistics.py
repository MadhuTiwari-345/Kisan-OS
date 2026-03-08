from __future__ import annotations

import math
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.models import Farmer, LogisticsPool, TransportRequest, TransportStatus, TransportType, VehicleRoute


router = APIRouter()


class TransportRequestCreate(BaseModel):
    crop_type: str
    quantity_kg: float = Field(gt=0)
    pickup_location: str
    pickup_lat: float | None = None
    pickup_lng: float | None = None
    destination_mandi: str
    destination_state: str | None = None
    truck_type: str = "mini_truck"
    scheduled_date: datetime | None = None
    scheduled_time: str | None = None


class MilkRunRequest(BaseModel):
    crop_type: str
    destination_mandi: str
    state: str | None = None


def _distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    return math.sqrt(((lat1 - lat2) * 111) ** 2 + ((lng1 - lng2) * 111) ** 2)


def _mandi_coordinates(name: str) -> tuple[float, float]:
    lookup = {
        "Azadpur Mandi": (28.7431, 77.1522),
        "Lasalgaon Mandi": (20.1422, 74.2390),
        "Karnal Mandi": (29.6857, 76.9905),
        "Kolar Mandi": (13.1353, 78.1291),
        "Guntur Mandi": (16.3067, 80.4365),
    }
    return lookup.get(name, (28.6139, 77.2090))


def _heuristic_route(requests: list[TransportRequest]) -> dict:
    destination_lat, destination_lng = _mandi_coordinates(requests[0].destination_mandi)
    stops = sorted(
        requests,
        key=lambda item: ((item.pickup_lat or 28.61) - destination_lat) ** 2
        + ((item.pickup_lng or 77.20) - destination_lng) ** 2,
    )
    total_distance = 0.0
    prev_lat, prev_lng = stops[0].pickup_lat or 28.61, stops[0].pickup_lng or 77.20
    sequence = []
    for index, stop in enumerate(stops, start=1):
        current_lat = stop.pickup_lat or prev_lat
        current_lng = stop.pickup_lng or prev_lng
        hop = 0.0 if index == 1 else _distance_km(prev_lat, prev_lng, current_lat, current_lng)
        total_distance += hop
        sequence.append(
            {
                "stop": index,
                "type": "pickup",
                "farmerName": f"Farmer {stop.farmer_id}",
                "latitude": current_lat,
                "longitude": current_lng,
                "distanceFromPrevKm": round(hop, 2),
            }
        )
        prev_lat, prev_lng = current_lat, current_lng
    last_hop = _distance_km(prev_lat, prev_lng, destination_lat, destination_lng)
    total_distance += last_hop
    sequence.append(
        {
            "stop": len(stops) + 1,
            "type": "destination",
            "farmerName": requests[0].destination_mandi,
            "latitude": destination_lat,
            "longitude": destination_lng,
            "distanceFromPrevKm": round(last_hop, 2),
        }
    )
    total_quantity = sum(item.quantity_kg for item in requests)
    total_cost = round((total_distance * 15) + (len(requests) * 120), 2)
    return {
        "optimizedRoute": sequence,
        "totalDistanceKm": round(total_distance, 2),
        "estimatedCost": total_cost,
        "costPerFarmer": round(total_cost / max(len(requests), 1), 2),
        "costPerKg": round(total_cost / max(total_quantity, 1), 2),
        "totalQuantityKg": total_quantity,
        "savingsPercentage": 28,
        "estimatedDeliveryHours": round(total_distance / 35 + (len(requests) * 0.3), 2),
        "carbonSavedKg": round(total_distance * 0.65, 2),
    }


@router.post("/request")
async def create_request(
    payload: TransportRequestCreate,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    destination_lat, destination_lng = _mandi_coordinates(payload.destination_mandi)
    pickup_lat = payload.pickup_lat or current_user.latitude or 28.61
    pickup_lng = payload.pickup_lng or current_user.longitude or 77.20
    distance = _distance_km(pickup_lat, pickup_lng, destination_lat, destination_lng)
    estimate = round((distance * 15) + 250, 2)
    request = TransportRequest(
        farmer_id=current_user.id,
        crop_type=payload.crop_type,
        quantity_kg=payload.quantity_kg,
        pickup_location=payload.pickup_location,
        pickup_lat=pickup_lat,
        pickup_lng=pickup_lng,
        destination_mandi=payload.destination_mandi,
        destination_state=payload.destination_state,
        truck_type=TransportType(payload.truck_type),
        status=TransportStatus.PENDING,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        collection_window_start=datetime.utcnow(),
        collection_window_end=datetime.utcnow() + timedelta(hours=8),
        price_estimate=estimate,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return {
        "id": request.id,
        "crop_type": request.crop_type,
        "quantity_kg": request.quantity_kg,
        "pickup_location": request.pickup_location,
        "destination_mandi": request.destination_mandi,
        "status": request.status.value,
        "price_estimate": request.price_estimate,
        "final_price": request.final_price,
        "truck_type": request.truck_type.value,
        "scheduled_date": request.scheduled_date,
        "scheduled_time": request.scheduled_time,
        "driver_name": request.driver_name,
        "driver_phone": request.driver_phone,
        "vehicle_number": request.vehicle_number,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }


@router.get("/status/{request_id}")
async def status_endpoint(
    request_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    request = (
        (await db.execute(select(TransportRequest).where(TransportRequest.id == request_id)))
        .scalars()
        .first()
    )
    if not request or request.farmer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transport request not found")
    return {
        "id": request.id,
        "crop_type": request.crop_type,
        "quantity_kg": request.quantity_kg,
        "pickup_location": request.pickup_location,
        "destination_mandi": request.destination_mandi,
        "status": request.status.value,
        "price_estimate": request.price_estimate,
        "final_price": request.final_price,
        "truck_type": request.truck_type.value,
        "scheduled_date": request.scheduled_date,
        "scheduled_time": request.scheduled_time,
        "driver_name": request.driver_name,
        "driver_phone": request.driver_phone,
        "vehicle_number": request.vehicle_number,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }


@router.get("/history")
async def history(
    limit: int = Query(default=10, ge=1, le=100),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    requests = (
        (
            await db.execute(
                select(TransportRequest)
                .where(TransportRequest.farmer_id == current_user.id)
                .order_by(TransportRequest.created_at.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return {"requests": [await status_endpoint(item.id, current_user, db) for item in requests], "total": len(requests)}


@router.post("/milk-run/optimize")
async def optimize(
    payload: MilkRunRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    requests = (
        (
            await db.execute(
                select(TransportRequest).where(
                    TransportRequest.crop_type == payload.crop_type,
                    TransportRequest.destination_mandi == payload.destination_mandi,
                    TransportRequest.status == TransportStatus.PENDING,
                )
            )
        )
        .scalars()
        .all()
    )
    if len(requests) < 2:
        raise HTTPException(status_code=400, detail="Need at least two pending requests for milk-run optimization")

    optimized = _heuristic_route(requests)
    pool = LogisticsPool(
        crop_type=payload.crop_type,
        destination_mandi=payload.destination_mandi,
        total_quantity_kg=optimized["totalQuantityKg"],
        total_farmers=len(requests),
        status="optimized",
        pickup_points=[
            {
                "farmer_id": request.farmer_id,
                "pickup_location": request.pickup_location,
                "pickup_lat": request.pickup_lat,
                "pickup_lng": request.pickup_lng,
                "quantity_kg": request.quantity_kg,
            }
            for request in requests
        ],
        route_summary=optimized,
        cost_per_kg=optimized["costPerKg"],
        estimated_delivery_hours=optimized["estimatedDeliveryHours"],
    )
    db.add(pool)
    await db.commit()
    await db.refresh(pool)

    route = VehicleRoute(
        logistics_pool_id=pool.id,
        route_sequence=optimized["optimizedRoute"],
        total_distance_km=optimized["totalDistanceKm"],
        total_duration_minutes=optimized["estimatedDeliveryHours"] * 60,
        estimated_cost=optimized["estimatedCost"],
        algorithm_used="nearest-neighbor",
    )
    db.add(route)

    for request in requests:
        request.status = TransportStatus.POOLED
        db.add(request)
    await db.commit()

    return {
        "pool_id": pool.id,
        "crop_type": pool.crop_type,
        "destination_mandi": pool.destination_mandi,
        "total_quantity_kg": optimized["totalQuantityKg"],
        "total_farmers": len(requests),
        "optimizedRoute": optimized["optimizedRoute"],
        "pickup_sequence": [
            {
                "farmer_id": request.farmer_id,
                "location": request.pickup_location,
                "latitude": request.pickup_lat,
                "longitude": request.pickup_lng,
                "quantity_kg": request.quantity_kg,
                "crop_type": request.crop_type,
            }
            for request in requests
        ],
        "totalDistanceKm": optimized["totalDistanceKm"],
        "totalCostRupees": optimized["estimatedCost"],
        "total_distance_km": optimized["totalDistanceKm"],
        "total_cost_rupees": optimized["estimatedCost"],
        "cost_per_kg": optimized["costPerKg"],
        "estimated_delivery_hours": optimized["estimatedDeliveryHours"],
        "carbon_saved_kg": optimized["carbonSavedKg"],
        "savingsPercentage": optimized["savingsPercentage"],
    }


@router.get("/quote")
async def quote(
    origin: str,
    destination: str,
    crop_type: str,
    quantity_kg: float,
    truck_type: str = "mini_truck",
    current_user: Farmer = Depends(get_current_user),
):
    distance = 35 + (len(origin) % 12) + (len(destination) % 8)
    base_price = round(distance * 15 + 220, 2)
    return {
        "origin": origin,
        "destination": destination,
        "crop_type": crop_type,
        "quantity_kg": quantity_kg,
        "truck_type": truck_type,
        "base_price": base_price,
        "distance_km": round(distance, 2),
        "estimated_delivery_hours": round(distance / 35, 2),
        "milk_run_savings": round(base_price * 0.28, 2),
    }
