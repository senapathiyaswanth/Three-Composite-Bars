import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Sun, Moon, Layers, Github, BarChart3, ListTree, LayoutDashboard } from "lucide-react";

interface Props {
  dark: boolean;
  onToggle: () => void;
  status: "idle" | "computing" | "solved";
  hasSolution: boolean;
}

const tabClass = (isActive: boolean, enabled: boolean) =>
  `relative px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-lg transition-all ${
    !enabled ? "opacity-40 pointer-events-none" : ""
  }`;

export default function TopBar({ dark, onToggle, status, hasSolution }: Props) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-50 w-full"
      style={{
        background: "var(--topbar-bg)",
        backdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 0 20px var(--accent-glow)",
            }}
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Layers className="w-4.5 h-4.5 text-white" />
          </motion.div>
          <div className="flex items-center gap-2.5">
            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              PROJECT
            </span>
            <span
              className="hidden md:inline text-base font-black tracking-wider"
              style={{ color: "var(--text-primary)" }}
            >
              THREE COMPOSITE BARS
            </span>
          </div>
        </div>

        {/* Center: Status + Tab Navigation */}
        <div className="hidden sm:flex items-center gap-4">
          <span className={`status-badge status-badge--${status}`}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: status === "computing" ? "var(--accent)"
                  : status === "solved" ? "var(--accent-emerald)"
                  : "var(--text-dim)",
              }}
            />
            {status === "computing" ? "Computing..." : status === "solved" ? "Solved" : "Ready"}
          </span>

          {/* Tab navigation */}
          <nav
            className="flex items-center p-1 rounded-xl"
            style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
          >
            <NavLink to="/" end>
              {({ isActive }) => (
                <span className={tabClass(isActive, true)}
                  style={{ color: isActive ? "#ffffff" : "var(--text-secondary)" }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                  {isActive && (
                    <motion.div
                      layoutId="nav-tab-bg"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "var(--gradient-primary)", zIndex: -1, boxShadow: "0 0 12px var(--accent-glow)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </span>
              )}
            </NavLink>

            <NavLink to="/graphs">
              {({ isActive }) => (
                <span className={tabClass(isActive, hasSolution)}
                  style={{ color: isActive ? "#ffffff" : "var(--text-secondary)" }}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Graph View
                  {isActive && (
                    <motion.div
                      layoutId="nav-tab-bg"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "var(--gradient-primary)", zIndex: -1, boxShadow: "0 0 12px var(--accent-glow)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </span>
              )}
            </NavLink>

            <NavLink to="/steps">
              {({ isActive }) => (
                <span className={tabClass(isActive, hasSolution)}
                  style={{ color: isActive ? "#ffffff" : "var(--text-secondary)" }}
                >
                  <ListTree className="w-3.5 h-3.5" />
                  Step-by-Step
                  {isActive && (
                    <motion.div
                      layoutId="nav-tab-bg"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "var(--gradient-primary)", zIndex: -1, boxShadow: "0 0 12px var(--accent-glow)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </span>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <a
            href="https://github.com/senapathiyaswanth"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !p-2 !rounded-lg"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <motion.button
            onClick={onToggle}
            className="btn-ghost !p-2 !rounded-lg"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            whileTap={{ scale: 0.9, rotate: dark ? 180 : -180 }}
            transition={{ duration: 0.3 }}
          >
            {dark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
