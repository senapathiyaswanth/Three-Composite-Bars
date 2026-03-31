import { Outlet } from "react-router-dom";
import TopBar from "@/components/TopBar";
import { useDarkMode } from "@/hooks";
import { useSolverContext } from "@/context/SolverContext";

export default function Layout() {
  const { dark, toggle } = useDarkMode();
  const { result, loading } = useSolverContext();

  const solverStatus = loading ? "computing" : result ? "solved" : "idle";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <TopBar dark={dark} onToggle={toggle} status={solverStatus} hasSolution={!!result} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
