from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import register_routes
from app.core.config import settings
from app.core.database import check_db_connection, close_db, init_db
from app.core.languages import LANGUAGE_CATALOG


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "languages": len(LANGUAGE_CATALOG),
        "features": [
            "auth",
            "farm-management",
            "crop-marketplace",
            "bidding",
            "digital-transactions",
            "voice",
            "advisory",
            "market",
            "price-prediction",
            "demand-forecasting",
            "logistics",
            "analytics-dashboard",
            "offline-first",
        ],
    }


@app.get("/health")
async def health():
    db_ok = await check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.utcnow(),
        "services": {
            "database": "operational" if db_ok else "down",
            "voice": "operational",
            "market": "operational",
            "advisory": "operational",
            "logistics": "operational",
        },
    }


register_routes(app)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
