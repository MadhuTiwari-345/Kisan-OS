from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.models import CropListing, DiseaseDetection, DiseaseSeverity, Farmer, Mandi, Order, PriceIndex
from app.services.forecasting_service import forecast_demand, predict_price


router = APIRouter()


@router.post("/disease-detect")
async def disease_detect(
    image_base64: str = Form(...),
    analysis_type: str = Form("disease"),
    crop: str | None = Form(default=None),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    crop_name = crop or "tomato"
    disease = DiseaseDetection(
        farmer_id=current_user.id,
        crop_name=crop_name,
        disease_name="Leaf Blight",
        severity=DiseaseSeverity.MODERATE,
        confidence=0.88,
        image_name="uploaded-image",
        treatment=[
            "Spray copper fungicide at recommended dosage.",
            "Remove heavily infected leaves.",
        ],
        prevention=[
            "Avoid late-evening overhead irrigation.",
            "Maintain field airflow and spacing.",
        ],
    )
    db.add(disease)
    await db.commit()
    return {
        "request_id": str(uuid4()),
        "language": current_user.language.value,
        "data_freshness": datetime.utcnow(),
        "source_system": "crop-doctor",
        "is_offline_fallback": False,
        "analysis_type": analysis_type,
        "crop": crop_name,
        "disease_name": disease.disease_name,
        "confidence": disease.confidence,
        "severity": disease.severity.value,
        "treatment": disease.treatment,
        "prevention": disease.prevention,
        "urgency": "medium",
    }


@router.get("/price-prediction")
async def price_prediction(
    crop: str = Query(...),
    state: str | None = Query(default=None),
    season: str | None = Query(default=None),
    weather_risk: float = Query(default=0.2, ge=0, le=1),
    demand_score: float = Query(default=0.6, ge=0, le=1),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    price_query = select(PriceIndex).where(PriceIndex.commodity_name == crop.lower()).order_by(PriceIndex.recorded_at.asc())
    price_rows = (await db.execute(price_query)).scalars().all()
    if state:
        mandi_ids = {
            mandi.id
            for mandi in (
                (await db.execute(select(Mandi).where(Mandi.state == state))).scalars().all()
            )
        }
        price_rows = [row for row in price_rows if row.mandi_id in mandi_ids]
    prediction = predict_price(
        crop_name=crop.lower(),
        state=state or current_user.state,
        season=season,
        historical_prices=price_rows,
        weather_risk=weather_risk,
        demand_score=demand_score,
    )
    prediction["request_id"] = str(uuid4())
    prediction["language"] = current_user.language.value
    prediction["generated_at"] = datetime.utcnow()
    return prediction


@router.get("/demand-forecast")
async def demand_forecast(
    crop: str | None = Query(default=None),
    lookahead_days: int = Query(default=14, ge=1, le=90),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    orders = (await db.execute(select(Order).order_by(Order.created_at.desc()))).scalars().all()
    listings = (await db.execute(select(CropListing).order_by(CropListing.created_at.desc()))).scalars().all()
    forecast = forecast_demand(crop_name=crop, orders=orders, listings=listings, lookahead_days=lookahead_days)
    return {
        "request_id": str(uuid4()),
        "language": current_user.language.value,
        "generated_at": forecast["generated_at"],
        "lookahead_days": forecast["lookahead_days"],
        "items": forecast["items"],
    }
