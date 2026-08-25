"use client";
import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Lock,
  Database,
  Cpu,
} from "lucide-react";

export default function WebhookSettingsPanel() {
  const [origin, setOrigin] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const webhookUrl = `${origin}/api/messenger`;
  const verifyToken = "my-verify-token";

  function copy(text: string, type: "url" | "token") {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  }

  async function testTelegram() {
    setTelegramStatus("Sending test handoff alert…");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        setTelegramStatus("Test handoff triggered! If configured, check your Telegram bot.");
      } else {
        setTelegramStatus("Failed to trigger test.");
      }
    } catch {
      setTelegramStatus("Network error triggering test.");
    }
    setTimeout(() => setTelegramStatus(null), 5000);
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border border-line bg-panel p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-violet">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-paper">
            Webhook, Channels & Security Configuration
          </h2>
          <p className="text-xs text-fog">
            Connect Facebook Pages, Telegram handoff bots, and monitor API endpoint health
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. Meta Webhook Connection */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-sky" />
              Meta Messenger Webhook
            </h3>
            <span className="flex items-center gap-1 rounded bg-mint/15 px-2 py-0.5 font-mono text-[10px] text-mint">
              <CheckCircle2 className="h-3 w-3" />
              Active Endpoint
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-fog mb-1">
                Webhook Callback URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 rounded-lg border border-line bg-panelCard px-3 py-2 font-mono text-xs text-paper focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copy(webhookUrl, "url")}
                  className="flex items-center gap-1 rounded-lg border border-line bg-panelCard px-3 py-2 text-fog hover:text-paper"
                >
                  {copiedUrl ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedUrl ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-fog mb-1">
                Verify Token (hub.verify_token)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  className="flex-1 rounded-lg border border-line bg-panelCard px-3 py-2 font-mono text-xs text-paper focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copy(verifyToken, "token")}
                  className="flex items-center gap-1 rounded-lg border border-line bg-panelCard px-3 py-2 text-fog hover:text-paper"
                >
                  {copiedToken ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedToken ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-panelCard p-3 text-[11px] text-fog leading-relaxed">
              <p className="font-semibold text-paper mb-1">Setup in Facebook Developers:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Go to developers.facebook.com → Messenger → Webhooks.</li>
                <li>Paste the Callback URL and Verify Token above.</li>
                <li>Subscribe to <code className="text-signal">messages</code> and <code className="text-signal">messaging_postbacks</code>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 2. Telegram Handoff Bot */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <Send className="h-4 w-4 text-mint" />
              Telegram Human Handoff Alerts
            </h3>
            <span className="rounded bg-line px-2 py-0.5 font-mono text-[10px] text-fog">
              Free Bot API
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-fog">
            <p>
              Whenever customer sentiment is angry/urgent or customer requests refund/human support, an instant alert is pushed to your private Telegram channel.
            </p>

            <div className="rounded-lg border border-line bg-panelCard p-3 text-[11px]">
              <p className="font-semibold text-paper mb-1">Configured Environment Variables:</p>
              <ul className="space-y-1 font-mono text-[10px]">
                <li>• <strong className="text-fog">TELEGRAM_BOT_TOKEN:</strong> Bot token from @BotFather</li>
                <li>• <strong className="text-fog">TELEGRAM_CHAT_ID:</strong> Your numeric Telegram Chat ID</li>
              </ul>
            </div>

            <button
              onClick={testTelegram}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-line bg-panelCard px-4 py-2.5 font-medium text-paper transition-colors hover:border-mint hover:text-mint"
            >
              <Send className="h-4 w-4" />
              <span>Send Sample Handoff Alert to Telegram</span>
            </button>

            {telegramStatus && (
              <p className="font-mono text-[11px] text-mint text-center animate-pulse">
                {telegramStatus}
              </p>
            )}
          </div>
        </div>

        {/* 3. System Engine & Security Health */}
        <div className="rounded-xl border border-line bg-panel p-5 md:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-signal" />
              Security & Infrastructure Stack
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-panelCard p-3 text-xs">
              <div className="flex items-center gap-2 text-paper font-semibold">
                <Lock className="h-4 w-4 text-mint" />
                HMAC SHA-256 Signature
              </div>
              <p className="mt-1.5 text-[11px] text-fog leading-relaxed">
                Protects against spoofed requests by validating <code className="text-mint">X-Hub-Signature-256</code> with your <code className="text-paper">FB_APP_SECRET</code>.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-panelCard p-3 text-xs">
              <div className="flex items-center gap-2 text-paper font-semibold">
                <Cpu className="h-4 w-4 text-signal" />
                AI Inference Engine
              </div>
              <p className="mt-1.5 text-[11px] text-fog leading-relaxed">
                Powered by Groq Llama 3.3 70B & OpenAI with a smart offline multilingual NLP rule fallback.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-panelCard p-3 text-xs">
              <div className="flex items-center gap-2 text-paper font-semibold">
                <Database className="h-4 w-4 text-sky" />
                libSQL / Turso SQLite
              </div>
              <p className="mt-1.5 text-[11px] text-fog leading-relaxed">
                High-performance edge database supporting local file development and serverless zero-latency cloud deployments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
