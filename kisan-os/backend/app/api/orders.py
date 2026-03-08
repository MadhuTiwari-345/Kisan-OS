from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.models import Buyer, CropListing, Farmer, Order, PaymentTransaction, TransactionStatus, UserRole


router = APIRouter()


class OrderCreateRequest(BaseModel):
    listing_id: int
    quantity_kg: float = Field(gt=0)


class PaymentRequest(BaseModel):
    payment_method: str = "upi"
    transaction_reference: str | None = None


def _serialize_order(order: Order) -> dict:
    return {
        "id": order.id,
        "buyer_id": order.buyer_id,
        "buyer_name": order.buyer_name,
        "listing_id": order.listing_id,
        "farmer_id": order.farmer_id,
        "quantity_kg": order.quantity_kg,
        "price_per_kg": order.price_per_kg,
        "total_amount": order.total_amount,
        "payment_status": order.payment_status,
        "fulfillment_status": order.fulfillment_status,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


def _serialize_transaction(transaction: PaymentTransaction) -> dict:
    return {
        "id": transaction.id,
        "order_id": transaction.order_id,
        "payer_user_id": transaction.payer_user_id,
        "payee_farmer_id": transaction.payee_farmer_id,
        "amount": transaction.amount,
        "payment_method": transaction.payment_method,
        "transaction_reference": transaction.transaction_reference,
        "status": transaction.status.value if hasattr(transaction.status, "value") else str(transaction.status),
        "transparency_payload": transaction.transparency_payload,
        "created_at": transaction.created_at,
    }


async def _resolve_buyer_profile(current_user: Farmer, db: AsyncSession) -> Buyer | None:
    buyer = (
        (
            await db.execute(
                select(Buyer).where((Buyer.phone == current_user.phone) | (Buyer.email == current_user.email))
            )
        )
        .scalars()
        .first()
    )
    if buyer or current_user.role != UserRole.BUYER:
        return buyer

    buyer = Buyer(
        company_name=f"{current_user.name} Trading",
        contact_name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        location=current_user.location or "Not set",
        verified=True,
    )
    db.add(buyer)
    await db.commit()
    await db.refresh(buyer)
    return buyer


async def _current_buyer_id(current_user: Farmer, db: AsyncSession) -> int | None:
    buyer = await _resolve_buyer_profile(current_user, db)
    return buyer.id if buyer else None


@router.post("")
async def create_order(
    payload: OrderCreateRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {UserRole.BUYER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only buyers can place orders")
    listing = (await db.execute(select(CropListing).where(CropListing.id == payload.listing_id))).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Listing is not available for purchase")
    if payload.quantity_kg > listing.quantity_kg:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds listing stock")

    buyer = await _resolve_buyer_profile(current_user, db)
    if not buyer and current_user.role == UserRole.ADMIN:
        buyer = (await db.execute(select(Buyer).order_by(Buyer.created_at.asc()))).scalars().first()

    order = Order(
        buyer_id=buyer.id if buyer else None,
        buyer_name=buyer.company_name if buyer else current_user.name,
        listing_id=listing.id,
        farmer_id=listing.farmer_id,
        quantity_kg=payload.quantity_kg,
        price_per_kg=listing.price_per_kg,
        total_amount=round(payload.quantity_kg * listing.price_per_kg, 2),
        payment_status="pending",
        fulfillment_status="confirmed",
    )
    listing.quantity_kg = round(listing.quantity_kg - payload.quantity_kg, 2)
    if listing.quantity_kg <= 0:
        listing.status = "sold"
    listing.updated_at = datetime.utcnow()
    db.add(order)
    db.add(listing)
    await db.commit()
    await db.refresh(order)
    return _serialize_order(order)


@router.get("/user/{user_id}")
async def get_orders_for_user(
    user_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    buyer_id = user_id
    if current_user.role != UserRole.ADMIN:
        buyer_id = await _current_buyer_id(current_user, db)
    else:
        user = (await db.execute(select(Farmer).where(Farmer.id == user_id))).scalars().first()
        if user and user.role == UserRole.BUYER:
            buyer = (
                (
                    await db.execute(
                        select(Buyer).where((Buyer.phone == user.phone) | (Buyer.email == user.email))
                    )
                )
                .scalars()
                .first()
            )
            buyer_id = buyer.id if buyer else buyer_id
    orders = (
        (await db.execute(select(Order).where(Order.farmer_id == user_id).order_by(Order.created_at.desc())))
        .scalars()
        .all()
    )
    if buyer_id:
        buyer_orders = (
            (await db.execute(select(Order).where(Order.buyer_id == buyer_id).order_by(Order.created_at.desc())))
            .scalars()
            .all()
        )
        order_map = {order.id: order for order in orders}
        for order in buyer_orders:
            order_map.setdefault(order.id, order)
        orders = list(order_map.values())
    return {"items": [_serialize_order(order) for order in orders], "total": len(orders)}


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    buyer_id = await _current_buyer_id(current_user, db)
    if current_user.role != UserRole.ADMIN and current_user.id != order.farmer_id and buyer_id != order.buyer_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    transactions = (
        (await db.execute(select(PaymentTransaction).where(PaymentTransaction.order_id == order.id)))
        .scalars()
        .all()
    )
    return {"order": _serialize_order(order), "transactions": [_serialize_transaction(txn) for txn in transactions]}


@router.post("/{order_id}/pay")
async def pay_for_order(
    order_id: int,
    payload: PaymentRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    buyer_id = await _current_buyer_id(current_user, db)
    if current_user.role != UserRole.ADMIN and buyer_id != order.buyer_id:
        raise HTTPException(status_code=403, detail="Only the buyer can complete payment")
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order is already paid")

    transaction = PaymentTransaction(
        order_id=order.id,
        payer_user_id=current_user.id,
        payee_farmer_id=order.farmer_id,
        amount=order.total_amount,
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference or f"TXN-{uuid4().hex[:12].upper()}",
        status=TransactionStatus.SUCCESS,
        transparency_payload={
            "order_id": order.id,
            "listing_id": order.listing_id,
            "buyer_id": order.buyer_id,
            "farmer_id": order.farmer_id,
            "paid_at": datetime.utcnow().isoformat(),
            "amount_breakdown": {
                "quantity_kg": order.quantity_kg,
                "price_per_kg": order.price_per_kg,
                "total_amount": order.total_amount,
            },
        },
    )
    order.payment_status = "paid"
    order.updated_at = datetime.utcnow()
    db.add(transaction)
    db.add(order)
    await db.commit()
    await db.refresh(transaction)
    await db.refresh(order)
    return {"order": _serialize_order(order), "transaction": _serialize_transaction(transaction)}
