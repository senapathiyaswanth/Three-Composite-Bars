"""
Unit tests for IntelliStruct composite bar solver.
Run with:  pytest tests/test_solver.py -v
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import pytest
import math
from solver import CompositeSolver, RodInput


@pytest.fixture
def solver():
    return CompositeSolver()


# ─────────────────────────────────────────────
# Helper: classical 2-rod closed-form solution
# P1 = P * k1 / (k1 + k2),  k_i = A_i * E_i / L
# ─────────────────────────────────────────────
def two_rod_exact(A1, E1, A2, E2, P, L):
    k1 = A1 * E1 / L
    k2 = A2 * E2 / L
    P1 = P * k1 / (k1 + k2)
    P2 = P - P1
    return P1, P2


# ─────────────────────────────────────────────
# Basic two-rod test
# ─────────────────────────────────────────────
class TestTwoRod:
    def test_load_equilibrium(self, solver):
        rods = [
            RodInput("Rod1", 2e-4, 200e9),
            RodInput("Rod2", 3e-4, 70e9),
        ]
        res = solver.solve(rods, 100_000, 1.0)
        total = sum(r.load for r in res.rods)
        assert abs(total - 100_000) < 1e-4

    def test_compatibility(self, solver):
        """All rods must have the same deformation."""
        rods = [
            RodInput("Rod1", 2e-4, 200e9),
            RodInput("Rod2", 3e-4, 70e9),
        ]
        res = solver.solve(rods, 100_000, 1.0)
        deltas = [r.deformation for r in res.rods]
        for d in deltas:
            assert abs(d - deltas[0]) < 1e-10

    def test_load_values_match_closed_form(self, solver):
        A1, E1 = 2e-4, 200e9
        A2, E2 = 3e-4, 70e9
        P, L = 100_000, 1.0
        P1_exact, P2_exact = two_rod_exact(A1, E1, A2, E2, P, L)

        rods = [RodInput("Rod1", A1, E1), RodInput("Rod2", A2, E2)]
        res = solver.solve(rods, P, L)

        assert abs(res.rods[0].load - P1_exact) < 1e-2
        assert abs(res.rods[1].load - P2_exact) < 1e-2

    def test_stress_formula(self, solver):
        rods = [RodInput("R1", 1e-4, 200e9), RodInput("R2", 2e-4, 70e9)]
        res = solver.solve(rods, 50_000, 0.5)
        for r in res.rods:
            expected_stress = r.load / r.area
            assert abs(r.stress - expected_stress) < 1e-3

    def test_strain_formula(self, solver):
        rods = [RodInput("R1", 1e-4, 200e9), RodInput("R2", 2e-4, 70e9)]
        res = solver.solve(rods, 50_000, 0.5)
        for r in res.rods:
            expected_strain = r.stress / r.modulus
            assert abs(r.strain - expected_strain) < 1e-12


# ─────────────────────────────────────────────
# Three-rod (copper-zinc-aluminum example)
# ─────────────────────────────────────────────
class TestThreeRod:
    def test_equilibrium_3_rods(self, solver):
        rods = [
            RodInput("Copper",   1.5e-4, 110e9),
            RodInput("Zinc",     2.0e-4, 100e9),  # brass proxy
            RodInput("Aluminum", 2.5e-4, 69e9),
        ]
        P = 150_000
        res = solver.solve(rods, P, 1.2)
        assert abs(sum(r.load for r in res.rods) - P) < 1e-4

    def test_compatibility_3_rods(self, solver):
        rods = [
            RodInput("Copper",   1.5e-4, 110e9),
            RodInput("Zinc",     2.0e-4, 100e9),
            RodInput("Aluminum", 2.5e-4, 69e9),
        ]
        res = solver.solve(rods, 150_000, 1.2)
        deltas = [r.deformation for r in res.rods]
        for d in deltas:
            assert abs(d - deltas[0]) < 1e-10

    def test_all_loads_positive(self, solver):
        rods = [
            RodInput("Steel",    2e-4, 200e9),
            RodInput("Aluminum", 3e-4, 69e9),
            RodInput("Copper",   1e-4, 110e9),
        ]
        res = solver.solve(rods, 200_000, 0.8)
        for r in res.rods:
            assert r.load > 0


# ─────────────────────────────────────────────
# Edge-case / error tests
# ─────────────────────────────────────────────
class TestEdgeCases:
    def test_zero_area_raises(self, solver):
        with pytest.raises(ValueError, match="area must be positive"):
            solver.solve([RodInput("R", 0, 200e9)], 10_000, 1.0)

    def test_negative_area_raises(self, solver):
        with pytest.raises(ValueError, match="area must be positive"):
            solver.solve([RodInput("R", -1e-4, 200e9)], 10_000, 1.0)

    def test_zero_modulus_raises(self, solver):
        with pytest.raises(ValueError, match="Young's modulus must be positive"):
            solver.solve([RodInput("R", 1e-4, 0)], 10_000, 1.0)

    def test_zero_load_raises(self, solver):
        with pytest.raises(ValueError, match="Total load must be positive"):
            solver.solve([RodInput("R", 1e-4, 200e9)], 0, 1.0)

    def test_negative_load_raises(self, solver):
        with pytest.raises(ValueError, match="Total load must be positive"):
            solver.solve([RodInput("R", 1e-4, 200e9)], -100, 1.0)

    def test_zero_length_raises(self, solver):
        with pytest.raises(ValueError, match="Length must be positive"):
            solver.solve([RodInput("R", 1e-4, 200e9)], 10_000, 0)

    def test_no_rods_raises(self, solver):
        with pytest.raises(ValueError, match="At least one rod"):
            solver.solve([], 10_000, 1.0)

    def test_single_rod(self, solver):
        """Single rod – all load goes to it."""
        res = solver.solve([RodInput("R1", 2e-4, 200e9)], 50_000, 1.0)
        assert abs(res.rods[0].load - 50_000) < 1e-6

    def test_identical_rods(self, solver):
        """N identical rods must share load equally."""
        n = 4
        rods = [RodInput(f"R{i+1}", 1e-4, 200e9) for i in range(n)]
        P = 80_000
        res = solver.solve(rods, P, 1.0)
        for r in res.rods:
            assert abs(r.load - P / n) < 1e-4

    def test_very_stiff_rod_takes_most_load(self, solver):
        """A rod with 100× stiffness should carry ~100/(100+1) of the total load."""
        rods = [
            RodInput("Stiff",  1e-4, 200e9),   # k = 2e7
            RodInput("Weak",   1e-6, 200e9),   # k = 2e5  → 100× weaker
        ]
        res = solver.solve(rods, 100_000, 1.0)
        # stiff rod fraction ≈ 100/101 ≈ 0.9901
        ratio = res.rods[0].load / 100_000
        assert abs(ratio - 100.0 / 101.0) < 1e-4

    def test_large_n(self, solver):
        """10-rod system should still satisfy equilibrium."""
        n = 10
        rods = [RodInput(f"R{i+1}", (i + 1) * 5e-5, (100 + i * 10) * 1e9) for i in range(n)]
        P = 500_000
        res = solver.solve(rods, P, 2.0)
        assert abs(sum(r.load for r in res.rods) - P) < 1e-3


# ─────────────────────────────────────────────
# Sensitivity analysis
# ─────────────────────────────────────────────
class TestSensitivity:
    def test_sensitivity_returns_series(self, solver):
        rods = [RodInput("R1", 2e-4, 200e9), RodInput("R2", 3e-4, 70e9)]
        res = solver.solve(rods, 100_000, 1.0)
        assert "series" in res.sensitivity
        assert "x" in res.sensitivity
        for name in ["R1", "R2"]:
            assert name in res.sensitivity["series"]

    def test_sensitivity_length(self, solver):
        rods = [RodInput("A", 1e-4, 200e9), RodInput("B", 2e-4, 70e9)]
        res = solver.solve(rods, 50_000, 1.0)
        n_points = len(res.sensitivity["x"])
        assert n_points == len(res.sensitivity["series"]["A"])
        assert n_points >= 5
