import type { ConversationLog } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DayBucket {
  /** Local midnight of the day, as epoch ms. */
  day: number;
  auto: number;
  human: number;
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Conversations per day for the last `days` days, split by who handled them. */
export function dailyTraffic(logs: ConversationLog[], days = 7, now = Date.now()): DayBucket[] {
  const today = startOfDay(now);
  const buckets: DayBucket[] = Array.from({ length: days }, (_, i) => ({
    day: today - (days - 1 - i) * DAY_MS,
    auto: 0,
    human: 0,
  }));
  for (const log of logs) {
    const index = Math.round((startOfDay(new Date(log.createdAt).getTime()) - buckets[0].day) / DAY_MS);
    const bucket = buckets[index];
    if (!bucket) continue;
    if (log.needsHuman) bucket.human += 1;
    else bucket.auto += 1;
  }
  return buckets;
}

/**
 * Percent change between the last 24h and the 24h before it, for logs that
 * match `pick`. Null when there is no earlier window to compare against.
 */
export function dayOverDay(
  logs: ConversationLog[],
  pick: (log: ConversationLog) => boolean = () => true,
  now = Date.now()
): number | null {
  let current = 0;
  let previous = 0;
  for (const log of logs) {
    if (!pick(log)) continue;
    const age = now - new Date(log.createdAt).getTime();
    if (age < DAY_MS) current += 1;
    else if (age < 2 * DAY_MS) previous += 1;
  }
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Largest `n` entries of a count map, plus their share of `total`. */
export function topShares(counts: Record<string, number>, n: number, total: number) {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([label, count]) => ({ label, count, pct: total ? Math.round((count / total) * 100) : 0 }));
}

/** Count logs by a string key; missing keys land under `fallback`. */
export function countBy(logs: ConversationLog[], key: (log: ConversationLog) => string | undefined, fallback: string) {
  const out: Record<string, number> = {};
  for (const log of logs) {
    const k = key(log) || fallback;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
