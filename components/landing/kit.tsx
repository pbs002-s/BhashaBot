"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cx } from "../ui/primitives";

/** Physical curve used everywhere on this page, matching the desk. */
export const PHYSICAL: [number, number, number, number] = [0.32, 0.72, 0, 1];
export const SETTLE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Keeps a value inside [min, max) by wrapping, for the infinite ticker. */
export function wrap(min: number, max: number, value: number) {
  const range = max - min;
  return (((value - min) % range) + range) % range + min;
}

/** One page-width container so every section lines up on the same gutters. */
export function Shell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-[86rem] px-5 md:px-8", className)}>{children}</div>
  );
}

/** Scroll entry. Motion only, never layout, and off entirely under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  amount = 0.25,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, delay, ease: SETTLE }}
    >
      {children}
    </motion.div>
  );
}

/** Rationed: the page uses three of these in total. */
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panelCard/70 px-3 py-1 text-micro font-semibold uppercase tracking-[0.2em] text-fog">
      {children}
    </span>
  );
}

/** Section title, always stacked over its body copy rather than split across columns. */
export function SectionTitle({
  title,
  body,
  className,
}: {
  title: React.ReactNode;
  body?: string;
  className?: string;
}) {
  return (
    <div className={cx("max-w-2xl", className)}>
      <h2 className="font-display text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.035em] text-paper md:text-[2.9rem]">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-fog md:text-[0.95rem]">
          {body}
        </p>
      ) : null}
    </div>
  );
}

/** Mono metadata line. Used for machine output only, never for prose. */
export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("font-mono text-[0.68rem] tracking-tight text-fog", className)}>
      {children}
    </span>
  );
}
