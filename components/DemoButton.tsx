"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DemoButton({ onSent }: { onSent?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function trigger() {
    setLoading(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      onSent?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      onClick={trigger}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={loading}
      className="rounded-lg bg-signal px-4 py-2 font-body text-sm font-medium text-ink disabled:opacity-60"
    >
      {loading ? "Sending…" : "Send test message"}
    </motion.button>
  );
}
