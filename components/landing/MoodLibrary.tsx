"use client";

import Link from "next/link";
import { Lock } from "@phosphor-icons/react/dist/ssr";
import MoodGlyph from "../MoodGlyph";
import { cx } from "../ui/primitives";
import { Mono, Reveal, SectionTitle, Shell } from "./kit";
import { GUARDRAILS, MOOD_COPY } from "@/lib/landing-content";
import { ROLES } from "@/lib/relationships";
import { MOODS, PRITAM_SUB_MOODS } from "@/lib/settings-schema";

/** Column spans per cell, so twelve moods fill exactly twelve cells with rhythm. */
const SPANS = [
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-3",
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
];

/** The four widest cells carry an accent wash so the grid is not twelve text boxes. */
const TINTED = new Set([0, 4, 8, 11]);

export function MoodBento() {
  return (
    <section id="moods" className="py-24 md:py-32">
      <Shell>
        <SectionTitle
          title="Twelve registers, and one of them is a person."
          body="The mood is orthogonal to the workspace: it changes how a thing is said, never what may be said. Each one has its own page with live samples."
        />

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-12 lg:mt-14">
          {MOODS.map((mood, index) => {
            const copy = MOOD_COPY[mood.id];
            const tinted = TINTED.has(index);
            return (
              <Reveal
                key={mood.id}
                delay={(index % 3) * 0.05}
                amount={0.2}
                className={cx("min-w-0", SPANS[index])}
              >
                <Link
                  href={`/moods/${mood.id}`}
                  className="group flex h-full flex-col justify-between rounded-card border border-line bg-panelCard/40 p-5 transition-all duration-300 ease-physical hover:-translate-y-0.5 hover:border-lineLight hover:shadow-lifted"
                  style={
                    tinted
                      ? {
                          backgroundImage: `radial-gradient(120% 120% at 0% 0%, ${mood.accent}26, transparent 62%)`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-soft border border-line/60"
                      style={{ backgroundColor: `${mood.accent}1f`, color: mood.accent }}
                    >
                      <MoodGlyph icon={mood.icon} size={16} />
                    </span>
                    {mood.locked ? (
                      <span className="flex items-center gap-1 rounded-full border border-line bg-panel px-2 py-0.5">
                        <Lock size={10} weight="fill" className="text-signal" />
                        <Mono className="text-paper">locked</Mono>
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <h3 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em] text-paper">
                      {copy.name}
                    </h3>
                    <p className="mt-1.5 text-[0.82rem] leading-relaxed text-fog">{copy.line}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Shell>
    </section>
  );
}

/* ----------------------------------------------------------------- persona */

export function PersonaEngine() {
  return (
    <section id="persona" className="border-y border-line/60 bg-panel/30 py-24 md:py-32">
      <Shell>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Registers first, offset left, because they are the evidence. */}
          <div className="lg:col-span-5">
            <Mono className="text-paper">relationship registers</Mono>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {ROLES.map((role) => (
                <li key={role.id} className="flex gap-3 py-3.5">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: role.accent }}
                  />
                  <div className="min-w-0">
                    <p className="text-[0.85rem] font-medium text-paper">{role.label.en}</p>
                    <p className="mt-0.5 text-[0.78rem] leading-relaxed text-fog">
                      {role.register.split(". ")[0]}.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <SectionTitle
              title="A mood trained on one person, locked behind his password."
              body="The persona mood is not a prompt describing a voice. A trainer reads exported chats on your own machine, measures how the owner actually writes, and hands the model that measurement."
            />

            <div className="mt-8 flex flex-wrap gap-1.5">
              {PRITAM_SUB_MOODS.map((sub) => (
                <span
                  key={sub.id}
                  className="rounded-full border border-line bg-panelCard px-3 py-1 text-[0.75rem] text-fog"
                >
                  {sub.id}
                </span>
              ))}
            </div>

            <ul className="mt-8 space-y-3 border-t border-line pt-6">
              {GUARDRAILS.map((line) => (
                <li key={line} className="flex gap-3 text-[0.85rem] leading-relaxed text-paper">
                  <Lock size={13} weight="fill" className="mt-1 shrink-0 text-signal" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    </section>
  );
}
