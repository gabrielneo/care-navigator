"use client";
// Screens 3–7. Wording: docs/specs/08; behaviour and edge cases: docs/specs/06 and 09; layouts: docs/wireframes.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { dataDate, longDate, manifest, rules, source } from "@/lib/data";
import { useGeo } from "@/lib/data/geo";
import { costPlan, nursingHome, potentialGrants, planEntries, severeOnlyHidden, type Range } from "@/lib/engine/cost";
import { matchServices } from "@/lib/engine/matching";
import { incomeOptions, type TierId } from "@/lib/engine/tiers";
import type { Session } from "@/lib/engine/urlCodec";
import { nearbyContacts } from "@/lib/geo/nearby";
import { pointForSession, type Region } from "@/lib/geo/postal";
import { becauseOf, Handover, TIER_LABEL, WHO } from "./Journey";
import { Explain, Sources, termForStep } from "./Sourced";
import { nextSteps, TIMINGS, type PlanStep, type Timing } from "@/lib/engine/steps";
import { reminders, remindersIcs } from "@/lib/engine/reminders";
import { getLang, list as join, t } from "@/lib/i18n";
import { CountRange, money, NO_PRICE, range, Radio, Seg, Stepper, tilt, UNIT_ONE, UNIT_WEEK, UNIT_WEEK_ONE } from "./ui";
import { DAY_KEYS, daysOf, daysText, entryFor, startingDays } from "@/lib/engine/days";

type P = { s: Session; update: (p: Partial<Session>) => void; next: (s?: Session) => void; restart: () => void; startNew: () => void;
  toWeek: () => void };
const services = new Map(rules.serviceTypes.map((x) => [x.serviceId, x]));
const prices = new Map(rules.priceReferences.prices.map((p) => [p.serviceId, p]));
const svcName = (id: string) => t(services.get(id)?.name ?? id);
const disclaimer = () => t("Estimate only, based on published rules as of {date}. Not a quote, an eligibility decision or medical advice.", { date: dataDate });

function priceBadge(id: string): string {
  const p = prices.get(id), svc = services.get(id);
  if (!p || !svc?.unit) return t(NO_PRICE[id] ?? "");
  const about = p.lowConfidence === "official" ? "From" : "About";
  const amount = p.priceLowSgd === p.priceHighSgd || about === "From" ? money(p.priceLowSgd) : `${money(p.priceLowSgd)}–${money(p.priceHighSgd)}`;
  return t(about === "From" ? "From {amount} {unit} before subsidy" : "About {amount} {unit} before subsidy", { amount, unit: t(UNIT_ONE[svc.unit] ?? "") });
}


/** In-page links ("On this page", the total bar) scroll to their section without touching the address: the plan
 *  lives in the # part of the link, so a plain #total would replace it. */
function jump(e: React.MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById(e.currentTarget.hash.slice(1));
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el.focus({ preventScroll: true });
}

/** On a phone, the monthly total stays in reach while the answers above it change: a bar at the bottom of the screen,
 *  shown only while the total itself is further down. Tapping it goes to the total. */
function TotalPeek({ r, subsidised }: { r: Range; subsidised: boolean }) {
  const [below, setBelow] = useState(false);
  useEffect(() => {
    // Checked on every scroll, not with an IntersectionObserver: a jump straight past the total (a fling, End, a link)
    // never "intersects", which left the bar covering the buttons further down.
    const check = () => { const el = document.getElementById("total"); setBelow(!!el && el.getBoundingClientRect().top > innerHeight); };
    check();
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    return () => { removeEventListener("scroll", check); removeEventListener("resize", check); };
  }, []);
  if (!below) return null;
  return (
    <a href="#total" className="peek no-print" onClick={jump}>
      <b>{range(r)}</b>{t(subsidised ? " a month with subsidy" : " a month, full price")}<span aria-hidden="true"> ↓</span>
    </a>
  );
}


/** The sources behind the numbers a price badge shows: a "From" badge shows only the low figure. */
const priceSources = (id: string) => {
  const p = prices.get(id);
  return !p ? [] : p.lowConfidence === "official" ? [p.lowSourceId] : [p.lowSourceId, p.highSourceId];
};

// ---------- 3 · Matches ----------
export function Matches({ s, update, next, restart }: P) {
  const m = matchServices(rules, s);
  const because = (x: (typeof m.matches)[number]) => becauseOf(x.when, s);
  // Matches beyond the top 3 that come from something she ticked herself (a health event, medical care) open by default;
  // the label counts every one that traces back to her answers, so it matches the cards shown.
  const fromTicks = m.more.filter((x) => x.when.some((c) => c.q === "cond" || c.q === "med"));
  const fromAnswers = m.more.filter((x) => because(x).length > 0);
  const card = (x: (typeof m.matches)[number]) => {
    const svc = services.get(x.serviceId)!;
    return (
      <div className="svc tilt" key={x.serviceId} {...tilt}>
        <h3>{t(svc.name)} <span className="meta">({svc.officialTerm})</span></h3>
        {because(x).length > 0 && (
          <p className="because"><span>{t("Because you said:")}</span> {because(x).map((b) => <span className="tag" key={b}>{b}</span>)}</p>
        )}
        <p className="price">{priceBadge(x.serviceId)}</p>
        <p className="why"><b>{t("Why this fits:")}</b> {t(x.reasonText)}</p>
        <p>{t(svc.description)}</p>
        {svc.unit && <Sources ids={priceSources(x.serviceId)} />}
      </div>
    );
  };
  if (m.matches.length === 0) {
    return (
      <>
        <h1>{t("We need a bit more to suggest services")}</h1>
        <a className="btn" href="tel:18006506060">{t("Call the AIC hotline")}</a>
        <button type="button" className="btn sec" onClick={restart}>{t("Change answers")}</button>
      </>
    );
  }
  const build = () => {
    // First visit: start the week from the matched services that have a weekly default (spec 08: "our assumption").
    const plan = s.plan ?? m.matches.flatMap((x) => {
      const n = services.get(x.serviceId)?.defaultUnitsPerWeek;
      return n ? [{ s: x.serviceId, n }] : [];
    });
    const session = { ...s, plan };
    update({ plan });
    next(session);
  };
  return (
    <>
      <h1>{m.matches.length === 1 ? t("1 service may fit") : t("{n} services may fit", { n: m.matches.length })}</h1>
      {m.dementiaNote && <><p className="why">{t(m.dementiaNote)}</p><Sources ids={[rules.branchRules.dementiaFlag.sourceId]} /></>}
      {m.confirmWithProfessional && <p className="help">{t('Some answers were "Not sure". Check these with a doctor, the ward social worker or an AIC Link.')}</p>}
      {m.matches.map(card)}
      {m.more.length > 0 && (
        <details className="panel" open={fromTicks.length > 0}>
          <summary>{fromAnswers.length === 1 && m.more.length === 1 ? t("1 more fits your answers")
            : fromAnswers.length === m.more.length ? t("{n} more fit your answers", { n: m.more.length })
            : t("More that may help")}</summary>
          {m.more.map(card)}
        </details>
      )}
      <button type="button" className="btn" onClick={build}>{t("Build her week")}</button>
    </>
  );
}

// ---------- 4 · Week ----------
/** The week at a glance, where each service can be moved to another day: drag its tag onto a day, or tap the tag and
 *  then "Move here" (the way that works for touch, keyboard and screen readers alike). A day that already has that
 *  service can't take a second one. */
function WeekBoard({ plan, onMove }: { plan: { s: string; n: number; d?: number }[]; onMove: (s: string, from: number, to: number) => void }) {
  const board = useRef<HTMLDivElement>(null);
  // Where the tag was grabbed (dx, dy inside it), so the dragged copy stays under the pointer exactly as picked up.
  const press = useRef<{ s: string; from: number; x: number; y: number; id: number; dx: number; dy: number } | null>(null);
  const [drag, setDrag] = useState<{ s: string; from: number; x: number; y: number; dx: number; dy: number; over: number | null } | null>(null);
  const [picked, setPicked] = useState<{ s: string; from: number } | null>(null);
  const [said, setSaid] = useState("");
  // Escape puts a picked-up service back. Listened for on the page: Safari doesn't focus a tapped button.
  useEffect(() => {
    if (!picked) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPicked(null); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [picked]);
  const on = (s: string) => daysOf(plan.find((e) => e.s === s) ?? { n: 0 });
  const rowAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-row]");
    return el && board.current?.contains(el) ? Number(el.dataset.row) : null;
  };
  const move = (s: string, from: number, to: number) => {
    const name = shortName(s), day = (i: number) => t(DAY_KEYS[i]!);
    if (to === from) return;
    if (on(s).includes(to)) { setSaid(t("{name} is already on {day}.", { name, day: day(to) })); return; }
    onMove(s, from, to);
    setSaid(t("{name} moved from {from} to {to}.", { name, from: day(from), to: day(to) }));
  };
  return (
    <div className="panel weekboard" ref={board} aria-label={t("Her week")}
      onPointerDown={(e) => {
        const tag = (e.target as HTMLElement).closest<HTMLElement>("[data-tag]");
        if (!tag) return;
        const r = tag.getBoundingClientRect();
        press.current = { s: tag.dataset.tag!, from: Number(tag.dataset.from), x: e.clientX, y: e.clientY, id: e.pointerId,
          dx: e.clientX - r.left, dy: e.clientY - r.top };
      }}
      onPointerMove={(e) => {
        const p = press.current;
        if (!p) return;
        if (!drag && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return;       // a tap, not a drag (yet)
        if (!drag) board.current?.setPointerCapture(p.id);
        setDrag({ s: p.s, from: p.from, x: e.clientX, y: e.clientY, dx: p.dx, dy: p.dy, over: rowAt(e.clientX, e.clientY) });
      }}
      onPointerUp={() => {
        if (drag && drag.over != null) move(drag.s, drag.from, drag.over);
        press.current = null;
        setDrag(null);
      }}
      onPointerCancel={() => { press.current = null; setDrag(null); }}>
      <p className="help">{picked ? t("Now tap Move here on another day, or tap {name} again to cancel.", { name: shortName(picked.s) })
        : t("Drag a service to another day, or tap it, then choose the day.")}</p>
      {DAY_KEYS.map((day, i) => {
        const here = plan.filter((e) => daysOf(e).includes(i));
        const canDrop = picked && !on(picked.s).includes(i);
        return (
          <div className={`day${drag?.over === i ? (on(drag.s).includes(i) ? " over no" : " over") : ""}`} key={day} data-row={i}>
            <b>{t(day)}</b>
            <span className="tags">
              {here.map((e) => (
                <button type="button" className="tag movable" key={e.s} data-tag={e.s} data-from={i}
                  aria-pressed={picked?.s === e.s && picked.from === i}
                  onClick={(ev) => { if (!drag) { ev.preventDefault(); setPicked(picked?.s === e.s && picked.from === i ? null : { s: e.s, from: i }); } }}>
                  {shortName(e.s)}<span className="sr-only">{t(", {day}", { day: t(day) })}</span>
                </button>
              ))}
              {canDrop && <button type="button" className="link drop" onClick={() => { move(picked.s, picked.from, i); setPicked(null); }}>
                {t("Move here")}<span className="sr-only"> ({t(day)})</span></button>}
              {!here.length && !canDrop && <span className="meta">—</span>}
            </span>
          </div>
        );
      })}
      <p className="sr-only" aria-live="polite">{said}</p>
      {/* On <body>, not inside the screen: the screen's slide-in animation holds a transform, which makes "fixed"
          measure from the screen instead of the window and threw the copy off to the side. */}
      {drag && createPortal(<span className="tag ghost" aria-hidden="true"
        style={{ left: drag.x - drag.dx, top: drag.y - drag.dy }}>{shortName(drag.s)}</span>, document.body)}
    </div>
  );
}

/** One letter for a day on narrow phones: the last character in Chinese (周一 → 一), else the first letter as people
 *  read it (Tamil vowel signs stay with their letter). */
function dayLetter(day: string) {
  if (getLang() === "zh") return day.slice(-1);
  const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  return seg ? [...seg.segment(day)][0]?.segment ?? day : [...day][0] ?? day;
}

/** Seven day buttons for one service. Press and drag across them (a swipe on a phone) to add a run of days, or start
 *  on a chosen day to clear a run; a tap, Space or Enter turns one day on or off. */
function DayStrip({ days, onChange, name }: { days: number[]; onChange: (days: number[]) => void; name: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef<{ adding: boolean; set: Set<number> } | null>(null);
  const [live, setLive] = useState<number[] | null>(null);
  const shown = live ?? days;
  const dayAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-day]");
    return el && strip.current?.contains(el) ? Number(el.dataset.day) : null;
  };
  const paint = (i: number) => {
    const d = drag.current!;
    if (d.adding) d.set.add(i); else d.set.delete(i);
    setLive([...d.set].sort());
  };
  const end = () => {
    if (!drag.current) return;
    onChange([...drag.current.set].sort());
    drag.current = null;
    setLive(null);
  };
  return (
    <div className="daystrip" ref={strip} role="group" aria-label={t("Days for {name}", { name })}
      onPointerDown={(e) => {
        const i = dayAt(e.clientX, e.clientY);
        if (i == null) return;
        drag.current = { adding: !shown.includes(i), set: new Set(shown) };
        strip.current?.setPointerCapture(e.pointerId);
        paint(i);
      }}
      onPointerMove={(e) => { if (drag.current) { const i = dayAt(e.clientX, e.clientY); if (i != null) paint(i); } }}
      onPointerUp={end} onPointerCancel={end}>
      {DAY_KEYS.map((k, i) => (
        <button type="button" key={k} data-day={i} aria-pressed={shown.includes(i)}
          // Keyboard presses arrive as clicks with detail 0; pointer presses were already handled above.
          onClick={(e) => { if (e.detail === 0) onChange(days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort()); }}>
          <span className="d-full">{t(k)}</span><span className="d-letter" aria-hidden="true">{dayLetter(t(k))}</span>
        </button>
      ))}
    </div>
  );
}
export function Week({ s, update, next }: P) {
  const plan = (s.plan ?? []).filter((e) => e.s !== "day_care_transport");
  // Change one service's count in place (keeps the order); 0 removes it. Transport's n: 0 opt-out is kept.
  // A service keeps its place while its days change, even with none chosen (it then isn't costed); Remove takes it out.
  const setDays = (id: string, days: number[]) => {
    const cur = s.plan ?? [];
    const e = entryFor(id, days);
    update({ plan: cur.some((x) => x.s === id) ? cur.map((x) => (x.s === id ? e : x)) : [...cur, e] });
  };
  const remove = (id: string) => update({ plan: (s.plan ?? []).filter((x) => x.s !== id) });
  const set = (id: string, n: number) => setDays(id, startingDays(n));
  const addable = rules.serviceTypes.filter((x) => prices.has(x.serviceId) && x.unit !== "month" && x.serviceId !== "nursing_home"
    && !plan.some((e) => e.s === x.serviceId));
  // Transport sits in the first day care card it belongs to.
  const firstDayCare = plan.find((e) => e.s === "day_care" || e.s === "dementia_day_care")?.s;
  const transportOn = (s.plan ?? []).find((e) => e.s === "day_care_transport")?.n !== 0;
  const respiteMatched = matchServices(rules, s).matches.some((m) => m.serviceId === "respite");

  // Display only: each service goes on weekdays first, spread out (2 a week → Tue and Thu), so services share days
  // as they usually do (a carer in the morning, day care after) instead of spilling onto the weekend.

  if (plan.length === 0) {
    return (
      <>
        <h1>{t("Her plan is empty")}</h1>
        <p>{t("Add a service, or see who to call for advice.")}</p>
        <AddService options={addable} onAdd={(id) => set(id, services.get(id)?.defaultUnitsPerWeek ?? 1)} />
        <button type="button" className="btn sec" onClick={() => next({ ...s, plan: [] })}>{t("See who to call")}</button>
      </>
    );
  }
  return (
    <>
      <h1>{t("Build her week")}</h1>
      <p className="help">{t("This is our starting point. Drag across the days, or tap them, to change when each service comes.")}</p>
      {plan.map((e) => {
        const svc = services.get(e.s)!;
        const on = daysOf(e);
        const weekend = on.some((i) => i >= 5) && e.s.includes("day_care");
        return (
          <div className="panel" key={e.s}>
            <div className="row" style={{ alignItems: "baseline" }}>
              <h3>{t(svc.name)}</h3>
              <button type="button" className="link" style={{ flex: "none" }} onClick={() => remove(e.s)}>
                {t("Remove")}<span className="sr-only"> {t(svc.name)}</span></button>
            </div>
            <DayStrip days={on} onChange={(d) => setDays(e.s, d)} name={t(svc.name)} />
            <p className="meta" aria-live="polite">
              {on.length ? `${daysText(on, t, join)} · ${perWeek(svc.unit, on.length, svc.blockHours)}` : t("No days chosen, so it isn't costed.")}
              {weekend ? t(" · most centres open weekdays; check weekend care when you call") : ""}
            </p>
            <div className="presets">
              <button type="button" className="link" onClick={() => setDays(e.s, [0, 1, 2, 3, 4])}>{t("Weekdays")}</button>
              <button type="button" className="link" onClick={() => setDays(e.s, [0, 1, 2, 3, 4, 5, 6])}>{t("Every day")}</button>
              <button type="button" className="link" onClick={() => setDays(e.s, [])}>{t("Clear")}</button>
            </div>
            {e.s === firstDayCare && (
              <label className="opt">
                <input type="checkbox" checked={transportOn}
                  onChange={(ev) => update({ plan: [...plan, ...(ev.target.checked ? [] : [{ s: "day_care_transport", n: 0 }])] })} />
                <span>{t("Include transport to and from day care")}</span>
              </label>
            )}
          </div>
        );
      })}
      <WeekBoard plan={plan} onMove={(id, from, to) => {
        const e = plan.find((x) => x.s === id);
        if (e) setDays(id, [...daysOf(e).filter((x) => x !== from), to].sort());
      }} />
      {respiteMatched && !plan.some((e) => e.s === "respite") && (
        <p className="note">{t("A break for you isn't in the week: respite is booked as a stay of at least 7 days. Ask about it when you call.")}</p>
      )}
      <AddService options={addable} onAdd={(id) => set(id, services.get(id)?.defaultUnitsPerWeek ?? 1)} />
      <button type="button" className="btn" onClick={() => next()}>{t("See the cost")}</button>
    </>
  );
}
/** "1 day a week", "5 days a week", "2 visits of 4 hours a week". */
function perWeek(unit: string | null | undefined, n: number, hours?: number | null) {
  if (unit === "hour") return t(n === 1 ? "{n} visit of {h} hours a week" : "{n} visits of {h} hours a week", { n, h: hours ?? 4 });
  return n === 1 ? t(UNIT_WEEK_ONE[unit ?? ""] ?? "1 a week") : `${n} ${t(UNIT_WEEK[unit ?? ""] ?? "a week")}`;
}
function shortName(id: string) {
  const n = ({ day_care: "Day care", dementia_day_care: "Dementia day care", home_personal_care: "Home care", home_nursing: "Nurse",
    home_therapy: "Therapy", community_rehab: "Centre therapy", medical_escort: "Escort", meals_on_wheels: "Meals", respite: "Respite" } as Record<string, string | undefined>)[id];
  return n ? t(n) : svcName(id);
}
function AddService({ options, onAdd }: { options: typeof rules.serviceTypes; onAdd: (id: string) => void }) {
  const [pick, setPick] = useState("");
  if (options.length === 0) return null;
  return (
    <div className="field">
      <label htmlFor="add">{t("Add a service")}</label>
      <div className="row">
        <select id="add" className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">{t("Choose a service")}</option>
          {options.map((o) => <option key={o.serviceId} value={o.serviceId}>{t(o.name)}</option>)}
        </select>
        <button type="button" className="btn sec" style={{ flex: "0 0 auto", width: "auto" }} disabled={!pick}
          onClick={() => { onAdd(pick); setPick(""); }}>{t("Add")}</button>
      </div>
    </div>
  );
}

// ---------- 5 · Cost ----------
export function CostScreen({ s, update, next, toWeek }: P) {
  const nursing = s.w === "in_nursing_home";
  const c = costPlan(rules, s);
  const m = matchServices(rules, s);
  const grants = potentialGrants(rules, s, m.adlCount);
  const nh = nursingHome(rules, s);
  const [showNh, setShowNh] = useState(nursing);
  const hcgHidden = s.t && s.r !== "none" && m.adlCount < 3 && !nursing;
  const severeHidden = severeOnlyHidden(rules, s, m.adlCount);
  const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${join(xs.slice(0, -1))}${t(" and ")}${xs.at(-1)}`);

  return (
    <>
      <h1>{nursing ? t("What a nursing home may cost") : t("What her care may cost each month")}</h1>
      {!nursing && c.lines.length > 0 && (
        <nav className="onpage no-print" aria-label={t("On this page")}>
          <span className="meta">{t("On this page:")}</span>
          <a href="#total" onClick={jump}>{t("Monthly total")}</a><a href="#each" onClick={jump}>{t("Each service")}</a><a href="#grants" onClick={jump}>{t("Grants")}</a><a href="#workings" onClick={jump}>{t("How it's worked out")}</a>
        </nav>
      )}
      <div className="panel">
        <div className="field">
          <label htmlFor="tier">{t("Monthly household income, per person")}</label>
          <p id="tier-help" className="help">{t("Everyone's monthly income in her household, divided by the number of people who live there.")}</p>
          <select id="tier" className="input" aria-describedby="tier-help" value={s.t ?? ""}
            onChange={(e) => update({ t: (e.target.value || undefined) as TierId | undefined })}>
            <option value="">{t("Choose her range")}</option>
            {(Object.keys(TIER_LABEL) as TierId[]).map((tier) => <option key={tier} value={tier}>{t(TIER_LABEL[tier])}</option>)}
          </select>
        </div>
        <IncomeHelper onPick={(t) => update({ t })} />
        <Sources ids={rules.subsidyTiers.schemes.filter((x) => (x.scheme === "residential") === nursing).map((x) => x.sourceId)} />
        <Seg name="res" legend={t("She is a")} value={s.r} onChange={(r) => update({ r })}
          options={[["sc", t("Singapore Citizen")], ["pr", t("PR")], ["none", t("Neither")]]} />
        {s.r !== "pr" && s.r !== "none" && (
          <Seg name="born" legend={t("She was born")} value={s.b ?? "le1969"} onChange={(b) => update({ b })}
            options={[["le1969", t("1969 or earlier")], ["gt1969", t("After 1969")]]} />
        )}
        {s.r === "sc" && (
          // Only a few families need this one, so it waits behind a summary (open once answered).
          <details className="more-about" open={s.g != null}>
            <summary>{t("More about her (optional)")}</summary>
            <Seg name="gen" legend={t("Pioneer or Merdeka Generation?")} value={s.g} onChange={(g) => update({ g })}
              options={[["pg", t("Pioneer")], ["mg", t("Merdeka")], ["no", t("Neither")], ["unsure", t("Not sure")]]} />
          </details>
        )}
      </div>

      {s.r === "none" && <p className="help">{t("Government subsidies are for Singapore Citizens and PRs. These are full prices.")}</p>}
      {s.t === "T5" && s.r !== "none" && <p className="help">{t("At this income, there's no government subsidy. Both columns show full price.")}</p>}

      {!nursing && c.total && (
        <div className="total" id="total" tabIndex={-1} aria-label={t("Estimated monthly total")}>
          {c.total.withSubsidy && !c.total.sameAsFullPrice ? (
            <>
              <div><p className="lbl">{t("At a government-funded provider, with subsidy")}</p>
                <Explain id="government_funded" />
                <p className="big"><CountRange r={c.total.withSubsidy} /></p><p className="sub">{t("a month · estimate")}</p>
                <p className="asof">{t("Figures as of {date}", { date: dataDate })}</p></div>
              <hr />
              <div><p className="lbl">{t("Full price, at a private provider")}</p>
                <p className="mid"><CountRange r={c.total.fullPrice} />{t(" a month")}</p><p className="sub">{t("may add 9% GST")}</p></div>
            </>
          ) : (
            <div>
              <p className="lbl">{!s.t || !s.r ? t("Full price (pick her income range to see the subsidy)") : t("Full price")}</p>
              <p className="big"><CountRange r={c.total.fullPrice} /></p><p className="sub">{t("a month · estimate · may add 9% GST")}</p>
              <p className="asof">{t("Figures as of {date}", { date: dataDate })}</p>
            </div>
          )}
        </div>
      )}
      {!nursing && c.total && <TotalPeek r={c.total.withSubsidy && !c.total.sameAsFullPrice ? c.total.withSubsidy : c.total.fullPrice}
        subsidised={!!c.total.withSubsidy && !c.total.sameAsFullPrice} />}
      {!nursing && !c.total && (s.plan ?? []).some((e) => e.d === 0)
        ? <><p className="help">{t("No days chosen yet. Go back to her week to pick days.")}</p>
            <button type="button" className="btn sec" onClick={toWeek}>{t("Back to her week")}</button></>
        : !nursing && !c.total && <p className="help">{t("Her plan is empty, so there's nothing to cost yet.")}</p>}

      {!nursing && c.lines.length > 0 && (
        <details className="panel lines" id="each" tabIndex={-1}>
          <summary>{t("Cost of each service, and your own quotes")}</summary>
          {c.lines.map((l) => {
          const svc = services.get(l.serviceId)!;
          const entry = planEntries(s).find((e) => e.s === l.serviceId);
          const freq = svc.unit === "month" ? "" : ` · ${perWeek(svc.unit, entry?.n ?? 0, svc.blockHours)}`;
          const own = s.plan?.find((e) => e.s === l.serviceId);
          const when = own && svc.unit !== "month" ? ` (${daysText(daysOf(own), t, join)})` : "";
          return (
            <div className="line panel" key={l.serviceId}>
              <h3>{t(svc.name)}{freq}{when}</h3>
              <div className="two">
                <span><small>{t("With subsidy")}</small>{l.withSubsidy ? range(l.withSubsidy) : "—"}</span>
                <span><small>{t("Full price")}</small>{range(l.fullPrice)}</span>
              </div>
              {l.serviceId === "day_care_transport"
                ? <p className="note">{t("Full price in both columns: no source says transport is subsidised.")}</p>
                : <Quote id={l.serviceId} value={s.q?.[l.serviceId]} unit={svc.unit ?? ""}
                    onChange={(v) => { const q = { ...(s.q ?? {}) }; if (v == null) delete q[l.serviceId]; else q[l.serviceId] = v; update({ q }); }} />}
            </div>
          );
          })}
        </details>
      )}
      {!nursing && c.unpriced.length > 0 && <p className="note">{t("No published price for: {list}. Ask when you call.", { list: join(c.unpriced.map((x) => svcName(x))) })}</p>}

      {(showNh || nursing) ? (
        <div className="panel">
          <h3>{t("Nursing home")}</h3>
          <p className="big" style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem" }}>{t("from {amount} a month", { amount: money(nh.from) })}{s.t && s.r ? "" : t(" before subsidy")}</p>
          <p className="meta">{s.t && s.r
            ? t('{label}. {pct}% residential subsidy on AIC\'s "from" fee of $4,900. Estimate.', { label: t(nh.label), pct: nh.subsidyPct })
            : t('AIC\'s "from" fee before subsidy. Pick her income range and residency to see the subsidised figure.')}</p>
          {nh.realBills && <p>{t("What families actually pay at one home: {low} – {high} a month for subsidised residents (Ren Ci, Jul 2026).", { low: money(nh.realBills.low), high: money(nh.realBills.high) })}</p>}
          <p className="note">{t("Bills vary with the ward and the care needed. Private homes set their own fees and get no subsidy.")}</p>
          <Sources ids={[...nh.sourceIds, nh.realBills?.sourceId]} />
        </div>
      ) : (
        <button type="button" className="link" onClick={() => setShowNh(true)}>{t("See what a nursing home may cost")}</button>
      )}

      <div className="panel" id="grants" tabIndex={-1}>
        <h3>{grants.length ? t("You may qualify for") : t("Grants and payouts")}</h3>
        {grants.length ? (
          <ul className="plain">
            {grants.map((g) => (
              <li key={g.grantId}><b>{t(g.name)}</b>: {(g.period === "once_then_yearly" || g.kind === "concession") && g.amountMeaning ? t(g.amountMeaning).replace(/\.$/, "")
                : <>{t(g.isMaximum ? "up to {amount}" : "{amount}", { amount: money(g.amount) })}{g.period === "month" ? t(" a month") : ""}</>}
                {g.needsAgeCheck ? t(" (if she is 67 or older)") : ""}{g.askIf ? ` (${t(g.askIf)})` : ""}.
                <ul className="criteria">{g.criteria.map((c) => <li key={c}>{t(c)}</li>)}</ul>
                <a href={g.officialUrl}>{t("Official page and how to apply")}</a></li>
            ))}
          </ul>
        ) : <p className="meta">{!s.t || !s.r ? t("Pick her income range and residency to see what she may qualify for.") : t("None found from her answers.")}</p>}
        {s.r === "sc" && s.g === "mg" && <p className="note">{t("The Merdeka Generation Package helps with MediShield Life and CareShield Life premiums. It doesn't list a payout for care costs.")}</p>}
        {severeHidden.length > 0 && <p className="note">{t("Not shown: {list}. They need her to be unable to do 3 or more daily activities at all.", { list: andList(severeHidden.map((x) => t(x))) })}</p>}
        {hcgHidden && <p className="note">{t("Not shown: the Home Caregiving Grant. It needs help with 3 or more daily activities. Ask about it if her needs grow.")}</p>}
        <p className="note">{t("Grants are never taken off the totals above.")}</p>
        <Sources ids={[...grants.map((g) => g.sourceId), ...(s.r === "sc" && s.g === "mg" ? ["moh_mg"] : [])]} />
      </div>

      {!nursing && c.lines.length > 0 && (
        <details className="panel" id="workings" tabIndex={-1}>
          <summary>{t("How is this worked out")}</summary>
          <table className="calc">
            <thead><tr><th>{t("Service")}</th><th>{t("Per month")}</th><th>{t("Price")}</th><th>{t("Subsidy")}</th></tr></thead>
            <tbody>
              {c.lines.map((l) => (
                <tr key={l.serviceId}><td>{svcName(l.serviceId)}</td><td>{l.unitsPerMonth.toFixed(1)}</td>
                  <td>{l.quoted ? t("{amount} (your quote)", { amount: money(l.priceLow) }) : l.priceLow === l.priceHigh ? money(l.priceLow) : `${money(l.priceLow)}–${money(l.priceHigh)}`}</td>
                  <td>{l.withSubsidy ? `${l.subsidyPct}%` : "—"}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="note">{t("Weekly amounts × 52 ÷ 12. Rounded to $5. Sources:")}</p>
          <ul className="plain note">
            {[...new Set([...c.lines.flatMap((l) => l.sourceIds), rules.priceReferences.gstSourceId])].map((id) => {
              const src = source(id);
              return src ? <li key={id}><a href={src.url}>{src.title}</a> · {t("checked {date}", { date: longDate(src.checkedOn) })}</li> : null;
            })}
          </ul>
        </details>
      )}

      <p className="note">{disclaimer()}</p>
      <button type="button" className="btn" onClick={() => next()}>{nursing ? t("See what to ask") : t("See who to call")}</button>
    </>
  );
}

function Quote({ id, value, unit, onChange }: { id: string; value?: number; unit: string; onChange: (v: number | undefined) => void }) {
  const [open, setOpen] = useState(value != null);
  const [text, setText] = useState(value?.toString() ?? "");
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <button type="button" className="link" onClick={() => setOpen(true)}>{t("Enter a quote")}</button>;
  const commit = () => {
    if (!text) { setErr(null); onChange(undefined); return; }
    const n = Number(text);
    if (!Number.isInteger(n) || n < 1 || n > 10_000) { setErr(n === 0 ? t("If it's free, remove it from her plan instead.") : t("Enter a fee between $1 and $10,000.")); return; }
    setErr(null); onChange(n);
  };
  return (
    <div className="field">
      <label htmlFor={`q-${id}`}>{t("Quoted fee ({unit}, $)", { unit: t(UNIT_ONE[unit] ?? "per unit") })}</label>
      <input id={`q-${id}`} className="input" inputMode="numeric" value={text} aria-invalid={err ? true : undefined}
        onChange={(e) => { setText(e.target.value.replace(/\D/g, "")); setErr(null); }} onBlur={commit} />
      <p className="errtxt" role="alert">{err ?? ""}</p>
    </div>
  );
}

/** 3-question helper, inline (never a pop-up). Exact income is never asked (ADR-003). */
function IncomeHelper({ onPick }: { onPick: (t: TierId) => void }) {
  const [open, setOpen] = useState(false);
  const [earns, setEarns] = useState<"yes" | "no" | "">("");
  const [size, setSize] = useState(2);
  const [home, setHome] = useState("");
  if (!open) return <button type="button" className="link" onClick={() => setOpen(true)}>{t("Not sure which range? Work it out in 3 questions.")}</button>;
  const opts = incomeOptions(rules, size);
  return (
    <div className="panel" style={{ background: "var(--bg-sunken)" }}>
      <fieldset>
        <legend><h3>{t("1. Does anyone living at her address earn an income?")}</h3></legend>
        <p className="help">{t("Count everyone on the NRIC address, including her. Income includes salary, bonuses, allowances and self-employed earnings.")}</p>
        <div className="row">
          <Radio name="earns" value="yes" checked={earns === "yes"} onChange={() => setEarns("yes")}>{t("Yes")}</Radio>
          <Radio name="earns" value="no" checked={earns === "no"} onChange={() => setEarns("no")}>{t("No")}</Radio>
        </div>
      </fieldset>
      {earns === "yes" && (
        <>
          <div className="row" style={{ alignItems: "center" }}>
            <h3>{t("2. How many people live there, including her?")}</h3>
            <Stepper value={size} min={1} max={10} onChange={setSize} label={t("People in the household")} less={t("Fewer people")} more={t("More people")} />
          </div>
          <fieldset>
            <legend><h3>{t("3. Roughly how much do they earn in total each month, before CPF?")}</h3></legend>
            {opts.map((o) => (
              <Radio key={o.tierId} name="band" value={o.tierId} checked={false} onChange={() => { onPick(o.tierId); setOpen(false); }}>
                {o.max == null ? t("Above {amount}", { amount: money(o.min - 1) }) : o.min === 0 ? t("Up to {amount}", { amount: money(o.max) }) : `${money(o.min)} – ${money(o.max)}`}
              </Radio>
            ))}
          </fieldset>
        </>
      )}
      {earns === "no" && (
        <fieldset>
          <legend><h3>{t("2. What type of home is it?")}</h3></legend>
          <Radio name="home" value="hdb" checked={home === "hdb"} onChange={() => { setHome("hdb"); onPick("T0"); setOpen(false); }}>{t("HDB flat (likely the lowest range)")}</Radio>
          <Radio name="home" value="private" checked={home === "private"} onChange={() => setHome("private")}>{t("Condominium or landed property")}</Radio>
          {home === "private" && <p className="help">{t("Without income, subsidy depends on the home's Annual Value. Check it on IRAS, then pick a range above.")}</p>}
        </fieldset>
      )}
    </div>
  );
}

// ---------- 6 · Who to call ----------
export function ContactsScreen({ s, update, next }: P) {
  const geo = useGeo();
  if (!geo) {
    return (
      <div className="skeletons" aria-busy="true">
        <p className="help">{navigator.onLine ? t("Finding the nearest places…")
          : t("You're offline. Nearby places will show when you're back online. The AIC hotline is 1800-650-6060.")}</p>
        {[0, 1, 2].map((i) => <div className="contact skel" key={i} aria-hidden="true" />)}
      </div>
    );
  }
  const { contacts: contactsBundle, places, sectors } = geo;
  const point = pointForSession(sectors, s.loc);
  const branch = matchServices(rules, s).branch;
  if (!point) {
    const REGIONS: [Region, string][] = [["central", "Central"], ["north", "North"], ["northeast", "North-East"], ["east", "East"], ["west", "West"]];
    return (
      <>
        <h1>{t("Who to call first")}</h1>
        <fieldset className="panel">
          <legend><h3>{t("Pick her area to see the nearest places:")}</h3></legend>
          <div className="grid2">{REGIONS.map(([r, l]) => <button key={r} type="button" className="chip" onClick={() => update({ loc: { reg: r } })}>{t(l)}</button>)}</div>
        </fieldset>
      </>
    );
  }
  const near = nearbyContacts(point, contactsBundle.contacts, places, branch);
  const dist = (km: number | null, precision: string | null) =>
    km == null ? null : precision === "sector" && km < 1 ? t("In your area") : t("About {km} km", { km });
  const LINK_LABEL: Record<string, string> = {
    aic_aac: "Find Active Ageing Centres near her on AIC's site",
    aic_day_care: "Find day care centres near her on AIC's map",
    aic_nursing_home: "Find nursing homes on AIC's site",
  };
  return (
    <>
      <h1>{t("Who to call first")}</h1>
      {near.items.map((i, k) => (
        <div className={`contact tilt${i.kind === "ward_msw" ? " first" : ""}`} key={`${i.kind}-${i.id ?? k}`} {...tilt}>
          <h3>{t(i.name)}</h3>
          {i.kind === "ward_msw" && <p>{t("Ask before she's discharged. Some help can only be requested through them.")}</p>}
          {i.address && <p className="meta">{[dist(i.km, i.precision), i.address].filter(Boolean).join(" · ")}</p>}
          {i.hours && <p className="meta">{i.hours}</p>}
          {(i.checkedOn || i.updatedOn) && <p className="meta">{i.checkedOn ? t("Address checked {date}", { date: longDate(i.checkedOn) })
            : t("Address from government open data, updated {date}", { date: longDate(i.updatedOn!) })}</p>}
          {/* The place's own name and address, never her postal code. Some polyclinics sit at their area's centre on
              our list, so the search uses the address rather than coordinates. */}
          {i.address && (
            <a className="link no-print" rel="noopener"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${i.name}, ${i.address}, Singapore`)}`}>
              {t("Directions")}<span className="sr-only"> {i.name}</span></a>
          )}
        </div>
      ))}
      <div className="contact">
        <h3>{t(contactsBundle.hotline.name)}</h3>
        <p className="meta"><a href="tel:18006506060">{contactsBundle.hotline.phone}</a> · {contactsBundle.hotline.hours}</p>
      </div>
      {near.linkOutSourceIds.map((id) => source(id) && <a key={id} className="link" href={source(id)!.url}>{LINK_LABEL[id] ? t(LINK_LABEL[id]) : source(id)!.title}</a>)}
      <p className="note">{t("Distances are from the centre of her area, so they're approximate.")}</p>
      <button type="button" className="btn" onClick={() => next()}>{t("See her action plan")}</button>
    </>
  );
}

// ---------- 7 · Action plan ----------
const WHEN: Record<Timing, string> = { now: "Now", week: "This week", month: "This month", later: "Later" };
export function Action({ s, update, restart, startNew }: Pick<P, "s" | "update" | "restart" | "startNew">) {
  const m = matchServices(rules, s);
  const c = costPlan(rules, s);
  const grants = potentialGrants(rules, s, m.adlCount);
  const geo = useGeo();
  const point = geo ? pointForSession(geo.sectors, s.loc) : null;
  const aicLink = geo && point ? nearbyContacts(point, geo.contacts.contacts, geo.places, m.branch).items.find((i) => i.kind === "aic_link") : null;
  const routes = new Map(rules.howToApply.routes.map((r) => [r.applyId, r]));
  const extraDocs = [...new Set(planEntries(s).flatMap((e) => routes.get(services.get(e.s)?.howToApplyId ?? "")?.extraDocuments ?? []))];
  const today = new Date().toLocaleDateString(`${getLang()}-SG`, { day: "numeric", month: "short", year: "numeric" });
  // Mid-sentence, "The medical social worker" reads "the medical…"; acronyms ("AIC Link") and non-Latin scripts stay as they are.
  const whoRaw = t(m.branch.firstContact);
  const who = /^[A-Z][a-z]/.test(whoRaw) ? whoRaw.charAt(0).toLowerCase() + whoRaw.slice(1) : whoRaw;
  const callText = m.branchId === "in_hospital" && !s.d ? t("Call {who}, before she's discharged.", { who }) : t("Call {who}.", { who });
  const share = typeof window !== "undefined" ? window.location.href : "";
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(t("{title}: {link}", { title: t(WHO[s.who ?? "mum"].plan), link: share }))}`;
  // The days chosen in the week builder, so the shared and printed plan keeps the schedule.
  const week = (s.plan ?? []).filter((e) => e.n > 0 && services.get(e.s)?.unit !== "month")
    .map((e) => t("{name} ({days})", { name: shortName(e.s), days: daysText(daysOf(e), t, join) }));
  const discharge = m.branch.links?.map((l) => source(l.sourceId) && { ...l, url: source(l.sourceId)!.url }).filter(Boolean) ?? [];
  const steps = nextSteps(rules, s);
  const done = s.done ?? [];
  const tick = (id: string, on: boolean) => update({ done: on ? [...done, id] : done.filter((x) => x !== id) });
  const doneHere = steps.filter((st) => done.includes(st.id)).length;
  const summary = useRef<HTMLDetailsElement>(null);
  // One list of tickable steps, grouped by when. Used for the timeline, "For you" (8.8) and "Also worth doing" (8.9).
  const stepSection = (id: string, title: string, list: PlanStep[], counter: boolean, intro?: string, extra = "") => list.length > 0 && (
    <section className={`timeline ${extra}`} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {intro && <p className="meta">{intro}</p>}
      {counter && <p className="meta no-print">{t("{done} of {all} done. Ticks are saved in this plan's link, so anyone you share it with sees them.", { done: doneHere, all: steps.length })}</p>}
      {TIMINGS.map((tm) => {
        const here = list.filter((st) => st.timing === tm);
        return here.length > 0 && (
          <div key={tm} className="when" data-timing={tm}>
            {list.length > 2 && <h3>{t(WHEN[tm])}</h3>}
            <ul className="tl">
              {here.map((st) => (
                <li key={st.id} className={done.includes(st.id) ? "done" : undefined}>
                  <label className="opt tick">
                    <input type="checkbox" checked={done.includes(st.id)} onChange={(e) => tick(st.id, e.target.checked)} />
                    <span><b>{st.id === "call_first" ? callText : t(st.text)}</b>{" "}
                      {st.after && <span className="meta step-meta">{t("After: {label}. ", { label: t(st.after) })}</span>}
                      {st.unlocks && <span className="meta step-meta">{st.group === "plan" ? t("Unlocks: ") : ""}{t(st.unlocks)}</span>}
                    </span>
                  </label>
                  {termForStep.has(st.id) && <Explain id={termForStep.get(st.id)!} />}
                  {st.id === "call_first" && (
                    <div className="ask">
                      <p className="meta">{t("Ask:")}</p>
                      <ul className="plain">{m.askList.map((q) => <li key={q}>&quot;{t(q)}&quot;</li>)}</ul>
                      {discharge.map((l) => l && <a key={l.label} className="link no-print" href={l.url}>{t(l.label)}</a>)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <Sources ids={list.flatMap((st) => st.sourceIds)} />
    </section>
  );
  // 8.11: a calendar file built here and saved by the family; nothing leaves the phone.
  const saveReminders = () => {
    const now = new Date();
    const ics = remindersIcs(reminders(steps, done, now), window.location.href, now);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "care-plan-reminders.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // Print with a mode class on the page: "print-handover" (the summary on its own), "print-compact" (the 1-page plan).
  const printAs = (mode: "print-handover" | "print-compact") => {
    if (mode === "print-handover" && summary.current) summary.current.open = true;
    document.documentElement.classList.add(mode);
    window.addEventListener("afterprint", () => document.documentElement.classList.remove(mode), { once: true });
    window.print();
  };

  return (
    <>
      <div className="top no-print">
        <button type="button" className="link" onClick={restart}>{t("Change answers")}</button>
        <button type="button" className="link" onClick={startNew}>{t("Start a plan for someone else")}</button>
        <span>{today}</span>
      </div>
      <p className="ready no-print"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M7 12.5l3.2 3.2L17 9" /></svg>{t("Your plan is ready")}</p>
      <h1>{t(WHO[s.who ?? "mum"].plan)}</h1>
      {/* The two things most people do next, within reach before the long plan; the full set is at the bottom too. */}
      <div className="row quick-share no-print">
        <a className="btn" href={whatsapp}>{t("Share on WhatsApp")}</a>
        <button type="button" className="btn sec" onClick={() => printAs("print-compact")}>{t("Print one page")}</button>
      </div>
      <p className="print-only meta">{today} · Care Navigator</p>
      {stepSection("next-steps", t("Your next steps"), steps.filter((st) => st.group === "plan"), true)}
      {stepSection("for-you", t("For you"), steps.filter((st) => st.group === "carer"), false,
        t("You matter too. These are for you, not for her."), "carer-steps")}
      {(() => {
        const asks = planEntries(s).filter((e) => e.n > 0 && services.get(e.s)?.askProvider?.length);
        return asks.length > 0 && (
          <section className="providers" aria-labelledby="ask-providers">
            <h2 id="ask-providers">{t("When you call a provider")}</h2>
            <p className="meta">{t("Our suggestions, for the centre or home care provider you're referred to.")}</p>
            {asks.map((e) => (
              <div key={e.s}>
                <h3>{svcName(e.s)}</h3>
                <ul className="plain">{services.get(e.s)!.askProvider!.map((q) => <li key={q}>&quot;{t(q)}&quot;</li>)}</ul>
              </div>
            ))}
          </section>
        );
      })()}
      <ol className="steps">
        <li>
          <h3>{t("Bring")}</h3>
          <p className="meta">{t("Our suggestion. There's no official list.")}</p>
          <ul className="plain">{[...rules.howToApply.alwaysBring, ...extraDocs].map((d) => <li key={d}>{t(d)}</li>)}</ul>
        </li>
        <li>
          <h3>{t("If you need help later")}</h3>
          <p className="meta">{aicLink ? t("{name}, or the AIC hotline on 1800-650-6060.", { name: aicLink.name }) : t("The AIC hotline on 1800-650-6060.")}</p>
        </li>
      </ol>

      {c.total && (
        <div className="panel">
          <h3>{t("Estimated monthly cost")}</h3>
          {week.length > 0 && <p className="meta"><b>{t("Her week")}:</b> {week.join(" · ")}</p>}
          <p style={{ fontVariantNumeric: "tabular-nums" }}>
            {c.total.withSubsidy ? <>{t("{amount} with subsidy", { amount: range(c.total.withSubsidy) })}<br /></> : null}
            <span className="meta">{t("{amount} at full price", { amount: range(c.total.fullPrice) })}</span>
          </p>
          <div className="row no-print" style={{ alignItems: "center" }}>
            <span>{t("Split between")}</span>
            <Stepper value={s.x ?? 1} min={1} max={10} onChange={(x) => update({ x })} label={t("People sharing the cost")} less={t("Fewer people")} more={t("More people")} />
          </div>
          {c.split && <p><b><CountRange r={c.split.each} />{t(" each")}</b>{t(" a month")}{c.total.withSubsidy ? t(", with subsidy") : ""}</p>}
          <Sources ids={c.lines.flatMap((l) => l.sourceIds)} />
        </div>
      )}
      {grants.length > 0 && (
        <div className="panel">
          <h3>{t("She may qualify for")}</h3>
          <p className="meta">{join(grants.map((g) => t(g.name)))}{t(". Confirm on the official pages.")}</p>
        </div>
      )}
      {stepSection("ahead", t("Also worth doing"), steps.filter((st) => st.group === "ahead"), false,
        t("Not urgent, but easier to do early."), "no-print")}
      {steps.some((st) => st.group === "ahead") && (
        <p className="print-only note ahead-line">{t("Also worth doing, in this plan's link: {list}.", { list: join(steps.filter((st) => st.group === "ahead").map((st) => t(st.label))) })}</p>
      )}
      <details className="panel handover-box" ref={summary}>
        <summary>{t("Summary for her social worker or AIC Link")}</summary>
        <Handover s={s} />
        <button type="button" className="btn sec no-print" onClick={() => printAs("print-handover")}>{t("Print this summary")}</button>
      </details>
      <a className="btn no-print" href={whatsapp}>{t("Share on WhatsApp")}</a>
      <div className="row no-print">
        <button type="button" className="btn sec" onClick={() => printAs("print-compact")}>{t("Print one page")}</button>
        <button type="button" className="btn sec" onClick={() => window.print()}>{t("Print full plan")}</button>
      </div>
      <p className="meta no-print">{t("One page has the first call, this week's steps and the cost. The full plan has everything. To keep a copy, choose Save as PDF in the print window.")}</p>
      <button type="button" className="btn sec no-print" onClick={saveReminders}>{t("Add reminders to your calendar")}</button>
      <p className="print-only note compact-only">{t("Later steps, support for you and things worth doing ahead are in this plan's link.")}</p>
      <p className="print-only note">{t("Sources and the dates they were checked are in this plan's link.")}</p>
      <p className="note">{disclaimer()}</p>
    </>
  );
}
