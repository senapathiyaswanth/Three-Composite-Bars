import { motion } from "framer-motion";
import { BarChart3, ListTree } from "lucide-react";

interface Props {
  view: "graph" | "steps";
  onChange: (view: "graph" | "steps") => void;
}

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="flex justify-center -mb-2 mt-2">
      <div 
        className="glass-card flex items-center p-1.5 rounded-2xl relative"
        style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
      >
        <button
          onClick={() => onChange("graph")}
          className="relative px-6 py-2.5 text-sm font-bold z-10 flex items-center gap-2 rounded-xl transition-colors"
          style={{ color: view === "graph" ? "#ffffff" : "var(--text-secondary)" }}
        >
          <BarChart3 className="w-4 h-4" />
          Graph View
          {view === "graph" && (
            <motion.div
              layoutId="toggle-bg"
              className="absolute inset-0 rounded-xl"
              style={{ background: "var(--gradient-primary)", zIndex: -1, boxShadow: "0 0 16px var(--accent-glow)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
        </button>

        <button
          onClick={() => onChange("steps")}
          className="relative px-6 py-2.5 text-sm font-bold z-10 flex items-center gap-2 rounded-xl transition-colors"
          style={{ color: view === "steps" ? "#ffffff" : "var(--text-secondary)" }}
        >
          <ListTree className="w-4 h-4" />
          Step-by-Step
          {view === "steps" && (
            <motion.div
              layoutId="toggle-bg"
              className="absolute inset-0 rounded-xl"
              style={{ background: "var(--gradient-primary)", zIndex: -1, boxShadow: "0 0 16px var(--accent-glow)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
