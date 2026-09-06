import fs from "node:fs";
import path from "node:path";
import stub from "./persona/pritam-style.stub.json";
import { roleMeta, type RelationshipRole } from "./relationships";
import { PRITAM_SUB_MOODS, subMoodMeta, type PritamSubMood } from "./settings-schema";

/**
 * Turns the trained style file into the prompt block the persona mood uses.
 *
 * scripts/train-persona.mjs writes lib/persona/pritam-style.json from the
 * exported chats; nothing here reads the chats themselves. Re-run the trainer
 * after adding threads and this block updates with it.
 */

export interface TrainedSample {
  incoming: string;
  reply: string;
  with?: string;
  role?: string;
  subMood?: string;
}

interface TrainedProfile {
  generatedAt: string;
  owner: string;
  corpus: {
    threads: number;
    messages: number;
    ownMessages: number;
    ownMessagesUsed: number;
    byRole: Record<string, number>;
  };
  style: {
    avgWordsPerReply: number;
    medianWordsPerReply: number;
    emojiRatePct: number;
    questionRatePct: number;
    script: { bengaliPct: number; banglishPct: number; mixedPct: number };
    topOpeners: { value: string; count: number }[];
    topPhrases: { value: string; count: number }[];
  };
  subMoods: Record<string, { observed: number; learned: boolean; samples: TrainedSample[] }>;
  relationships: Record<
    string,
    { observed: number; subMoods?: Record<string, number>; samples: TrainedSample[] }
  >;
}

/**
 * The trained file holds real private messages, so it is deliberately not in
 * git: it is read from disk at runtime and the committed stub stands in until
 * `node scripts/train-persona.mjs` has been run on this machine.
 */
const TRAINED_PATH = path.join(process.cwd(), "lib", "persona", "pritam-style.json");

function loadProfile(): TrainedProfile {
  try {
    if (fs.existsSync(TRAINED_PATH)) {
      return JSON.parse(fs.readFileSync(TRAINED_PATH, "utf8")) as TrainedProfile;
    }
  } catch (err) {
    console.error("Trained persona file could not be read, using the stub:", err);
  }
  return stub as unknown as TrainedProfile;
}

const profile = loadProfile();

/** How many learned exchanges go into a single prompt. */
const MAX_STYLE_SAMPLES = 6;
const MAX_ROLE_SAMPLES = 3;

export function personaProfile(): TrainedProfile {
  return profile;
}

/** True once the trainer has been run against a corpus with usable messages. */
export function personaIsTrained(): boolean {
  return (profile?.corpus?.ownMessagesUsed || 0) > 0;
}

/** Small summary for the mood page, safe to send to the browser. */
export function personaSummary() {
  return {
    trained: personaIsTrained(),
    generatedAt: profile.generatedAt,
    threads: profile.corpus.threads,
    messages: profile.corpus.messages,
    ownMessages: profile.corpus.ownMessages,
    ownMessagesUsed: profile.corpus.ownMessagesUsed,
    style: profile.style,
    subMoods: Object.fromEntries(
      PRITAM_SUB_MOODS.map((m) => [
        m.id,
        {
          observed: profile.subMoods[m.id]?.observed || 0,
          learned: Boolean(profile.subMoods[m.id]?.learned),
        },
      ])
    ),
    roles: profile.corpus.byRole,
  };
}

function formatSamples(samples: TrainedSample[], limit: number): string {
  return samples
    .slice(0, limit)
    .map((s) => `They: ${s.incoming}\nYou: ${s.reply}`)
    .join("\n\n");
}

/**
 * The persona block appended to the system prompt when the persona mood is
 * active. `role` narrows the register when the thread is on the roster.
 */
export function buildPersonaBlock(subMood: PritamSubMood, role?: RelationshipRole): string {
  const sub = subMoodMeta(subMood);
  const learned = profile.subMoods[subMood];
  const lines: string[] = [];

  lines.push(`SUB-MOOD — ${subMood}: ${sub.directive}`);

  if (personaIsTrained()) {
    const s = profile.style;
    const dominant =
      s.script.banglishPct >= s.script.bengaliPct
        ? "Banglish (Bengali written in Latin letters)"
        : "Bengali script";
    lines.push(
      `MEASURED VOICE — taken from ${profile.corpus.ownMessagesUsed} of the owner's own messages across ${profile.corpus.threads} chats:
- Replies run about ${s.avgWordsPerReply} words, median ${s.medianWordsPerReply}. Never write a paragraph where he would have written a line.
- ${s.script.banglishPct}% of his lines are Banglish, ${s.script.bengaliPct}% Bengali script, ${s.script.mixedPct}% both in one line. Default to ${dominant} and mirror whichever the sender used.
- An emoji appears in ${s.emojiRatePct}% of his lines, usually one, at the end. ${s.questionRatePct}% of his lines ask something back.
- Openers he actually uses: ${s.topOpeners.slice(0, 10).map((o) => o.value).join(", ")}.
- Turns of phrase that recur: ${s.topPhrases.slice(0, 10).map((p) => p.value).join(", ")}.
- Punctuation stays loose: commas and spaces before commas are normal, full stops are often dropped. Do not tidy the grammar into textbook Bengali or textbook English.`
    );
  }

  if (learned?.samples?.length) {
    lines.push(
      `HOW HE ACTUALLY REPLIES IN THIS SUB-MOOD — real exchanges, copy the register and the length, never the content:\n\n${formatSamples(
        learned.samples,
        MAX_STYLE_SAMPLES
      )}`
    );
  } else {
    lines.push(
      `No exchange in the corpus was labelled ${subMood}, so follow the sub-mood directive above and keep the measured voice.`
    );
  }

  if (role && role !== "unknown" && role !== "self") {
    const meta = roleMeta(role);
    lines.push(`WHO IS ON THE OTHER END — ${meta.label.en}. ${meta.register}`);
    const rolePairs = profile.relationships[role]?.samples;
    if (rolePairs?.length) {
      lines.push(`How he writes to this person:\n\n${formatSamples(rolePairs, MAX_ROLE_SAMPLES)}`);
    }
  }

  lines.push(
    `CONTEXTUAL RELEVANCE & TOPIC ADHERENCE — CRITICAL:
- Directly react and reply to the EXACT topic, question, emotion, or situation the person is talking about.
- Do NOT bring up eating, sleeping, or food unless the sender explicitly asks about food, eating, or cooking.
- Keep the reply concise, natural, witty, and relevant to their specific message.`
  );

  lines.push(
    `PERSONA LIMITS — this is a private voice, not a licence. Never insult anyone's family, body or religion, never threaten, never write sexual content, and never keep pushing a tone the other side has stepped away from. If the incoming message reads as coming from a stranger, a minor or someone in real distress, drop the persona and answer plainly and kindly.`
  );

  return lines.join("\n\n");
}
