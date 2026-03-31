"""
IntelliStruct – Composite Bar Solver
=====================================
Solves statically indeterminate parallel composite bars using
compatibility conditions and linear algebra (NumPy).

Compatibility condition:
    δ₁ = δ₂ = … = δₙ   (all rods undergo the same deformation)

Where:
    δᵢ = Pᵢ · L / (Aᵢ · Eᵢ)

Equilibrium:
    ΣPᵢ = P_total

The system becomes:
    P₁/(A₁E₁) - P₂/(A₂E₂) = 0   (n-1 compatibility equations)
    P₁ + P₂ + … + Pₙ = P_total   (1 equilibrium equation)
    ────────────────────────────────
    n × n linear system  →  solved via np.linalg.solve
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import List, Dict, Any

import numpy as np


# ─────────────────────────────────────────────
# Data containers
# ─────────────────────────────────────────────

@dataclass
class RodInput:
    name: str
    area: float        # m²
    modulus: float     # Pa
    material: str = "Custom"
    density: float = 7850.0  # kg/m³


@dataclass
class RodResult:
    name: str
    material: str
    area: float
    modulus: float
    load: float        # N
    stress: float      # Pa
    strain: float      # dimensionless
    deformation: float # m
    mass: float        # kg


@dataclass
class SolverResult:
    total_load: float
    length: float
    rods: List[RodResult] = field(default_factory=list)
    common_deformation: float = 0.0
    steps: List[str] = field(default_factory=list)
    sensitivity: Dict[str, Any] = field(default_factory=dict)


# ─────────────────────────────────────────────
# Solver
# ─────────────────────────────────────────────

class CompositeSolver:
    """Solves n-rod parallel composite bar systems."""

    def _solve_core(
        self,
        rods: List[RodInput],
        total_load: float,
        length: float,
    ) -> SolverResult:
        """Run the solver WITHOUT computing sensitivity (avoids infinite recursion)."""
        return self._run(rods, total_load, length, with_sensitivity=False)

    def solve(
        self,
        rods: List[RodInput],
        total_load: float,
        length: float,
    ) -> SolverResult:
        return self._run(rods, total_load, length, with_sensitivity=True)

    def _run(
        self,
        rods: List[RodInput],
        total_load: float,
        length: float,
        with_sensitivity: bool = True,
    ) -> SolverResult:
        """Internal solver — call solve() or _solve_core() from outside."""
        n = len(rods)
        if n < 1:
            raise ValueError("At least one rod is required.")
        if total_load <= 0:
            raise ValueError("Total load must be positive.")
        if length <= 0:
            raise ValueError("Length must be positive.")

        for i, r in enumerate(rods):
            if r.area <= 0:
                raise ValueError(f"Rod {i+1} ({r.name}): area must be positive.")
            if r.modulus <= 0:
                raise ValueError(f"Rod {i+1} ({r.name}): Young's modulus must be positive.")

        # Stiffness coefficients  kᵢ = Aᵢ·Eᵢ / L
        k = np.array([r.area * r.modulus / length for r in rods], dtype=float)

        steps: List[str] = []
        steps.append(
            "### Step 1 – Compatibility Condition\n\n"
            "All rods are connected between the same rigid plates, so they must "
            "all deform by the same amount $\\delta$:\n\n"
            "$$ \\delta_1 = \\delta_2 = \\dots = \\delta_n $$\n\n"
            "Using $\\delta_i = \\frac{P_i \\cdot L}{A_i \\cdot E_i} \\implies \\frac{P_i}{k_i} = \\frac{P_j}{k_j}$ for all $i, j$."
        )

        # Build n×n linear system  A·P = b
        # Rows 0…n-2 : compatibility  P_i/k_i - P_{i+1}/k_{i+1} = 0
        # Row   n-1  : equilibrium    ΣP = P_total
        A = np.zeros((n, n), dtype=float)
        b = np.zeros(n, dtype=float)

        for i in range(n - 1):
            A[i, i]     =  1.0 / k[i]
            A[i, i + 1] = -1.0 / k[i + 1]
            b[i]        =  0.0

        A[n - 1, :] = 1.0
        b[n - 1]    = total_load

        steps.append(
            "### Step 2 – System of Equations\n"
            "**Compatibility** ($n-1$ equations):\n\n"
            + "".join(
                f"$$ \\frac{{P_{i+1}}}{{A_{i+1} \\cdot E_{i+1}}} - \\frac{{P_{i+2}}}{{A_{i+2} \\cdot E_{i+2}}} = 0 $$\n"
                for i in range(n - 1)
            )
            + f"**Equilibrium** (1 equation):\n\n"
              f"$$ " + " + ".join(f"P_{i+1}" for i in range(n)) + f" = {total_load:g} \\,\\text{{N}} $$"
        )

        # Solve
        try:
            loads = np.linalg.solve(A, b)
        except np.linalg.LinAlgError as exc:
            raise ValueError(f"Singular system – cannot solve: {exc}") from exc

        steps.append(
            "### Step 3 – Solving the Linear System\n"
            "Using Gaussian elimination (`np.linalg.solve`) on the $n \\times n$ matrix:\n\n"
            + "".join(f"$$ P_{i+1} = {loads[i]:.4f} \\,\\text{{N}} $$\n" for i in range(n))
        )

        # Derive stress, strain, deformation
        raw_delta = loads[0] * length / (rods[0].area * rods[0].modulus)
        common_delta = float(raw_delta) if math.isfinite(raw_delta) else 0.0

        rod_results = []
        for i, r in enumerate(rods):
            # Explicitly cast to Python float to avoid NumPy types in response
            p_val = float(loads[i])
            stress = p_val / r.area
            strain = stress / r.modulus
            deform = strain * length

            # Handle NaN/Inf just in case
            def safe_f(v): return float(v) if math.isfinite(v) else 0.0

            rod_results.append(
                RodResult(
                    name=r.name,
                    material=r.material,
                    area=r.area,
                    modulus=r.modulus,
                    load=safe_f(p_val),
                    stress=safe_f(stress),
                    strain=safe_f(strain),
                    deformation=safe_f(deform),
                    mass=safe_f(r.area * length * r.density),
                )
            )

        steps_final = "### Step 4 – Derived Quantities\n\n"
        for i in range(n):
            s_val = rod_results[i].stress
            e_val = rod_results[i].strain
            d_val = rod_results[i].deformation
            steps_final += (
                f"**Rod {i+1}:**\n"
                f"$$ \\sigma = \\frac{{P}}{{A}} = {s_val:.4e} \\,\\text{{Pa}} $$\n"
                f"$$ \\varepsilon = \\frac{{\\sigma}}{{E}} = {e_val:.6e} $$\n"
                f"$$ \\delta = {d_val:.6e} \\,\\text{{m}} $$\n\n"
            )
        steps.append(steps_final.strip())

        result = SolverResult(
            total_load=total_load,
            length=length,
            rods=rod_results,
            common_deformation=common_delta,
            steps=steps,
        )

        if with_sensitivity:
            result.sensitivity = self._sensitivity(rods, total_load, length, steps=20, variation=0.50)
        return result

    # ─────────────────────────────────────────
    # Sensitivity analysis
    # ─────────────────────────────────────────

    def _sensitivity(
        self,
        rods: List[RodInput],
        total_load: float,
        length: float,
        steps: int = 20,
        variation: float = 0.50,
    ) -> Dict[str, Any]:
        """
        Vary Rod 1's area from (1-variation)·A₁ to (1+variation)·A₁
        and record how every rod's stress changes.
        """
        areas = np.linspace(
            rods[0].area * (1 - variation),
            rods[0].area * (1 + variation),
            steps,
        )
        series: Dict[str, List[float]] = {r.name: [] for r in rods}
        x_labels: List[float] = []

        for a in areas:
            modified = [RodInput(r.name, r.area, r.modulus, r.material, r.density) for r in rods]
            modified[0] = RodInput(rods[0].name, float(a), rods[0].modulus, rods[0].material, rods[0].density)
            try:
                res = self._solve_core(modified, total_load, length)
                for rod in res.rods:
                    # Ensure series contains serializable floats
                    val = float(rod.stress) if math.isfinite(rod.stress) else 0.0
                    series[rod.name].append(val)
                x_labels.append(round(float(a), 6))
            except Exception:
                for r in rods:
                    series[r.name].append(None)
                x_labels.append(round(float(a), 6))

        return {"x_axis_label": f"Area of {rods[0].name} (m²)", "x": x_labels, "series": series}


# ─────────────────────────────────────────────
# Singleton for import
# ─────────────────────────────────────────────
solver = CompositeSolver()
