from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Boolean, DateTime, Integer, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from db.database import Base


class Trend(Base):
    __tablename__ = "trends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    keyword: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)  # google / tiktok / pinterest

    # Groq fast scoring
    score_groq: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pod_viability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    competition_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # low/medium/high
    ip_safe: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    product_suggestions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    score_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Claude deep analysis (7+ scores only)
    deep_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    design_brief: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_audience: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Raw data
    interest_over_time: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Temporal tracking (smart caching)
    last_scraped_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    scrape_count: Mapped[int] = mapped_column(Integer, default=1)
    last_scored_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_analyzed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    days_trending: Mapped[int] = mapped_column(Integer, default=0)

    # Trend momentum
    trend_velocity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # rising/stable/declining
    peak_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    peak_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Search interest metrics (from Google Trends)
    avg_interest: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 0-100
    interest_peak: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    interest_delta: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # % change

    # Temporal context
    temporal_tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # ["Q1", "valentine", "evergreen"]
    emoji_tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "💪 Motivational"
    urgency: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # urgent/plan_ahead/evergreen

    # Cost tracking
    scoring_cost: Mapped[float] = mapped_column(Float, default=0.0)
    analysis_cost: Mapped[float] = mapped_column(Float, default=0.0)
    total_api_cost: Mapped[float] = mapped_column(Float, default=0.0)

    # Validation & status
    validation_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # proven_seller/untested
    archived: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)  # etsy / shopify
    external_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")
    views: Mapped[int] = mapped_column(Integer, default=0)
    favorites: Mapped[int] = mapped_column(Integer, default=0)
    sales: Mapped[int] = mapped_column(Integer, default=0)
    revenue: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    external_order_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    product_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    variant: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    revenue: Mapped[float] = mapped_column(Float, default=0.0)
    printful_cost: Mapped[float] = mapped_column(Float, default=0.0)
    profit: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
