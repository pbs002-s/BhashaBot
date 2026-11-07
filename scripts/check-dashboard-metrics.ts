// Run: node scripts/check-dashboard-metrics.ts   (Node 22.6+ strips types natively)
import assert from "node:assert/strict";
import { countBy, dailyTraffic, dayOverDay, topShares } from "../lib/dashboard-metrics.ts";

const now = new Date("2026-11-07T12:00:00").getTime();
const at = (hoursAgo: number, needsHuman = false, platform?: string) =>
  ({ createdAt: new Date(now - hoursAgo * 3600_000).toISOString(), needsHuman, platform }) as any;

const logs = [at(1), at(2, true), at(30), at(30), at(200)];

const traffic = dailyTraffic(logs, 7, now);
assert.equal(traffic.length, 7);
assert.deepEqual([traffic[6].auto, traffic[6].human], [1, 1]);
assert.equal(traffic[5].auto, 2);
assert.equal(traffic.reduce((s, b) => s + b.auto + b.human, 0), 4, "8-day-old log is dropped");

assert.equal(dayOverDay(logs, undefined, now), 0); // 2 today vs 2 yesterday
assert.equal(dayOverDay([at(1)], undefined, now), null);

assert.deepEqual(countBy([at(1, false, "telegram"), at(1)], (l) => l.platform, "web"), { telegram: 1, web: 1 });
assert.deepEqual(topShares({ a: 1, b: 3, c: 2 }, 2, 6).map((s) => s.label), ["b", "c"]);

console.log("dashboard-metrics ok");
