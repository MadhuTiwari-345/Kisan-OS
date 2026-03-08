from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.models import Crop, CropSeason, Farm, Farmer, UserRole


router = APIRouter()


class FarmCreateRequest(BaseModel):
    name: str = Field(min_length=2)
    size_hectares: float = Field(gt=0)
    soil_type: str
    soil_ph: float | None = None
    water_availability: str | None = None
    irrigation_type: str | None = None
    boundary_geojson: dict | None = None


class CropCreateRequest(BaseModel):
    crop_name: str
    variety: str | None = None
    season: str
    area_hectares: float = Field(gt=0)
    expected_yield_quintals: float | None = Field(default=None, gt=0)
    plantation_date: datetime | None = None
    expected_harvest_date: datetime | None = None


def _serialize_farm(farm: Farm) -> dict:
    return {
        "id": farm.id,
        "farmer_id": farm.farmer_id,
        "name": farm.name,
        "size_hectares": farm.size_hectares,
        "soil_type": farm.soil_type,
        "soil_ph": farm.soil_ph,
        "water_availability": farm.water_availability,
        "irrigation_type": farm.irrigation_type,
        "boundary_geojson": farm.boundary_geojson,
        "created_at": farm.created_at,
        "updated_at": farm.updated_at,
    }


def _serialize_crop(crop: Crop) -> dict:
    return {
        "id": crop.id,
        "farm_id": crop.farm_id,
        "crop_name": crop.crop_name,
        "variety": crop.variety,
        "season": crop.season.value if hasattr(crop.season, "value") else str(crop.season),
        "area_hectares": crop.area_hectares,
        "expected_yield_quintals": crop.expected_yield_quintals,
        "plantation_date": crop.plantation_date,
        "expected_harvest_date": crop.expected_harvest_date,
        "created_at": crop.created_at,
        "updated_at": crop.updated_at,
    }


async def _get_farm_or_404(farm_id: int, db: AsyncSession) -> Farm:
    farm = (await db.execute(select(Farm).where(Farm.id == farm_id))).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.get("")
async def list_farms(
    farmer_id: int | None = Query(default=None),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Farm).order_by(Farm.created_at.desc())
    if current_user.role != UserRole.ADMIN:
        query = query.where(Farm.farmer_id == current_user.id)
    elif farmer_id:
        query = query.where(Farm.farmer_id == farmer_id)
    farms = (await db.execute(query)).scalars().all()
    return {"items": [_serialize_farm(farm) for farm in farms], "total": len(farms)}


@router.post("")
async def create_farm(
    payload: FarmCreateRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {UserRole.FARMER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only farmers can add farm details")
    farm = Farm(
        farmer_id=current_user.id,
        name=payload.name,
        size_hectares=payload.size_hectares,
        soil_type=payload.soil_type,
        soil_ph=payload.soil_ph,
        water_availability=payload.water_availability,
        irrigation_type=payload.irrigation_type,
        boundary_geojson=payload.boundary_geojson,
        updated_at=datetime.utcnow(),
    )
    db.add(farm)
    await db.commit()
    await db.refresh(farm)
    return _serialize_farm(farm)


@router.get("/{farm_id}")
async def get_farm(
    farm_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farm = await _get_farm_or_404(farm_id, db)
    if current_user.role != UserRole.ADMIN and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    crops = (
        (await db.execute(select(Crop).where(Crop.farm_id == farm.id).order_by(Crop.created_at.desc())))
        .scalars()
        .all()
    )
    return {"farm": _serialize_farm(farm), "crops": [_serialize_crop(crop) for crop in crops]}


@router.get("/{farm_id}/crops")
async def list_farm_crops(
    farm_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farm = await _get_farm_or_404(farm_id, db)
    if current_user.role != UserRole.ADMIN and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    crops = (
        (await db.execute(select(Crop).where(Crop.farm_id == farm.id).order_by(Crop.created_at.desc())))
        .scalars()
        .all()
    )
    return {"items": [_serialize_crop(crop) for crop in crops], "total": len(crops)}


@router.post("/{farm_id}/crops")
async def create_farm_crop(
    farm_id: int,
    payload: CropCreateRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farm = await _get_farm_or_404(farm_id, db)
    if current_user.role != UserRole.ADMIN and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    crop = Crop(
        farm_id=farm.id,
        crop_name=payload.crop_name.lower(),
        variety=payload.variety,
        season=CropSeason(payload.season.lower()),
        area_hectares=payload.area_hectares,
        expected_yield_quintals=payload.expected_yield_quintals,
        plantation_date=payload.plantation_date,
        expected_harvest_date=payload.expected_harvest_date,
        updated_at=datetime.utcnow(),
    )
    db.add(crop)
    await db.commit()
    await db.refresh(crop)
    return _serialize_crop(crop)
