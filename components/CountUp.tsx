"use client";
import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";

export default function CountUp({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${Math.round(v)}${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    return controls.stop;
  }, [value, mv]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [rounded]);

  return (
    <span ref={ref} className="font-display text-2xl font-bold tracking-tight text-paper tabular-nums md:text-3xl">
      {prefix}0{suffix}
    </span>
  );
}
