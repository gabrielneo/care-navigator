// The action plan's timeline (to-do 8.2): the first call, then the steps from next_steps.yaml whose conditions hold for
// her, in order: now, this week, this month, later. Each step carries the source that describes it.
import type { RulesBundle } from "../data/types";
import { planEntries, potentialGrants } from "./cost";
import { clauseHolds, matchServices } from "./matching";
import type { Session } from "./urlCodec";

export const TIMINGS = ["now", "week", "month", "later"] as const;
export type Timing = (typeof TIMINGS)[number];

export interface PlanStep {
  id: string;
  timing: Timing;
  label: string;
  text: string;
  unlocks: string | null;
  after: string | null;        // the label of the step that comes first, if it's also on her plan
  group: "plan" | "carer" | "ahead";   // the timeline, "For you" (8.8) or "Also worth doing" (8.9)
  sourceIds: string[];
}

export function nextSteps(rules: RulesBundle, s: Session): PlanStep[] {
  const m = matchServices(rules, s);
  const inPlan = new Set(planEntries(s).filter((e) => e.n > 0).map((e) => e.s));
  const grants = new Set(potentialGrants(rules, s, m.adlCount).map((g) => g.grantId));
  const first = m.branch.firstContact.charAt(0).toLowerCase() + m.branch.firstContact.slice(1);
  const call: PlanStep = {
    id: "call_first", timing: "now", label: "First call",
    text: `Call ${first}${m.branchId === "in_hospital" && !s.d ? ", before she's discharged" : ""}.`,
    unlocks: null, after: null, group: "plan", sourceIds: m.branch.sourceIds,
  };
  const picked = rules.nextSteps.filter((st) =>
    (st.when ?? []).every((c) => clauseHolds(c, s))
    && (!st.planAny?.length || st.planAny.some((x) => inPlan.has(x)))
    && (!st.grantAny?.length || st.grantAny.some((x) => grants.has(x))));
  const labels = new Map(picked.map((st) => [st.stepId, st.label]));
  const rest: PlanStep[] = picked.map((st) => ({
    id: st.stepId, timing: st.timing, label: st.label, text: st.text, unlocks: st.unlocks ?? null,
    after: st.after ? labels.get(st.after) ?? null : null, group: st.group ?? "plan", sourceIds: [st.sourceId],
  }));
  // Stable sort keeps the table's order within each timing.
  return [call, ...rest].sort((a, b) => TIMINGS.indexOf(a.timing) - TIMINGS.indexOf(b.timing));
}
