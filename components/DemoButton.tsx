"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

export default function DemoButton({ onSent }: { onSent?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function trigger() {
    setLoading(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      onSent?.();
    } catch (err) {
      console.error("Seed error:", err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }

  return (
    <motion.button
      onClick={trigger}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/15 px-3.5 py-1.5 font-body text-xs font-medium text-signal transition-all hover:bg-signal/25 hover:border-signal active:scale-95 disabled:opacity-50"
      title="Fires a random realistic multilingual customer message into the webhook"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      <span>{loading ? "Simulating…" : "Fire Test Event"}</span>
    </motion.button>
  );
}
