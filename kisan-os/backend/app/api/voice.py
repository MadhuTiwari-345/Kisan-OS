from __future__ import annotations

import base64
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Form
from pydantic import BaseModel

from app.api.auth import get_current_user
from app.core.languages import ADMIN_LANGUAGES, DIALECT_ALIASES, LANGUAGE_CATALOG, normalize_language
from app.core.models import Farmer


router = APIRouter()


class SttRequest(BaseModel):
    audio_base64: str
    language: str = "hi-IN"
    encoding: str = "wav"
    sample_rate: int = 16000


class TtsRequest(BaseModel):
    text: str
    language: str = "hi-IN"
    gender: str = "female"


class TranslationRequest(BaseModel):
    text: str
    source_language: str = "hi-IN"
    target_language: str = "en-IN"


def _fake_transcript(language: str) -> str:
    transcripts = {
        "hi-IN": "Aaj pyaz ka bhav aur transport option batao",
        "bn-IN": "Aaj peyajer daam bolo",
        "ta-IN": "Inru vengayam vilai sollunga",
        "te-IN": "E roju ullipaya dhara cheppu",
        "mr-IN": "Aaj kandyacha bhav sanga",
    }
    return transcripts.get(language, "Please share mandi price and crop advice")


def _encode_audio_marker(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("utf-8")


@router.get("/languages")
async def languages(current_user: Farmer = Depends(get_current_user)):
    return {
        "request_id": str(uuid4()),
        "language": current_user.language.value,
        "data_freshness": datetime.utcnow(),
        "source_system": "bhashini-adapter",
        "is_offline_fallback": False,
        "languages": LANGUAGE_CATALOG,
        "admin_languages": ADMIN_LANGUAGES,
        "dialect_aliases": DIALECT_ALIASES,
        "total_count": len(LANGUAGE_CATALOG),
    }


@router.post("/stt")
async def stt(payload: SttRequest, current_user: Farmer = Depends(get_current_user)):
    language = normalize_language(payload.language)
    return {
        "request_id": str(uuid4()),
        "text": _fake_transcript(language),
        "language": language,
        "confidence": 0.91,
        "data_freshness": datetime.utcnow(),
        "source_system": "bhashini-adapter",
        "is_offline_fallback": True,
    }


@router.post("/translate")
async def translate(payload: TranslationRequest, current_user: Farmer = Depends(get_current_user)):
    source_language = normalize_language(payload.source_language)
    target_language = normalize_language(payload.target_language)
    translated_text = f"[{target_language}] {payload.text}"
    return {
        "request_id": str(uuid4()),
        "source_text": payload.text,
        "translated_text": translated_text,
        "source_language": source_language,
        "target_language": target_language,
        "language": target_language,
        "confidence": 0.88,
        "data_freshness": datetime.utcnow(),
        "source_system": "bhashini-adapter",
        "is_offline_fallback": True,
    }


@router.post("/tts")
async def tts(payload: TtsRequest, current_user: Farmer = Depends(get_current_user)):
    language = normalize_language(payload.language)
    return {
        "request_id": str(uuid4()),
        "audio_base64": _encode_audio_marker(f"{language}:{payload.text}"),
        "language": language,
        "format": "wav",
        "duration_ms": max(900, len(payload.text) * 90),
        "data_freshness": datetime.utcnow(),
        "source_system": "bhashini-adapter",
        "is_offline_fallback": True,
    }


@router.post("/query")
async def query(
    audio_base64: str = Form(...),
    language: str = Form("hi-IN"),
    query_type: str = Form("advisory"),
    crop: str | None = Form(default=None),
    soil_type: str | None = Form(default=None),
    current_user: Farmer = Depends(get_current_user),
):
    normalized_language = normalize_language(language)
    transcript = _fake_transcript(normalized_language)
    context_bits = [bit for bit in [crop, soil_type, current_user.location] if bit]
    response_text = (
        f"{query_type.title()} response ready. "
        f"Context used: {', '.join(context_bits) if context_bits else 'farmer profile'}."
    )
    return {
        "request_id": str(uuid4()),
        "query_text": transcript,
        "response_text": response_text,
        "response_audio_base64": _encode_audio_marker(response_text),
        "language": normalized_language,
        "confidence": 0.9,
        "data_freshness": datetime.utcnow(),
        "source_system": "voice-orchestrator",
        "is_offline_fallback": True,
    }
