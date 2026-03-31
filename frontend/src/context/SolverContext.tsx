import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { solve } from "@/utils/api";
import type { RodInput, SolveResponse } from "@/utils/types";
import toast from "react-hot-toast";

interface SolverContextType {
  rods: RodInput[];
  setRods: (rods: RodInput[]) => void;
  totalLoad: number;
  setTotalLoad: (v: number) => void;
  length: number;
  setLength: (v: number) => void;
  result: SolveResponse | null;
  loading: boolean;
  run: (rods: RodInput[], totalLoad: number, length: number, save?: boolean) => Promise<void>;
}

const SolverContext = createContext<SolverContextType | null>(null);

const DEFAULT_RODS: RodInput[] = [
  { id: "1", name: "Rod 1", material: "Copper",   area: 5e-4,   modulus: 130e9, density: 8960 },
  { id: "2", name: "Rod 2", material: "Zinc",     area: 7.5e-4, modulus: 100e9, density: 7133 },
  { id: "3", name: "Rod 3", material: "Aluminum", area: 1e-3,   modulus: 80e9,  density: 2700 },
];

export function SolverProvider({ children }: { children: ReactNode }) {
  const [rods, setRods]           = useState<RodInput[]>(DEFAULT_RODS);
  const [totalLoad, setTotalLoad] = useState<number>(250_000);
  const [length, setLength]       = useState<number>(1.0);
  const [result, setResult]       = useState<SolveResponse | null>(null);
  const [loading, setLoading]     = useState(false);

  const run = useCallback(
    async (rods: RodInput[], totalLoad: number, length: number, save = false) => {
      setLoading(true);
      try {
        const rodPayload = rods.map(({ id: _id, ...rest }) => rest);
        const res = await solve(rodPayload, totalLoad, length, save);
        setResult(res);
        toast.success("Solution computed successfully!");
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { detail?: string } } })?.response?.data
                ?.detail ?? "Solver error";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <SolverContext.Provider value={{ rods, setRods, totalLoad, setTotalLoad, length, setLength, result, loading, run }}>
      {children}
    </SolverContext.Provider>
  );
}

export function useSolverContext() {
  const ctx = useContext(SolverContext);
  if (!ctx) throw new Error("useSolverContext must be used inside SolverProvider");
  return ctx;
}
