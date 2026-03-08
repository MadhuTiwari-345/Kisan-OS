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


def _register_user(
    client: TestClient,
    *,
    phone: str,
    name: str,
    email: str,
    role: str,
    password: str = "password123",
):
    response = client.post(
        "/api/auth/register",
        json={
            "phone": phone,
            "name": name,
            "email": email,
            "password": password,
            "language": "hi-IN",
            "role": role,
            "location": "Karnal",
            "company_name": "FreshRoute Traders" if role == "buyer" else None,
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["access_token"]
    return payload


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_auth_register_login_and_profile_flow(client: TestClient):
    registered = _register_user(
        client,
        phone="7000000001",
        name="Ravi Kumar",
        email="ravi@example.com",
        role="farmer",
    )

    assert registered["user"]["role"] == "farmer"
    assert registered["user"]["language"] == "hi-IN"

    profile_response = client.get(
        "/api/auth/profile",
        headers=_auth_headers(registered["access_token"]),
    )
    assert profile_response.status_code == 200, profile_response.text
    profile = profile_response.json()
    assert profile["phone"] == "7000000001"
    assert profile["name"] == "Ravi Kumar"

    login_response = client.post(
        "/api/auth/login",
        data={"username": "ravi@example.com", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200, login_response.text
    logged_in = login_response.json()
    assert logged_in["user"]["id"] == registered["user"]["id"]
    assert logged_in["user"]["email"] == "ravi@example.com"


def test_bid_accept_order_history_and_payment_flow(client: TestClient):
    farmer = _register_user(
        client,
        phone="7000000002",
        name="Farmer One",
        email="farmer.one@example.com",
        role="farmer",
    )
    buyer = _register_user(
        client,
        phone="7000000003",
        name="Buyer One",
        email="buyer.one@example.com",
        role="buyer",
    )

    listing_response = client.post(
        "/api/listings",
        json={
            "crop_name": "onion",
            "category": "vegetable",
            "season": "rabi",
            "quantity_kg": 1200,
            "price_per_kg": 21.5,
            "mandi_name": "Azadpur Mandi",
            "location": "Karnal",
        },
        headers=_auth_headers(farmer["access_token"]),
    )
    assert listing_response.status_code == 200, listing_response.text
    listing = listing_response.json()

    bid_response = client.post(
        f"/api/listings/{listing['id']}/bids",
        json={
            "quantity_kg": 500,
            "bid_price_per_kg": 22.0,
            "note": "Fast pickup required",
        },
        headers=_auth_headers(buyer["access_token"]),
    )
    assert bid_response.status_code == 200, bid_response.text
    bid = bid_response.json()
    assert bid["status"] == "open"

    bids_response = client.get(
        f"/api/listings/{listing['id']}/bids",
        headers=_auth_headers(farmer["access_token"]),
    )
    assert bids_response.status_code == 200, bids_response.text
    bids_payload = bids_response.json()
    assert bids_payload["total"] == 1
    assert bids_payload["items"][0]["id"] == bid["id"]

    accept_response = client.post(
        f"/api/listings/{listing['id']}/bids/{bid['id']}/accept",
        headers=_auth_headers(farmer["access_token"]),
    )
    assert accept_response.status_code == 200, accept_response.text
    accepted = accept_response.json()
    order_id = accepted["order"]["id"]
    assert accepted["accepted_bid"]["status"] == "accepted"
    assert accepted["order"]["payment_status"] == "pending"

    order_history_response = client.get(
        f"/api/orders/user/{buyer['user']['id']}",
        headers=_auth_headers(buyer["access_token"]),
    )
    assert order_history_response.status_code == 200, order_history_response.text
    order_history = order_history_response.json()
    assert order_history["total"] >= 1
    assert any(order["id"] == order_id for order in order_history["items"])

    payment_response = client.post(
        f"/api/orders/{order_id}/pay",
        json={"payment_method": "upi"},
        headers=_auth_headers(buyer["access_token"]),
    )
    assert payment_response.status_code == 200, payment_response.text
    payment = payment_response.json()
    assert payment["order"]["payment_status"] == "paid"
    assert payment["transaction"]["status"] == "success"
    assert payment["transaction"]["payment_method"] == "upi"

    order_detail_response = client.get(
        f"/api/orders/{order_id}",
        headers=_auth_headers(buyer["access_token"]),
    )
    assert order_detail_response.status_code == 200, order_detail_response.text
    order_detail = order_detail_response.json()
    assert order_detail["order"]["id"] == order_id
    assert len(order_detail["transactions"]) == 1
    assert order_detail["transactions"][0]["status"] == "success"
