"""
KISAN-OS Services
External service integrations
"""

from app.services.agmarknet import AgmarknetService, agmarknet_service, get_agmarknet_service

__all__ = [
    "AgmarknetService",
    "agmarknet_service",
    "get_agmarknet_service",
]

