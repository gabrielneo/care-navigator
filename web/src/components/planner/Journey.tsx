"use client";
// The planner's sense of progress: a journey bar across the six stages, and "Her plan so far", which collects each answer
// and result as a chip as the family goes (a strip on phones, a sticky side panel on wide screens).
import { rules } from "@/lib/data";
import { costPlan } from "@/lib/engine/cost";
import { matchServices } from "@/lib/engine/matching";
import type { Session, Step } from "@/lib/engine/urlCodec";
import { CountRange } from "./ui";

export const QUESTIONS: Step[] = ["where", "adl", "alone", "memory", "helper", "limits", "postal"];
const PHASES: [string, Step[]][] = [
  ["About her", QUESTIONS], ["Services", ["matches"]], ["Her week", ["week"]], ["Cost", ["cost"]], ["Who to call", ["contacts"]], ["Plan", ["action"]],
];

export function JourneyBar({ step, flow, go }: { step: Step; flow: Step[]; go: (to: Step) => void }) {
  const phases = PHASES.map(([label, steps]) => [label, steps.filter((x) => flow.includes(x))] as const).filter(([, st]) => st.length);
  const at = phases.findIndex(([, st]) => st.includes(step));
  const q = QUESTIONS.indexOf(step);
  return (
    <nav className="journey no-print" aria-label="Progress">
      <ol>
        {phases.map(([label, st], i) => {
          const state = i < at ? "done" : i === at ? "now" : "todo";
          const fill = state === "done" ? 1 : state === "now" ? (q >= 0 && st.length > 1 ? (q + 1) / st.length : 1) : 0;
          return (
            <li key={label} className={state} aria-current={state === "now" ? "step" : undefined}>
              <span className="jseg"><i style={{ transform: `scaleX(${fill})` }} /></span>
              {state === "done"
                ? <button type="button" onClick={() => go(st[0]!)}>{label}<span className="sr-only"> (done, go back)</span></button>
                : <span className="lbl">{label}</span>}
            </li>
          );
        })}
      </ol>
      <p className="journey-now" aria-hidden="true">Step {at + 1} of {phases.length}: {phases[at]?.[0]}{q >= 0 && phases[at]?.[1].length !== 1 ? `, question ${q + 1} of 7` : ""}</p>
    </nav>
  );
}

const WHERE: Record<string, string> = {
  in_hospital: "In hospital", changed_at_home: "At home, needs changed", struggling: "At home, hard to cope",
  in_nursing_home: "In a nursing home", unsure: "Not sure where",
};
const ADL: Record<string, string> = { bath: "washing", dress: "dressing", eat: "eating", toilet: "the toilet", move: "walking", transfer: "getting up" };
const ALONE: Record<string, string> = { weekdays: "Alone on weekdays", most: "Alone most days", no: "Usually has company" };
const MEMORY: Record<string, string> = { dx: "Dementia diagnosed", undx: "Memory problems" };
const HELPER: Record<string, string> = { yes: "Live-in helper", considering: "Thinking about a helper" };
const LIMITS: Record<string, string> = { ok: "You're managing", tired: "You need a break", cant: "You're at your limit" };
const REGION: Record<string, string> = { central: "Central", north: "North", northeast: "North-East", east: "East", west: "West" };
const SHORT: Record<string, string> = {
  day_care: "Day care", dementia_day_care: "Dementia day care", home_personal_care: "Home care", home_nursing: "Nurse visits",
  home_therapy: "Therapy", medical_escort: "Escort", meals_on_wheels: "Meals", respite: "Respite",
};

/** The chips for what's known so far; each stage adds its result once the family has reached it. */
function chips(s: Session, reached: (x: Step) => boolean) {
  const out: [string, React.ReactNode][] = [];
  if (s.w) out.push(["where", s.w === "in_hospital" && s.d ? "Home from hospital" : WHERE[s.w]]);
  if (s.adl) out.push(["adl", s.adl[0] === "unsure" ? "Help needed: not sure" : s.adl.length
    ? `Help with ${(s.adl as string[]).map((a) => ADL[a]).join(", ")}` : "No help with daily tasks"]);
  if (s.med) out.push(["med", "Medical care at home"]);
  for (const [k, v, map] of [["al", s.al, ALONE], ["mem", s.mem, MEMORY], ["hlp", s.hlp, HELPER], ["lim", s.lim, LIMITS]] as const) {
    if (v && map[v]) out.push([k, map[v]]);
  }
  if (s.loc) out.push(["loc", "sec" in s.loc ? `Area ${s.loc.sec}` : `${REGION[s.loc.reg]} region`]);
  if (reached("week") && s.plan?.some((e) => e.n > 0 && SHORT[e.s])) {
    out.push(["plan", s.plan.filter((e) => e.n > 0 && SHORT[e.s]).map((e) => `${SHORT[e.s]} ×${e.n}`).join(", ") + " a week"]);
  }
  const total = reached("cost") ? costPlan(rules, s).total : null;
  if (total?.withSubsidy) out.push(["cost", <><CountRange r={total.withSubsidy} /> a month with subsidy</>]);
  else if (total) out.push(["cost", <><CountRange r={total.fullPrice} /> a month, full price</>]);
  if (reached("contacts")) out.push(["call", `Call first: ${matchServices(rules, s).branch.firstContact}`]);
  return out;
}

export function PlanSoFar({ s, step, flow }: { s: Session; step: Step; flow: Step[] }) {
  const reached = (x: Step) => flow.includes(x) && flow.indexOf(step) >= flow.indexOf(x);
  const list = chips(s, reached);
  if (!list.length || step === "action") return null;
  return (
    <aside className="sofar no-print" aria-label="Her plan so far">
      <h2>Her plan so far</h2>
      <ul tabIndex={0}>{list.map(([k, v]) => <li key={`${k}-${typeof v === "string" ? v : k}`}>{v}</li>)}</ul>
    </aside>
  );
}
