export interface RodInput {
  id: string;
  name: string;
  material: string;
  area: number;       // m²
  modulus: number;    // Pa
  density: number;    // kg/m³
}

export interface RodResult {
  name: string;
  material: string;
  area: number;
  modulus: number;
  load: number;       // N
  stress: number;     // Pa
  strain: number;
  deformation: number; // m
  mass: number;       // kg
}

export interface SolveResponse {
  id?: string;
  total_load: number;
  length: number;
  common_deformation: number;
  rods: RodResult[];
  steps: string[];
  sensitivity: SensitivityData;
  timestamp?: string;
}

export interface SensitivityData {
  x_axis_label: string;
  x: number[];
  series: Record<string, (number | null)[]>;
}

export interface Material {
  name: string;
  modulus: number;
  density: number;
  color: string;
}

export interface HistoryItem {
  id: string;
  total_load: number;
  length: number;
  rod_count: number;
  timestamp: string;
}
