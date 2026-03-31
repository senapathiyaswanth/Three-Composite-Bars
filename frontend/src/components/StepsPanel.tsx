import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BlockMath, InlineMath } from "react-katex";
import { ChevronRight } from "lucide-react";
import "katex/dist/katex.min.css";

interface Props {
  steps: string[];
}

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

export default function StepsPanel({ steps }: Props) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set(steps.map((_, i) => i)));

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <section className="glass-card p-5 space-y-5">
      <header>
        <p className="section-label">Mathematical Derivation</p>
        <h2 className="text-base font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
          Step-by-Step Solution
        </h2>
      </header>

      <div className="space-y-3 relative">
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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative pl-10"
            >
              {/* Step number */}
              <motion.div
                className="absolute left-0 top-2 w-[36px] h-[36px] rounded-xl flex items-center justify-center text-[12px] font-black z-10"
                style={{
                  background: "var(--gradient-primary)",
                  color: "#fff",
                  boxShadow: "0 0 16px var(--accent-glow)",
                }}
                whileHover={{ scale: 1.1 }}
              >
                {i + 1}
              </motion.div>

              {/* Step card */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--rod-card-bg)",
                }}
              >
                {/* Header (clickable) */}
                <button
                  onClick={() => toggleStep(i)}
                  className="flex items-center justify-between w-full px-4 py-3 text-left transition-colors hover:bg-[rgba(99,102,241,0.04)]"
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

                {/* Body (expandable) */}
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
    </section>
  );
}
