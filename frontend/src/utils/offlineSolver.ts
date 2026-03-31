/**
 * offlineSolver.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure-TypeScript port of the Python CompositeSolver (backend/app/solver.py).
 * Runs entirely in the browser — no backend required.
 *
 * Algorithm:
 *   Compatibility: δ₁ = δ₂ = … = δₙ  →  Pᵢ/kᵢ = Pⱼ/kⱼ  (n-1 equations)
 *   Equilibrium :  ΣPᵢ = P_total      (1 equation)
 *   Solved via Gaussian Elimination on an n×n matrix.
 */

import type { SolveResponse, RodResult, SensitivityData } from "./types";

// ── Tiny Gaussian Elimination ─────────────────────────────────────────────────
function gaussSolve(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Augmented matrix [A | b]
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    if (Math.abs(M[col][col]) < 1e-15) throw new Error("Singular system");

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
    }
  }

  // Back-substitution
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

// ── Step text builder ─────────────────────────────────────────────────────────
function buildSteps(
  rods: Array<{ name: string; area: number; modulus: number; density: number }>,
  loads: number[],
  total_load: number,
  length: number
): string[] {
  const n = rods.length;
  const steps: string[] = [];

  steps.push(
    "### Step 1 – Compatibility Condition\n\n" +
    "All rods share the same deformation $\\delta$:\n\n" +
    "$$\\delta_1 = \\delta_2 = \\dots = \\delta_n$$\n\n" +
    "$$\\frac{P_i}{k_i} = \\frac{P_j}{k_j}, \\quad k_i = \\frac{A_i E_i}{L}$$"
  );

  let eqStr =
    "### Step 2 – System of Equations\n**Compatibility** ($n-1$ equations):\n\n" +
    Array.from({ length: n - 1 }, (_, i) =>
      `$$\\frac{P_{${i + 1}}}{A_{${i + 1}} \\cdot E_{${i + 1}}} - \\frac{P_{${i + 2}}}{A_{${i + 2}} \\cdot E_{${i + 2}}} = 0$$\n`
    ).join("") +
    `**Equilibrium** (1 equation):\n\n$$` +
    rods.map((_, i) => `P_{${i + 1}}`).join(" + ") +
    ` = ${total_load.toLocaleString()} \\,\\text{N}$$`;
  steps.push(eqStr);

  steps.push(
    "### Step 3 – Solving the Linear System\n" +
    "Using Gaussian Elimination on the $" + n + " \\times " + n + "$ matrix:\n\n" +
    loads.map((p, i) => `$$P_{${i + 1}} = ${p.toFixed(4)} \\,\\text{N}$$\n`).join("")
  );

  let deriv = "### Step 4 – Derived Quantities\n\n";
  for (let i = 0; i < n; i++) {
    const stress = loads[i] / rods[i].area;
    const strain = stress / rods[i].modulus;
    const deform = strain * length;
    deriv +=
      `**Rod ${i + 1}:**\n` +
      `$$\\sigma = \\frac{P}{A} = ${stress.toExponential(4)} \\,\\text{Pa}$$\n` +
      `$$\\varepsilon = \\frac{\\sigma}{E} = ${strain.toExponential(6)}$$\n` +
      `$$\\delta = ${deform.toExponential(6)} \\,\\text{m}$$\n\n`;
  }
  steps.push(deriv.trim());

  return steps;
}

// ── Core solver ───────────────────────────────────────────────────────────────
function solveCore(
  rods: Array<{ name: string; area: number; modulus: number; density: number; material: string }>,
  total_load: number,
  length: number
): { loads: number[]; rodResults: RodResult[]; commonDeformation: number; steps: string[] } {
  const n = rods.length;
  if (n < 1) throw new Error("At least one rod is required.");
  if (total_load <= 0) throw new Error("Total load must be positive.");
  if (length <= 0) throw new Error("Length must be positive.");

  const k = rods.map((r) => (r.area * r.modulus) / length);

  // Build n×n system
  const A: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array<number>(n).fill(0);

  for (let i = 0; i < n - 1; i++) {
    A[i][i] = 1 / k[i];
    A[i][i + 1] = -1 / k[i + 1];
    b[i] = 0;
  }
  A[n - 1].fill(1);
  b[n - 1] = total_load;

  const loads = gaussSolve(A, b);
  const steps = buildSteps(rods, loads, total_load, length);

  const rawDelta = (loads[0] * length) / (rods[0].area * rods[0].modulus);
  const commonDeformation = isFinite(rawDelta) ? rawDelta : 0;

  const rodResults: RodResult[] = rods.map((r, i) => {
    const load = isFinite(loads[i]) ? loads[i] : 0;
    const stress = load / r.area;
    const strain = stress / r.modulus;
    const deformation = strain * length;
    const mass = r.area * length * r.density;
    return {
      name: r.name,
      material: r.material,
      area: r.area,
      modulus: r.modulus,
      load: isFinite(load) ? load : 0,
      stress: isFinite(stress) ? stress : 0,
      strain: isFinite(strain) ? strain : 0,
      deformation: isFinite(deformation) ? deformation : 0,
      mass: isFinite(mass) ? mass : 0,
    };
  });

  return { loads, rodResults, commonDeformation, steps };
}

// ── Sensitivity ───────────────────────────────────────────────────────────────
function computeSensitivity(
  rods: Array<{ name: string; area: number; modulus: number; density: number; material: string }>,
  total_load: number,
  length: number,
  steps = 20,
  variation = 0.5
): SensitivityData {
  const x_labels: number[] = [];
  const series: Record<string, (number | null)[]> = {};
  rods.forEach((r) => (series[r.name] = []));

  for (let i = 0; i < steps; i++) {
    const fraction = (1 - variation) + (2 * variation * i) / (steps - 1);
    const area = rods[0].area * fraction;
    x_labels.push(parseFloat(area.toFixed(6)));

    const modified = rods.map((r, idx) =>
      idx === 0 ? { ...r, area } : { ...r }
    );
    try {
      const { rodResults } = solveCore(modified, total_load, length);
      rodResults.forEach((rr) => {
        series[rr.name].push(isFinite(rr.stress) ? rr.stress : null);
      });
    } catch {
      rods.forEach((r) => series[r.name].push(null));
    }
  }

  return {
    x_axis_label: `Area of ${rods[0].name} (m²)`,
    x: x_labels,
    series,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────
export interface OfflineRodInput {
  name: string;
  material: string;
  area: number;
  modulus: number;
  density: number;
}

export function offlineSolve(
  rods: OfflineRodInput[],
  total_load: number,
  length: number
): SolveResponse {
  const { rodResults, commonDeformation, steps } = solveCore(rods, total_load, length);
  const sensitivity = computeSensitivity(rods, total_load, length);

  return {
    total_load,
    length,
    common_deformation: commonDeformation,
    rods: rodResults,
    steps,
    sensitivity,
  };
}
