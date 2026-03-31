"""POST /sensitivity – parametric sensitivity analysis."""
from __future__ import annotations

from typing import Any, Dict, List

import numpy as np
from fastapi import APIRouter, HTTPException

from app.models.schemas import SensitivityRequest
from app.solver import solver, RodInput

router = APIRouter(prefix="/sensitivity", tags=["Sensitivity"])


@router.post("", response_model=Dict[str, Any])
async def sensitivity_analysis(payload: SensitivityRequest):
    """
    Sweep the area of one rod and return how stress in every rod changes.

    - **rod_index**: Which rod's area to vary (0-based)
    - **variation**: ±fraction around nominal (e.g. 0.5 → ±50%)
    - **steps**: Number of sample points
    """
    if payload.rod_index >= len(payload.rods):
        raise HTTPException(
            status_code=422,
            detail=f"rod_index {payload.rod_index} out of range for {len(payload.rods)} rods.",
        )

    rod_inputs = [
        RodInput(name=r.name, area=r.area, modulus=r.modulus, material=r.material)
        for r in payload.rods
    ]

    pivot_rod = rod_inputs[payload.rod_index]
    areas = np.linspace(
        pivot_rod.area * (1 - payload.variation),
        pivot_rod.area * (1 + payload.variation),
        payload.steps,
    ).tolist()

    series: Dict[str, List] = {r.name: [] for r in rod_inputs}
    x_labels: List[float] = []

    for a in areas:
        modified = list(rod_inputs)
        f_a = float(a)
        modified[payload.rod_index] = RodInput(
            pivot_rod.name, f_a, pivot_rod.modulus, pivot_rod.material
        )
        try:
            res = solver.solve(modified, payload.total_load, payload.length)
            for rod in res.rods:
                # Use standard floats
                series[rod.name].append(float(rod.stress))
        except Exception:
            for r in rod_inputs:
                series[r.name].append(None)
        x_labels.append(round(f_a, 8))

    return {
        "x_axis_label": f"Area of {pivot_rod.name} [m²]",
        "y_axis_label": "Stress [Pa]",
        "x": x_labels,
        "series": series,
    }
