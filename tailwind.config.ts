import type { Config } from "tailwindcss";

/**
 * Every colour is a CSS custom property holding a bare `R G B` triplet, so the
 * same utility class (`bg-panel`, `text-fog/70`) resolves correctly in both the
 * light and the dark theme without duplicating a single class name in the JSX.
 */
function token(name: string) {
  return `rgb(var(${name}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: token("--c-ink"),
        panel: token("--c-panel"),
        panelCard: token("--c-panel-card"),
        panelHover: token("--c-panel-hover"),
        line: token("--c-line"),
        lineLight: token("--c-line-light"),
        signal: token("--c-signal"),
        signalSoft: token("--c-signal-soft"),
        onSignal: token("--c-on-signal"),
        mint: token("--c-mint"),
        coral: token("--c-coral"),
        sky: token("--c-sky"),
        violet: token("--c-violet"),
        blush: token("--c-blush"),
        honey: token("--c-honey"),
        fog: token("--c-fog"),
        fogLight: token("--c-fog-light"),
        paper: token("--c-paper"),
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        bangla: ["var(--font-bangla)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        micro: ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.09em" }],
      },
      borderRadius: {
        shell: "1.75rem",
        core: "1.375rem",
        card: "1rem",
        soft: "0.625rem",
      },
      boxShadow: {
        // Tinted, never pure black — shadows carry the hue of the surface.
        ambient: "0 1px 2px rgb(var(--c-shadow) / 0.05), 0 8px 24px -12px rgb(var(--c-shadow) / 0.16)",
        lifted: "0 2px 4px rgb(var(--c-shadow) / 0.06), 0 18px 40px -16px rgb(var(--c-shadow) / 0.26)",
        island: "0 1px 1px rgb(var(--c-shadow) / 0.04), 0 14px 44px -18px rgb(var(--c-shadow) / 0.35)",
        inset: "inset 0 1px 0 rgb(var(--c-inner-light) / 0.55)",
        none: "none",
      },
      transitionTimingFunction: {
        physical: "cubic-bezier(0.32, 0.72, 0, 1)",
        settle: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.85)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(3%, -4%, 0) scale(1.08)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "rise-in": "rise-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        drift: "drift 26s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        shimmer: "shimmer 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
