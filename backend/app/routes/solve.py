"""POST /solve – compute composite bar solution."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status

from app.models.database import get_db
from app.models.schemas import SolveRequest, SolveResponse, RodResultOut
from app.solver import solver, RodInput

router = APIRouter(prefix="/solve", tags=["Solver"])


def _rod_input(r) -> RodInput:
    return RodInput(name=r.name, area=r.area, modulus=r.modulus, material=r.material, density=r.density)


@router.post("", response_model=SolveResponse, status_code=status.HTTP_200_OK)
async def solve_composite_bar(payload: SolveRequest) -> SolveResponse:
    """
    Solve a parallel composite bar problem.

    - **total_load**: Total axial load applied [N]
    - **length**: Common length of all rods [m]
    - **rods**: List of rod definitions (name, material, area, modulus)
    - **save**: Optionally persist result to MongoDB
    """
    try:
        rod_inputs = [_rod_input(r) for r in payload.rods]
        result = solver.solve(rod_inputs, payload.total_load, payload.length)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        # Catch-all to prevent generic 500 without details
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Solver Error: {str(exc)}") from exc

    rod_outs = [
        RodResultOut(
            name=r.name,
            material=r.material,
            area=r.area,
            modulus=r.modulus,
            load=r.load,
            stress=r.stress,
            strain=r.strain,
            deformation=r.deformation,
            mass=r.mass,
        )
        for r in result.rods
    ]

    timestamp = datetime.now(tz=timezone.utc)
    doc_id: str | None = None

    if payload.save:
        try:
            db = get_db()
            # Explicitly ensure everything is a standard Python type
            doc: Dict[str, Any] = {
                "total_load": float(result.total_load),
                "length": float(result.length),
                "common_deformation": float(result.common_deformation),
                "rods_input": [r.model_dump() for r in payload.rods],
                "rods_result": [r.model_dump() for r in rod_outs],
                "steps": result.steps,
                "sensitivity": result.sensitivity,
                "timestamp": timestamp,
            }
            ins = await db["problems"].insert_one(doc)
            doc_id = str(ins.inserted_id)
        except Exception as exc:
            print(f"Database error during save: {exc}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database connection error: {str(exc)}"
            )

    return SolveResponse(
        id=doc_id,
        total_load=result.total_load,
        length=result.length,
        common_deformation=result.common_deformation,
        rods=rod_outs,
        steps=result.steps,
        sensitivity=result.sensitivity,
        timestamp=timestamp,
    )
