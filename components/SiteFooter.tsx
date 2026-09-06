"use client";

import Link from "next/link";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr";
import Logo from "./Logo";
import { useT } from "./providers/AppProviders";
import { AUTHOR } from "@/lib/settings-schema";

/**
 * One footer for every route, so the credit and the legal links do not drift
 * apart between the desk and the mood pages.
 */
export default function SiteFooter() {
  const t = useT();

  return (
    <footer className="mx-auto w-full max-w-[86rem] border-t border-line px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 text-[0.72rem] text-fog">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Logo size={18} />
          <p>{t("footer.builtWith")}</p>
          <span aria-hidden className="hidden text-line sm:inline">
            ·
          </span>
          <a
            href={AUTHOR.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-paper"
          >
            <GithubLogo size={13} weight="fill" />
            {t("footer.credit", { name: AUTHOR.name })}
          </a>
        </div>

        <nav className="flex items-center gap-5">
          <Link href="/" className="transition-colors hover:text-paper">
            Home
          </Link>
          <Link href="/desk" className="transition-colors hover:text-paper">
            Reply desk
          </Link>
          <Link href="/moods" className="transition-colors hover:text-paper">
            {t("nav.moods")}
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-paper">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="transition-colors hover:text-paper">
            {t("footer.terms")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
