"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Buildings,
  DownloadSimple,
  Envelope,
  MagnifyingGlass,
  MapPin,
  Phone,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { ConversationLog } from "@/lib/types";
import { useT } from "./providers/AppProviders";
import { Button, CopyButton, EmptyState, SectionHead, cx } from "./ui/primitives";

export default function LeadsPanel({
  logs,
  isFullPage = false,
  onSelectLog,
}: {
  logs: ConversationLog[];
  isFullPage?: boolean;
  onSelectLog?: (log: ConversationLog) => void;
}) {
  const t = useT();
  const [search, setSearch] = useState("");

  const leads = useMemo(
    () => logs.filter((l) => l.leadName || l.leadPhone || l.leadEmail || l.leadCompany),
    [logs]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter((l) =>
      [l.leadName, l.leadPhone, l.leadEmail, l.leadLocation, l.leadCompany, l.leadInterest]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [leads, search]);

  function exportAs(format: "csv" | "json") {
    window.open(`/api/leads/export?format=${format}`, "_blank", "noopener");
  }

  /* ---------------- compact rail ---------------- */
  if (!isFullPage) {
    return (
      <aside className="rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient">
        <div className="rounded-core border border-line/60 bg-panel shadow-inset">
          {/* A narrow rail cannot carry an icon, a title, a hint and a button on
              one line, so the button rides beside the title and the hint sits
              underneath at full width. */}
          <header className="border-b border-line px-5 pb-4 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-[0.95rem] font-semibold tracking-[-0.01em] text-paper">
                <UsersThree size={16} className="text-signal" />
                {t("leads.sideTitle")}
                <span className="font-mono text-[0.7rem] font-normal text-fog">{leads.length}</span>
              </h2>
              {leads.length > 0 ? (
                <button
                  type="button"
                  onClick={() => exportAs("csv")}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-panelCard px-2.5 py-1 text-[0.7rem] text-fog transition-colors hover:border-lineLight hover:text-paper"
                >
                  <DownloadSimple size={11} />
                  CSV
                </button>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-fog">{t("leads.sideSubtitle")}</p>
          </header>

          <div className="flex flex-col gap-2 p-4">
            <AnimatePresence initial={false}>
              {leads.length === 0 ? (
                <p className="px-1 py-8 text-center text-xs leading-relaxed text-fog">
                  {t("leads.emptyBody")}
                </p>
              ) : (
                leads.slice(0, 8).map((lead, index) => (
                  <motion.button
                    key={lead.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.03 }}
                    onClick={() => onSelectLog?.(lead)}
                    className="rounded-soft border border-line bg-panelCard px-3 py-2.5 text-left transition-all duration-300 ease-physical hover:border-signal/40 hover:bg-panelHover"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-medium text-paper">
                        {lead.leadName || t("leads.unnamed")}
                      </p>
                      <time className="shrink-0 font-mono text-[0.65rem] text-fog">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-[0.7rem] text-fog">
                      {[lead.leadPhone, lead.leadEmail, lead.leadCompany, lead.leadLocation]
                        .filter(Boolean)
                        .join(" · ") || t("field.none")}
                    </p>
                    {lead.leadInterest ? (
                      <span className="mt-2 inline-block max-w-full truncate rounded-full bg-signal/12 px-2 py-0.5 text-[0.65rem] text-signal">
                        {lead.leadInterest}
                      </span>
                    ) : null}
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>
    );
  }

  /* ---------------- full CRM ---------------- */
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient">
        <div className="rounded-core border border-line/60 bg-panel shadow-inset">
          <SectionHead
            title={t("leads.title")}
            hint={t("leads.subtitle", { n: leads.length })}
            icon={<UsersThree size={17} />}
            actions={
              <>
                <div className="relative hidden min-w-[15rem] md:block">
                  <MagnifyingGlass
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("leads.search")}
                    className="w-full rounded-full border border-line bg-panelCard py-2 pl-9 pr-4 text-xs text-paper placeholder-fog/70 focus:border-signal focus:outline-none"
                  />
                </div>
                <Button onClick={() => exportAs("csv")} leadingIcon={<DownloadSimple size={13} />}>
                  CSV
                </Button>
                <Button onClick={() => exportAs("json")} leadingIcon={<DownloadSimple size={13} />}>
                  JSON
                </Button>
              </>
            }
          />
        </div>
      </div>

      <div className="rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient">
        <div className="overflow-hidden rounded-core border border-line/60 bg-panel shadow-inset">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<UsersThree size={20} />}
              title={t("leads.empty")}
              body={t("leads.emptyBody")}
            />
          ) : (
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-micro uppercase tracking-[0.14em] text-fog">
                    <th className="px-5 py-3 font-medium">{t("leads.col.contact")}</th>
                    <th className="px-5 py-3 font-medium">{t("leads.col.reach")}</th>
                    <th className="px-5 py-3 font-medium">{t("leads.col.place")}</th>
                    <th className="px-5 py-3 font-medium">{t("leads.col.interest")}</th>
                    <th className="px-5 py-3 font-medium">{t("leads.col.language")}</th>
                    <th className="px-5 py-3 font-medium">{t("leads.col.captured")}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      className="transition-colors duration-200 hover:bg-panelCard/70"
                    >
                      <td className="px-5 py-4 align-top">
                        <span className="block font-medium text-paper">
                          {lead.leadName || t("leads.unnamed")}
                        </span>
                        <span className="font-mono text-[0.65rem] text-fog">#{lead.id}</span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          {lead.leadPhone ? (
                            <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-paper">
                              <Phone size={12} className="text-mint" />
                              {lead.leadPhone}
                            </span>
                          ) : null}
                          {lead.leadEmail ? (
                            <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-paper">
                              <Envelope size={12} className="text-sky" />
                              {lead.leadEmail}
                            </span>
                          ) : null}
                          {!lead.leadPhone && !lead.leadEmail ? (
                            <span className="text-fog">{t("field.none")}</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          {lead.leadLocation ? (
                            <span className="flex items-center gap-1.5 text-[0.7rem] text-fog">
                              <MapPin size={12} className="text-coral" />
                              {lead.leadLocation}
                            </span>
                          ) : null}
                          {lead.leadCompany ? (
                            <span className="flex items-center gap-1.5 text-[0.7rem] text-fog">
                              <Buildings size={12} className="text-signal" />
                              {lead.leadCompany}
                            </span>
                          ) : null}
                          {!lead.leadLocation && !lead.leadCompany ? (
                            <span className="text-fog">{t("field.none")}</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          {lead.leadInterest ? (
                            <span className="max-w-[12rem] truncate font-medium text-signal">
                              {lead.leadInterest}
                            </span>
                          ) : null}
                          {lead.leadBudget ? (
                            <span className="font-mono text-[0.65rem] text-fog">
                              {lead.leadBudget}
                            </span>
                          ) : null}
                          {!lead.leadInterest && !lead.leadBudget ? (
                            <span className="text-fog">{t("field.none")}</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-[0.7rem] text-fog">
                        {lead.detectedLanguage}
                      </td>
                      <td className="px-5 py-4 align-top font-mono text-[0.7rem] text-fog">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center justify-end gap-2">
                          {lead.leadPhone || lead.leadEmail ? (
                            <CopyButton
                              value={lead.leadPhone || lead.leadEmail}
                              copyLabel={t("action.copy")}
                              doneLabel={t("action.copied")}
                            />
                          ) : null}
                          <Button variant="quiet" onClick={() => onSelectLog?.(lead)}>
                            {t("action.viewThread")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
