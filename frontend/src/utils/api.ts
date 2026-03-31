import axios from "axios";
import type {
  SolveResponse,
  Material,
  HistoryItem,
  SensitivityData,
  RodInput,
} from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

const http = axios.create({ baseURL: BASE, timeout: 15_000 });

// ─── Solver ──────────────────────────────────────────────────────────────────
export async function solve(
  rods: Omit<RodInput, "id">[],
  total_load: number,
  length: number,
  save = false
): Promise<SolveResponse> {
  const { data } = await http.post<SolveResponse>("/solve", {
    rods,
    total_load,
    length,
    save,
  });
  return data;
}

// ─── Materials ────────────────────────────────────────────────────────────────
export async function getMaterials(): Promise<Material[]> {
  const { data } = await http.get<Material[]>("/materials");
  return data;
}

// ─── History ─────────────────────────────────────────────────────────────────
export async function getHistory(
  limit = 20,
  skip = 0
): Promise<HistoryItem[]> {
  const { data } = await http.get<HistoryItem[]>("/history", {
    params: { limit, skip },
  });
  return data;
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
  const { data } = await http.post<SensitivityData>("/sensitivity", {
    rods,
    total_load,
    length,
    rod_index,
    variation,
    steps,
  });
  return data;
}

// ─── AI Parser ───────────────────────────────────────────────────────────────
export async function parseNL(text: string) {
  const { data } = await http.post("/ai/parse", { text });
  return data;
}
