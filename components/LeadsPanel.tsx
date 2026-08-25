"use client";
import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ConversationLog } from "@/lib/types";
import {
  Users,
  Download,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Tag,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

export default function LeadsPanel({
  logs,
  isFullPage = false,
  onSelectLog,
}: {
  logs: ConversationLog[];
  isFullPage?: boolean;
  onSelectLog?: (log: ConversationLog) => void;
}) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const leads = useMemo(() => {
    return logs.filter(
      (l) => l.leadName || l.leadPhone || l.leadEmail || l.leadCompany
    );
  }, [logs]);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.leadName?.toLowerCase().includes(q) ||
        l.leadPhone?.toLowerCase().includes(q) ||
        l.leadEmail?.toLowerCase().includes(q) ||
        l.leadLocation?.toLowerCase().includes(q) ||
        l.leadCompany?.toLowerCase().includes(q) ||
        l.leadInterest?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleExport(format: "csv" | "json") {
    window.open(`/api/leads/export?format=${format}`, "_blank");
  }

  // --- 1. Compact Sidebar View ---
  if (!isFullPage) {
    return (
      <div className="rounded-xl border border-line bg-panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold text-paper flex items-center gap-1.5">
              <Users className="h-4 w-4 text-signal" />
              Captured Leads
            </h2>
            <p className="mt-0.5 text-[11px] text-fog">Auto-extracted entities ({leads.length})</p>
          </div>
          {leads.length > 0 && (
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-1 rounded border border-line bg-panelCard px-2 py-1 text-[10px] text-fog hover:text-paper"
              title="Export leads to CSV"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          )}
        </div>

        <div className="mt-3.5 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {leads.length === 0 ? (
              <div className="py-8 text-center text-xs text-fog">
                <p>No leads captured yet.</p>
                <p className="mt-1 text-[10px]">Mention a name, phone, or email to see it here.</p>
              </div>
            ) : (
              leads.slice(0, 8).map((l) => (
                <motion.div
                  key={l.id}
                  onClick={() => onSelectLog?.(l)}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className="group cursor-pointer rounded-lg border border-line bg-panelCard p-2.5 text-xs transition-colors hover:border-signal/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-paper">{l.leadName || "Unnamed Lead"}</p>
                    <span className="font-mono text-[10px] text-fog">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-fog truncate">
                    {[l.leadPhone, l.leadEmail, l.leadCompany, l.leadLocation].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {l.leadInterest && (
                    <span className="mt-1.5 inline-block rounded bg-line px-1.5 py-0.5 font-mono text-[9px] text-signal truncate max-w-full">
                      {l.leadInterest}
                    </span>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- 2. Full Page CRM Table View ---
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-signal">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-paper">
              Leads CRM & Contact Management
            </h2>
            <p className="text-xs text-fog">
              Total {leads.length} qualified leads extracted from Messenger conversations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-fog" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, phone…"
              className="w-full rounded-lg border border-line bg-panelCard pl-9 pr-3 py-1.5 text-xs text-paper placeholder-fog/60 focus:border-signal focus:outline-none"
            />
          </div>

          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panelCard px-3 py-2 text-xs font-medium text-paper transition-colors hover:border-signal hover:text-signal"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panelCard px-3 py-2 text-xs font-medium text-paper transition-colors hover:border-signal hover:text-signal"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="scrollbar-thin overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="w-full text-left text-xs text-paper">
          <thead className="border-b border-line bg-panelCard text-[11px] uppercase tracking-wider text-fog">
            <tr>
              <th className="px-4 py-3">Lead Contact</th>
              <th className="px-4 py-3">Phone & Email</th>
              <th className="px-4 py-3">Location & Company</th>
              <th className="px-4 py-3">Interest & Budget</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">Captured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-fog">
                  No captured leads matching search criteria.
                </td>
              </tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-panelCard/60">
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-paper block">{l.leadName || "Unnamed Lead"}</span>
                    <span className="font-mono text-[10px] text-fog">ID: #{l.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      {l.leadPhone ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-mint" />
                          <span>{l.leadPhone}</span>
                          <button
                            onClick={() => copy(l.leadPhone, `phone-${l.id}`)}
                            className="text-fog hover:text-paper"
                          >
                            {copiedId === `phone-${l.id}` ? (
                              <Check className="h-3 w-3 text-mint" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-fog">—</span>
                      )}

                      {l.leadEmail ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Mail className="h-3 w-3 text-sky" />
                          <span>{l.leadEmail}</span>
                          <button
                            onClick={() => copy(l.leadEmail, `email-${l.id}`)}
                            className="text-fog hover:text-paper"
                          >
                            {copiedId === `email-${l.id}` ? (
                              <Check className="h-3 w-3 text-mint" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      {l.leadLocation && (
                        <span className="flex items-center gap-1 text-[11px] text-fog">
                          <MapPin className="h-3 w-3 text-coral" />
                          {l.leadLocation}
                        </span>
                      )}
                      {l.leadCompany && (
                        <span className="flex items-center gap-1 text-[11px] text-fog">
                          <Building className="h-3 w-3 text-signal" />
                          {l.leadCompany}
                        </span>
                      )}
                      {!l.leadLocation && !l.leadCompany && <span className="text-fog">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      {l.leadInterest && (
                        <span className="font-medium text-signal truncate max-w-[180px]">
                          {l.leadInterest}
                        </span>
                      )}
                      {l.leadBudget && (
                        <span className="font-mono text-[10px] text-fog">
                          Budget: {l.leadBudget}
                        </span>
                      )}
                      {!l.leadInterest && !l.leadBudget && <span className="text-fog">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-fog">
                    {l.detectedLanguage}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-fog">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onSelectLog?.(l)}
                      className="rounded-md border border-line bg-panel px-2.5 py-1 text-[11px] font-medium text-fog hover:border-signal hover:text-paper"
                    >
                      View Chat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
