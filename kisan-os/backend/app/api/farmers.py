from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user, require_admin
from app.core.database import get_db
from app.core.languages import normalize_language
from app.core.models import Farmer, LanguageCode, UserRole
from app.core.security import hash_password


router = APIRouter()


class FarmerCreateRequest(BaseModel):
    name: str = Field(min_length=2)
    phone: str = Field(min_length=10, max_length=10)
    password: str = Field(min_length=6)
    language: str = "hi-IN"
    village: str | None = None
    district: str | None = None
    state: str | None = None
    location: str | None = None
    total_farm_size_hectares: float = 0.0
    primary_crops: list[str] = Field(default_factory=list)


def _serialize_farmer(farmer: Farmer) -> dict:
    return {
        "id": farmer.id,
        "name": farmer.name,
        "phone": farmer.phone,
        "language": farmer.language.value,
        "location": farmer.location,
        "village": farmer.village,
        "district": farmer.district,
        "state": farmer.state,
        "farm_size": farmer.total_farm_size_hectares,
        "primary_crops": farmer.primary_crops,
        "created_at": farmer.created_at,
        "role": farmer.role.value,
    }


@router.get("")
async def list_farmers(
    _: Farmer = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    farmers = (
        (await db.execute(select(Farmer).where(Farmer.role == UserRole.FARMER).order_by(Farmer.created_at.desc())))
        .scalars()
        .all()
    )
    return {"items": [_serialize_farmer(farmer) for farmer in farmers], "total": len(farmers)}


@router.post("")
async def create_farmer(
    payload: FarmerCreateRequest,
    _: Farmer = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = (
        (await db.execute(select(Farmer).where(Farmer.phone == payload.phone))).scalars().first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Farmer with this phone already exists")
    location = payload.location or ", ".join(
        part for part in [payload.village, payload.district, payload.state] if part
    )
    farmer = Farmer(
        name=payload.name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        language=LanguageCode(normalize_language(payload.language)),
        village=payload.village,
        district=payload.district,
        state=payload.state,
        location=location,
        total_farm_size_hectares=payload.total_farm_size_hectares,
        primary_crops=payload.primary_crops,
        role=UserRole.FARMER,
        updated_at=datetime.utcnow(),
    )
    db.add(farmer)
    await db.commit()
    await db.refresh(farmer)
    return _serialize_farmer(farmer)


@router.get("/{farmer_id}")
async def get_farmer(
    farmer_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farmer = (await db.execute(select(Farmer).where(Farmer.id == farmer_id))).scalars().first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    if current_user.role != UserRole.ADMIN and current_user.id != farmer.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return _serialize_farmer(farmer)


@router.delete("/{farmer_id}")
async def delete_farmer(
    farmer_id: int,
    _: Farmer = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    farmer = (await db.execute(select(Farmer).where(Farmer.id == farmer_id))).scalars().first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    await db.delete(farmer)
    await db.commit()
    return {"deleted": True, "farmer_id": farmer_id}
