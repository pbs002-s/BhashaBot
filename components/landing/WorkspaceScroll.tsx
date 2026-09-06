"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";
import MoodGlyph from "../MoodGlyph";
import { cx } from "../ui/primitives";
import { Mono, SETTLE, SectionTitle, Shell } from "./kit";
import { WORKSPACE_STORY } from "@/lib/landing-content";
import { moodMeta, workspaceModeMeta } from "@/lib/settings-schema";
import { MOOD_COPY } from "@/lib/landing-content";

/**
 * The narrative pins while the reader scrolls: the same message desk keeps
 * its frame and only its contents change, which is the point being made.
 * Scroll progress drives one small piece of state (the step index), never a
 * per-frame re-render.
 */
export default function WorkspaceScroll() {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const railScale = useTransform(scrollYProgress, [0, 1], [0.02, 1]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(
      WORKSPACE_STORY.length - 1,
      Math.max(0, Math.floor(value * WORKSPACE_STORY.length))
    );
    setActive((current) => (current === next ? current : next));
  });

  const story = WORKSPACE_STORY[active];
  const mode = workspaceModeMeta(story.id);
  const mood = moodMeta(story.defaultMood);

  return (
    <section id="workspaces" ref={track} className="relative h-[460vh]">
      <div className="sticky top-0 flex min-h-[100dvh] items-center overflow-hidden py-24">
        <Shell>
          <SectionTitle
            title="Five desks, one engine."
            body="A workspace is not a theme. It changes what the reply may claim, whether a contact is worth keeping, and which registers are even reachable."
          />

          <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
            {/* Left: the narrative, all five on desktop, only the live one on mobile. */}
            <div className="relative flex gap-5">
              <div className="relative hidden w-px shrink-0 bg-line sm:block" aria-hidden>
                <motion.div
                  className="absolute inset-x-0 top-0 h-full origin-top bg-signal"
                  style={reduce ? { scaleY: 1 } : { scaleY: railScale }}
                />
              </div>

              <ol className="flex-1 space-y-6 lg:space-y-8">
                {WORKSPACE_STORY.map((item, index) => {
                  const live = index === active;
                  return (
                    <li
                      key={item.id}
                      className={cx(
                        "transition-opacity duration-500 ease-physical",
                        live ? "opacity-100" : "opacity-100 lg:opacity-35",
                        live ? "block" : "hidden lg:block"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {live ? (
                          <CheckCircle size={14} weight="fill" className="text-signal" />
                        ) : (
                          <Circle size={14} className="text-fogLight" />
                        )}
                        <h3 className="font-display text-[0.95rem] font-semibold tracking-[-0.01em] text-paper">
                          {item.name}
                        </h3>
                      </div>
                      <p className="mt-2 font-display text-lg leading-snug tracking-[-0.02em] text-paper md:text-xl">
                        {item.headline}
                      </p>
                      <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-fog">
                        {item.body}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Right: the desk itself, reframing per mode. */}
            <div className="rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-lifted">
              <div className="rounded-core border border-line/60 bg-panel shadow-inset">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <Mono className="text-paper">workspace / {story.id}</Mono>
                  <span className="flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-2.5 py-1">
                    <MoodGlyph icon={mood.icon} size={11} className="text-signal" />
                    <Mono className="text-paper">{MOOD_COPY[mood.id].name.toLowerCase()}</Mono>
                  </span>
                </div>

                <div className="min-h-[19rem] px-4 py-5 sm:px-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={story.id}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: SETTLE }}
                    >
                      <div className="max-w-[90%] rounded-core rounded-tl-md border border-line bg-panelCard px-4 py-3">
                        <p className="text-[0.9rem] leading-relaxed text-paper">{story.incoming}</p>
                      </div>

                      <div className="mt-4 ml-auto max-w-[95%] rounded-core rounded-br-md border border-signal/40 bg-signal/10 px-4 py-3">
                        <p className="text-[0.9rem] leading-relaxed text-paper">{story.reply}</p>
                      </div>

                      <dl className="mt-6 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <Mono>leads</Mono>
                          <Mono className="text-paper">
                            {mode.capturesLeads ? "captured" : "off"}
                          </Mono>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <Mono>intimate moods</Mono>
                          <Mono className="text-paper">
                            {mode.allowsIntimateMoods ? "reachable" : "blocked"}
                          </Mono>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 sm:col-span-2">
                          <Mono>after the reply</Mono>
                          <Mono className="text-paper">{story.outcome}</Mono>
                        </div>
                      </dl>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Shell>
      </div>
    </section>
  );
}
