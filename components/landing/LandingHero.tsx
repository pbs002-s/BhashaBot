"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { ArrowUpRight, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import Logo from "../Logo";
import ThemeColorMenu from "../ThemeColorMenu";
import { Bezel, cx } from "../ui/primitives";
import { Kicker, Mono, PHYSICAL, SETTLE, Shell, wrap } from "./kit";
import { COUNTS, HERO_THREAD, TICKER } from "@/lib/landing-content";
import { AUTHOR } from "@/lib/settings-schema";

/* ------------------------------------------------------------------ nav */

/**
 * A detached island rather than an edge-to-edge bar. Secondary links drop off
 * below md so the row can never wrap onto a second line.
 */
function NavIsland() {
  return (
    <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 md:top-6">
      <nav className="glass-island flex h-14 items-center gap-1 rounded-full border border-line/70 p-1.5 shadow-island">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-3 py-2 text-[0.8rem] font-medium text-paper transition-colors duration-300 ease-physical hover:bg-panelHover"
        >
          <Logo size={22} />
          <span className="hidden sm:inline">BhashaBot</span>
        </Link>

        <span aria-hidden className="mx-1 hidden h-5 w-px bg-line md:block" />

        <Link
          href="/moods"
          className="hidden rounded-full px-3 py-2 text-[0.8rem] text-fog transition-colors duration-300 ease-physical hover:bg-panelHover hover:text-paper md:inline-flex"
        >
          Explore {COUNTS.moods} moods
        </Link>
        <a
          href={AUTHOR.url}
          target="_blank"
          rel="noreferrer noopener"
          className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] text-fog transition-colors duration-300 ease-physical hover:bg-panelHover hover:text-paper md:inline-flex"
        >
          <GithubLogo size={14} weight="fill" />
          GitHub source
        </a>

        <a
          href={AUTHOR.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="GitHub source"
          className="flex h-10 w-10 items-center justify-center rounded-full text-fog transition-colors duration-300 ease-physical hover:bg-panelHover hover:text-paper md:hidden"
        >
          <GithubLogo size={16} weight="fill" />
        </a>

        <ThemeColorMenu compact align="right" />

        <Link
          href="/desk"
          className="group ml-1 inline-flex items-center gap-2 rounded-full bg-signal py-2 pl-4 pr-1.5 text-[0.8rem] font-semibold text-onSignal shadow-ambient transition-all duration-300 ease-physical hover:brightness-110 active:scale-[0.975]"
        >
          Launch reply desk
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-onSignal/15 transition-transform duration-300 ease-physical group-hover:translate-x-0.5 group-hover:-translate-y-px">
            <ArrowUpRight size={13} weight="bold" />
          </span>
        </Link>
      </nav>
    </div>
  );
}

/* -------------------------------------------------------- kinetic headline */

const MORPH = [
  { id: "en", text: "Every language, your voice.", bangla: false },
  { id: "bn", text: "যেকোনো ভাষায়, আপনার সুরে।", bangla: true },
];

/**
 * Words, not characters: splitting Bengali per code point breaks its
 * conjuncts and matras, so the stagger runs one word at a time in both scripts.
 */
function MorphLine() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % MORPH.length), 3800);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <span className="grid" aria-hidden>
      {MORPH.map((line, i) => {
        const active = i === index;
        return (
          <span
            key={line.id}
            className={cx(
              "col-start-1 row-start-1 block",
              line.bangla && "font-bangla leading-[1.25]"
            )}
          >
            {line.text.split(" ").map((word, w) => (
              <motion.span
                key={w}
                className="mr-[0.22em] inline-block"
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: "0.3em" }}
                transition={{
                  duration: 0.55,
                  delay: active ? w * 0.05 : 0,
                  ease: PHYSICAL,
                }}
              >
                {word}
              </motion.span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

/* -------------------------------------------------------------- hero panel */

/** A real render of what the desk reads, cycling one arrival per script family. */
function HeroPanel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const item = HERO_THREAD[index];

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % HERO_THREAD.length), 5600);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <Bezel as="div" spotlight className="w-full">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
          <Mono className="text-paper">inbound</Mono>
        </span>
        <Mono>{item.read.ms} ms</Mono>
      </div>

      <div className="px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.42, ease: SETTLE }}
          >
            <div className="max-w-[92%] rounded-core rounded-tl-md border border-line bg-panelCard px-4 py-3">
              <p className="text-[0.9rem] leading-relaxed text-paper">{item.incoming}</p>
            </div>
            <p className="mt-2 text-[0.7rem] text-fog">{item.gloss}</p>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-line py-3">
              {(
                [
                  ["script", item.read.script],
                  ["language", item.read.language],
                  ["sentiment", item.read.sentiment],
                  ["intent", item.read.intent],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-2">
                  <Mono>{label}</Mono>
                  <Mono className="text-paper">{value}</Mono>
                </div>
              ))}
            </dl>

            <div className="mt-5 ml-auto max-w-[94%] rounded-core rounded-br-md border border-signal/40 bg-signal/10 px-4 py-3">
              <p
                className={cx(
                  "text-[0.9rem] leading-relaxed text-paper",
                  item.read.language.startsWith("bn") && item.read.script === "Bengali" && "font-bangla"
                )}
              >
                {item.reply}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Bezel>
  );
}

/* ------------------------------------------------------------------ ticker */

const KIND_TONE: Record<string, string> = {
  script: "text-paper",
  channel: "text-fog",
  model: "text-signal",
};

/**
 * The one marquee on the page. It carries the breadth claim (scripts, apps,
 * providers) that would otherwise need a 21-row list, and it speeds up with
 * the reader's own scrolling so the page feels physically connected.
 */
function VelocityTicker() {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 320 });
  const factor = useTransform(smooth, [-1400, 0, 1400], [-3.4, 1, 3.4], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const direction = React.useRef(1);

  useAnimationFrame((_t, delta) => {
    if (reduce) return;
    const speed = factor.get();
    if (speed < 0) direction.current = -1;
    else if (speed > 0) direction.current = 1;
    baseX.set(baseX.get() + direction.current * -1.6 * (delta / 1000) * Math.abs(speed));
  });

  return (
    <section
      aria-label="Languages, channels and model providers"
      className="relative border-y border-line/60 bg-panel/40 py-4"
    >
      <div className="overflow-hidden">
        <motion.div style={reduce ? undefined : { x }} className="flex w-max gap-8 whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-8" aria-hidden={copy === 1}>
              {TICKER.map((entry) => (
                <span key={entry.label} className="flex items-center gap-8">
                  <span
                    className={cx(
                      "text-[0.95rem] tracking-tight",
                      KIND_TONE[entry.kind],
                      entry.kind === "script" && "font-display font-medium"
                    )}
                  >
                    {entry.label}
                  </span>
                  <span aria-hidden className="h-1 w-1 rounded-full bg-line" />
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- hero */

export default function LandingHero() {
  const reduce = useReducedMotion();
  const firstLine = "One inbox.".split(" ");

  return (
    <>
      <NavIsland />

      <header className="relative flex min-h-[100dvh] flex-col justify-center pb-16 pt-24 md:pb-20">
        <Shell>
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
            <div>
              <Kicker>Multilingual reply desk</Kicker>

              <h1 className="mt-6 font-display text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.042em] text-paper sm:text-[3.6rem] lg:text-[4.15rem]">
                <span className="sr-only">
                  One inbox. Every language, your voice. যেকোনো ভাষায়, আপনার সুরে।
                </span>
                <span aria-hidden className="block">
                  {firstLine.map((word, i) => (
                    <motion.span
                      key={word}
                      className="mr-[0.22em] inline-block"
                      initial={reduce ? false : { opacity: 0, y: "0.35em" }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.75,
                        delay: 0.05 + i * 0.07,
                        ease: PHYSICAL,
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
                <span className="mt-1 block text-signal">
                  <MorphLine />
                </span>
              </h1>

              <p className="mt-6 max-w-[46ch] text-[0.95rem] leading-relaxed text-fog">
                It reads whatever script arrives, answers in that same script, and holds the exact
                tone you picked.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/desk"
                  className="group inline-flex items-center gap-2 rounded-full bg-signal py-3 pl-6 pr-2 text-sm font-semibold text-onSignal shadow-lifted transition-all duration-300 ease-physical hover:brightness-110 active:scale-[0.98]"
                >
                  Launch reply desk
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-onSignal/15 transition-transform duration-300 ease-physical group-hover:translate-x-0.5 group-hover:-translate-y-px">
                    <ArrowUpRight size={15} weight="bold" />
                  </span>
                </Link>
                <Link
                  href="/moods"
                  className="inline-flex items-center rounded-full border border-line bg-panelCard px-6 py-3 text-sm font-medium text-paper transition-all duration-300 ease-physical hover:border-lineLight hover:bg-panelHover active:scale-[0.98]"
                >
                  Explore {COUNTS.moods} moods
                </Link>
              </div>
            </div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: SETTLE }}
              className="lg:pl-6"
            >
              <HeroPanel />
            </motion.div>
          </div>
        </Shell>
      </header>

      <VelocityTicker />
    </>
  );
}
