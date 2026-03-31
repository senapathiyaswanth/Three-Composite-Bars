import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Calculator,
  Save,
  WandSparkles,
  Loader2,
  ChevronDown,
  CircleDot,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Material, RodInput } from "@/utils/types";
import { parseNL } from "@/utils/api";

interface Props {
  rods: RodInput[];
  setRods: (v: RodInput[]) => void;
  totalLoad: number;
  setTotalLoad: (v: number) => void;
  length: number;
  setLength: (v: number) => void;
  materials: Material[];
  onSolve: (save: boolean) => Promise<void>;
  loading: boolean;
}

const newRod = (index: number): RodInput => ({
  id: crypto.randomUUID(),
  name: `Rod ${index + 1}`,
  material: "Steel",
  area: 1e-4,
  modulus: 200e9,
  density: 7850,
});

// Material color map for rod card left borders
const MAT_COLORS: Record<string, string> = {
  Steel: "#4B7BEC",
  Aluminum: "#06B6D4",
  Copper: "#E17055",
  Brass: "#F9CA24",
  Titanium: "#A29BFE",
  "Cast Iron": "#636E72",
  Concrete: "#B2BEC3",
  "Carbon Fiber": "#2D3436",
};

export default function InputPanel({
  rods,
  setRods,
  totalLoad,
  setTotalLoad,
  length,
  setLength,
  materials,
  onSolve,
  loading,
}: Props) {
  const [nlText, setNlText] = useState("");
  const [parsing, setParsing] = useState(false);

  const materialMap = useMemo(
    () => new Map(materials.map((m) => [m.name, m])),
    [materials]
  );

  const validate = (): string | null => {
    if (totalLoad <= 0) return "Total load must be positive.";
    if (length <= 0) return "Length must be positive.";
    if (rods.length === 0) return "Add at least one rod.";
    for (const r of rods) {
      if (!r.name.trim()) return "Each rod must have a name.";
      if (r.area <= 0) return `${r.name}: area must be > 0`;
      if (r.modulus <= 0) return `${r.name}: modulus must be > 0`;
    }
    return null;
  };

  const handleSolve = async (save = false) => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    await onSolve(save);
  };

  const addRod = () => setRods([...rods, newRod(rods.length)]);
  const removeRod = (id: string) => {
    if (rods.length === 1) {
      toast.error("At least one rod is required.");
      return;
    }
    setRods(rods.filter((r) => r.id !== id).map((r, i) => ({ ...r, name: `Rod ${i + 1}` })));
  };

  const updateRod = (id: string, patch: Partial<RodInput>) => {
    setRods(rods.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const applyMaterial = (id: string, materialName: string) => {
    const m = materialMap.get(materialName);
    updateRod(id, {
      material: materialName,
      modulus: m?.modulus ?? 200e9,
      density: m?.density ?? 7850,
    });
  };

  const parseNaturalLanguage = async () => {
    if (!nlText.trim()) {
      toast.error("Enter a natural-language prompt first.");
      return;
    }
    setParsing(true);
    try {
      const data = await parseNL(nlText.trim());
      if (typeof data.total_load === "number") setTotalLoad(data.total_load);
      if (typeof data.length === "number") setLength(data.length);
      if (Array.isArray(data.rods) && data.rods.length) {
        const parsed = data.rods.map((r: any, i: number) => ({
          id: crypto.randomUUID(),
          name: r.name ?? `Rod ${i + 1}`,
          material: r.material ?? "Custom",
          area: Number(r.area ?? 1e-4),
          modulus: Number(r.modulus ?? 200e9),
          density: Number(r.density ?? 7850),
        }));
        setRods(parsed);
      }
      toast.success(`AI parse completed (confidence: ${data.confidence ?? "unknown"})`);
    } catch {
      toast.error("Natural-language parse failed.");
    } finally {
      setParsing(false);
    }
  };

  const matColor = (name: string) => MAT_COLORS[name] ?? "var(--accent)";

  return (
    <section className="glass-card p-5 space-y-5">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="section-label">Configuration</p>
          <h2 className="text-lg font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
            Composite Bar Setup
          </h2>
        </div>
        <motion.button
          className="btn-ghost mt-1"
          onClick={addRod}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="w-4 h-4" /> Add Rod
        </motion.button>
      </header>

      {/* ── AI Natural Language Input ── */}
      <div className="space-y-2">
        <label className="section-label flex items-center gap-1.5">
          <WandSparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />
          AI Assistant — Natural Language
        </label>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid",
            borderImage: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(34,211,238,0.2)) 1",
          }}
        >
          <div className="flex">
            <input
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && parseNaturalLanguage()}
              className="flex-1 px-3.5 py-2.5 text-sm outline-none bg-transparent"
              style={{ color: "var(--text-primary)" }}
              placeholder='"3 rods steel, copper, aluminum; load 120kN; length 1.2m"'
            />
            <motion.button
              className="px-4 flex items-center gap-1.5 text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))",
                color: "var(--accent)",
              }}
              onClick={parseNaturalLanguage}
              disabled={parsing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WandSparkles className="w-3.5 h-3.5" />}
              Parse
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Global fields ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="section-label mb-1.5 block">Total Load, P</label>
          <div className="relative">
            <input
              type="number"
              className="glass-input !pr-8"
              value={totalLoad}
              step="any"
              min="0"
              onChange={(e) => setTotalLoad(Number(e.target.value))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: "var(--text-dim)" }}>N</span>
          </div>
        </div>
        <div>
          <label className="section-label mb-1.5 block">Length, L</label>
          <div className="relative">
            <input
              type="number"
              className="glass-input !pr-8"
              value={length}
              step="any"
              min="0"
              onChange={(e) => setLength(Number(e.target.value))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: "var(--text-dim)" }}>m</span>
          </div>
        </div>
      </div>

      {/* ── Rod cards ── */}
      <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
        <AnimatePresence initial={false}>
          {rods.map((rod, idx) => {
            const invalidArea = !rod.area || rod.area <= 0;
            const invalidE = !rod.modulus || rod.modulus <= 0;
            const color = matColor(rod.material);

            return (
              <motion.div
                layout
                key={rod.id}
                initial={{ opacity: 0, x: -16, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="rod-card"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-3.5 h-3.5" style={{ color }} />
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{rod.name}</p>
                  </div>
                  <motion.button
                    className="btn-ghost !px-2 !py-1 !rounded-lg"
                    onClick={() => removeRod(rod.id)}
                    title="Remove rod"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Material */}
                  <div className="col-span-1 flex flex-col justify-end">
                    <label className="section-label mb-1">Material</label>
                    <select
                      value={rod.material}
                      className="glass-input !text-xs !py-2"
                      onChange={(e) => applyMaterial(rod.id, e.target.value)}
                    >
                      {materials.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  {/* Area */}
                  <div className="flex flex-col justify-end">
                    <label className="section-label mb-1">Area</label>
                    <div className="relative">
                      <input
                        type="number"
                        className={`glass-input !text-xs !py-2 !pr-10 ${invalidArea ? "!border-red-400" : ""}`}
                        value={rod.area * 1e6}
                        step="any"
                        min="0"
                        onChange={(e) => updateRod(rod.id, { area: Number(e.target.value) * 1e-6 })}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold" style={{ color: "var(--text-dim)" }}>mm²</span>
                    </div>
                  </div>

                  {/* Modulus */}
                  <div className="flex flex-col justify-end">
                    <label className="section-label mb-1">E</label>
                    <div className="relative">
                      <input
                        type="number"
                        className={`glass-input !text-xs !py-2 !pr-10 ${invalidE ? "!border-red-400" : ""}`}
                        value={rod.modulus / 1e9}
                        step="any"
                        min="0"
                        onChange={(e) => updateRod(rod.id, { modulus: Number(e.target.value) * 1e9 })}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold" style={{ color: "var(--text-dim)" }}>GPa</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Action buttons ── */}
      <footer className="grid grid-cols-2 gap-3 pt-1">
        <motion.button
          className="btn-primary justify-center"
          onClick={() => handleSolve(false)}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          Solve Problem
        </motion.button>
        <motion.button
          className="btn-ghost justify-center font-bold"
          onClick={() => handleSolve(true)}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ borderColor: "var(--border-bright)" }}
        >
          <Save className="w-4 h-4" />
          Solve & Save
        </motion.button>
      </footer>
    </section>
  );
}
