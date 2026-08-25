"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Sparkles,
  BarChart3,
  Users,
  BookOpen,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

export type NavTab = "live" | "analytics" | "leads" | "knowledge" | "settings";

export default function StatusHeader({
  activeTab,
  onTabChange,
  onOpenSimulator,
  soundEnabled,
  onToggleSound,
}: {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSimulator: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const tabs = [
    { id: "live", label: "Live Stream", icon: Activity },
    { id: "analytics", label: "Analytics & Trends", icon: BarChart3 },
    { id: "leads", label: "Leads CRM", icon: Users },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
    { id: "settings", label: "Webhook & Settings", icon: Settings },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-col border-b border-line bg-panel/70 px-4 backdrop-blur-md md:px-8"
    >
      {/* Top row: Brand + Simulator + Audio */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-mint" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base font-bold tracking-tight text-paper md:text-lg">
                BhashaBot
              </h1>
              <span className="rounded bg-mint/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-mint">
                SIGNAL ROOM
              </span>
            </div>
            <p className="text-[11px] text-fog">
              Multilingual AI Messenger auto-reply, sentiment & human-handoff console
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Sound alert toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
              soundEnabled
                ? "border-mint/40 bg-mint/10 text-mint"
                : "border-line bg-panelCard text-fog hover:text-paper"
            }`}
            title={soundEnabled ? "Audio chime enabled" : "Audio chime muted"}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Muted"}</span>
          </button>

          {/* Interactive Live Simulator Button */}
          <button
            type="button"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-1.5 font-body text-xs font-semibold text-ink transition-all hover:bg-signalLight active:scale-95 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Test Playground</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Tab Navigation */}
      <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-thin">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id as NavTab)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-panelCard text-paper border border-lineLight shadow-xs"
                  : "text-fog hover:bg-panelCard/50 hover:text-paper"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-mint" : "text-fog"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </motion.header>
  );
}
