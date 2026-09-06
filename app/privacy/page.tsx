import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — BhashaBot",
  description: "What BhashaBot stores, where it stores it, and what leaves your server.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <Link href="/" className="text-xs text-fog underline-offset-4 hover:text-paper hover:underline">
        Back to the desk
      </Link>

      <h1 className="mt-8 font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] text-paper">
        Privacy
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-fog">
        BhashaBot is self-hosted. This page describes what the software itself does; the operator of
        this particular deployment is the data controller.
      </p>

      <section className="mt-10 flex flex-col gap-7 text-sm leading-relaxed text-fog">
        <div>
          <h2 className="font-display text-base font-semibold text-paper">What is stored</h2>
          <p className="mt-2">
            Incoming messages, the drafted reply, the detected language, a sentiment label, an intent
            label, reply latency, and any contact details the assistant extracted. Rows live in the
            libSQL database configured for this deployment — a local file by default, or your own
            Turso instance.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-paper">API keys and tokens</h2>
          <p className="mt-2">
            Keys entered in Settings are written to the same database and are never sent back to the
            browser afterwards; the interface only shows a masked preview. Environment variables are
            used as a fallback when no key has been saved.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-paper">What leaves the server</h2>
          <p className="mt-2">
            When a model provider is configured, the message text and the system prompt are sent to
            that provider so a reply can be generated. With the built-in rule engine selected,
            nothing leaves the server. Handoff alerts go to Telegram only when a bot token and chat
            id are configured. A drafted reply is delivered to Messenger, Instagram, WhatsApp,
            Telegram, Discord or Slack only when that platform is switched on in Settings and its
            credentials are stored; the generic webhook returns the reply in its own response and
            sends nothing anywhere.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-paper">Deletion</h2>
          <p className="mt-2">
            Conversations are rows in the <code className="font-mono text-paper">logs</code> table
            and settings are a single row in <code className="font-mono text-paper">app_settings</code>.
            Both can be deleted directly in the database at any time.
          </p>
        </div>
      </section>

      <p className="mt-12 border-t border-line pt-6 text-[0.72rem] text-fog">
        Built by{" "}
        <a
          href="https://github.com/pbs002-s"
          target="_blank"
          rel="noreferrer noopener"
          className="text-paper underline-offset-4 hover:underline"
        >
          Pritam Biswas
        </a>
        .
      </p>
    </main>
  );
}
