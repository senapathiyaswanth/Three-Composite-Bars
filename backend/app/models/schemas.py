"""Pydantic schemas for IntelliStruct API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# ─────────────────────────────────────────────
# Request models
# ─────────────────────────────────────────────

class RodIn(BaseModel):
    name: str = Field(..., example="Rod 1")
    material: str = Field("Custom", example="Steel")
    area: float = Field(..., gt=0, description="Cross-sectional area [m²]")
    modulus: float = Field(..., gt=0, description="Young's modulus [Pa]")
    density: float = Field(default=7850.0, description="Material density [kg/m³]")


class SolveRequest(BaseModel):
    total_load: float = Field(..., gt=0, description="Total applied load [N]")
    length: float = Field(..., gt=0, description="Common length [m]")
    rods: List[RodIn] = Field(..., min_length=1)
    save: bool = Field(False, description="Persist result to database")

    @field_validator("rods")
    @classmethod
    def at_least_one_rod(cls, v: List[RodIn]) -> List[RodIn]:
        if len(v) < 1:
            raise ValueError("Provide at least one rod.")
        return v


class SensitivityRequest(BaseModel):
    total_load: float = Field(..., gt=0)
    length: float = Field(..., gt=0)
    rods: List[RodIn] = Field(..., min_length=1)
    rod_index: int = Field(0, ge=0, description="Index of rod whose area is swept")
    variation: float = Field(0.5, ge=0.05, le=0.95)
    steps: int = Field(20, ge=5, le=100)


class NLParseRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Natural language problem description")


# ─────────────────────────────────────────────
# Response models
# ─────────────────────────────────────────────

class RodResultOut(BaseModel):
    name: str
    material: str
    area: float
    modulus: float
    load: float
    stress: float
    strain: float
    deformation: float
    mass: float


class SolveResponse(BaseModel):
    id: Optional[str] = None
    total_load: float
    length: float
    common_deformation: float
    rods: List[RodResultOut]
    steps: List[str]
    sensitivity: Dict[str, Any]
    timestamp: Optional[datetime] = None


class HistoryItem(BaseModel):
    id: str
    total_load: float
    length: float
    rod_count: int
    timestamp: datetime


class MaterialOut(BaseModel):
    name: str
    modulus: float    # Pa
    density: float    # kg/m³
    color: str        # hex

class NLParseResponse(BaseModel):
    total_load: Optional[float] = None
    length: Optional[float] = None
    rods: List[RodIn] = Field(default_factory=list)
    raw_text: str
    confidence: str = "low"
