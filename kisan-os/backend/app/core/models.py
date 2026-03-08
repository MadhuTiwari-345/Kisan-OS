from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel

from app.core.config import settings

try:
    from geoalchemy2 import Geometry
except Exception:  # pragma: no cover - optional in local fallback setups
    Geometry = None


def _geo_column(kind: str) -> Column:
    if Geometry and settings.DATABASE_URL.startswith("postgresql"):
        return Column(Geometry(kind, srid=4326), nullable=True)
    return Column(JSON, nullable=True)


class UserRole(str, Enum):
    ADMIN = "admin"
    FARMER = "farmer"
    BUYER = "buyer"
    LOGISTICS = "logistics"


class LanguageCode(str, Enum):
    EN = "en-IN"
    AS = "as-IN"
    BN = "bn-IN"
    BODO = "bodo-IN"
    DOGRI = "dog-IN"
    GU = "gu-IN"
    HI = "hi-IN"
    KN = "kn-IN"
    KS = "ks-IN"
    KONKANI = "kok-IN"
    MAITHILI = "mai-IN"
    ML = "ml-IN"
    MANIPURI = "mni-IN"
    MR = "mr-IN"
    NE = "ne-IN"
    OD = "or-IN"
    PA = "pa-IN"
    SA = "sa-IN"
    SANTALI = "sat-IN"
    SD = "sd-IN"
    TA = "ta-IN"
    TE = "te-IN"
    UR = "ur-IN"


class CropSeason(str, Enum):
    KHARIF = "kharif"
    RABI = "rabi"
    ZAID = "zaid"


class DiseaseSeverity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class TransportStatus(str, Enum):
    PENDING = "pending"
    POOLED = "pooled"
    CONFIRMED = "confirmed"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class TransportType(str, Enum):
    MINI_TRUCK = "mini_truck"
    TEMPO = "tempo"
    TRUCK = "truck"
    AUTO = "auto"


class BidStatus(str, Enum):
    OPEN = "open"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class Farmer(SQLModel, table=True):
    __tablename__ = "farmers"

    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(index=True, unique=True, max_length=10)
    name: str
    email: Optional[str] = Field(default=None, index=True, unique=True)
    password_hash: str
    language: LanguageCode = Field(default=LanguageCode.HI)
    role: UserRole = Field(default=UserRole.FARMER)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    location: Optional[str] = None
    upi_id: Optional[str] = None
    total_farm_size_hectares: float = 0.0
    primary_crops: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Farm(SQLModel, table=True):
    __tablename__ = "farms"

    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="farmers.id", index=True)
    name: str
    size_hectares: float
    soil_type: str
    soil_ph: Optional[float] = None
    water_availability: Optional[str] = None
    irrigation_type: Optional[str] = None
    boundary_geojson: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    geom: Optional[dict[str, Any]] = Field(default=None, sa_column=_geo_column("POLYGON"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Crop(SQLModel, table=True):
    __tablename__ = "crops"

    id: Optional[int] = Field(default=None, primary_key=True)
    farm_id: int = Field(foreign_key="farms.id", index=True)
    crop_name: str = Field(index=True)
    variety: Optional[str] = None
    season: CropSeason
    area_hectares: float
    expected_yield_quintals: Optional[float] = None
    plantation_date: Optional[datetime] = None
    expected_harvest_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Mandi(SQLModel, table=True):
    __tablename__ = "mandis"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    state: str = Field(index=True)
    district: Optional[str] = None
    latitude: float
    longitude: float
    is_ondc_enabled: bool = False
    provider_metadata: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    location_geojson: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    geom: Optional[dict[str, Any]] = Field(default=None, sa_column=_geo_column("POINT"))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PriceIndex(SQLModel, table=True):
    __tablename__ = "price_indices"

    id: Optional[int] = Field(default=None, primary_key=True)
    mandi_id: int = Field(foreign_key="mandis.id", index=True)
    commodity_name: str = Field(index=True)
    variety: Optional[str] = None
    price_per_quintal: float
    price_per_kg: float
    arrival_quantity_quintals: float = 0.0
    trend: str = "stable"
    source: str = "agmarknet-mock"
    data_freshness: datetime = Field(default_factory=datetime.utcnow, index=True)
    recorded_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class AdvisoryChat(SQLModel, table=True):
    __tablename__ = "advisory_chats"

    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="farmers.id", index=True)
    query: str
    response: str
    language: LanguageCode
    crop: Optional[str] = None
    source_documents: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    confidence: float = 0.0
    is_voice_query: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class DiseaseDetection(SQLModel, table=True):
    __tablename__ = "disease_detections"

    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="farmers.id", index=True)
    crop_name: str
    disease_name: str
    severity: DiseaseSeverity = Field(default=DiseaseSeverity.LOW)
    confidence: float = 0.0
    image_name: Optional[str] = None
    treatment: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    prevention: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TransportRequest(SQLModel, table=True):
    __tablename__ = "transport_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="farmers.id", index=True)
    crop_type: str = Field(index=True)
    quantity_kg: float
    pickup_location: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    destination_mandi: str = Field(index=True)
    destination_state: Optional[str] = None
    truck_type: TransportType = Field(default=TransportType.MINI_TRUCK)
    status: TransportStatus = Field(default=TransportStatus.PENDING, index=True)
    collection_window_start: Optional[datetime] = None
    collection_window_end: Optional[datetime] = None
    price_estimate: Optional[float] = None
    final_price: Optional[float] = None
    scheduled_date: Optional[datetime] = None
    scheduled_time: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LogisticsPool(SQLModel, table=True):
    __tablename__ = "logistics_pools"

    id: Optional[int] = Field(default=None, primary_key=True)
    crop_type: str = Field(index=True)
    destination_mandi: str = Field(index=True)
    total_quantity_kg: float
    total_farmers: int
    status: str = "open"
    pickup_points: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    route_summary: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    cost_per_kg: Optional[float] = None
    estimated_delivery_hours: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class VehicleRoute(SQLModel, table=True):
    __tablename__ = "vehicle_routes"

    id: Optional[int] = Field(default=None, primary_key=True)
    logistics_pool_id: int = Field(foreign_key="logistics_pools.id", index=True)
    route_sequence: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    total_distance_km: float
    total_duration_minutes: float
    estimated_cost: float
    algorithm_used: str = "nearest-neighbor"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class KnowledgeDocument(SQLModel, table=True):
    __tablename__ = "knowledge_documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    topic: str = Field(index=True)
    crop_name: Optional[str] = Field(default=None, index=True)
    source: str
    content: str
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_verified: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Buyer(SQLModel, table=True):
    __tablename__ = "buyers"

    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str
    contact_name: str
    phone: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None, index=True, unique=True)
    location: str
    verified: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class CropListing(SQLModel, table=True):
    __tablename__ = "crop_listings"

    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="farmers.id", index=True)
    crop_name: str = Field(index=True)
    category: Optional[str] = None
    season: Optional[str] = None
    quantity_kg: float
    price_per_kg: float
    mandi_name: str
    location: Optional[str] = None
    status: str = "active"
    available_from: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    buyer_id: Optional[int] = Field(default=None, foreign_key="buyers.id", index=True)
    buyer_name: str
    listing_id: int = Field(foreign_key="crop_listings.id", index=True)
    farmer_id: int = Field(foreign_key="farmers.id", index=True)
    quantity_kg: float
    price_per_kg: float
    total_amount: float
    payment_status: str = "pending"
    fulfillment_status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Bid(SQLModel, table=True):
    __tablename__ = "bids"

    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="crop_listings.id", index=True)
    bidder_user_id: int = Field(foreign_key="farmers.id", index=True)
    buyer_id: Optional[int] = Field(default=None, foreign_key="buyers.id", index=True)
    quantity_kg: float
    bid_price_per_kg: float
    note: Optional[str] = None
    status: BidStatus = Field(default=BidStatus.OPEN, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PaymentTransaction(SQLModel, table=True):
    __tablename__ = "payment_transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="orders.id", index=True)
    payer_user_id: Optional[int] = Field(default=None, foreign_key="farmers.id", index=True)
    payee_farmer_id: int = Field(foreign_key="farmers.id", index=True)
    amount: float
    payment_method: str = "upi"
    transaction_reference: str = Field(index=True, unique=True)
    status: TransactionStatus = Field(default=TransactionStatus.PENDING, index=True)
    transparency_payload: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class UserActionLog(SQLModel, table=True):
    __tablename__ = "user_action_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: Optional[int] = Field(default=None, foreign_key="farmers.id", index=True)
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    event_payload: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class SystemConfig(SQLModel, table=True):
    __tablename__ = "system_configs"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True)
    value: str
    description: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
