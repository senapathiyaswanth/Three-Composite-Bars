import axios from "axios";
import type {
  SolveResponse,
  Material,
  HistoryItem,
  SensitivityData,
  RodInput,
} from "./types";
import { offlineSolve } from "./offlineSolver";
import { BUILTIN_MATERIALS } from "@/hooks/useMaterials";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

const http = axios.create({ baseURL: BASE, timeout: 8_000 });

// ─── Helper: check if real backend is reachable ───────────────────────────────
let _backendAlive: boolean | null = null;

async function isBackendAlive(): Promise<boolean> {
  if (_backendAlive !== null) return _backendAlive;
  try {
    await http.get("/materials", { timeout: 3000 });
    _backendAlive = true;
  } catch {
    _backendAlive = false;
  }
  return _backendAlive;
}

// ─── Solver ──────────────────────────────────────────────────────────────────
export async function solve(
  rods: Omit<RodInput, "id">[],
  total_load: number,
  length: number,
  save = false
): Promise<SolveResponse> {
  const alive = await isBackendAlive();

  if (alive) {
    try {
      const { data } = await http.post<SolveResponse>("/solve", {
        rods,
        total_load,
        length,
        save,
      });
      return data;
    } catch {
      // Backend failed mid-request, fall through to offline
    }
  }

  // ── Offline fallback ──
  const rodsWithDensity = rods.map((r) => {
    const material = BUILTIN_MATERIALS.find((m) => m.name === r.material);
    return {
      name: r.name,
      material: r.material,
      area: r.area,
      modulus: r.modulus,
      density: r.density ?? material?.density ?? 7850,
    };
  });

  return offlineSolve(rodsWithDensity, total_load, length);
}

// ─── Materials ────────────────────────────────────────────────────────────────
export async function getMaterials(): Promise<Material[]> {
  const alive = await isBackendAlive();
  if (alive) {
    try {
      const { data } = await http.get<Material[]>("/materials");
      if (Array.isArray(data)) return data;
    } catch { /* fall through */ }
  }
  return BUILTIN_MATERIALS;
}

// ─── History ─────────────────────────────────────────────────────────────────
export async function getHistory(
  limit = 20,
  skip = 0
): Promise<HistoryItem[]> {
  const alive = await isBackendAlive();
  if (!alive) return [];
  try {
    const { data } = await http.get<HistoryItem[]>("/history", {
      params: { limit, skip },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getProblem(id: string): Promise<SolveResponse> {
  const { data } = await http.get<SolveResponse>(`/history/${id}`);
  return data;
}

export async function deleteProblem(id: string): Promise<void> {
  await http.delete(`/history/${id}`);
}

// ─── Sensitivity ─────────────────────────────────────────────────────────────
export async function runSensitivity(
  rods: Omit<RodInput, "id">[],
  total_load: number,
  length: number,
  rod_index = 0,
  variation = 0.5,
  steps = 20
): Promise<SensitivityData> {
  const alive = await isBackendAlive();
  if (alive) {
    try {
      const { data } = await http.post<SensitivityData>("/sensitivity", {
        rods,
        total_load,
        length,
        rod_index,
        variation,
        steps,
      });
      return data;
    } catch { /* fall through */ }
  }
  // Offline fallback handled through offlineSolve sensitivity
  return { x_axis_label: "", x: [], series: {} };
}

// ─── AI Parser (offline: not available) ──────────────────────────────────────
export async function parseNL(text: string) {
  const alive = await isBackendAlive();
  if (!alive) throw new Error("AI Parser requires a backend connection.");
  const { data } = await http.post("/ai/parse", { text });
  return data;
}
