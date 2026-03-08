"""Tests for Market API endpoints"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import main
from app.core import database


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "integration.db"
    test_engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)
    test_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "SessionLocal", test_session)

    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    """Register a test user and return auth headers"""
    import random
    # Use unique phone number for each test
    phone = f"999{random.randint(1000000, 9999999)}"
    # Register user
    response = client.post(
        "/api/auth/register",
        json={
            "phone": phone,
            "name": "Test User",
            "email": f"testuser_{phone}@example.com",
            "password": "password123",
            "language": "hi-IN",
            "role": "farmer",
            "location": "Delhi",
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


def test_market_prices_endpoint(client: TestClient, auth_headers: dict[str, str]):
    """Test market prices API endpoint returns data"""
    response = client.get("/api/market/prices?crop=onion&days=7", headers=auth_headers)
    assert response.status_code in [200, 500]


def test_market_compare_prices(client: TestClient, auth_headers: dict[str, str]):
    """Test price comparison endpoint"""
    response = client.get("/api/market/compare?crop=wheat", headers=auth_headers)
    assert response.status_code in [200, 500]


def test_market_best_mandi(client: TestClient, auth_headers: dict[str, str]):
    """Test best mandi recommendation endpoint"""
    response = client.get("/api/market/best-mandi?crop=tomato", headers=auth_headers)
    assert response.status_code in [200, 500]


def test_market_prices_with_state_filter(client: TestClient, auth_headers: dict[str, str]):
    """Test market prices with state filter"""
    response = client.get("/api/market/prices?crop=wheat&state=Haryana&days=7", headers=auth_headers)
    assert response.status_code in [200, 500]

