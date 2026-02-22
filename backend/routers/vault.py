"""
Design Vault Router — persist & manage AI-generated design ideas.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from db.models import SavedDesign

router = APIRouter(prefix="/vault", tags=["Vault"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class SaveDesignRequest(BaseModel):
    niche: str
    title: str
    concept: Optional[str] = None
    design_text: Optional[str] = None
    product_type: Optional[str] = None
    style_preference: Optional[str] = "Balanced"
    demand_score: Optional[float] = None
    elements: Optional[List[str]] = None
    mockup_url: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str  # draft | ready | exported


class UpdateListingRequest(BaseModel):
    listing_title: Optional[str] = None
    listing_description: Optional[str] = None
    listing_tags: Optional[List[str]] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
def list_vault(
    niche: Optional[str] = None,
    status: Optional[str] = None,
    style: Optional[str] = None,
    product_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all saved designs, with optional filters."""
    q = db.query(SavedDesign)
    if niche:
        q = q.filter(SavedDesign.niche.ilike(f"%{niche}%"))
    if status:
        q = q.filter(SavedDesign.status == status)
    if style:
        q = q.filter(SavedDesign.style_preference == style)
    if product_type:
        q = q.filter(SavedDesign.product_type.ilike(f"%{product_type}%"))
    designs = q.order_by(SavedDesign.created_at.desc()).limit(limit).all()
    return [_serialize(d) for d in designs]


@router.get("/stats")
def vault_stats(db: Session = Depends(get_db)):
    """Summary stats for the vault."""
    total = db.query(func.count(SavedDesign.id)).scalar()
    by_status = (
        db.query(SavedDesign.status, func.count(SavedDesign.id))
        .group_by(SavedDesign.status)
        .all()
    )
    top_niches = (
        db.query(SavedDesign.niche, func.count(SavedDesign.id).label("count"))
        .group_by(SavedDesign.niche)
        .order_by(func.count(SavedDesign.id).desc())
        .limit(5)
        .all()
    )
    return {
        "total": total,
        "by_status": {row[0]: row[1] for row in by_status},
        "top_niches": [{"niche": r[0], "count": r[1]} for r in top_niches],
    }


@router.post("", status_code=201)
def save_design(body: SaveDesignRequest, db: Session = Depends(get_db)):
    """Save a design idea to the vault."""
    design = SavedDesign(
        niche=body.niche,
        title=body.title,
        concept=body.concept,
        design_text=body.design_text,
        product_type=body.product_type,
        style_preference=body.style_preference,
        demand_score=body.demand_score,
        elements=body.elements,
        mockup_url=body.mockup_url,
        status="draft",
    )
    db.add(design)
    db.commit()
    db.refresh(design)
    print(f"[Vault] Saved design: {design.title} (id={design.id})")
    return _serialize(design)


@router.patch("/{design_id}/status")
def update_status(design_id: int, body: UpdateStatusRequest, db: Session = Depends(get_db)):
    """Update the workflow status of a design."""
    design = db.query(SavedDesign).filter(SavedDesign.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if body.status not in ("draft", "ready", "exported"):
        raise HTTPException(status_code=400, detail="status must be draft | ready | exported")
    design.status = body.status
    design.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(design)
    return _serialize(design)


@router.patch("/{design_id}/listing")
def update_listing(design_id: int, body: UpdateListingRequest, db: Session = Depends(get_db)):
    """Store generated listing copy onto a saved design."""
    design = db.query(SavedDesign).filter(SavedDesign.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if body.listing_title is not None:
        design.listing_title = body.listing_title
    if body.listing_description is not None:
        design.listing_description = body.listing_description
    if body.listing_tags is not None:
        design.listing_tags = body.listing_tags
    design.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(design)
    return _serialize(design)


@router.delete("/{design_id}", status_code=204)
def delete_design(design_id: int, db: Session = Depends(get_db)):
    """Delete a design from the vault."""
    design = db.query(SavedDesign).filter(SavedDesign.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    db.delete(design)
    db.commit()
    print(f"[Vault] Deleted design id={design_id}")
    return None


# ── Helper ────────────────────────────────────────────────────────────────────

def _serialize(d: SavedDesign) -> dict:
    return {
        "id": d.id,
        "niche": d.niche,
        "title": d.title,
        "concept": d.concept,
        "design_text": d.design_text,
        "product_type": d.product_type,
        "style_preference": d.style_preference,
        "demand_score": d.demand_score,
        "elements": d.elements or [],
        "mockup_url": d.mockup_url,
        "listing_title": d.listing_title,
        "listing_description": d.listing_description,
        "listing_tags": d.listing_tags or [],
        "status": d.status,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }
