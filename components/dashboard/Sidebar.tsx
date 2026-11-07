"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Broadcast,
  ChartBar,
  Heart,
  MagnifyingGlass,
  Notebook,
  PenNib,
  SlidersHorizontal,
  Terminal,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import Logo from "../Logo";
import { useT } from "../providers/AppProviders";
import { cx } from "../ui/primitives";
import type { TranslationKey } from "@/lib/i18n";

export type NavTab = "live" | "analytics" | "leads" | "knowledge" | "settings";

type Item = { label: TranslationKey; icon: Icon } & ({ tab: NavTab } | { href: string });

const GROUPS: Array<{ title: TranslationKey; items: Item[] }> = [
  {
    title: "dash.menu",
    items: [
      { tab: "live", icon: Broadcast, label: "nav.live" },
      { tab: "analytics", icon: ChartBar, label: "nav.analytics" },
      { tab: "leads", icon: UsersThree, label: "nav.leads" },
    ],
  },
  {
    title: "dash.workspace",
    items: [
      { tab: "knowledge", icon: Notebook, label: "nav.knowledge" },
      { href: "/moods", icon: Heart, label: "nav.moods" },
      { href: "/servers", icon: Terminal, label: "nav.servers" },
    ],
  },
  {
    title: "dash.tools",
    items: [{ tab: "settings", icon: SlidersHorizontal, label: "nav.settings" }],
  },
];

const ITEM =
  "relative flex w-full items-center gap-3 rounded-card px-3.5 py-2.5 text-[0.8rem] font-medium transition-colors duration-300 ease-physical";

export default function Sidebar({
  activeTab,
  onTabChange,
  onOpenStudio,
  onOpenPalette,
}: {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenStudio: () => void;
  onOpenPalette: () => void;
}) {
  const t = useT();

  return (
    <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-60 shrink-0 flex-col rounded-shell border border-line/70 bg-panel p-4 shadow-ambient lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-2 pb-6 pt-1">
        <Logo size={30} className="rounded-soft" />
        <span className="font-display text-base font-semibold tracking-[-0.02em] text-paper">{t("app.name")}</span>
      </Link>

      <nav aria-label={t("app.name")} className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-micro font-semibold uppercase text-fogLight">{t(group.title)}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              if ("href" in item) {
                return (
                  <Link key={item.href} href={item.href} className={cx(ITEM, "text-fog hover:bg-panelCard hover:text-paper")}>
                    <Icon size={17} />
                    {t(item.label)}
                  </Link>
                );
              }
              const active = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onTabChange(item.tab)}
                  aria-current={active ? "page" : undefined}
                  className={cx(ITEM, active ? "text-onSignal" : "text-fog hover:bg-panelCard hover:text-paper")}
                >
                  {active ? (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute inset-0 rounded-card bg-signal shadow-[0_8px_20px_-8px_rgb(var(--c-signal)/0.7)]"
                    />
                  ) : null}
                  <Icon size={17} weight={active ? "fill" : "regular"} className="relative z-10" />
                  <span className="relative z-10">{t(item.label)}</span>
                </button>
              );
            })}
          </div>
        ))}

        <button type="button" onClick={onOpenPalette} className={cx(ITEM, "text-fog hover:bg-panelCard hover:text-paper")}>
          <MagnifyingGlass size={17} />
          {t("action.command")}
          <kbd className="ml-auto rounded border border-line px-1.5 font-mono text-[0.6rem]">Ctrl K</kbd>
        </button>
      </nav>

      {/* Dark promo card, the "Upgrade Pro" slot of the reference, repurposed for the studio. */}
      <div className="beam-border relative mt-4 overflow-hidden rounded-core bg-[#16140f] p-4 text-white">
        <PenNib size={120} weight="fill" className="pointer-events-none absolute -bottom-6 -right-6 text-white/[0.06]" />
        <span className="flex h-8 w-8 items-center justify-center rounded-soft bg-white/10">
          <PenNib size={15} weight="fill" />
        </span>
        <p className="mt-3 font-display text-base font-semibold">{t("dash.studio.title")}</p>
        <p className="mt-1 text-[0.7rem] leading-relaxed text-white/60">{t("dash.studio.body")}</p>
        <button
          type="button"
          onClick={onOpenStudio}
          className="relative mt-4 w-full rounded-card bg-signal py-2.5 text-xs font-semibold text-onSignal transition-transform duration-300 ease-physical hover:scale-[1.02] active:scale-[0.98]"
        >
          {t("action.playground")}
        </button>
      </div>
    </aside>
  );
}

/** Below lg the sidebar collapses into a scrolling pill row. */
export function MobileTabs({ activeTab, onTabChange }: { activeTab: NavTab; onTabChange: (tab: NavTab) => void }) {
  const t = useT();
  const tabs = GROUPS.flatMap((g) => g.items).filter((i): i is Item & { tab: NavTab } => "tab" in i);
  return (
    <nav className="scrollbar-thin -mx-1 flex gap-1 overflow-x-auto px-1 lg:hidden">
      {tabs.map(({ tab, label, icon: Icon }) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          aria-current={activeTab === tab ? "page" : undefined}
          className={cx(
            "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium",
            activeTab === tab ? "bg-signal text-onSignal" : "bg-panel text-fog"
          )}
        >
          <Icon size={14} />
          {t(label)}
        </button>
      ))}
    </nav>
  );
}
