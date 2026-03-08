from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.languages import normalize_language
from app.core.models import AdvisoryChat, Farmer, KnowledgeDocument, LanguageCode


router = APIRouter()


class AdvisoryQueryRequest(BaseModel):
    query: str = Field(min_length=3)
    language: str = "hi-IN"
    crop: Optional[str] = None
    soil_type: Optional[str] = None
    season: Optional[str] = None


class CropRecommendationRequest(BaseModel):
    soil_type: str
    season: str
    water_availability: str
    market_demand: Optional[str] = None
    area_hectares: Optional[float] = None


def _retrieve_sources(documents: list[KnowledgeDocument], crop: Optional[str], query: str) -> list[KnowledgeDocument]:
    query_words = {token.lower() for token in query.split()}
    matches: list[KnowledgeDocument] = []
    for document in documents:
        doc_tags = {tag.lower() for tag in document.tags}
        if crop and document.crop_name and document.crop_name.lower() == crop.lower():
            matches.append(document)
            continue
        if query_words.intersection(doc_tags) or any(token in document.content.lower() for token in query_words):
            matches.append(document)
    return matches[:3]


@router.post("/query")
async def query_advisory(
    payload: AdvisoryQueryRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lang = normalize_language(payload.language)
    docs = (await db.execute(select(KnowledgeDocument).where(KnowledgeDocument.is_verified == True))).scalars().all()
    sources = _retrieve_sources(docs, payload.crop, payload.query)
    if not sources:
        sources = docs[:2]

    source_titles = [doc.title for doc in sources]
    crop_context = payload.crop or (current_user.primary_crops[0] if current_user.primary_crops else "your crop")
    response = (
        f"For {crop_context}, focus on verified advisory first. "
        f"Check field moisture, inspect leaves daily, and use only recommended treatment from the cited guidance."
    )
    if payload.soil_type:
        response += f" Soil type noted as {payload.soil_type}."
    if payload.season:
        response += f" Season context: {payload.season}."

    chat = AdvisoryChat(
        farmer_id=current_user.id,
        query=payload.query,
        response=response,
        language=LanguageCode(lang),
        crop=payload.crop,
        source_documents=source_titles,
        confidence=0.83,
        is_voice_query=False,
    )
    db.add(chat)
    await db.commit()

    return {
        "request_id": str(uuid4()),
        "query": payload.query,
        "response": response,
        "language": lang,
        "crop": payload.crop,
        "sources": source_titles,
        "confidence": 0.83,
        "data_freshness": datetime.utcnow(),
        "source_system": "kisan-rag",
        "is_offline_fallback": False,
    }


@router.get("/history")
async def history(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chats = (
        (
            await db.execute(
                select(AdvisoryChat)
                .where(AdvisoryChat.farmer_id == current_user.id)
                .order_by(AdvisoryChat.created_at.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return {
        "request_id": str(uuid4()),
        "language": current_user.language.value,
        "data_freshness": datetime.utcnow(),
        "source_system": "kisan-rag",
        "is_offline_fallback": False,
        "items": [
            {
                "query": chat.query,
                "response": chat.response,
                "crop": chat.crop,
                "sources": chat.source_documents,
                "confidence": chat.confidence,
                "created_at": chat.created_at,
            }
            for chat in chats
        ],
    }


@router.post("/recommend-crop")
async def recommend_crop(
    payload: CropRecommendationRequest,
    current_user: Farmer = Depends(get_current_user),
):
    season = payload.season.lower()
    water = payload.water_availability.lower()
    soil = payload.soil_type.lower()

    recommendations = []
    if season == "rabi":
        recommendations.extend(
            [
                ("wheat", 22, 58000, 420, "High", "Strong"),
                ("mustard", 18, 54000, 360, "High", "Stable"),
            ]
        )
    elif season == "kharif":
        recommendations.extend(
            [
                ("rice", 28, 62000, 900, "High", "Strong"),
                ("maize", 20, 47000, 500, "Medium", "Stable"),
            ]
        )
    else:
        recommendations.extend(
            [
                ("vegetables", 16, 52000, 380, "Medium", "Strong"),
                ("fodder", 14, 30000, 320, "High", "Steady"),
            ]
        )

    if soil == "loamy" and water != "low":
        recommendations.insert(0, ("tomato", 24, 72000, 540, "High", "Strong"))

    return [
        {
            "crop": crop,
            "expected_yield_quintals": yield_q,
            "estimated_profit": profit,
            "water_requirement_mm": water_mm,
            "season_suitability": suitability,
            "market_demand": demand,
        }
        for crop, yield_q, profit, water_mm, suitability, demand in recommendations[:3]
    ]
