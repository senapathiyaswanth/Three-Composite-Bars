import { motion, AnimatePresence } from "framer-motion";

import InputPanel from "@/components/InputPanel";
import Diagram from "@/components/Diagram";
import ResultsPanel from "@/components/ResultsPanel";
import { useMaterials } from "@/hooks";
import { useSolverContext } from "@/context/SolverContext";

export default function App() {
  const { materials }              = useMaterials();
  const { rods, setRods, totalLoad, setTotalLoad, length, setLength, result, loading, run } = useSolverContext();

  const handleSolve = async (save: boolean) => {
    await run(rods, totalLoad, length, save);
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }),
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6">

      {/* Main dashboard grid */}
      <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">

        {/* ── LEFT: sticky input panel + credit ── */}
        <div className="lg:sticky lg:top-[72px] space-y-4">
          <InputPanel
            rods={rods}
            setRods={setRods}
            totalLoad={totalLoad}
            setTotalLoad={setTotalLoad}
            length={length}
            setLength={setLength}
            materials={materials}
            onSolve={handleSolve}
            loading={loading}
          />
          <div className="px-1">
            <p className="text-sm font-bold tracking-wide gradient-text">
              Done by SENAPATHI YASWANTH (RA17)
            </p>
          </div>
        </div>

        {/* ── RIGHT: diagram + results ── */}
        <div className="space-y-6">
          {/* Structural diagram — always visible */}
          <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
            <Diagram rods={rods} result={result} materials={materials} />
          </motion.div>

          {/* Results section — when solved */}
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="has-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
                  <ResultsPanel result={result} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-14 flex flex-col items-center justify-center text-center gap-5"
                style={{ minHeight: 220 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 17H15M9 13H15M12 3L2 8L12 13L22 8L12 3ZM2 16L12 21L22 16"
                      stroke="var(--accent)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
                <div>
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                    Ready to Simulate
                  </p>
                  <p
                    className="text-xs mt-2 max-w-[300px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Configure the composite bar system on the left panel, then press{" "}
                    <strong className="gradient-text">Solve Problem</strong> to compute.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
