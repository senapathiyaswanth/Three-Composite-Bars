"""GET /materials – return built-in material library."""
from fastapi import APIRouter
from typing import List
from app.models.schemas import MaterialOut

router = APIRouter(prefix="/materials", tags=["Materials"])

# Built-in material presets (modulus in Pa, density in kg/m³)
MATERIALS: List[MaterialOut] = [
    MaterialOut(name="Steel",     modulus=200e9, density=7850, color="#4B7BEC"),
    MaterialOut(name="Aluminum",  modulus=80e9,  density=2700, color="#06B6D4"),
    MaterialOut(name="Copper",    modulus=130e9, density=8960, color="#E17055"),
    MaterialOut(name="Zinc",      modulus=100e9, density=7133, color="#7B7B7B"),
    MaterialOut(name="Brass",     modulus=100e9, density=8500, color="#F9CA24"),
    MaterialOut(name="Titanium",  modulus=116e9, density=4510, color="#A29BFE"),
    MaterialOut(name="Cast Iron", modulus=170e9, density=7200, color="#636E72"),
    MaterialOut(name="Concrete",  modulus=30e9,  density=2400, color="#B2BEC3"),
    MaterialOut(name="Carbon Fiber", modulus=181e9, density=1600, color="#2D3436"),
]

MATERIALS_MAP = {m.name: m for m in MATERIALS}


@router.get("", response_model=List[MaterialOut])
async def list_materials():
    """Return all predefined engineering materials."""
    return MATERIALS
