from __future__ import annotations

from app.core.models import LanguageCode


LANGUAGE_CATALOG = [
    {"code": "as-IN", "name": "Assamese"},
    {"code": "bn-IN", "name": "Bengali"},
    {"code": "bodo-IN", "name": "Bodo"},
    {"code": "dog-IN", "name": "Dogri"},
    {"code": "gu-IN", "name": "Gujarati"},
    {"code": "hi-IN", "name": "Hindi"},
    {"code": "kn-IN", "name": "Kannada"},
    {"code": "ks-IN", "name": "Kashmiri"},
    {"code": "kok-IN", "name": "Konkani"},
    {"code": "mai-IN", "name": "Maithili"},
    {"code": "ml-IN", "name": "Malayalam"},
    {"code": "mni-IN", "name": "Manipuri"},
    {"code": "mr-IN", "name": "Marathi"},
    {"code": "ne-IN", "name": "Nepali"},
    {"code": "or-IN", "name": "Odia"},
    {"code": "pa-IN", "name": "Punjabi"},
    {"code": "sa-IN", "name": "Sanskrit"},
    {"code": "sat-IN", "name": "Santali"},
    {"code": "sd-IN", "name": "Sindhi"},
    {"code": "ta-IN", "name": "Tamil"},
    {"code": "te-IN", "name": "Telugu"},
    {"code": "ur-IN", "name": "Urdu"},
]

ADMIN_LANGUAGES = [{"code": "en-IN", "name": "English"}]

DIALECT_ALIASES = {
    "bhojpuri": "hi-IN",
    "awadhi": "hi-IN",
    "haryanvi": "hi-IN",
    "marwari": "hi-IN",
    "bundeli": "hi-IN",
    "chhattisgarhi": "hi-IN",
    "magahi": "hi-IN",
    "braj": "hi-IN",
    "sylheti": "bn-IN",
    "rangpuri": "bn-IN",
    "varhadi": "mr-IN",
    "dakhni": "ur-IN",
    "majhi": "pa-IN",
    "doabi": "pa-IN",
    "malwai": "pa-IN",
}


def normalize_language(code: str | None) -> str:
    if not code:
        return LanguageCode.HI.value
    lowered = code.strip()
    if lowered in {item["code"] for item in LANGUAGE_CATALOG + ADMIN_LANGUAGES}:
        return lowered
    return DIALECT_ALIASES.get(lowered.lower(), LanguageCode.HI.value)
