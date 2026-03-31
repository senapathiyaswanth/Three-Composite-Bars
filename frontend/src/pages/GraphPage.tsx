import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, Legend, LabelList,
  Area, AreaChart,
} from "recharts";
import { ImageDown, BarChart3, Activity, TrendingUp, ArrowLeft } from "lucide-react";
import type { SolveResponse, Material } from "@/utils/types";
import { exportChartPNG } from "@/utils/export";
import { useSolverContext } from "@/context/SolverContext";
import { useMaterials } from "@/hooks";

const PALETTE = [
  "#6366F1", "#22D3EE", "#F59E0B", "#10B981",
  "#F43F5E", "#A78BFA", "#FB923C", "#34D399",
];

const tooltipStyle = {
  background: "rgba(10, 10, 30, 0.95)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: 12,
  color: "#F1F5F9",
  fontSize: 12,
  fontFamily: "JetBrains Mono, monospace",
  padding: "10px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

function ChartHeader({ icon: Icon, label, title, color }: {
  icon: any; label: string; title: string; color: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <p className="section-label !text-[9px]" style={{ color }}>{label}</p>
      </div>
      <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{title}</h3>
    </div>
  );
}

export default function GraphPage() {
  const { result } = useSolverContext();
  const { materials } = useMaterials();
  const navigate = useNavigate();

  if (!result) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
        <motion.div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <BarChart3 className="w-7 h-7" style={{ color: "var(--accent)" }} />
        </motion.div>
        <div className="text-center">
          <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            No Results Yet
          </p>
          <p className="text-xs mt-2 max-w-[340px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Solve a problem on the Dashboard first to see graphs here.
          </p>
        </div>
        <motion.button
          className="btn-primary mt-2"
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </motion.button>
      </div>
    );
  }

  return <GraphContent result={result} materials={materials} />;
}

function GraphContent({ result, materials }: { result: SolveResponse; materials: any[] }) {
  const loadData = useMemo(
    () =>
      result.rods.map((r, i) => {
        const mat = materials.find((m) => m.name === r.material);
        return {
          name: r.name,
          load: parseFloat(r.load.toFixed(2)),
          fill: mat?.color ?? PALETTE[i % PALETTE.length],
        };
      }),
    [result, materials]
  );

  const stressData = useMemo(
    () =>
      result.rods.map((r, i) => {
        const mat = materials.find((m) => m.name === r.material);
        return {
          name: r.name,
          stressMPa: parseFloat((r.stress / 1e6).toFixed(4)),
          fill: mat?.color ?? PALETTE[i % PALETTE.length],
        };
      }),
    [result, materials]
  );

  const sensitivityData = useMemo(() => {
    const { x, series } = result.sensitivity;
    if (!x || !series) return [];
    return x.map((xv, i) => {
      const point: Record<string, number | null> = { x: xv };
      Object.keys(series).forEach((key) => {
        point[key] = series[key][i] !== null ? parseFloat((series[key][i]! / 1e6).toFixed(4)) : null;
      });
      return point;
    });
  }, [result]);

  const seriesKeys = Object.keys(result.sensitivity.series ?? {});

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="section-label">Data Visualization</p>
          <h1 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>
            Analysis Charts
          </h1>
        </div>
        <motion.button
          id="charts-export-btn"
          className="btn-ghost !px-4 !py-2 text-xs"
          onClick={() => exportChartPNG("charts-full-container")}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <ImageDown className="w-4 h-4" /> Export Charts
        </motion.button>
      </motion.div>

      <div id="charts-full-container" className="space-y-6">
        {/* Load + Stress side by side */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Load Distribution */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <ChartHeader icon={BarChart3} label="Load Distribution" title="Load Carried [N]" color="#6366f1" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={loadData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8888aa", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8888aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(99,102,241,0.04)" }} contentStyle={tooltipStyle} itemStyle={{ color: "#E2E8F0" }} formatter={(v: number) => [`${v.toLocaleString()} N`, "Load"]} />
                <Bar dataKey="load" radius={[8, 8, 0, 0]} animationDuration={800}>
                  <LabelList dataKey="load" position="top" fill="var(--text-secondary)" fontSize={10} fontWeight={600} />
                  {loadData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Stress Comparison */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <ChartHeader icon={Activity} label="Stress Analysis" title="Stress [MPa]" color="#22d3ee" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stressData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8888aa", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8888aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(99,102,241,0.04)" }} contentStyle={tooltipStyle} itemStyle={{ color: "#E2E8F0" }} formatter={(v: number) => [`${v} MPa`, "Stress"]} />
                <Bar dataKey="stressMPa" radius={[8, 8, 0, 0]} animationDuration={800}>
                  <LabelList dataKey="stressMPa" position="top" fill="var(--text-secondary)" fontSize={10} fontWeight={600} />
                  {stressData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Sensitivity Analysis — full width */}
        {sensitivityData.length > 0 && seriesKeys.length > 0 && (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <ChartHeader
              icon={TrendingUp}
              label="Sensitivity Analysis"
              title="Stress vs Area of Rod 1"
              color="#a78bfa"
            />
            <p className="text-[11px] mb-4 -mt-2" style={{ color: "var(--text-dim)" }}>
              {result.sensitivity.x_axis_label}
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={sensitivityData}>
                <defs>
                  {seriesKeys.map((key, i) => (
                    <linearGradient key={key} id={`grad-full-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                <XAxis
                  dataKey="x"
                  tick={{ fill: "#8888aa", fontSize: 9 }}
                  tickFormatter={(v: number) => v.toExponential(1)}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fill: "#8888aa", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#E2E8F0" }}
                  formatter={(v: number) => [`${v} MPa`, ""]}
                  labelFormatter={(l: number) => `A₁ = ${Number(l).toExponential(2)} m²`}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#8888aa", paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                {seriesKeys.map((key, i) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={PALETTE[i % PALETTE.length]}
                    strokeWidth={2.5}
                    fill={`url(#grad-full-${key})`}
                    dot={false}
                    connectNulls
                    animationDuration={1000}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
