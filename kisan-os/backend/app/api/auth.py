from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_db
from app.core.languages import normalize_language
from app.core.models import Buyer, Farmer, LanguageCode, UserRole
from app.core.schemas import AuthTokenResponse, FarmerProfile, FarmerRegisterRequest, FarmerUpdateRequest
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _serialize_farmer(user: Farmer) -> FarmerProfile:
    return FarmerProfile(
        id=user.id,
        phone=user.phone,
        name=user.name,
        email=user.email,
        language=user.language.value if hasattr(user.language, "value") else str(user.language),
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        latitude=user.latitude,
        longitude=user.longitude,
        location=user.location,
        village=user.village,
        district=user.district,
        state=user.state,
        upi_id=user.upi_id,
        total_farm_size_hectares=user.total_farm_size_hectares,
        primary_crops=user.primary_crops,
        created_at=user.created_at,
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> Farmer:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        subject = decode_access_token(token)
    except JWTError as exc:
        raise credentials_error from exc

    result = await db.execute(
        select(Farmer).where(or_(Farmer.phone == subject, Farmer.email == subject))
    )
    user = result.scalars().first()
    if not user or not user.is_active:
        raise credentials_error
    return user


async def require_admin(current_user: Farmer = Depends(get_current_user)) -> Farmer:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/register", response_model=AuthTokenResponse)
async def register(payload: FarmerRegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Farmer).where(or_(Farmer.phone == payload.phone, Farmer.email == payload.email))
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Farmer account already exists")

    role = UserRole(payload.role)

    user = Farmer(
        phone=payload.phone,
        name=payload.name.strip(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        language=LanguageCode(normalize_language(payload.language)),
        role=role,
        location=payload.location or "Not set",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    if role == UserRole.BUYER:
        existing_buyer = await db.execute(
            select(Buyer).where(or_(Buyer.phone == payload.phone, Buyer.email == payload.email))
        )
        if not existing_buyer.scalars().first():
            db.add(
                Buyer(
                    company_name=payload.company_name or f"{payload.name.strip()} Trading",
                    contact_name=payload.name.strip(),
                    phone=payload.phone,
                    email=payload.email,
                    location=payload.location or "Not set",
                    verified=True,
                )
            )
            await db.commit()

    token = create_access_token(user.phone)
    return AuthTokenResponse(access_token=token, user=_serialize_farmer(user))


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    identifier = form_data.username.strip()
    result = await db.execute(
        select(Farmer).where(or_(Farmer.phone == identifier, Farmer.email == identifier))
    )
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect phone/email or password")
    token = create_access_token(user.phone)
    return AuthTokenResponse(access_token=token, user=_serialize_farmer(user))


@router.get("/me", response_model=FarmerProfile)
async def me(current_user: Farmer = Depends(get_current_user)):
    return _serialize_farmer(current_user)


@router.get("/profile", response_model=FarmerProfile)
async def profile(current_user: Farmer = Depends(get_current_user)):
    return _serialize_farmer(current_user)


@router.put("/me", response_model=FarmerProfile)
async def update_me(
    payload: FarmerUpdateRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_fields = payload.model_dump(exclude_unset=True)
    if "language" in update_fields:
        update_fields["language"] = LanguageCode(normalize_language(update_fields["language"]))
    for key, value in update_fields.items():
        setattr(current_user, key, value)
    current_user.updated_at = datetime.utcnow()
    if current_user.village or current_user.district or current_user.state:
        parts = [current_user.village, current_user.district, current_user.state]
        current_user.location = ", ".join(part for part in parts if part)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return _serialize_farmer(current_user)
