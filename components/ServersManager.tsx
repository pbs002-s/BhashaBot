"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ArrowsClockwise,
  Broadcast,
  Check,
  Circle,
  Code,
  Copy,
  Cpu,
  Eye,
  FileCode,
  Info,
  PaperPlaneTilt,
  Play,
  QrCode,
  Square,
  Terminal,
  Trash,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import AmbientBackdrop from "./AmbientBackdrop";
import Logo from "./Logo";
import SiteFooter from "./SiteFooter";
import { useLocale } from "./providers/AppProviders";
import { Button, cx } from "./ui/primitives";
import type { ServerId, ServerState } from "@/lib/server-manager";

export default function ServersManager() {
  const { t } = useLocale();
  const [servers, setServers] = useState<ServerState[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<ServerId>("whatsapp");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFbHelp, setShowFbHelp] = useState(false);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [cookieText, setCookieText] = useState("");
  const [cookieStatus, setCookieStatus] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [cookieSaving, setCookieSaving] = useState(false);

  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch servers status
  async function fetchServers() {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      if (data.ok && data.servers) {
        setServers(data.servers);
      }
    } catch (err) {
      console.error("Failed to fetch bot servers:", err);
    }
  }

  useEffect(() => {
    fetchServers();
    if (!autoRefresh) return;
    const interval = setInterval(fetchServers, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle WhatsApp QR code generation
  const waServer = servers.find((s) => s.id === "whatsapp");
  const tgServer = servers.find((s) => s.id === "telegram");
  const fbServer = servers.find((s) => s.id === "messenger");

  useEffect(() => {
    if (waServer?.qrCode) {
      QRCode.toDataURL(waServer.qrCode, {
        margin: 2,
        scale: 6,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [waServer?.qrCode]);

  // Auto scroll terminal to bottom
  const selectedServer = servers.find((s) => s.id === selectedServerId);
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedServer?.logs?.length]);

  async function handleAction(server: ServerId, action: "start" | "stop" | "restart" | "clear-logs") {
    const actionKey = `${server}-${action}`;
    setLoadingAction(actionKey);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, action }),
      });
      const data = await res.json();
      if (data.ok && data.server) {
        setServers((prev) => prev.map((s) => (s.id === server ? data.server : s)));
      }
    } catch (err) {
      console.error(`Failed to ${action} ${server}:`, err);
    } finally {
      setLoadingAction(null);
    }
  }

  // Handle saving cookies from modal
  async function handleSaveCookies() {
    if (!cookieText.trim()) {
      setCookieStatus({ ok: false, message: "Please paste your JSON cookies first." });
      return;
    }
    setCookieSaving(true);
    setCookieStatus(null);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-appstate",
          appStateText: cookieText,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCookieStatus({ ok: true, message: data.message || "Cookies saved successfully." });
        if (data.servers) setServers(data.servers);
        setTimeout(() => {
          setCookieModalOpen(false);
          setCookieText("");
          setCookieStatus(null);
          fetchServers();
        }, 1500);
      } else {
        setCookieStatus({ ok: false, message: data.message || "Failed to save cookies." });
      }
    } catch (err: any) {
      setCookieStatus({ ok: false, message: err.message || "Network error while saving." });
    } finally {
      setCookieSaving(false);
    }
  }

  // Handle deleting cookies
  async function handleDeleteCookies() {
    if (!confirm("Are you sure you want to remove the Facebook cookies session?")) return;
    setCookieSaving(true);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-appstate" }),
      });
      const data = await res.json();
      if (data.servers) setServers(data.servers);
      setCookieStatus({ ok: true, message: data.message || "Cookies removed." });
      fetchServers();
    } catch (err: any) {
      setCookieStatus({ ok: false, message: err.message });
    } finally {
      setCookieSaving(false);
    }
  }

  const widgetSnippet = `<script src="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/widget.js" data-title="BhashaBot"></script>`;

  function copySnippet() {
    navigator.clipboard.writeText(widgetSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  }

  return (
    <>
      <AmbientBackdrop />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {/* ---- Masthead ---- */}
        <header className="mx-auto w-full max-w-[86rem] px-5 pt-10 md:px-8 lg:pt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-fog transition-colors hover:text-paper"
              >
                <Logo size={22} />
                <span>BhashaBot</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper"
              >
                <ArrowLeft size={12} />
                <span>Back to reply desk</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono transition-all",
                  autoRefresh
                    ? "border-mint/30 bg-mint/10 text-mint"
                    : "border-line bg-panelCard text-fog"
                )}
              >
                <span className={cx("h-1.5 w-1.5 rounded-full", autoRefresh ? "animate-pulse bg-mint" : "bg-fog")} />
                {autoRefresh ? "Live polling on" : "Live polling paused"}
              </button>

              <button
                type="button"
                onClick={fetchServers}
                title="Refresh status now"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panelCard text-fog transition-all hover:border-lineLight hover:text-paper active:scale-95"
              >
                <ArrowsClockwise size={14} />
              </button>
            </div>
          </div>

          <span className="mt-8 block text-micro font-semibold uppercase tracking-[0.24em] text-fog">
            Personal Accounts & Web Integrations
          </span>
          <h1 className="mt-3 max-w-2xl font-display text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.035em] text-paper md:text-[3.2rem]">
            Bot Server Control Center
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fog">
            Manage your personal background listener clients (Telegram MTProto, WhatsApp Web Baileys, Facebook Messenger FCA)
            and embeddable website widgets.
          </p>
        </header>

        {/* ---- Main Dashboard ---- */}
        <main className="mx-auto w-full max-w-[86rem] flex-1 px-5 pb-20 pt-8 md:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {/* ---- 1. WhatsApp UserBot Card ---- */}
            <ServerCard
              server={waServer}
              icon={<WhatsappLogo size={24} weight="fill" className="text-emerald-400" />}
              accentClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              isLoadingAction={Boolean(loadingAction?.startsWith("whatsapp"))}
              isSelected={selectedServerId === "whatsapp"}
              onSelect={() => setSelectedServerId("whatsapp")}
              onStart={() => handleAction("whatsapp", "start")}
              onStop={() => handleAction("whatsapp", "stop")}
              onRestart={() => handleAction("whatsapp", "restart")}
              extraContent={
                qrDataUrl ? (
                  <div className="mt-4 flex flex-col items-center rounded-card border border-emerald-500/20 bg-emerald-950/20 p-4">
                    <p className="mb-2 text-center text-xs font-medium text-emerald-300">
                      Scan with WhatsApp on your phone:
                    </p>
                    <img
                      src={qrDataUrl}
                      alt="WhatsApp QR Code"
                      className="h-40 w-40 rounded-lg border border-white/10 bg-white p-2 shadow-ambient"
                    />
                    <span className="mt-2 text-[0.68rem] text-fog">
                      Linked Devices &rarr; Link a Device
                    </span>
                  </div>
                ) : null
              }
            />

            {/* ---- 2. Telegram UserBot Card ---- */}
            <ServerCard
              server={tgServer}
              icon={<PaperPlaneTilt size={24} weight="fill" className="text-sky-400" />}
              accentClass="border-sky-500/30 bg-sky-500/10 text-sky-400"
              isLoadingAction={Boolean(loadingAction?.startsWith("telegram"))}
              isSelected={selectedServerId === "telegram"}
              onSelect={() => setSelectedServerId("telegram")}
              onStart={() => handleAction("telegram", "start")}
              onStop={() => handleAction("telegram", "stop")}
              onRestart={() => handleAction("telegram", "restart")}
            />

            {/* ---- 3. Facebook Messenger UserBot Card ---- */}
            <ServerCard
              server={fbServer}
              icon={
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-blue-400">
                  <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.735 7.207V22l3.39-1.862c.907.251 1.874.388 2.875.388 5.523 0 10-4.145 10-9.268C22 6.145 17.523 2 12 2zm1.05 12.443l-2.686-2.864-5.244 2.864 5.768-6.12 2.756 2.864 5.174-2.864-5.768 6.12z" />
                </svg>
              }
              accentClass="border-blue-500/30 bg-blue-500/10 text-blue-400"
              isLoadingAction={Boolean(loadingAction?.startsWith("messenger"))}
              isSelected={selectedServerId === "messenger"}
              onSelect={() => setSelectedServerId("messenger")}
              onStart={() => handleAction("messenger", "start")}
              onStop={() => handleAction("messenger", "stop")}
              onRestart={() => handleAction("messenger", "restart")}
              extraContent={
                <div className="mt-3 space-y-2">
                  {fbServer?.hasSession ? (
                    <div className="flex items-center justify-between rounded-card border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-[0.7rem]">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check size={13} weight="bold" />
                        <span>Cookies Configured</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCookieModalOpen(true)}
                        className="text-blue-400 hover:underline font-medium"
                      >
                        Update
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCookieModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/15 py-1.5 text-[0.72rem] font-medium text-blue-300 hover:bg-blue-500/25 transition-colors"
                    >
                      <span>Paste Cookies (appstate.json)</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between text-[0.68rem] text-fog">
                    <button
                      type="button"
                      onClick={() => setShowFbHelp(!showFbHelp)}
                      className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                    >
                      <Info size={12} />
                      <span>{showFbHelp ? "Hide guide" : "How to export cookies"}</span>
                    </button>
                    {fbServer?.hasSession && (
                      <button
                        type="button"
                        onClick={handleDeleteCookies}
                        className="text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {showFbHelp && (
                    <div className="rounded-card border border-blue-500/20 bg-blue-950/25 p-2.5 text-[0.68rem] leading-relaxed text-fog">
                      <p className="font-semibold text-blue-300">Quick Cookie Setup:</p>
                      <ol className="list-decimal pl-3 mt-1 space-y-1">
                        <li>Install <b>cstate</b> or <b>EditThisCookie</b> extension in Chrome.</li>
                        <li>Log into facebook.com and export cookies as JSON.</li>
                        <li>Click <b>Paste Cookies</b> above and paste the JSON array.</li>
                        <li>Click <b>Start Bot</b>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              }
            />

            {/* ---- 4. Web Widget Embed Card ---- */}
            <div className="flex flex-col justify-between rounded-shell border border-line bg-panelCard/70 p-6 shadow-ambient">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-card border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <Code size={24} weight="bold" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-0.5 font-mono text-[0.7rem] text-mint">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                    Live Route
                  </span>
                </div>

                <h2 className="mt-4 font-display text-lg font-semibold text-paper">
                  Website Chat Widget
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-fog">
                  Embed BhashaBot on any HTML website, portfolio, Shopify, or blog with one script tag.
                </p>

                <div className="mt-4 rounded-card border border-line bg-ink/60 p-3">
                  <div className="flex items-center justify-between text-[0.7rem] font-medium text-fog">
                    <span>Embed snippet</span>
                    <button
                      type="button"
                      onClick={copySnippet}
                      className="inline-flex items-center gap-1 text-signal hover:underline"
                    >
                      {copiedSnippet ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedSnippet ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="mt-2 overflow-x-auto font-mono text-[0.7rem] text-signal/90">
                    <code>{widgetSnippet}</code>
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href="/widget-demo.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-signal/40 bg-signal/15 px-4 py-2 text-xs font-medium text-signal transition-all hover:bg-signal/25"
                >
                  <Eye size={14} />
                  <span>Open Live Demo</span>
                </a>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="flex items-center justify-center rounded-full border border-line bg-panel px-3 py-2 text-xs text-fog hover:text-paper"
                  title="Copy snippet"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ---- Terminal Console Section ---- */}
          <div className="mt-8 overflow-hidden rounded-shell border border-line bg-ink shadow-lifted">
            <div className="flex flex-wrap items-center justify-between border-b border-line bg-panel px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-card bg-panelCard text-signal">
                  <Terminal size={15} />
                </span>
                <div>
                  <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-paper">
                    Live Server Logs &middot;{" "}
                    {selectedServer?.name || "Server Terminal"}
                  </h3>
                  <span className="font-mono text-[0.68rem] text-fog">
                    {selectedServer?.status === "running"
                      ? `Active · PID ${selectedServer.pid || "System"} · ${selectedServer.connectedAccount || "Listening"}`
                      : selectedServer?.error || "Inactive / Stopped"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switcher */}
                <div className="flex rounded-full border border-line bg-panelCard p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedServerId("whatsapp")}
                    className={cx(
                      "rounded-full px-3 py-1 font-medium transition-colors",
                      selectedServerId === "whatsapp" ? "bg-panel text-paper shadow-ambient" : "text-fog"
                    )}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedServerId("telegram")}
                    className={cx(
                      "rounded-full px-3 py-1 font-medium transition-colors",
                      selectedServerId === "telegram" ? "bg-panel text-paper shadow-ambient" : "text-fog"
                    )}
                  >
                    Telegram
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedServerId("messenger")}
                    className={cx(
                      "rounded-full px-3 py-1 font-medium transition-colors",
                      selectedServerId === "messenger" ? "bg-panel text-paper shadow-ambient" : "text-fog"
                    )}
                  >
                    Messenger
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction(selectedServerId, "clear-logs")}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-panelCard text-fog transition-colors hover:text-paper"
                  title="Clear terminal buffer"
                >
                  <Trash size={13} />
                </button>
              </div>
            </div>

            {/* Log output stream */}
            <div className="h-80 overflow-y-auto p-4 font-mono text-[0.76rem] leading-relaxed text-paper/90">
              {selectedServer?.logs && selectedServer.logs.length > 0 ? (
                selectedServer.logs.map((line, idx) => {
                  const isError = line.includes("[ERROR]") || line.includes("FAILED") || line.includes("[FB_ERROR]");
                  const isSuccess = line.includes("[Connected]") || line.includes("connected");
                  const isIncoming = line.includes("[Incoming");
                  const isReplying = line.includes("[Replying");
                  return (
                    <div
                      key={idx}
                      className={cx(
                        "py-0.5",
                        isError
                          ? "text-rose-400"
                          : isSuccess
                          ? "text-emerald-400"
                          : isIncoming
                          ? "text-sky-300"
                          : isReplying
                          ? "text-amber-300"
                          : "text-fog/90"
                      )}
                    >
                      {line}
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-xs text-fog">
                  <Terminal size={32} className="mb-2 opacity-30" />
                  <p>No log output yet. Click &quot;Start Bot&quot; above to launch the process.</p>
                </div>
              )}
              <div ref={terminalBottomRef} />
            </div>
          </div>
        </main>

        {/* ---- Paste Cookies Modal ---- */}
        <AnimatePresence>
          {cookieModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCookieModalOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 w-full max-w-lg rounded-shell border border-line bg-panel p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-card bg-blue-500/15 text-blue-400">
                      <FileCode size={18} />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-paper">
                        Paste Facebook Cookies (appstate.json)
                      </h3>
                      <p className="text-xs text-fog">Connect personal Facebook Messenger</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCookieModalOpen(false)}
                    className="rounded-full p-1.5 text-fog hover:bg-panelCard hover:text-paper"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-fog mb-2">
                    Paste exported JSON cookies array:
                  </label>
                  <textarea
                    rows={8}
                    value={cookieText}
                    onChange={(e) => {
                      setCookieText(e.target.value);
                      if (cookieStatus) setCookieStatus(null);
                    }}
                    placeholder='[{"key":"c_user","value":"...","domain":"facebook.com",...}]'
                    className="w-full rounded-card border border-line bg-ink/70 p-3 font-mono text-xs text-paper placeholder:text-fog/40 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[0.68rem] text-fog">
                    Export your cookies using the <b>cstate</b> or <b>EditThisCookie</b> Chrome extension while logged into facebook.com.
                  </p>
                </div>

                {cookieStatus && (
                  <div
                    className={cx(
                      "mt-3 rounded-card border p-3 text-xs",
                      cookieStatus.ok
                        ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                        : "border-rose-500/30 bg-rose-950/20 text-rose-400"
                    )}
                  >
                    {cookieStatus.message}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCookieModalOpen(false)}
                    className="rounded-full border border-line bg-panelCard px-4 py-2 text-xs font-medium text-fog hover:text-paper"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={cookieSaving || !cookieText.trim()}
                    onClick={handleSaveCookies}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lifted hover:bg-blue-600 disabled:opacity-50"
                  >
                    {cookieSaving ? "Saving..." : "Save & Link Messenger"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <SiteFooter />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------- */
/* Helper Card Component                                                     */
/* ------------------------------------------------------------------------- */

function ServerCard({
  server,
  icon,
  accentClass,
  isLoadingAction,
  isSelected,
  onSelect,
  onStart,
  onStop,
  onRestart,
  extraContent,
}: {
  server?: ServerState;
  icon: React.ReactNode;
  accentClass: string;
  isLoadingAction: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  extraContent?: React.ReactNode;
}) {
  const isRunning = server?.status === "running";
  const isStarting = server?.status === "starting";
  const isError = server?.status === "error";

  return (
    <div
      className={cx(
        "flex flex-col justify-between rounded-shell border p-6 transition-all duration-300 ease-physical shadow-ambient",
        isSelected
          ? "border-signal/50 bg-panelCard"
          : "border-line bg-panelCard/70 hover:border-lineLight"
      )}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className={cx("flex h-11 w-11 items-center justify-center rounded-card border", accentClass)}>
            {icon}
          </span>

          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.7rem]",
              isRunning
                ? "border-mint/30 bg-mint/10 text-mint"
                : isStarting
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : isError
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : "border-line bg-panel text-fog"
            )}
          >
            <span
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                isRunning
                  ? "animate-pulse bg-mint"
                  : isStarting
                  ? "animate-ping bg-amber-400"
                  : isError
                  ? "bg-rose-400"
                  : "bg-fog"
              )}
            />
            {isRunning ? "Running" : isStarting ? "Starting..." : isError ? "Error" : "Stopped"}
          </span>
        </div>

        <h2 className="mt-4 font-display text-lg font-semibold text-paper">
          {server?.name || "Bot Client"}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-fog">{server?.description}</p>

        {/* Connected account metadata */}
        <div className="mt-4 space-y-1.5 rounded-card border border-line bg-ink/40 p-3 font-mono text-[0.72rem] text-fog">
          <div className="flex justify-between">
            <span>Account:</span>
            <span className="font-semibold text-paper truncate max-w-[140px]">
              {server?.connectedAccount || (isRunning ? "Active / Listening" : "Not connected")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Process PID:</span>
            <span className="text-paper">{server?.pid || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Forward target:</span>
            <span className="text-signal truncate max-w-[150px]">/api/channels/web</span>
          </div>
        </div>

        {extraContent}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {isRunning ? (
          <>
            <button
              type="button"
              disabled={isLoadingAction}
              onClick={onStop}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-300 transition-all hover:bg-rose-500/25 active:scale-95 disabled:opacity-50"
            >
              <Square size={13} weight="fill" />
              <span>Stop</span>
            </button>
            <button
              type="button"
              disabled={isLoadingAction}
              onClick={onRestart}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-panel px-3 py-2 text-xs font-medium text-paper transition-all hover:bg-panelHover active:scale-95 disabled:opacity-50"
              title="Restart bot"
            >
              <ArrowsClockwise size={13} />
              <span>Restart</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isLoadingAction}
            onClick={onStart}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-mint/40 bg-mint/15 px-4 py-2 text-xs font-medium text-mint transition-all hover:bg-mint/25 active:scale-95 disabled:opacity-50"
          >
            <Play size={13} weight="fill" />
            <span>Start Bot</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSelect}
          className={cx(
            "flex items-center justify-center rounded-full border px-3 py-2 text-xs transition-colors",
            isSelected ? "border-signal bg-signal/15 text-signal" : "border-line bg-panel text-fog hover:text-paper"
          )}
          title="View logs in terminal"
        >
          <Terminal size={14} />
        </button>
      </div>
    </div>
  );
}
