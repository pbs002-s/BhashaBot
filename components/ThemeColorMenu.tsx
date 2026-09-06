"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Desktop, Moon, PaintBrush, Sun } from "@phosphor-icons/react/dist/ssr";
import { ACCENT_COLORS, useTheme, type AccentColor } from "./providers/AppProviders";
import { cx } from "./ui/primitives";
import type { ThemePreference } from "@/lib/settings-schema";

export default function ThemeColorMenu({
  compact = false,
  align = "right",
}: {
  compact?: boolean;
  align?: "left" | "right";
}) {
  const { preference, resolved, setPreference, color, setColor } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentColor = ACCENT_COLORS.find((c) => c.id === color) || ACCENT_COLORS[0];

  const modes: Array<{ id: ThemePreference; label: string; icon: React.ComponentType<any> }> = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "Auto", icon: Desktop },
  ];

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Theme and color palette settings"
        className={cx(
          "inline-flex items-center gap-2 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog shadow-ambient transition-all duration-300 ease-physical hover:border-lineLight hover:bg-panelHover hover:text-paper active:scale-95",
          compact && "px-2.5 py-1.5"
        )}
      >
        {/* Active accent dot */}
        <span
          className="relative flex h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: currentColor.swatch }}
        >
          <span
            className="absolute -inset-0.5 animate-pulse-dot rounded-full opacity-40"
            style={{ backgroundColor: currentColor.swatch }}
          />
        </span>

        {/* Current mode icon */}
        <span className="text-paper">
          {resolved === "dark" ? <Moon size={13} weight="fill" /> : <Sun size={13} weight="fill" />}
        </span>

        {!compact && (
          <span className="hidden text-[0.76rem] font-medium sm:inline">
            {currentColor.label}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className={cx(
              "absolute z-50 mt-2 w-64 origin-top rounded-card border border-line bg-panel/95 p-3 shadow-island backdrop-blur-xl",
              align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
            )}
          >
            {/* Mode selection row */}
            <div className="mb-3">
              <div className="mb-1.5 flex items-center justify-between text-micro font-semibold uppercase tracking-[0.16em] text-fog">
                <span>Theme Mode</span>
                <span className="capitalize text-fogLight">{preference}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-full border border-line bg-panelCard p-1">
                {modes.map((m) => {
                  const active = preference === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPreference(m.id)}
                      className={cx(
                        "flex items-center justify-center gap-1.5 rounded-full py-1 text-[0.72rem] font-medium transition-all duration-200",
                        active
                          ? "bg-panel text-paper shadow-ambient"
                          : "text-fog hover:text-paper"
                      )}
                    >
                      <Icon size={12} weight={active ? "fill" : "regular"} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Palette selection */}
            <div>
              <div className="mb-2 flex items-center justify-between border-t border-line/60 pt-2.5 text-micro font-semibold uppercase tracking-[0.16em] text-fog">
                <span className="flex items-center gap-1.5">
                  <PaintBrush size={12} />
                  <span>Accent Tone</span>
                </span>
                <span className="text-[0.7rem] capitalize text-signal font-mono">
                  {currentColor.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {ACCENT_COLORS.map((c) => {
                  const active = color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={cx(
                        "flex items-center gap-2 rounded-soft border px-2.5 py-1.5 text-left text-xs transition-all duration-200",
                        active
                          ? "border-lineLight bg-panelCard text-paper shadow-sm"
                          : "border-transparent text-fog hover:border-line hover:bg-panelCard/60 hover:text-paper"
                      )}
                    >
                      <span
                        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full shadow-inner"
                        style={{ backgroundColor: c.swatch }}
                      >
                        {active && (
                          <Check size={9} weight="bold" className="text-onSignal" />
                        )}
                      </span>
                      <span className="truncate text-[0.74rem] font-medium">
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
