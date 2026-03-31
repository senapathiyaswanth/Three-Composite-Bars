import { useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { RodInput, SolveResponse, Material } from "@/utils/types";

interface Props {
  rods: RodInput[];
  result: SolveResponse | null;
  materials: Material[];
}

const FALLBACK_COLORS = [
  "#6366F1", "#22D3EE", "#F59E0B", "#10B981",
  "#F43F5E", "#A78BFA", "#FB923C", "#34D399",
];

export const MAT_COLORS: Record<string, string> = {
  Steel: "#4B7BEC",
  Aluminum: "#06B6D4",
  Copper: "#E17055",
  Brass: "#F9CA24",
  Titanium: "#A29BFE",
  "Cast Iron": "#636E72",
  Concrete: "#B2BEC3",
  "Carbon Fiber": "#2D3436",
};

// Stress to color gradient: green → yellow → orange → red
function stressColor(ratio: number): string {
  if (ratio < 0.33) {
    const t = ratio / 0.33;
    const r = Math.round(16 + t * (245 - 16));
    const g = Math.round(185 + t * (158 - 185));
    const b = Math.round(129 + t * (11 - 129));
    return `rgb(${r},${g},${b})`;
  }
  if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33;
    const r = Math.round(245 + t * (251 - 245));
    const g = Math.round(158 + t * (146 - 158));
    const b = Math.round(11 + t * (60 - 11));
    return `rgb(${r},${g},${b})`;
  }
  const t = (ratio - 0.66) / 0.34;
  const r = Math.round(251 - t * (7));
  const g = Math.round(146 - t * (83));
  const b = Math.round(60 - t * (2));
  return `rgb(${r},${g},${b})`;
}

export default function Diagram({ rods, result, materials }: Props) {
  const matColor = useMemo(() => {
    return (name: string, idx: number) => MAT_COLORS[name] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
  }, []);

  // Layout constants
  const svgW     = 800;
  const wallW    = 22;
  const plateW   = 30;
  const spacing  = 22;
  const ROD_H    = 44;

  const startX   = wallW + plateW;
  const endX     = 630;
  const rodLen   = endX - startX;

  const totalH   = rods.length * ROD_H + Math.max(0, rods.length - 1) * spacing;
  const svgH     = Math.max(280, totalH + 90);
  const offsetY  = (svgH - totalH) / 2;

  let cy = offsetY;
  const rodPositions = rods.map((r) => {
    const y = cy;
    cy += ROD_H + spacing;
    return { rod: r, y };
  });

  const stresses  = result?.rods.map((r) => r.stress) ?? [];
  const maxStress = Math.max(...stresses, 1);

  const commonDelta = result?.common_deformation ?? 0;
  const deformPx    = Math.min(Math.abs(commonDelta) * 1e4, 12);

  const arrowX1 = endX + plateW + 10;
  const arrowX2 = endX + plateW + 60;

  return (
    <section className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <p className="section-label">Visualization</p>
          <h2 className="text-base font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
            Structural Diagram
          </h2>
        </div>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <div
              className="px-3 py-1.5 rounded-lg flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.08))",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                δ
              </span>
              <span className="font-mono text-xs font-bold gradient-text">
                {result.common_deformation.toExponential(4)} m
              </span>
            </div>
            {/* Stress legend */}
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-bold" style={{ color: "var(--text-dim)" }}>LOW</span>
              <div
                className="w-16 h-2 rounded-full"
                style={{ background: "linear-gradient(90deg, #10B981, #F59E0B, #F43F5E)" }}
              />
              <span className="text-[8px] font-bold" style={{ color: "var(--text-dim)" }}>HIGH</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="overflow-auto rounded-xl" style={{ background: "rgba(5,5,16,0.4)" }}>
        <svg
          viewBox={`-60 0 ${svgW + 60} ${svgH}`}
          width="100%"
          style={{ minWidth: 380 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Engineering grid */}
            <pattern id="eng-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="30" stroke="rgba(99,102,241,0.05)" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="30" y2="0" stroke="rgba(99,102,241,0.05)" strokeWidth="0.5" />
            </pattern>
            {/* Wall hatch */}
            <pattern id="wall-hatch" patternUnits="userSpaceOnUse" width="8" height="8">
              <line x1="0" y1="0" x2="8" y2="8" stroke="rgba(99,102,241,0.35)" strokeWidth="1.5" />
            </pattern>
            {/* Right force arrow head (scaled down per user request) */}
            <marker id="force-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0,1.5 L9,5 L0,8.5 Z" fill="#22D3EE" />
            </marker>
            {/* Left reaction arrow head */}
            <marker id="reaction-arrow" markerWidth="14" markerHeight="14" refX="2" refY="7" orient="auto">
              <path d="M13,1 L0,7 L13,13 Z" fill="#22D3EE" />
            </marker>
            {/* Block gradients per rod (always retain material color) */}
            {rodPositions.map(({ rod }, idx) => {
              const baseColor = matColor(rod.material, idx);
              return (
                <linearGradient key={rod.id} id={`rod-grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={baseColor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={baseColor} stopOpacity={0.55} />
                </linearGradient>
              );
            })}
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          <rect width={svgW} height={svgH} fill="url(#eng-grid)" />

          {/* ── Fixed wall ── */}
          <rect
            x={0} y={offsetY - 16}
            width={wallW} height={totalH + 32}
            fill="url(#wall-hatch)"
          />
          <line
            x1={wallW} y1={offsetY - 20}
            x2={wallW} y2={offsetY + totalH + 20}
            stroke="rgba(99,102,241,0.7)" strokeWidth="2.5"
          />

          {/* ── Left rigid plate ── */}
          <rect
            x={wallW} y={offsetY - 18}
            width={plateW} height={totalH + 36}
            rx="6"
            fill="var(--accent)"
            opacity={0.75}
          />
          <rect
            x={wallW + 4} y={offsetY - 14}
            width={plateW - 8} height={totalH + 28}
            rx="4"
            fill="rgba(255,255,255,0.08)"
          />

          {/* ── Right rigid plate (animates with deformation) ── */}
          <motion.g
            animate={{ x: result ? deformPx : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <rect
              x={endX} y={offsetY - 18}
              width={plateW} height={totalH + 36}
              rx="6"
              fill="var(--accent)"
              opacity={0.75}
            />
            <rect
              x={endX + 4} y={offsetY - 14}
              width={plateW - 8} height={totalH + 28}
              rx="4"
              fill="rgba(255,255,255,0.08)"
            />
          </motion.g>

          {/* ── Rods ── */}
          {rodPositions.map(({ rod, y }, idx) => {
            const stress  = result?.rods[idx]?.stress;
            const labelY  = y + ROD_H / 2;
            const ratio   = stress ? stress / maxStress : 0;

            return (
              <g key={rod.id}>
                {/* Rod glow (only when stressed) */}
                {result && (
                  <motion.rect
                    x={startX} y={y - 2}
                    width={rodLen} height={ROD_H + 4}
                    rx="8"
                    fill={stressColor(ratio)}
                    fillOpacity={0.08}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.05, 0.12, 0.05] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    filter="url(#glow)"
                  />
                )}

                {/* Rod body */}
                <motion.rect
                  x={startX} y={y}
                  width={rodLen} height={ROD_H}
                  rx="6"
                  fill={`url(#rod-grad-${idx})`}
                  stroke={matColor(rod.material, idx)}
                  strokeWidth="1.2"
                  strokeOpacity={0.5}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  style={{ transformOrigin: `${startX}px ${y + ROD_H / 2}px` }}
                />

                {/* Rod name */}
                <motion.text
                  x={startX + rodLen / 2} y={labelY - 6}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#ffffff" fontSize="12" fontWeight="800"
                  fontFamily="Inter, sans-serif"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                >
                  {rod.name}
                </motion.text>

                {/* Material + stress */}
                <motion.text
                  x={startX + rodLen / 2} y={labelY + 10}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.6)" fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.4 }}
                >
                  {rod.material}
                  {stress !== undefined ? ` · σ = ${(stress / 1e6).toFixed(1)} MPa` : ""}
                </motion.text>

                {/* Connector dots */}
                <circle cx={startX} cy={labelY} r={3.5}
                  fill={matColor(rod.material, idx)}
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                />
                <circle cx={startX + rodLen} cy={labelY} r={3.5}
                  fill={matColor(rod.material, idx)}
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                />

                {/* Index label */}
                <text
                  x={wallW + plateW - 8} y={y + ROD_H / 2}
                  fill="rgba(255,255,255,0.35)" fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="end" dominantBaseline="middle"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* ── Length dimension line ── */}
          <g>
            <line
              x1={startX} y1={offsetY + totalH + 28}
              x2={endX} y2={offsetY + totalH + 28}
              stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3"
            />
            <line x1={startX} y1={offsetY + totalH + 24} x2={startX} y2={offsetY + totalH + 32}
              stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
            <line x1={endX} y1={offsetY + totalH + 24} x2={endX} y2={offsetY + totalH + 32}
              stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
            <text
              x={(startX + endX) / 2} y={offsetY + totalH + 40}
              textAnchor="middle" fill="rgba(99,102,241,0.5)"
              fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600"
            >
              L
            </text>
          </g>

          {/* ── Force Arrows (matching user reference image, scaled down) ── */}
          <motion.g
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Top Arrow (aligned with Rod 1) */}
            <line
              x1={arrowX1} y1={rodPositions[0]?.y + ROD_H / 2}
              x2={arrowX2} y2={rodPositions[0]?.y + ROD_H / 2}
              stroke="#22D3EE" strokeWidth="2.5"
              strokeLinecap="round"
              markerEnd="url(#force-arrow)"
            />
            
            {/* Bottom Arrow (aligned with the last rod) */}
            {rods.length > 1 && (
              <line
                x1={arrowX1} y1={rodPositions[rods.length - 1]?.y + ROD_H / 2}
                x2={arrowX2} y2={rodPositions[rods.length - 1]?.y + ROD_H / 2}
                stroke="#22D3EE" strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#force-arrow)"
              />
            )}

            {/* P Label in the middle */}
            <text
              x={arrowX2 + 10} y={svgH / 2 - 10}
              fill="#22D3EE" fontSize="18" fontWeight="900"
              textAnchor="middle" fontFamily="Inter, sans-serif"
            >
              P
            </text>
            
            {/* Load Value */}
            {result && (
              <text
                x={arrowX2 + 10} y={svgH / 2 + 10}
                fill="rgba(34,211,238,0.6)" fontSize="10"
                textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="600"
              >
                {(result.total_load / 1000).toFixed(1)} kN
              </text>
            )}
          </motion.g>
        </svg>
      </div>
    </section>
  );
}
