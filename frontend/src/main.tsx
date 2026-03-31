import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SolverProvider } from "@/context/SolverContext";
import App from "./App";
import GraphPage from "@/pages/GraphPage";
import StepsPage from "@/pages/StepsPage";
import Layout from "@/components/Layout";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SolverProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<App />} />
            <Route path="graphs" element={<GraphPage />} />
            <Route path="steps" element={<StepsPage />} />
          </Route>
        </Routes>
      </SolverProvider>
    </BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1A1A2E",
          color: "#F1F5F9",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "12px",
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
        },
      }}
    />
  </React.StrictMode>
);
