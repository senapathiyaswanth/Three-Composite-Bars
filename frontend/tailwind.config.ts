import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: "#6366F1", 50: "#EEF2FF", 600: "#4F46E5", 700: "#4338CA" },
        surface:  { DEFAULT: "#1E1E2E", light: "#F8FAFC" },
        glass:    { DEFAULT: "rgba(255,255,255,0.08)", light: "rgba(255,255,255,0.60)" },
        border:   { DEFAULT: "rgba(255,255,255,0.12)", light: "rgba(0,0,0,0.08)" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backdropBlur: { glass: "12px" },
      boxShadow: {
        glass:  "0 4px 30px rgba(0,0,0,0.20)",
        glow:   "0 0 20px rgba(99,102,241,0.35)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-up": "fadeUp 0.4s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
