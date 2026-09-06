"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRight, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../ui/primitives";
import { Kicker, Mono, Reveal, SectionTitle, Shell } from "./kit";
import { AUTHORED, BYOK, CONNECTORS, COUNTS, STACK } from "@/lib/landing-content";
import { AUTHOR } from "@/lib/settings-schema";

/* --------------------------------------------------------------- channels */

export function ChannelsAndKeys() {
  return (
    <section id="channels" className="py-24 md:py-32">
      <Shell>
        <SectionTitle
          title="Bring your own key. Keep your own accounts."
          body="Nothing here is resold. The desk connects to your accounts with your credentials and calls a model with a key you generated yourself, including a free one or a local one."
        />

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {CONNECTORS.map((group) => (
            <Reveal key={group.group} amount={0.3}>
              <h3 className="text-[0.85rem] font-semibold tracking-[-0.01em] text-paper">
                {group.group}
              </h3>
              <dl className="mt-3 divide-y divide-line border-t border-line">
                {group.rows.map((row) => (
                  <div
                    key={row.name}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
                  >
                    <dt className="text-[0.85rem] text-paper">{row.name}</dt>
                    <dd className="text-[0.78rem] text-fog">{row.how}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>

        <Reveal amount={0.15} className="mt-16 border-t border-line pt-10 md:mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-[0.85rem] font-semibold tracking-[-0.01em] text-paper">
              {COUNTS.freeProviders} model providers that need no card
            </h3>
            <p className="max-w-[44ch] text-[0.78rem] leading-relaxed text-fog">
              With no key at all the desk still answers from its built-in rule engine, so a fresh
              install is never a blank screen.
            </p>
          </div>

          <dl className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {BYOK.map((row) => (
              <div key={row.name} className="border-b border-line py-3.5">
                <dt className="text-[0.85rem] text-paper">{row.name}</dt>
                <dd className="mt-0.5 text-[0.76rem] leading-relaxed text-fog">{row.how}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Shell>
    </section>
  );
}

/* --------------------------------------------------------------- manifesto */

const MANIFESTO =
  "Most inboxes ask the person on the other end to switch languages, flatten their tone, and wait. This one does the switching. It reads the script they chose, keeps the register you chose, and only pulls you in when a human is genuinely needed.";

function Word({
  children,
  progress,
  range,
  still,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  still: boolean;
}) {
  const opacity = useTransform(progress, range, [0.28, 1]);
  return (
    <motion.span className="mr-[0.26em] inline-block" style={still ? undefined : { opacity }}>
      {children}
    </motion.span>
  );
}

export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.4"] });
  const words = MANIFESTO.split(" ");

  return (
    <section className="border-y border-line/60 bg-panel/30 py-24 md:py-36">
      <Shell>
        <p
          ref={ref}
          className="max-w-[24ch] font-display text-[1.75rem] font-medium leading-[1.24] tracking-[-0.03em] text-paper sm:max-w-[30ch] sm:text-[2.2rem] lg:ml-[8vw] lg:max-w-[34ch] lg:text-[2.7rem]"
        >
          {words.map((word, i) => (
            <Word
              key={`${word}-${i}`}
              progress={scrollYProgress}
              range={[i / words.length, (i + 1) / words.length]}
              still={Boolean(reduce)}
            >
              {word}
            </Word>
          ))}
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-3 lg:ml-[8vw]">
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
      </Shell>
    </section>
  );
}

/* ----------------------------------------------------------------- credits */

export function Credits() {
  return (
    <section className="py-24 md:py-32">
      <Shell>
        <Kicker>Colophon</Kicker>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 className="font-display text-[1.8rem] font-semibold leading-[1.05] tracking-[-0.035em] text-paper md:text-[2.2rem]">
              Architected and built by {AUTHOR.name}.
            </h2>
            <a
              href={AUTHOR.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-panelCard px-4 py-2 text-[0.8rem] text-paper transition-all duration-300 ease-physical hover:border-lineLight hover:bg-panelHover"
            >
              <GithubLogo size={14} weight="fill" />
              {AUTHOR.handle}
            </a>

            <ul className="mt-8 space-y-3 border-t border-line pt-6">
              {AUTHORED.map((line) => (
                <li key={line} className="text-[0.85rem] leading-relaxed text-fog">
                  <span className="mr-2 text-signal">/</span>
                  {line}
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-[36ch] font-display text-lg leading-snug tracking-[-0.02em] text-paper">
              Built for real human connection in every mother tongue, not for sterile corporate
              bots.
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Mono className="text-paper">standing on</Mono>
            <dl className="mt-5 grid gap-x-8 border-t border-line sm:grid-cols-2">
              {STACK.map((item) => (
                <div key={item.name} className="border-b border-line py-3.5">
                  <dt>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={cx(
                        "inline-flex items-center gap-1 text-[0.85rem] text-paper transition-colors",
                        "hover:text-signal"
                      )}
                    >
                      {item.name}
                      <ArrowUpRight size={11} weight="bold" className="text-fog" />
                    </a>
                  </dt>
                  <dd className="mt-0.5 text-[0.76rem] text-fog">{item.role}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Shell>
    </section>
  );
}
