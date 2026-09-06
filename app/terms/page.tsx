import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — BhashaBot",
  description: "The terms this self-hosted deployment of BhashaBot runs under.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <Link href="/" className="text-xs text-fog underline-offset-4 hover:text-paper hover:underline">
        Back to the desk
      </Link>

      <h1 className="mt-8 font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] text-paper">
        Terms
      </h1>

      <section className="mt-10 flex flex-col gap-7 text-sm leading-relaxed text-fog">
        <div>
          <h2 className="font-display text-base font-semibold text-paper">Drafts, not decisions</h2>
          <p className="mt-2">
            Replies are generated text. Review anything that commits you to a price, a delivery
            date, a refund, or a legal position before it is sent.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-paper">Third-party services</h2>
          <p className="mt-2">
            Model providers, Telegram and Meta each have their own terms. Using this desk with those
            services means accepting theirs as well, and paying for whatever usage you generate on
            your own key.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-paper">No warranty</h2>
          <p className="mt-2">
            The software is provided as is. Language detection, sentiment labels and contact
            extraction are best-effort and will be wrong sometimes, which is why the handoff route
            exists.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-paper">Operator responsibility</h2>
          <p className="mt-2">
            Whoever runs this deployment is responsible for the messages it sends, for the consent
            they have to process them, and for the retention rules that apply where they operate.
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
