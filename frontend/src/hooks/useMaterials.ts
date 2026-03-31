import { useState, useEffect } from "react";
import { getMaterials } from "@/utils/api";
import type { Material } from "@/utils/types";

// Fallback built-in materials (used when API is unavailable)
export const BUILTIN_MATERIALS: Material[] = [
  { name: "Steel",        modulus: 200e9, density: 7850, color: "#4B7BEC" },
  { name: "Aluminum",     modulus: 69e9,  density: 2700, color: "#F7B731" },
  { name: "Copper",       modulus: 110e9, density: 8960, color: "#E17055" },
  { name: "Brass",        modulus: 100e9, density: 8500, color: "#F9CA24" },
  { name: "Titanium",     modulus: 116e9, density: 4510, color: "#A29BFE" },
  { name: "Cast Iron",    modulus: 170e9, density: 7200, color: "#636E72" },
  { name: "Concrete",     modulus: 30e9,  density: 2400, color: "#B2BEC3" },
  { name: "Carbon Fiber", modulus: 181e9, density: 1600, color: "#2D3436" },
];

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>(BUILTIN_MATERIALS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMaterials()
      .then((data) => { if (Array.isArray(data)) setMaterials(data); })
      .catch(() => {/* stay with fallback */})
      .finally(() => setLoading(false));
  }, []);

  const byName = (name: string): Material | undefined =>
    materials.find((m) => m.name === name);

  return { materials, loading, byName };
}
