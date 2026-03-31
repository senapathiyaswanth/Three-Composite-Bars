"""GET /history  +  POST /save routes."""
from __future__ import annotations

from typing import List

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status

from app.models.database import get_db
from app.models.schemas import HistoryItem, SolveResponse, RodResultOut

router = APIRouter(tags=["History"])


@router.get("/history", response_model=List[HistoryItem])
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    """Return a paginated list of previously solved problems."""
    try:
        db = get_db()
        cursor = db["problems"].find(
            {},
            {"total_load": 1, "length": 1, "rods_result": 1, "timestamp": 1},
        ).sort("timestamp", -1).skip(skip).limit(limit)

        items = []
        async for doc in cursor:
            items.append(
                HistoryItem(
                    id=str(doc["_id"]),
                    total_load=doc["total_load"],
                    length=doc["length"],
                    rod_count=len(doc.get("rods_result", [])),
                    timestamp=doc["timestamp"],
                )
            )
        return items
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(exc)}"
        )


@router.get("/history/{problem_id}", response_model=SolveResponse)
async def get_problem(problem_id: str):
    """Return full detail for a saved problem."""
    try:
        db = get_db()
        oid = ObjectId(problem_id)
        doc = await db["problems"].find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Problem not found")

        rods = [RodResultOut(**r) for r in doc["rods_result"]]
        return SolveResponse(
            id=str(doc["_id"]),
            total_load=doc["total_load"],
            length=doc["length"],
            common_deformation=doc["common_deformation"],
            rods=rods,
            steps=doc.get("steps", []),
            sensitivity=doc.get("sensitivity", {}),
            timestamp=doc["timestamp"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(exc)}"
        )


@router.delete("/history/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_problem(problem_id: str):
    """Delete a saved problem by ID."""
    try:
        db = get_db()
        oid = ObjectId(problem_id)
        result = await db["problems"].delete_one({"_id": oid})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Problem not found")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(exc)}"
        )
