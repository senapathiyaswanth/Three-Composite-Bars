"""
THREE COMPOSITE BARS – FastAPI application entry point.
Run with: uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.database import close_client
from app.routes.solve import router as solve_router
from app.routes.history import router as history_router
from app.routes.materials import router as materials_router
from app.routes.sensitivity import router as sensitivity_router
from app.routes.ai_parse import router as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


app = FastAPI(
    title="THREE COMPOSITE BARS API",
    description=(
        "AI-Powered Composite Bar Analyzer – solves statically indeterminate "
        "parallel composite bar systems using compatibility conditions and NumPy."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(solve_router)
app.include_router(history_router)
app.include_router(materials_router)
app.include_router(sensitivity_router)
app.include_router(ai_router)


@app.get("/", tags=["Health"])
async def health():
    return {"status": "ok", "service": "THREE COMPOSITE BARS API", "version": "1.0.0"}
