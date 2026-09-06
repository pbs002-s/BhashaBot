import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center px-6 py-24">
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-fog">404</span>
      <h1 className="mt-4 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.035em] text-paper">
        That page is not here
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-fog">
        The link may be old, or the page may have moved. Everything the desk does lives on one
        screen, so heading back will not cost you anything.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-onSignal transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
        >
          Back to the desk
        </Link>
      </div>
    </main>
  );
}
