#!/usr/bin/env node
/**
 * Persona trainer.
 *
 * Reads the exported personal chats in demo-messages/, keeps only what the
 * account owner himself wrote, and distils it into lib/persona/pritam-style.json:
 * measured style stats plus a small set of real (incoming, reply) pairs per
 * sub-mood and per relationship. lib/persona-pack.ts turns that file into the
 * prompt block the model sees, so no chat text leaves the machine until a
 * reply is actually drafted.
 *
 * Usage: node scripts/train-persona.mjs [--in demo-messages] [--out lib/persona/pritam-style.json]
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/* ---------------------------------------------------------------- arguments */

const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const ROOT = process.cwd();
const IN_DIR = path.resolve(ROOT, flag("in", "demo-messages"));
const OUT_FILE = path.resolve(ROOT, flag("out", "lib/persona/pritam-style.json"));
const MAX_SAMPLES_PER_SUBMOOD = Number(flag("samples", "10"));
const MAX_SAMPLES_PER_ROLE = 6;

/* ------------------------------------------------- roster (single source of truth)
   lib/relationships.ts owns the roster. Rather than duplicate it here, the
   plain object literal is lifted out of that file, which keeps the trainer a
   dependency-free node script with no compile step. */

function loadRoster() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "relationships.ts"), "utf8");
  const block = src.match(/export const ROSTER: Record<string, RelationshipRole> = \{([\s\S]*?)\n\};/);
  const roster = {};
  if (block) {
    for (const line of block[1].split("\n")) {
      const m = line.match(/^\s*"?([^":]+)"?\s*:\s*"([a-z-]+)"\s*,?\s*$/);
      if (m) roster[m[1].trim().toLowerCase()] = m[2];
    }
  }
  const owner = src.match(/export const OWNER_ALIASES = \[([^\]]*)\]/);
  const aliases = owner
    ? owner[1]
        .split(",")
        .map((s) => s.replace(/["']/g, "").trim().toLowerCase())
        .filter(Boolean)
    : ["pritom biswas"];
  const def = src.match(/export const DEFAULT_ROLE: RelationshipRole = "([a-z-]+)"/);
  return { roster, aliases, defaultRole: def ? def[1] : "friend" };
}

const { roster, aliases, defaultRole } = loadRoster();

function roleFor(name) {
  const key = (name || "").trim().toLowerCase();
  if (aliases.includes(key)) return "self";
  return roster[key] || defaultRole;
}

/* ----------------------------------------------------------------- lexicons
   Bengali script and Banglish (Bengali typed in Latin letters) both appear in
   the same thread, often in the same sentence, so every cue is listed twice. */

const SUB_MOODS = {
  romantic: [
    "ভালোবাসি", "ভালবাসি", "ভালোবাসা", "তোমাকে মিস", "জানু", "সোনা", "আদর", "চুমু", "বউ",
    "valobashi", "bhalobashi", "valobasi", "love you", "miss you", "misskorchi", "miss korchi",
    "jaan", "janu", "sona", "adore", "adr", "bou", "amar tumi", "tumi amar",
  ],
  flirty: [
    "সুন্দর লাগছে", "দুষ্টু", "লজ্জা", "হিহি", "প্রেম", "পটাও", "crush",
    "sundor", "sundori", "cute", "hehe", "dustu", "lojja", "prem", "potao", "flirt", "line mar",
  ],
  angry: [
    "রাগ", "বিরক্ত", "ধুর", "চুপ", "ফালতু", "বাজে", "মেজাজ", "থাম", "বাদ দে",
    "rag ", "raag", "birokto", "dhur", "chup", "faltu", "baje", "mejaj", "tham", "bad de",
    "irritating", "annoying", "shut up",
  ],
  sad: [
    "মন খারাপ", "কষ্ট", "কাঁদ", "কান্না", "একা", "ভালো লাগছে না", "হতাশ",
    "mon kharap", "monkharap", "koshto", "kosto", "kanna", "eka lagche", "valo lagche na",
    "vlo lagcena", "hotash", "depressed", "sad", "hurt",
  ],
  caring: [
    "খেয়েছ", "খেয়েছিস", "ওষুধ", "ঘুমা", "সাবধান", "যত্ন", "শরীর", "বিশ্রাম",
    "kheyecho", "kheyechis", "khaisos", "khaili", "oshudh", "ghuma", "ghumo", "shabdhan",
    "sabdhan", "jotno", "shorir", "take care", "rest nao", "rest ni",
  ],
};

const SUB_MOOD_IDS = ["friendly", "flirty", "romantic", "angry", "sad", "caring"];

/* ------------------------------------------------------------------ helpers */

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F004}]/u;
const BENGALI_RE = /[ঀ-৿]/;
const LATIN_RE = /[A-Za-z]/;
const URL_RE = /(https?:\/\/|www\.)/i;
/** Anything that looks like a phone number, an OTP, or an account id. */
const DIGIT_RUN_RE = /\d{6,}/;

function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function isUsable(m) {
  if (!m || m.isUnsent) return false;
  if (m.type && m.type !== "text") return false;
  const t = clean(m.text);
  if (t.length < 2 || t.length > 260) return false;
  if (URL_RE.test(t) || DIGIT_RUN_RE.test(t)) return false;
  return true;
}

function wordCount(t) {
  return t.split(/\s+/).filter(Boolean).length;
}

function scriptOf(t) {
  const bn = BENGALI_RE.test(t);
  const la = LATIN_RE.test(t);
  if (bn && la) return "mixed";
  if (bn) return "bn";
  return "bn-Latn";
}

function classify(replyText, incomingText, role) {
  const hay = `${incomingText} ${replyText}`.toLowerCase();
  const scores = {};
  for (const [mood, cues] of Object.entries(SUB_MOODS)) {
    let hits = 0;
    for (const cue of cues) if (hay.includes(cue.toLowerCase())) hits += 1;
    if (hits) scores[mood] = hits;
  }
  // A romantic cue only counts as romantic toward a partner; the same words to
  // a friend or a mother read as ordinary affection.
  if (scores.romantic && role !== "gf") {
    scores.caring = (scores.caring || 0) + scores.romantic;
    delete scores.romantic;
  }
  if (scores.flirty && (role === "mom" || role === "family")) delete scores.flirty;

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : "friendly";
}

/* -------------------------------------------------------------------- intake */

if (!fs.existsSync(IN_DIR)) {
  console.error(`No chat folder at ${IN_DIR}. Pass --in <folder>.`);
  process.exit(1);
}

const files = fs
  .readdirSync(IN_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => path.join(IN_DIR, f));

if (!files.length) {
  console.error(`No .json chats in ${IN_DIR}.`);
  process.exit(1);
}

const stats = {
  threads: 0,
  messages: 0,
  ownMessages: 0,
  usableOwn: 0,
  words: 0,
  emojiMessages: 0,
  questionMessages: 0,
  scripts: { bn: 0, "bn-Latn": 0, mixed: 0 },
  lengths: [],
};

const openers = new Map();
const phrases = new Map();
const pairsBySubMood = Object.fromEntries(SUB_MOOD_IDS.map((id) => [id, []]));
const pairsByRole = new Map();
const roleCounts = new Map();
const subMoodCounts = Object.fromEntries(SUB_MOOD_IDS.map((id) => [id, 0]));
const threadIndex = [];

function bump(map, key) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}

for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.warn(`Skipped ${path.basename(file)}: ${err.message}`);
    continue;
  }

  const messages = Array.isArray(data.messages) ? data.messages : [];
  if (!messages.length) continue;

  const other =
    (data.participants || []).find((p) => roleFor(p) !== "self") ||
    path.basename(file).replace(/_\d+\.json$/, "");
  const role = roleFor(other);

  stats.threads += 1;
  stats.messages += messages.length;
  bump(roleCounts, role);

  // Exports arrive newest-first in places, so sort before pairing.
  const ordered = [...messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  let ownInThread = 0;
  let lastIncoming = null;

  for (const m of ordered) {
    const mine = roleFor(m.senderName) === "self";

    if (!mine) {
      if (isUsable(m)) lastIncoming = clean(m.text);
      continue;
    }

    stats.ownMessages += 1;
    ownInThread += 1;
    if (!isUsable(m)) continue;

    const text = clean(m.text);
    stats.usableOwn += 1;

    const wc = wordCount(text);
    stats.words += wc;
    stats.lengths.push(wc);
    if (EMOJI_RE.test(text)) stats.emojiMessages += 1;
    if (text.includes("?")) stats.questionMessages += 1;
    stats.scripts[scriptOf(text)] += 1;

    const first = text.split(/\s+/)[0];
    if (first && first.length <= 14) bump(openers, first.toLowerCase());
    const words = text.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter((w) => w.length > 2);
    for (let i = 0; i < words.length - 1; i += 1) bump(phrases, `${words[i]} ${words[i + 1]}`);

    if (!lastIncoming) continue;

    const subMood = classify(text, lastIncoming, role);
    subMoodCounts[subMood] += 1;

    // Keep pairs that read like a real exchange rather than a one-word grunt.
    if (wc >= 3 && wc <= 32 && wordCount(lastIncoming) >= 2) {
      pairsBySubMood[subMood].push({ incoming: lastIncoming, reply: text, with: other, role });
      if (!pairsByRole.has(role)) pairsByRole.set(role, []);
      pairsByRole.get(role).push({ incoming: lastIncoming, reply: text, subMood });
    }

    lastIncoming = null;
  }

  threadIndex.push({
    thread: path.basename(file, ".json"),
    with: other,
    role,
    messages: messages.length,
    own: ownInThread,
  });
}

/* ------------------------------------------------------------------ shaping */

function pickSamples(list, limit, perPerson = 2) {
  const seen = new Set();
  const fromPerson = new Map();
  const out = [];
  // Prefer mid-length replies: long enough to carry voice, short enough to read.
  const ranked = [...list].sort(
    (a, b) => Math.abs(wordCount(a.reply) - 9) - Math.abs(wordCount(b.reply) - 9)
  );
  // Two passes: the first caps how many lines any one counterpart contributes,
  // so a single chatty thread cannot define the whole mood; the second fills
  // whatever is left over if the corpus is thin.
  for (const pass of [true, false]) {
    for (const p of ranked) {
      if (out.length >= limit) break;
      const key = p.reply.toLowerCase();
      if (seen.has(key)) continue;
      const person = p.with || p.subMood || "";
      if (pass && (fromPerson.get(person) || 0) >= perPerson) continue;
      seen.add(key);
      fromPerson.set(person, (fromPerson.get(person) || 0) + 1);
      out.push(p);
    }
  }
  return out;
}

function topOf(map, n) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

const sorted = [...stats.lengths].sort((a, b) => a - b);
const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

const profile = {
  generatedAt: new Date().toISOString(),
  source: path.relative(ROOT, IN_DIR).replace(/\\/g, "/"),
  owner: aliases[0],
  corpus: {
    threads: stats.threads,
    messages: stats.messages,
    ownMessages: stats.ownMessages,
    ownMessagesUsed: stats.usableOwn,
    byRole: Object.fromEntries([...roleCounts.entries()].sort((a, b) => b[1] - a[1])),
  },
  style: {
    avgWordsPerReply: stats.usableOwn ? +(stats.words / stats.usableOwn).toFixed(2) : 0,
    medianWordsPerReply: median,
    emojiRatePct: stats.usableOwn ? +((stats.emojiMessages / stats.usableOwn) * 100).toFixed(1) : 0,
    questionRatePct: stats.usableOwn
      ? +((stats.questionMessages / stats.usableOwn) * 100).toFixed(1)
      : 0,
    script: {
      bengaliPct: stats.usableOwn ? +((stats.scripts.bn / stats.usableOwn) * 100).toFixed(1) : 0,
      banglishPct: stats.usableOwn
        ? +((stats.scripts["bn-Latn"] / stats.usableOwn) * 100).toFixed(1)
        : 0,
      mixedPct: stats.usableOwn ? +((stats.scripts.mixed / stats.usableOwn) * 100).toFixed(1) : 0,
    },
    topOpeners: topOf(openers, 18),
    topPhrases: topOf(phrases, 22),
  },
  subMoods: Object.fromEntries(
    SUB_MOOD_IDS.map((id) => [
      id,
      {
        observed: subMoodCounts[id],
        /** False when the corpus held no example, so the prompt falls back to the curated mood. */
        learned: pairsBySubMood[id].length > 0,
        samples: pickSamples(pairsBySubMood[id], MAX_SAMPLES_PER_SUBMOOD),
      },
    ])
  ),
  relationships: Object.fromEntries(
    [...pairsByRole.entries()].map(([role, list]) => [
      role,
      {
        observed: list.length,
        subMoods: list.reduce((acc, p) => {
          acc[p.subMood] = (acc[p.subMood] || 0) + 1;
          return acc;
        }, {}),
        samples: pickSamples(list, MAX_SAMPLES_PER_ROLE, MAX_SAMPLES_PER_ROLE),
      },
    ])
  ),
  threads: threadIndex.sort((a, b) => b.own - a.own).slice(0, 40),
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(profile, null, 2)}\n`, "utf8");

/* ------------------------------------------------------------------ receipt */

console.log(`Read     ${stats.threads} threads, ${stats.messages} messages`);
console.log(`Owner    ${stats.ownMessages} messages, ${stats.usableOwn} usable after filtering`);
console.log(
  `Style    ${profile.style.avgWordsPerReply} words avg, ${profile.style.emojiRatePct}% emoji, ` +
    `${profile.style.script.banglishPct}% Banglish / ${profile.style.script.bengaliPct}% Bengali`
);
for (const id of SUB_MOOD_IDS) {
  console.log(
    `  ${id.padEnd(9)} ${String(subMoodCounts[id]).padStart(6)} observed, ${
      profile.subMoods[id].samples.length
    } kept`
  );
}
console.log(`Wrote    ${path.relative(ROOT, OUT_FILE).replace(/\\/g, "/")}`);
