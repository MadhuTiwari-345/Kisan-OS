from __future__ import annotations

from datetime import datetime, timedelta
from typing import AsyncGenerator

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.core.config import settings
from app.core.models import (
    AdvisoryChat,
    Buyer,
    Crop,
    CropListing,
    CropSeason,
    Farm,
    Farmer,
    KnowledgeDocument,
    LanguageCode,
    LogisticsPool,
    Mandi,
    Order,
    PriceIndex,
    TransportRequest,
    UserRole,
)
from app.core.security import hash_password


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.SQLALCHEMY_ECHO,
    future=True,
)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(SQLModel.metadata.create_all)
    await seed_reference_data()


async def close_db() -> None:
    await engine.dispose()


async def check_db_connection() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def seed_reference_data() -> None:
    async with SessionLocal() as session:
        admin_exists = await session.execute(select(Farmer).where(Farmer.phone == "9999999999"))
        if not admin_exists.scalars().first():
            session.add(
                Farmer(
                    phone="9999999999",
                    name="KISAN Admin",
                    email="admin@kisan-os.in",
                    password_hash=hash_password("admin123"),
                    language=LanguageCode.EN,
                    role=UserRole.ADMIN,
                    location="Operations Hub",
                    state="Delhi",
                )
            )

        buyer_exists = await session.execute(select(Farmer).where(Farmer.phone == "8888888888"))
        if not buyer_exists.scalars().first():
            session.add(
                Farmer(
                    phone="8888888888",
                    name="FreshMart Buyer",
                    email="buyer@kisan-os.in",
                    password_hash=hash_password("buyer123"),
                    language=LanguageCode.EN,
                    role=UserRole.BUYER,
                    location="NCR Procurement Hub",
                    state="Delhi",
                )
            )

        mandi_result = await session.execute(select(Mandi))
        if not mandi_result.scalars().first():
            mandis = [
                ("Azadpur Mandi", "Delhi", 28.7431, 77.1522, True),
                ("Lasalgaon Mandi", "Maharashtra", 20.1422, 74.2390, True),
                ("Karnal Mandi", "Haryana", 29.6857, 76.9905, False),
                ("Kolar Mandi", "Karnataka", 13.1353, 78.1291, False),
                ("Guntur Mandi", "Andhra Pradesh", 16.3067, 80.4365, True),
            ]
            for name, state, lat, lng, is_ondc_enabled in mandis:
                session.add(
                    Mandi(
                        name=name,
                        state=state,
                        latitude=lat,
                        longitude=lng,
                        is_ondc_enabled=is_ondc_enabled,
                        location_geojson={
                            "type": "Point",
                            "coordinates": [lng, lat],
                        },
                    )
                )
            await session.commit()

        mandi_rows = (await session.execute(select(Mandi))).scalars().all()
        price_result = await session.execute(select(PriceIndex))
        if not price_result.scalars().first():
            seed_rows = [
                ("tomato", "stable", 2200, 22.0, 1450, 45),
                ("onion", "rising", 1550, 15.5, 2200, 30),
                ("wheat", "stable", 2410, 24.1, 1750, 18),
                ("rice", "rising", 3150, 31.5, 980, 25),
                ("cotton", "falling", 7100, 71.0, 420, -40),
            ]
            for offset, mandi in enumerate(mandi_rows):
                for commodity, trend, per_quintal, per_kg, arrival, daily_variation in seed_rows:
                    for day in range(7):
                        session.add(
                            PriceIndex(
                                mandi_id=mandi.id,
                                commodity_name=commodity,
                                price_per_quintal=per_quintal + (offset * 25) + (day * daily_variation),
                                price_per_kg=per_kg + (offset * 0.25) + (day * (daily_variation / 100)),
                                arrival_quantity_quintals=max(100, arrival + (offset * 50) - (day * 20)),
                                trend=trend,
                                data_freshness=datetime.utcnow() - timedelta(days=6 - day, hours=offset),
                                recorded_at=datetime.utcnow() - timedelta(days=6 - day),
                            )
                        )

        docs_result = await session.execute(select(KnowledgeDocument))
        if not docs_result.scalars().first():
            documents = [
                (
                    "ICAR Tomato Blight Advisory",
                    "tomato",
                    "disease",
                    "ICAR",
                    "Blight in tomato can be managed with sanitation, copper-based fungicide, and airflow management.",
                    ["tomato", "blight", "fungicide"],
                ),
                (
                    "KVK Onion Storage Note",
                    "onion",
                    "market",
                    "KVK",
                    "Onion should be cured before transport and sold in ventilated lots when prices are stable or rising.",
                    ["onion", "storage", "market"],
                ),
                (
                    "Water Advisory for Wheat",
                    "wheat",
                    "irrigation",
                    "ICAR",
                    "Wheat benefits from timely irrigation at crown root initiation and grain filling stages.",
                    ["wheat", "irrigation"],
                ),
            ]
            for title, crop_name, topic, source, content, tags in documents:
                session.add(
                    KnowledgeDocument(
                        title=title,
                        crop_name=crop_name,
                        topic=topic,
                        source=source,
                        content=content,
                        tags=tags,
                    )
                )

        buyer_rows = await session.execute(select(Buyer))
        if not buyer_rows.scalars().first():
            session.add(
                Buyer(
                    company_name="FreshMart Retail",
                    contact_name="Ananya Singh",
                    phone="8888888888",
                    email="buyer@kisan-os.in",
                    location="Delhi",
                    verified=True,
                )
            )

        farmer_rows = (await session.execute(select(Farmer).where(Farmer.role == UserRole.FARMER))).scalars().all()
        if not farmer_rows:
            sample_farmer = Farmer(
                phone="9876500001",
                name="Suresh Patel",
                email="suresh@kisan-os.in",
                password_hash=hash_password("password123"),
                language=LanguageCode.HI,
                role=UserRole.FARMER,
                village="Rampur",
                district="Karnal",
                state="Haryana",
                location="Rampur, Karnal, Haryana",
                primary_crops=["onion", "wheat"],
                total_farm_size_hectares=2.4,
                latitude=29.69,
                longitude=76.98,
            )
            session.add(sample_farmer)
            await session.commit()
            farmer_rows = [sample_farmer]

        farms_result = await session.execute(select(Farm))
        if not farms_result.scalars().first():
            sample_farms = [
                Farm(
                    farmer_id=farmer_rows[0].id,
                    name="Rampur North Plot",
                    size_hectares=1.4,
                    soil_type="loamy",
                    soil_ph=6.7,
                    water_availability="medium",
                    irrigation_type="drip",
                ),
                Farm(
                    farmer_id=farmer_rows[0].id,
                    name="Canal Side Parcel",
                    size_hectares=1.0,
                    soil_type="alluvial",
                    soil_ph=7.1,
                    water_availability="high",
                    irrigation_type="canal",
                ),
            ]
            for farm in sample_farms:
                session.add(farm)
            await session.commit()

        farm_rows = (await session.execute(select(Farm).order_by(Farm.created_at.asc()))).scalars().all()
        crop_rows = await session.execute(select(Crop))
        if farm_rows and not crop_rows.scalars().first():
            session.add(
                Crop(
                    farm_id=farm_rows[0].id,
                    crop_name="onion",
                    variety="N-53",
                    season=CropSeason.RABI,
                    area_hectares=0.8,
                    expected_yield_quintals=95,
                )
            )
            session.add(
                Crop(
                    farm_id=farm_rows[1].id,
                    crop_name="wheat",
                    variety="HD-2967",
                    season=CropSeason.RABI,
                    area_hectares=1.0,
                    expected_yield_quintals=42,
                )
            )

        listings_result = await session.execute(select(CropListing))
        if not listings_result.scalars().first():
            seed_listings = [
                ("onion", "vegetable", "rabi", 2400, 18.5, "Azadpur Mandi"),
                ("wheat", "cereal", "rabi", 5000, 24.0, "Karnal Mandi"),
                ("tomato", "vegetable", "zaid", 1800, 22.0, "Azadpur Mandi"),
            ]
            for index, farmer in enumerate(farmer_rows[:1]):
                for crop_name, category, season, qty, price_per_kg, mandi_name in seed_listings:
                    session.add(
                        CropListing(
                            farmer_id=farmer.id,
                            crop_name=crop_name,
                            category=category,
                            season=season,
                            quantity_kg=qty + index * 100,
                            price_per_kg=price_per_kg,
                            mandi_name=mandi_name,
                            location=farmer.location,
                        )
                    )

        buyers = (await session.execute(select(Buyer))).scalars().all()
        listings = (await session.execute(select(CropListing))).scalars().all()
        orders_result = await session.execute(select(Order))
        if buyers and listings and not orders_result.scalars().first():
            listing = listings[0]
            buyer = buyers[0]
            session.add(
                Order(
                    buyer_id=buyer.id,
                    buyer_name=buyer.company_name,
                    listing_id=listing.id,
                    farmer_id=listing.farmer_id,
                    quantity_kg=600,
                    price_per_kg=listing.price_per_kg,
                    total_amount=600 * listing.price_per_kg,
                    payment_status="pending",
                    fulfillment_status="confirmed",
                )
            )

        await session.commit()
