"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { ConversationLog } from "@/lib/types";

export default function LeadsPanel({ logs }: { logs: ConversationLog[] }) {
  const leads = logs.filter(
    (l) => l.leadName || l.leadPhone || l.leadEmail || l.leadCompany
  );

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h2 className="font-display text-sm font-medium text-paper">Leads captured</h2>
      <p className="mt-0.5 text-xs text-fog">Auto-extracted from conversations</p>
      <div className="mt-3 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {leads.length === 0 && (
            <p className="py-4 text-center text-xs text-fog">None yet</p>
          )}
          {leads.slice(0, 6).map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="rounded-lg border border-line px-3 py-2 text-xs"
            >
              <p className="font-medium text-paper">{l.leadName || "Unnamed"}</p>
              <p className="mt-0.5 text-fog">
                {[l.leadPhone, l.leadEmail, l.leadCompany].filter(Boolean).join(" · ") || "—"}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
