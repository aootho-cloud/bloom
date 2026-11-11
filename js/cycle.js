// Cycle maths: groups logged days into periods and predicts what's next.
import { fromKey, toKey, addDays, diffDays, today } from './utils.js';

const isBleeding = (entry) => entry && entry.flow && entry.flow !== 'spotting';
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

/** Consecutive bleeding days (allowing a 1-day gap) become one period. */
export function getPeriods(days) {
  const keys = Object.keys(days).filter((k) => isBleeding(days[k])).sort();
  const periods = [];
  for (const k of keys) {
    const last = periods[periods.length - 1];
    if (last && diffDays(fromKey(k), fromKey(last.end)) <= 2) {
      last.end = k;
      last.length = diffDays(fromKey(k), fromKey(last.start)) + 1;
    } else {
      periods.push({ start: k, end: k, length: 1 });
    }
  }
  return periods;
}

export function getStats(state) {
  const { days, settings } = state;
  const luteal = settings.lutealLength || 14;
  const periods = getPeriods(days);

  const cycles = [];
  for (let i = 1; i < periods.length; i++) {
    const length = diffDays(fromKey(periods[i].start), fromKey(periods[i - 1].start));
    if (length >= 15 && length <= 60) cycles.push({ start: periods[i - 1].start, length });
  }

  const recentCycles = cycles.slice(-6);
  const avgCycle = recentCycles.length ? Math.round(avg(recentCycles.map((c) => c.length))) : settings.cycleLength;
  const recentPeriods = periods.slice(-6);
  const avgPeriod = recentPeriods.length
    ? Math.max(1, Math.round(avg(recentPeriods.map((p) => p.length))))
    : settings.periodLength;

  const lastPeriod = periods[periods.length - 1] || null;
  const stats = { periods, cycles, avgCycle, avgPeriod, lastPeriod, luteal };
  if (!lastPeriod) return stats;

  const t = today();
  const lastStart = fromKey(lastPeriod.start);
  const cycleDay = diffDays(t, lastStart) + 1;
  const nextStart = addDays(lastStart, avgCycle);
  const daysUntil = diffDays(nextStart, t);
  const onPeriod = cycleDay <= Math.max(avgPeriod, lastPeriod.length) && diffDays(t, fromKey(lastPeriod.end)) <= 1;

  // Fertile window: ovulation ~luteal days before the next period.
  let ovulation = addDays(nextStart, -luteal);
  if (diffDays(t, ovulation) > 1) ovulation = addDays(ovulation, avgCycle);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const inFertile = diffDays(t, fertileStart) >= 0 && diffDays(fertileEnd, t) >= 0;

  let phase;
  if (onPeriod) phase = 'Period';
  else if (daysUntil < 0) phase = 'Period expected';
  else if (inFertile) phase = 'Fertile window';
  else if (diffDays(fertileStart, t) > 0 && diffDays(nextStart, ovulation) > 0) phase = 'Follicular phase';
  else phase = 'Luteal phase';

  return {
    ...stats, cycleDay, nextStart, daysUntil, onPeriod,
    ovulation, fertileStart, fertileEnd, phase,
  };
}

/** Map of date key -> Set of prediction flags ('predicted' | 'fertile' | 'ovulation'). */
export function getPredictions(stats, monthsAhead = 12) {
  const map = new Map();
  if (!stats.lastPeriod) return map;
  const mark = (d, flag) => {
    const k = toKey(d);
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(flag);
  };

  const t = today();
  const lastStart = fromKey(stats.lastPeriod.start);
  const count = Math.ceil((monthsAhead * 30) / stats.avgCycle) + 1;

  for (let i = 1; i <= count; i++) {
    const start = addDays(lastStart, stats.avgCycle * i);
    // If late, shift the very next prediction to start today.
    const pStart = i === 1 && diffDays(start, t) < 0 ? t : start;
    for (let d = 0; d < stats.avgPeriod; d++) {
      const day = addDays(pStart, d);
      if (diffDays(day, t) >= 0) mark(day, 'predicted');
    }
    const ov = addDays(start, -stats.luteal);
    for (let d = -5; d <= 1; d++) {
      const day = addDays(ov, d);
      if (diffDays(day, lastStart) > 0) mark(day, d === 0 ? 'ovulation' : 'fertile');
    }
  }
  return map;
}
