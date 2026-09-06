"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowCounterClockwise,
  MessengerLogo,
  Pause,
  Play,
  TelegramLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { cx } from "../ui/primitives";
import { Kicker, Mono, SETTLE, SectionTitle, Shell } from "./kit";
import { REELS, type Lane, type ReelLine } from "@/lib/landing-content";

const LANES: { id: Lane; label: string; Icon: React.ComponentType<any> }[] = [
  { id: "whatsapp", label: "WhatsApp", Icon: WhatsappLogo },
  { id: "telegram", label: "Telegram", Icon: TelegramLogo },
  { id: "messenger", label: "Messenger", Icon: MessengerLogo },
];

/* ------------------------------------------------------------------ lines */

function Bubble({ line }: { line: ReelLine }) {
  if (line.role === "note") {
    return (
      <div className="rounded-card border border-line border-dashed bg-panelCard/40 px-3.5 py-3">
        <p className="font-mono text-[0.72rem] leading-relaxed text-signal">{line.text}</p>
        {line.sub ? <p className="mt-1.5 text-[0.72rem] leading-relaxed text-fog">{line.sub}</p> : null}
      </div>
    );
  }

  const incoming = line.role === "in";
  return (
    <div className={cx("flex", incoming ? "justify-start" : "justify-end")}>
      <div className={cx("max-w-[94%]", incoming ? "" : "text-right")}>
        <div
          className={cx(
            "rounded-core px-3.5 py-2.5 text-left",
            incoming
              ? "rounded-tl-md border border-line bg-panelCard"
              : "rounded-br-md border border-signal/40 bg-signal/10"
          )}
        >
          <p className="text-[0.86rem] leading-relaxed text-paper">{line.text}</p>
        </div>
        {line.sub ? <p className="mt-1.5 text-[0.7rem] leading-relaxed text-fog">{line.sub}</p> : null}
      </div>
    </div>
  );
}

function LineStack({ lines, reduce }: { lines: ReelLine[]; reduce: boolean }) {
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {lines.map((line, i) => (
          <motion.div
            key={`${line.role}-${i}-${line.text.slice(0, 18)}`}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: SETTLE }}
          >
            <Bubble line={line} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------- reel */

export default function MotionReels() {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.3 });

  const [reelIndex, setReelIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  const reel = REELS[reelIndex];
  const elapsed = useRef(0);
  const progress = useMotionValue(0);

  /* Never autoplay for a reader who asked for less motion, but let the
     play button work if they press it themselves. */
  useEffect(() => {
    if (reduce) setPlaying(false);
  }, [reduce]);

  /* Timers only run while the section is actually on screen. */
  const running = playing && inView;

  useAnimationFrame((_t, delta) => {
    if (!running) return;
    elapsed.current += delta;
    const duration = reel.steps[step].ms;
    if (elapsed.current >= duration) {
      elapsed.current = 0;
      progress.set(0);
      setStep((s) => (s + 1) % reel.steps.length);
      return;
    }
    progress.set(elapsed.current / duration);
  });

  const jump = useCallback((index: number) => {
    elapsed.current = 0;
    progress.set(0);
    setStep(index);
    setPlaying(false);
  }, [progress]);

  const pickReel = useCallback((index: number) => {
    elapsed.current = 0;
    progress.set(0);
    setReelIndex(index);
    setStep(0);
    setPlaying(true);
  }, [progress]);

  const reset = useCallback(() => {
    elapsed.current = 0;
    progress.set(0);
    setStep(0);
    setPlaying(true);
  }, [progress]);

  const current = reel.steps[step];
  const visible: ReelLine[] =
    reel.mode === "swap" ? current.lines : reel.steps.slice(0, step + 1).flatMap((s) => s.lines);
  const stats = reel.steps.slice(0, step + 1).flatMap((s) => s.stats ?? []);
  const laneLines = visible.filter((l) => l.lane);
  const looseLines = visible.filter((l) => !l.lane);

  return (
    <section id="reels" className="py-24 md:py-32">
      <Shell>
        <Kicker>Motion reels</Kicker>
        <SectionTitle
          className="mt-6"
          title="Four scripted runs of the desk."
          body="Each reel plays the real shape of a thread: what arrives, what the engine decides, and what goes back out. Scrub it, pause it, or pin any step."
        />

        <div ref={frameRef} className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[16rem_1fr] lg:gap-10">
          {/* Reel picker: a vertical index on desktop, a scroll strip on mobile. */}
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
            {REELS.map((entry, index) => {
              const live = index === reelIndex;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => pickReel(index)}
                  aria-pressed={live}
                  className={cx(
                    "shrink-0 rounded-card border px-4 py-3 text-left transition-all duration-300 ease-physical active:scale-[0.98] lg:w-full",
                    live
                      ? "border-signal/50 bg-signal/10 text-paper"
                      : "border-line bg-panelCard/50 text-fog hover:border-lineLight hover:text-paper"
                  )}
                >
                  <span className="block text-[0.85rem] font-semibold tracking-[-0.01em]">
                    {entry.title}
                  </span>
                  <span className="mt-1 hidden text-[0.72rem] leading-relaxed text-fog lg:block">
                    {entry.kicker}
                  </span>
                </button>
              );
            })}
          </div>

          {/* The reel itself. */}
          <div className="rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-lifted">
            <div className="rounded-core border border-line/60 bg-panel shadow-inset">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <Mono className="text-paper">reply desk / {reel.id}</Mono>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? "Pause the reel" : "Play the reel"}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panelCard text-paper transition-all duration-300 ease-physical hover:bg-panelHover active:scale-[0.94]"
                  >
                    {playing ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="Restart the reel"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panelCard text-fog transition-all duration-300 ease-physical hover:bg-panelHover hover:text-paper active:scale-[0.94]"
                  >
                    <ArrowCounterClockwise size={13} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Scrubber: one segment per step, the live one fills in real time. */}
              <div className="flex gap-1 px-4 pt-4">
                {reel.steps.map((entry, index) => (
                  <div key={entry.pill} className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                    {index < step ? (
                      <div className="h-full w-full bg-signal/70" />
                    ) : index === step ? (
                      <motion.div
                        className="h-full w-full origin-left bg-signal"
                        style={reduce ? { scaleX: 1 } : { scaleX: progress }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Step pills. */}
              <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                {reel.steps.map((entry, index) => (
                  <button
                    key={entry.pill}
                    type="button"
                    onClick={() => jump(index)}
                    aria-pressed={index === step}
                    className={cx(
                      "rounded-full border px-3 py-1 text-[0.7rem] font-medium transition-all duration-300 ease-physical active:scale-[0.96]",
                      index === step
                        ? "border-signal/50 bg-signal/12 text-paper"
                        : "border-line bg-panelCard text-fog hover:border-lineLight hover:text-paper"
                    )}
                  >
                    {entry.pill}
                  </button>
                ))}
              </div>

              <div
                className={cx(
                  "px-4 py-5 sm:px-5",
                  reel.frame === "phone" ? "min-h-[24rem]" : "min-h-[20rem]"
                )}
              >
                {reel.frame === "phone" ? (
                  <div className="mx-auto max-w-md">
                    <LineStack lines={visible} reduce={Boolean(reduce)} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {laneLines.length ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {LANES.map((lane) => {
                          const lines = laneLines.filter((l) => l.lane === lane.id);
                          return (
                            <div
                              key={lane.id}
                              className={cx(
                                "rounded-card border p-3 transition-colors duration-500 ease-physical",
                                lines.length ? "border-lineLight bg-panelCard/60" : "border-line bg-panelCard/20"
                              )}
                            >
                              <div className="flex items-center gap-2 pb-2">
                                <lane.Icon
                                  size={14}
                                  weight="fill"
                                  className={lines.length ? "text-signal" : "text-fogLight"}
                                />
                                <Mono className={lines.length ? "text-paper" : undefined}>
                                  {lane.label}
                                </Mono>
                              </div>
                              {lines.length ? (
                                <LineStack lines={lines} reduce={Boolean(reduce)} />
                              ) : (
                                <p className="py-4 text-center text-[0.7rem] text-fogLight">idle</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {looseLines.length ? (
                      <LineStack lines={looseLines} reduce={Boolean(reduce)} />
                    ) : null}

                    {stats.length ? (
                      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
                        {stats.map((stat) => (
                          <div key={stat.label} className="bg-panel px-3 py-4">
                            <dd className="font-display text-xl font-semibold tracking-[-0.03em] text-paper tabular">
                              {stat.value}
                            </dd>
                            <dt className="mt-1 font-mono text-[0.66rem] text-fog">{stat.label}</dt>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                )}
              </div>

              {reel.footnote ? (
                <p className="border-t border-line px-4 py-3 text-[0.7rem] text-fog">
                  {reel.footnote}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Shell>
    </section>
  );
}
