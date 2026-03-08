from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.models import Bid, BidStatus, Buyer, CropListing, Farmer, Order, UserRole


router = APIRouter()


class ListingCreateRequest(BaseModel):
    crop_name: str
    category: str | None = None
    season: str | None = None
    quantity_kg: float = Field(gt=0)
    price_per_kg: float = Field(gt=0)
    mandi_name: str
    location: str | None = None


class ListingUpdateRequest(BaseModel):
    quantity_kg: float | None = Field(default=None, gt=0)
    price_per_kg: float | None = Field(default=None, gt=0)
    status: str | None = None
    mandi_name: str | None = None


class BidCreateRequest(BaseModel):
    quantity_kg: float = Field(gt=0)
    bid_price_per_kg: float = Field(gt=0)
    note: str | None = Field(default=None, max_length=300)


def _serialize_listing(listing: CropListing) -> dict:
    return {
        "id": listing.id,
        "farmer_id": listing.farmer_id,
        "crop_name": listing.crop_name,
        "category": listing.category,
        "season": listing.season,
        "quantity_kg": listing.quantity_kg,
        "price_per_kg": listing.price_per_kg,
        "total_value": round(listing.quantity_kg * listing.price_per_kg, 2),
        "mandi_name": listing.mandi_name,
        "location": listing.location,
        "status": listing.status,
        "created_at": listing.created_at,
        "updated_at": listing.updated_at,
    }


def _serialize_bid(bid: Bid) -> dict:
    return {
        "id": bid.id,
        "listing_id": bid.listing_id,
        "bidder_user_id": bid.bidder_user_id,
        "buyer_id": bid.buyer_id,
        "quantity_kg": bid.quantity_kg,
        "bid_price_per_kg": bid.bid_price_per_kg,
        "total_amount": round(bid.quantity_kg * bid.bid_price_per_kg, 2),
        "note": bid.note,
        "status": bid.status.value if hasattr(bid.status, "value") else str(bid.status),
        "created_at": bid.created_at,
        "updated_at": bid.updated_at,
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


@router.get("")
async def list_listings(
    crop: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(CropListing).order_by(CropListing.created_at.desc())
    if crop:
        query = query.where(CropListing.crop_name == crop.lower())
    if status:
        query = query.where(CropListing.status == status)
    listings = (await db.execute(query)).scalars().all()
    return {"items": [_serialize_listing(listing) for listing in listings], "total": len(listings)}


@router.post("")
async def create_listing(
    payload: ListingCreateRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {UserRole.FARMER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only farmers can create listings")
    listing = CropListing(
        farmer_id=current_user.id,
        crop_name=payload.crop_name.lower(),
        category=payload.category,
        season=payload.season,
        quantity_kg=payload.quantity_kg,
        price_per_kg=payload.price_per_kg,
        mandi_name=payload.mandi_name,
        location=payload.location or current_user.location,
        status="active",
        updated_at=datetime.utcnow(),
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return _serialize_listing(listing)


@router.put("/{listing_id}")
async def update_listing(
    listing_id: int,
    payload: ListingUpdateRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = (await db.execute(select(CropListing).where(CropListing.id == listing_id))).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if current_user.role != UserRole.ADMIN and listing.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(listing, key, value)
    listing.updated_at = datetime.utcnow()
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return _serialize_listing(listing)


@router.delete("/{listing_id}")
async def delete_listing(
    listing_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = (await db.execute(select(CropListing).where(CropListing.id == listing_id))).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if current_user.role != UserRole.ADMIN and listing.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.delete(listing)
    await db.commit()
    return {"deleted": True, "listing_id": listing_id}


@router.post("/{listing_id}/bids")
async def create_bid(
    listing_id: int,
    payload: BidCreateRequest,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {UserRole.BUYER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only buyers can place bids")
    listing = (await db.execute(select(CropListing).where(CropListing.id == listing_id))).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Listing is not accepting bids")
    if payload.quantity_kg > listing.quantity_kg:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds listing stock")

    buyer = await _resolve_buyer_profile(current_user, db)
    bid = Bid(
        listing_id=listing.id,
        bidder_user_id=current_user.id,
        buyer_id=buyer.id if buyer else None,
        quantity_kg=payload.quantity_kg,
        bid_price_per_kg=payload.bid_price_per_kg,
        note=payload.note,
        status=BidStatus.OPEN,
        updated_at=datetime.utcnow(),
    )
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return _serialize_bid(bid)


@router.get("/{listing_id}/bids")
async def list_bids(
    listing_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = (await db.execute(select(CropListing).where(CropListing.id == listing_id))).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    query = select(Bid).where(Bid.listing_id == listing_id).order_by(Bid.created_at.desc())
    if current_user.role != UserRole.ADMIN and current_user.id != listing.farmer_id:
        query = query.where(Bid.bidder_user_id == current_user.id)
    bids = (await db.execute(query)).scalars().all()
    return {"items": [_serialize_bid(bid) for bid in bids], "total": len(bids)}


@router.post("/{listing_id}/bids/{bid_id}/accept")
async def accept_bid(
    listing_id: int,
    bid_id: int,
    current_user: Farmer = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = (await db.execute(select(CropListing).where(CropListing.id == listing_id))).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if current_user.role != UserRole.ADMIN and listing.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    bid = (
        (await db.execute(select(Bid).where(Bid.id == bid_id, Bid.listing_id == listing_id)))
        .scalars()
        .first()
    )
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    if bid.status != BidStatus.OPEN:
        raise HTTPException(status_code=400, detail="Bid is not open")
    if bid.quantity_kg > listing.quantity_kg:
        raise HTTPException(status_code=400, detail="Listing no longer has enough quantity")

    buyer = None
    if bid.buyer_id:
        buyer = (await db.execute(select(Buyer).where(Buyer.id == bid.buyer_id))).scalars().first()

    order = Order(
        buyer_id=bid.buyer_id,
        buyer_name=buyer.company_name if buyer else f"Buyer {bid.bidder_user_id}",
        listing_id=listing.id,
        farmer_id=listing.farmer_id,
        quantity_kg=bid.quantity_kg,
        price_per_kg=bid.bid_price_per_kg,
        total_amount=round(bid.quantity_kg * bid.bid_price_per_kg, 2),
        payment_status="pending",
        fulfillment_status="confirmed",
        updated_at=datetime.utcnow(),
    )
    listing.quantity_kg = round(listing.quantity_kg - bid.quantity_kg, 2)
    listing.updated_at = datetime.utcnow()
    if listing.quantity_kg <= 0:
        listing.status = "sold"
    bid.status = BidStatus.ACCEPTED
    bid.updated_at = datetime.utcnow()

    db.add(order)
    db.add(listing)
    db.add(bid)
    await db.commit()
    await db.refresh(order)

    if listing.status == "sold":
        remaining_bids = (
            (await db.execute(select(Bid).where(Bid.listing_id == listing_id, Bid.status == BidStatus.OPEN)))
            .scalars()
            .all()
        )
        for open_bid in remaining_bids:
            open_bid.status = BidStatus.REJECTED
            open_bid.updated_at = datetime.utcnow()
            db.add(open_bid)
        await db.commit()

    return {
        "accepted_bid": _serialize_bid(bid),
        "order": {
            "id": order.id,
            "listing_id": order.listing_id,
            "buyer_id": order.buyer_id,
            "buyer_name": order.buyer_name,
            "quantity_kg": order.quantity_kg,
            "price_per_kg": order.price_per_kg,
            "total_amount": order.total_amount,
            "payment_status": order.payment_status,
            "fulfillment_status": order.fulfillment_status,
        },
        "listing": _serialize_listing(listing),
    }
