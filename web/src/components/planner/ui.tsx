"use client";
// Small shared pieces for the planner screens. Wording: docs/specs/08-onscreen-wording.md.
import type { Range } from "@/lib/engine/cost";

export const money = (n: number) => `$${n.toLocaleString("en-SG")}`;
export const range = (r: Range) => (r.low === r.high ? money(r.low) : `${money(r.low)} – ${money(r.high)}`);

/** "a session (a day)", "an hour" … for "From $55 a session (a day) before subsidy". */
export const UNIT_ONE: Record<string, string> = {
  session: "a session (a day)", hour: "an hour", visit: "a visit", trip: "a trip", meal: "a meal", day: "a day", month: "a month",
};
/** "days a week" … for the week screen's steppers. */
export const UNIT_WEEK: Record<string, string> = {
  session: "days a week", hour: "4-hour visits a week", visit: "visits a week", trip: "trips a week",
  meal: "meals a week", day: "days a week",
};
/** Price badges for services without a published price (spec 08). */
export const NO_PRICE: Record<string, string> = {
  interim_caregiver_service: "Ask the ward's medical social worker",
  active_ageing_centre: "Usually free or low cost",
};

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d={d} /></svg>
);

/** − / + stepper with real buttons, accessible names, and a live value. */
export function Stepper({ value, min, max, onChange, less, more, label }: {
  value: number; min: number; max: number; onChange: (n: number) => void; less: string; more: string; label: string;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="sq" aria-label={less} title={less} disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}>{icon("M5 12h14")}</button>
      <output aria-live="polite">{value}</output>
      <button type="button" className="sq" aria-label={more} title={more} disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}>{icon("M12 5v14M5 12h14")}</button>
    </div>
  );
}

/** One radio answer inside a fieldset. */
export function Radio({ name, value, checked, onChange, children }: {
  name: string; value: string; checked: boolean; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <label className="opt">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span>{children}</span>
    </label>
  );
}

export function Check({ checked, onChange, children }: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <label className="opt">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

/** Segmented single choice (residency, birth year). */
export function Seg<T extends string>({ name, legend, value, options, onChange }: {
  name: string; legend: string; value: T | undefined; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="seg">
        {options.map(([v, label]) => (
          <label key={v}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
