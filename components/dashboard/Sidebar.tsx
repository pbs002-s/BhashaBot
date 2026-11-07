"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
const TABS: readonly NavTab[] = ["live", "analytics", "leads", "knowledge", "settings"];

/** Desk events the sidebar sends to the desk page when it is the current route. */
export const STUDIO_EVENT = "bhashabot:studio";
export const PALETTE_EVENT = "bhashabot:palette";

export function parseTab(value: string | null): NavTab {
  return TABS.find((tab) => tab === value) ?? "live";
}

export function tabHref(tab: NavTab): string {
  return tab === "live" ? "/desk" : `/desk?tab=${tab}`;
}

interface Item {
  label: TranslationKey;
  icon: Icon;
  href: string;
  /** Route prefix that marks this item active. */
  path: string;
  /** For /desk items: which tab marks it active. */
  tab?: NavTab;
}

const GROUPS: Array<{ title: TranslationKey; items: Item[] }> = [
  {
    title: "dash.menu",
    items: [
      { tab: "live", icon: Broadcast, label: "nav.live", path: "/desk", href: tabHref("live") },
      { tab: "analytics", icon: ChartBar, label: "nav.analytics", path: "/desk", href: tabHref("analytics") },
      { tab: "leads", icon: UsersThree, label: "nav.leads", path: "/desk", href: tabHref("leads") },
    ],
  },
  {
    title: "dash.workspace",
    items: [
      { tab: "knowledge", icon: Notebook, label: "nav.knowledge", path: "/desk", href: tabHref("knowledge") },
      { icon: Heart, label: "nav.moods", path: "/moods", href: "/moods" },
      { icon: Terminal, label: "nav.servers", path: "/servers", href: "/servers" },
    ],
  },
  {
    title: "dash.tools",
    items: [{ tab: "settings", icon: SlidersHorizontal, label: "nav.settings", path: "/desk", href: tabHref("settings") }],
  },
];

function useIsActive() {
  const pathname = usePathname();
  const currentTab = parseTab(useSearchParams().get("tab"));
  return (item: Item) =>
    pathname.startsWith(item.path) && (item.tab === undefined || (pathname === "/desk" && item.tab === currentTab));
}

const ITEM =
  "relative flex w-full items-center gap-3 rounded-card px-3.5 py-2.5 text-[0.8rem] font-medium leading-none transition-colors duration-300 ease-physical";

export default function Sidebar() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = useIsActive();
  const onDesk = pathname === "/desk";

  function openStudio() {
    if (onDesk) window.dispatchEvent(new Event(STUDIO_EVENT));
    else router.push("/desk?studio=1");
  }

  return (
    <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-60 shrink-0 flex-col rounded-shell border border-line/70 bg-panel p-4 shadow-ambient lg:flex">
      <Link href="/desk" className="flex items-center gap-2.5 px-2 pb-6 pt-1">
        <Logo size={30} className="shrink-0 rounded-soft" />
        <span className="font-display text-base font-semibold leading-none tracking-[-0.02em] text-paper">
          {t("app.name")}
        </span>
      </Link>

      <nav aria-label={t("app.name")} className="scrollbar-thin -mr-2 flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <span className="px-3.5 pb-1 text-micro font-semibold uppercase text-fogLight">{t(group.title)}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  scroll={false}
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
                  <Icon size={17} weight={active ? "fill" : "regular"} className="relative z-10 shrink-0" />
                  <span className="relative z-10">{t(item.label)}</span>
                </Link>
              );
            })}
          </div>
        ))}

        {onDesk ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
            className={cx(ITEM, "text-fog hover:bg-panelCard hover:text-paper")}
          >
            <MagnifyingGlass size={17} className="shrink-0" />
            {t("action.command")}
            <kbd className="ml-auto rounded border border-line px-1.5 py-0.5 font-mono text-[0.6rem] leading-none">Ctrl K</kbd>
          </button>
        ) : null}
      </nav>

      {/* Promo card: only when the viewport is tall enough not to squeeze the menu. */}
      <div className="beam-border relative mt-4 hidden overflow-hidden rounded-core bg-[#16140f] p-4 text-white [@media(min-height:860px)]:block">
        <PenNib size={120} weight="fill" className="pointer-events-none absolute -bottom-6 -right-6 text-white/[0.06]" />
        <span className="flex h-8 w-8 items-center justify-center rounded-soft bg-white/10">
          <PenNib size={15} weight="fill" />
        </span>
        <p className="mt-3 font-display text-base font-semibold leading-tight">{t("dash.studio.title")}</p>
        <p className="mt-1 text-[0.7rem] leading-relaxed text-white/60">{t("dash.studio.body")}</p>
        <button
          type="button"
          onClick={openStudio}
          className="relative mt-4 w-full rounded-card bg-signal py-2.5 text-xs font-semibold text-onSignal transition-transform duration-300 ease-physical hover:scale-[1.02] active:scale-[0.98]"
        >
          {t("action.playground")}
        </button>
      </div>
    </aside>
  );
}

/** Below lg the sidebar collapses into a scrolling pill row. */
export function MobileTabs() {
  const t = useT();
  const isActive = useIsActive();
  const items = GROUPS.flatMap((g) => g.items);
  return (
    <nav aria-label={t("app.name")} className="scrollbar-thin mb-3 flex gap-1 overflow-x-auto lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium leading-none",
              active ? "bg-signal text-onSignal" : "border border-line bg-panel text-fog"
            )}
          >
            <Icon size={14} />
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
