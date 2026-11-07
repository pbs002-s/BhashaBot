import React from "react";
import { cx } from "../ui/primitives";

/** Shared white dashboard surface with a title row. */
export default function Card({
  title,
  sub,
  actions,
  className,
  children,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cx("flex flex-col rounded-core border border-line/70 bg-panel p-5 shadow-ambient md:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em] text-paper">{title}</h2>
          {sub ? <p className="mt-0.5 text-[0.72rem] text-fog">{sub}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
