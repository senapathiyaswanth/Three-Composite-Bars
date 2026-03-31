import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BlockMath, InlineMath } from "react-katex";
import { ChevronRight, ArrowLeft, ListTree } from "lucide-react";
import "katex/dist/katex.min.css";
import { useSolverContext } from "@/context/SolverContext";

function parseStep(raw: string): { title: string; body: string } {
  const nl = raw.indexOf("\n");
  if (nl === -1) return { title: raw.trim(), body: "" };
  return { title: raw.slice(0, nl).trim(), body: raw.slice(nl + 1).trim() };
}

function renderRichText(text: string) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      return <BlockMath key={i}>{part.slice(2, -2)}</BlockMath>;
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={i}>{part.slice(1, -1)}</InlineMath>;
    }
    const textParts = part.split(/(\*\*[\s\S]*?\*\*)/g);
    return (
      <span key={i}>
        {textParts.map((t, j) => {
          if (t.startsWith("**") && t.endsWith("**")) {
            return (
              <strong key={j} className="font-bold" style={{ color: "var(--text-primary)" }}>
                {t.slice(2, -2)}
              </strong>
            );
          }
          return t;
        })}
      </span>
    );
  });
}

export default function StepsPage() {
  const { result } = useSolverContext();
  const navigate = useNavigate();

  if (!result || !result.steps?.length) {
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
          <ListTree className="w-7 h-7" style={{ color: "var(--accent)" }} />
        </motion.div>
        <div className="text-center">
          <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            No Solution Available
          </p>
          <p className="text-xs mt-2 max-w-[340px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Solve a problem on the Dashboard first to see the step-by-step solution here.
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

  return <StepsContent steps={result.steps} />;
}

function StepsContent({ steps }: { steps: string[] }) {
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set(steps.map((_, i) => i)));
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const scrollToStep = (idx: number) => {
    setActiveStep(idx);
    if (!expandedSteps.has(idx)) {
      setExpandedSteps((prev) => new Set(prev).add(idx));
    }
    stepRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="section-label">Mathematical Derivation</p>
        <h1 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>
          Step-by-Step Solution
        </h1>
      </motion.div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* ── Left: Step sub-navigation ── */}
        <motion.nav
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:sticky lg:top-[80px] glass-card p-4 space-y-1.5"
        >
          <p className="section-label mb-3">Navigate Steps</p>
          {steps.map((raw, i) => {
            const { title } = parseStep(raw);
            const isActive = activeStep === i;
            return (
              <motion.button
                key={i}
                onClick={() => scrollToStep(i)}
                className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all text-xs"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.08))"
                    : "transparent",
                  border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                }}
                whileHover={{ x: 2 }}
              >
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{
                    background: isActive ? "var(--gradient-primary)" : "rgba(99,102,241,0.1)",
                    color: isActive ? "#fff" : "var(--accent)",
                    boxShadow: isActive ? "0 0 12px var(--accent-glow)" : "none",
                  }}
                >
                  {i + 1}
                </span>
                <span className="font-semibold truncate">
                  {title.replace(/^###\s*/, "")}
                </span>
              </motion.button>
            );
          })}
        </motion.nav>

        {/* ── Right: Step cards ── */}
        <div className="space-y-4 relative">
          {/* Timeline line */}
          {steps.length > 1 && (
            <div
              className="absolute left-[17px] top-[24px] w-[2px]"
              style={{
                height: `calc(100% - 48px)`,
                background: "linear-gradient(180deg, var(--accent) 0%, rgba(99,102,241,0.08) 100%)",
              }}
            />
          )}

          {steps.map((raw, i) => {
            const { title, body } = parseStep(raw);
            const isExpanded = expandedSteps.has(i);

            return (
              <motion.div
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="relative pl-10"
              >
                {/* Step number */}
                <motion.div
                  className="absolute left-0 top-2 w-[36px] h-[36px] rounded-xl flex items-center justify-center text-[12px] font-black z-10"
                  style={{
                    background: activeStep === i ? "var(--gradient-primary)" : "rgba(99,102,241,0.15)",
                    color: "#fff",
                    boxShadow: activeStep === i ? "0 0 16px var(--accent-glow)" : "none",
                  }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setActiveStep(i)}
                >
                  {i + 1}
                </motion.div>

                {/* Step card */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: activeStep === i
                      ? "1px solid rgba(99,102,241,0.3)"
                      : "1px solid var(--border)",
                    background: "var(--rod-card-bg)",
                  }}
                >
                  <button
                    onClick={() => toggleStep(i)}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors hover:bg-[rgba(99,102,241,0.04)]"
                    style={{
                      borderBottom: isExpanded && body ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    <span className="font-bold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                      {title.replace(/^###\s*/, "")}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--text-dim)" }} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && body && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          className="px-5 py-4 text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {renderRichText(body)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
