import { motion } from "framer-motion";
import { FileDown, TrendingUp, Ruler, Activity } from "lucide-react";
import type { SolveResponse } from "@/utils/types";
import { exportPDF } from "@/utils/export";
import { useSolverContext } from "@/context/SolverContext";

interface Props {
  result: SolveResponse;
}

const fmtExp = (n: number) => n.toExponential(4);

// Animated counter for metric cards
function AnimatedValue({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <motion.span
      className="font-mono text-lg font-black value-highlight"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {value}
      {suffix && <span className="text-xs font-semibold ml-1" style={{ color: "var(--text-dim)" }}>{suffix}</span>}
    </motion.span>
  );
}

export default function ResultsPanel({ result }: Props) {
  const { rods, totalLoad, length } = useSolverContext();

  const metrics = [
    {
      label: "Total Load",
      value: result.total_load >= 1000 ? `${(result.total_load / 1000).toFixed(1)}` : `${result.total_load.toFixed(1)}`,
      suffix: result.total_load >= 1000 ? "kN" : "N",
      icon: TrendingUp,
      color: "#6366f1",
      gradient: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))",
    },
    {
      label: "Length",
      value: `${result.length}`,
      suffix: "m",
      icon: Ruler,
      color: "#22d3ee",
      gradient: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04))",
    },
    {
      label: "Common Deformation",
      value: fmtExp(result.common_deformation),
      suffix: "m",
      icon: Activity,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
    },
  ];

  const handleExportPDF = () => {
    exportPDF(result, rods, totalLoad, length);
  };

  return (
    <section className="glass-card p-5 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="section-label">Computed Output</p>
          <h2 className="text-base font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
            Results
          </h2>
        </div>
        <motion.button
          className="btn-ghost !px-3 !py-1.5 text-xs"
          onClick={handleExportPDF}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FileDown className="w-3.5 h-3.5" /> Export PDF
        </motion.button>
      </header>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map(({ label, value, suffix, icon: Icon, color, gradient }, i) => (
          <motion.div
            key={label}
            className="metric-card"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ background: gradient, borderColor: `${color}20` }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Icon className="w-3 h-3" style={{ color }} />
              <p className="section-label !text-[8px]" style={{ color }}>{label}</p>
            </div>
            <AnimatedValue value={value} suffix={suffix} />
          </motion.div>
        ))}
      </div>

      {/* ── Per-rod data table ── */}
      <div className="overflow-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr
              style={{
                background: "rgba(99,102,241,0.06)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Rod", "Material", "Load [N]", "Stress [MPa]", "Strain [×10⁻⁶]", "δ [m]"].map((h) => (
                <th key={h} className="py-2.5 px-3 text-left section-label !text-[9px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rods.map((r, i) => (
              <motion.tr
                key={r.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                style={{ borderBottom: "1px solid var(--border)" }}
                className="hover:!bg-[rgba(99,102,241,0.05)] transition-colors"
              >
                <td className="py-3 px-3">
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{r.name}</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {r.material}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                  {r.load.toFixed(1)}
                </td>
                <td className="py-3 px-3 font-mono font-bold" style={{ color: "var(--accent)" }}>
                  {(r.stress / 1e6).toFixed(2)}
                </td>
                <td className="py-3 px-3 font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {(r.strain * 1e6).toFixed(2)}
                </td>
                <td className="py-3 px-3 font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>
                  {r.deformation.toExponential(3)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
