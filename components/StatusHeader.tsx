"use client";
import { motion } from "framer-motion";

export default function StatusHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex items-center justify-between border-b border-line px-6 py-5 md:px-10"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-mint" />
        </span>
        <div>
          <h1 className="font-display text-lg font-medium tracking-tight md:text-xl">
            Signal Room
          </h1>
          <p className="text-xs text-fog">Multilingual Messenger auto-reply, live</p>
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        {["Messenger", "Groq LLM", "Telegram handoff"].map((c) => (
          <span
            key={c}
            className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-fog"
          >
            {c}
          </span>
        ))}
      </div>
    </motion.header>
  );
}
