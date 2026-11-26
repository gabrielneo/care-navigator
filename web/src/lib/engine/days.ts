// Which days of the week each service is on. A plan entry's `d` is a 7-bit mask (bit 0 = Monday … bit 6 = Sunday) and
// `n` is how many bits are set; older links have no `d`, so their days come from the usual spread below.
export const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// The starting point: weekdays first, spread out (2 a week → Tue and Thu), as services usually run.
const SPREAD: Record<number, number[]> = { 0: [], 1: [2], 2: [1, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };

export const maskOf = (days: number[]) => days.reduce((m, i) => m | (1 << i), 0);
export const countOf = (mask: number) => DAY_KEYS.reduce((c, _, i) => c + ((mask >> i) & 1), 0);
/** The day numbers (0 = Monday) a plan entry is on. */
export const daysOf = (e: { n: number; d?: number }) =>
  e.d != null ? DAY_KEYS.flatMap((_, i) => ((e.d! >> i) & 1 ? [i] : [])) : (SPREAD[e.n] ?? []);
/** A plan entry for these days. */
export const entryFor = (s: string, days: number[]) => ({ s, n: days.length, d: maskOf(days) });
export const startingDays = (n: number) => SPREAD[Math.max(0, Math.min(7, n))]!;

/** "Mon–Fri", "Tue, Thu", "Mon–Wed, Sat" or "Every day": runs of 3 or more days are joined with a dash. `tr` translates
 *  a day or "Every day"; `join` lists the parts the language's way. */
export function daysText(days: number[], tr: (en: string) => string, join: (xs: string[]) => string): string {
  if (days.length === 7) return tr("Every day");
  const runs: number[][] = [];
  for (const d of [...days].sort((a, b) => a - b)) {
    const last = runs.at(-1);
    if (last && last.at(-1) === d - 1) last.push(d); else runs.push([d]);
  }
  const day = (i: number) => tr(DAY_KEYS[i]!);
  return join(runs.flatMap((r) => (r.length >= 3 ? [`${day(r[0]!)}–${day(r.at(-1)!)}`] : r.map(day))));
}
