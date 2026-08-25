import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090D12",
        panel: "#101620",
        panelCard: "#141C28",
        panelHover: "#182232",
        line: "#1D2838",
        lineLight: "#28374D",
        signal: "#FFB454",
        signalLight: "#FFD08A",
        mint: "#7EE8C6",
        mintDark: "#2FA683",
        coral: "#FF6B6B",
        coralDark: "#B83A3A",
        sky: "#38BDF8",
        violet: "#A78BFA",
        fog: "#8C9BB0",
        fogLight: "#B0C0D4",
        paper: "#EDEFF2",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        bangla: ["var(--font-bangla)", "var(--font-bengali)", "Hind Siliguri", "sans-serif"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.85)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(126, 232, 198, 0.25)" },
          "50%": { boxShadow: "0 0 24px rgba(126, 232, 198, 0.45)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
