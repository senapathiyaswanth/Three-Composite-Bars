import { useState, useCallback } from "react";
import { solve } from "@/utils/api";
import type { RodInput, SolveResponse } from "@/utils/types";
import toast from "react-hot-toast";

export function useSolver() {
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      rods: RodInput[],
      totalLoad: number,
      length: number,
      save = false
    ) => {
      setLoading(true);
      setError(null);
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
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, run, reset };
}
