"use client";
// Small shared pieces for the planner screens. Wording: docs/specs/08-onscreen-wording.md.
import { useEffect, useRef, useState } from "react";
import type { Range } from "@/lib/engine/cost";

import { money, range } from "@/lib/format";
export { money, range };

/** A money range that counts to its new value when the answers change it. It shows the final value at once on first
 *  show and with reduced motion, so the figure is never wrong for long. */
export function CountRange({ r }: { r: Range }) {
  const [shown, setShown] = useState(r);
  const now = useRef(r);
  useEffect(() => {
    const from = now.current;
    if (from.low === r.low && from.high === r.high) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { now.current = r; setShown(r); return; }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 450), e = 1 - (1 - k) ** 3;
      const at = (a: number, b: number) => (k === 1 ? b : Math.round((a + (b - a) * e) / 5) * 5);
      now.current = { low: at(from.low, r.low), high: at(from.high, r.high) };
      setShown(now.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [r.low, r.high]);
  return <>{range(shown)}</>;
}

/** Pointer handlers that tilt a `.tilt` card toward a mouse (the CSS applies it only on mouse or trackpad devices). */
export const tilt = {
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const b = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--ry", `${((e.clientX - b.left) / b.width - 0.5) * 6}deg`);
    e.currentTarget.style.setProperty("--rx", `${(0.5 - (e.clientY - b.top) / b.height) * 6}deg`);
  },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--rx");
    e.currentTarget.style.removeProperty("--ry");
  },
};

/** A card that tilts toward the pointer; usable from server components (pages) as a plain wrapper. */
export function Tilt({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`tilt ${className}`} {...tilt}>{children}</div>;
}

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
  home_palliative_care: "Charges may apply. A medical social worker can help with fees",
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
