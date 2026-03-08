from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from app.core.languages import normalize_language


class ApiMeta(BaseModel):
    request_id: str
    language: str
    data_freshness: datetime
    source_system: str
    is_offline_fallback: bool = False
    confidence: Optional[float] = None


class FarmerProfile(BaseModel):
    id: int
    phone: str
    name: str
    email: Optional[str] = None
    language: str
    role: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    upi_id: Optional[str] = None
    total_farm_size_hectares: float = 0.0
    primary_crops: list[str] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: FarmerProfile


class FarmerRegisterRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=10)
    name: str = Field(min_length=2)
    password: str = Field(min_length=6)
    email: Optional[str] = None
    language: str = "hi-IN"
    role: str = "farmer"
    location: Optional[str] = None
    company_name: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError("Phone number must contain only digits")
        return value

    @field_validator("language")
    @classmethod
    def normalize_lang(cls, value: str) -> str:
        return normalize_language(value)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"farmer", "buyer", "logistics"}:
            raise ValueError("Role must be farmer, buyer, or logistics")
        return normalized


class FarmerUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    language: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    location: Optional[str] = None
    upi_id: Optional[str] = None
    total_farm_size_hectares: Optional[float] = None
    primary_crops: Optional[list[str]] = None

    @field_validator("language")
    @classmethod
    def normalize_lang(cls, value: Optional[str]) -> Optional[str]:
        return normalize_language(value) if value else value


class ResponseEnvelope(BaseModel):
    meta: ApiMeta
    data: dict[str, Any]
