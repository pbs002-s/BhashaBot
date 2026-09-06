"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { useSettings } from "./providers/AppProviders";
import { cx } from "./ui/primitives";

export default function CountUp({
  value,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const { settings } = useSettings();
  const still = settings.ui.reduceMotion;
  const mv = useMotionValue(still ? value : 0);
  const rounded = useTransform(mv, (v) => `${prefix}${Math.round(v)}${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (still) {
      mv.set(value);
      if (ref.current) ref.current.textContent = `${prefix}${Math.round(value)}${suffix}`;
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value, mv, still, prefix, suffix]);

  useEffect(() => rounded.on("change", (v) => {
    if (ref.current) ref.current.textContent = v;
  }), [rounded]);

  return (
    <span
      ref={ref}
      className={cx(
        "font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] text-paper tabular",
        className
      )}
    >
      {prefix}
      {still ? value : 0}
      {suffix}
    </span>
  );
}
