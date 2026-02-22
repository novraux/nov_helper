"""
Novraux Backend — FastAPI entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables
from routers import trends, seo, orders, research
from routers import shopify as shopify_router

app = FastAPI(
    title="Novraux API",
    description="POD automation backend — trend research, SEO generation, order management",
    version="1.0.0",
)

# CORS — allow the local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables on startup
@app.on_event("startup")
def on_startup():
    create_tables()
    print("[Novraux] Database tables ready.")


# Health check
@app.get("/health")
def health():
    return {"status": "ok", "service": "novraux-backend"}


# Routers
app.include_router(trends.router)
app.include_router(seo.router)
app.include_router(orders.router)
app.include_router(research.router)
app.include_router(shopify_router.router)
