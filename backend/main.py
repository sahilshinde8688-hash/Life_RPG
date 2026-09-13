from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.seeds import seed_database
from app.api import (
    auth_router, quests_router, progression_router, economy_router, ai_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Life RPG API — Gamified Personal Productivity Platform Engine",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": "Life RPG Backend",
        "version": settings.VERSION
    }

# Include all domain routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(quests_router, prefix=settings.API_V1_STR)
app.include_router(progression_router, prefix=settings.API_V1_STR)
app.include_router(economy_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
