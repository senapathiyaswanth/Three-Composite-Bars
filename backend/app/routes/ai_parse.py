"""
POST /ai/parse – Convert natural language problem to structured input.

Primary strategy: rule-based regex extraction (no external API needed).
Fallback: OpenAI GPT if OPENAI_API_KEY is set in environment.
"""
from __future__ import annotations

import json
import os
import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from app.models.schemas import NLParseRequest, NLParseResponse, RodIn
from app.routes.materials import MATERIALS_MAP

router = APIRouter(prefix="/ai", tags=["AI Parser"])

# Recognised material keywords (lowercase)
MATERIAL_KEYWORDS = {m.lower(): m for m in MATERIALS_MAP}


def _find_number(text: str, before_keyword: str) -> Optional[float]:
    """Extract a float that appears before or after `before_keyword`."""
    pattern = rf"([\d.]+(?:e[+-]?\d+)?)\s*{re.escape(before_keyword)}"
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    # also try keyword followed by number
    pattern2 = rf"{re.escape(before_keyword)}\s*(?:is|=|:)?\s*([\d.]+(?:e[+-]?\d+)?)"
    m2 = re.search(pattern2, text, re.IGNORECASE)
    if m2:
        return float(m2.group(1))
    return None


def _parse_regex(text: str) -> NLParseResponse:
    """Best-effort regex parser – no API calls required."""
    text_lower = text.lower()

    # ── Total load ──
    total_load: Optional[float] = None
    m = re.search(r"([\d,.]+)\s*k?n\b", text_lower)
    if m:
        val = float(m.group(1).replace(",", ""))
        total_load = val * 1000 if "kn" in text_lower[m.start():m.end()] else val

    # ── Length ──
    length: Optional[float] = None
    m = re.search(r"([\d.]+)\s*m(?:etre|eter|m)?\b", text_lower)
    if m:
        length = float(m.group(1))
    else:
        m = re.search(r"([\d.]+)\s*mm\b", text_lower)
        if m:
            length = float(m.group(1)) / 1000.0

    # ── Detect materials mentioned ──
    found_materials: List[str] = []
    for kw, canonical in MATERIAL_KEYWORDS.items():
        if kw in text_lower:
            found_materials.append(canonical)

    # ── Build rod list ──
    rods: List[RodIn] = []
    for i, mat in enumerate(found_materials):
        preset = MATERIALS_MAP.get(mat)
        modulus = preset.modulus if preset else 200e9
        # Look for area hints like "20 mm²" or "0.002 m²"
        area: float = 1e-4  # default 100mm²
        rods.append(
            RodIn(
                name=f"Rod {i+1}",
                material=mat,
                area=area,
                modulus=modulus,
            )
        )

    confidence = "high" if (total_load and length and len(rods) >= 2) else "medium" if rods else "low"

    return NLParseResponse(
        total_load=total_load,
        length=length,
        rods=rods,
        raw_text=text,
        confidence=confidence,
    )


async def _parse_openai(text: str) -> NLParseResponse:
    """Use OpenAI GPT-4o-mini to extract structured input from free text."""
    import httpx

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    system_prompt = (
        "You are an engineering assistant. Extract composite bar problem parameters "
        "from the user's text and return ONLY valid JSON with keys: "
        "total_load (float, N), length (float, m), rods (array of {name, material, area, modulus})."
    )

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    raw = data["choices"][0]["message"]["content"]
    parsed = json.loads(raw)

    rods = [
        RodIn(
            name=r.get("name", f"Rod {i+1}"),
            material=r.get("material", "Custom"),
            area=float(r.get("area", 1e-4)),
            modulus=float(r.get("modulus", 200e9)),
        )
        for i, r in enumerate(parsed.get("rods", []))
    ]

    return NLParseResponse(
        total_load=parsed.get("total_load"),
        length=parsed.get("length"),
        rods=rods,
        raw_text=text,
        confidence="high",
    )


@router.post("/parse", response_model=NLParseResponse)
async def parse_natural_language(req: NLParseRequest):
    """
    Parse a natural-language composite bar problem description.

    Example:
    > "Three rods – copper, steel, aluminum – each 1 m long, total load 150 kN"
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key:
        try:
            return await _parse_openai(req.text)
        except Exception:
            pass  # fall through to regex

    return _parse_regex(req.text)
