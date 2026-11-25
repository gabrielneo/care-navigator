"use client";
// Screens 3–7. Wording: docs/specs/08; behaviour and edge cases: docs/specs/06 and 09; layouts: docs/wireframes.
import { useState } from "react";
import { dataDate, longDate, rules, source } from "@/lib/data";
import { useGeo } from "@/lib/data/geo";
import { costPlan, nursingHome, potentialGrants, planEntries } from "@/lib/engine/cost";
import { matchServices } from "@/lib/engine/matching";
import { incomeOptions, type TierId } from "@/lib/engine/tiers";
import type { Session } from "@/lib/engine/urlCodec";
import { nearbyContacts } from "@/lib/geo/nearby";
import { pointForSession, type Region } from "@/lib/geo/postal";
import { money, NO_PRICE, range, Radio, Seg, Stepper, UNIT_ONE, UNIT_WEEK } from "./ui";

type P = { s: Session; update: (p: Partial<Session>) => void; next: (s?: Session) => void; restart: () => void };
const services = new Map(rules.serviceTypes.map((x) => [x.serviceId, x]));
const prices = new Map(rules.priceReferences.prices.map((p) => [p.serviceId, p]));
const svcName = (id: string) => services.get(id)?.name ?? id;
const DISCLAIMER = `Estimate only, based on published rules as of ${dataDate}. Not a quote, an eligibility decision or medical advice.`;

function priceBadge(id: string): string {
  const p = prices.get(id), svc = services.get(id);
  if (!p || !svc?.unit) return NO_PRICE[id] ?? "";
  const about = p.lowConfidence === "official" ? "From" : "About";
  const amount = p.priceLowSgd === p.priceHighSgd || about === "From" ? money(p.priceLowSgd) : `${money(p.priceLowSgd)}–${money(p.priceHighSgd)}`;
  return `${about} ${amount} ${UNIT_ONE[svc.unit] ?? ""} before subsidy`;
}

/** "Sources: <title>, checked 25 Nov 2026" under any figure, so every number shows where it's from and when. */
function Sources({ ids }: { ids: (string | null | undefined)[] }) {
  const list = [...new Set(ids)].flatMap((id) => { const src = id ? source(id) : undefined; return src ? [src] : []; });
  if (!list.length) return null;
  return (
    <p className="note">{list.length > 1 ? "Sources" : "Source"}: {list.map((src, i) => (
      <span key={src.sourceId}>{i ? "; " : ""}<a href={src.url}>{src.title}</a>, checked {longDate(src.checkedOn)}</span>
    ))}</p>
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
  const card = (x: (typeof m.matches)[number]) => {
    const svc = services.get(x.serviceId)!;
    return (
      <div className="svc" key={x.serviceId}>
        <h3>{svc.name} <span className="meta">({svc.officialTerm})</span></h3>
        <p>{svc.description}</p>
        <p className="why"><b>Why this fits:</b> {x.reasonText}</p>
        <p className="price">{priceBadge(x.serviceId)}</p>
        {svc.unit && <Sources ids={priceSources(x.serviceId)} />}
      </div>
    );
  };
  if (m.matches.length === 0) {
    return (
      <>
        <h1>We need a bit more to suggest services</h1>
        <a className="btn" href="tel:18006506060">Call the AIC hotline</a>
        <button type="button" className="btn sec" onClick={restart}>Change answers</button>
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
      <h1>{m.matches.length === 1 ? "1 service may fit" : `${m.matches.length} services may fit`}</h1>
      {m.dementiaNote && <><p className="why">{m.dementiaNote}</p><Sources ids={[rules.branchRules.dementiaFlag.sourceId]} /></>}
      {m.confirmWithProfessional && <p className="help">Some answers were "Not sure". Check these with a doctor, the ward social worker or an AIC Link.</p>}
      {m.matches.map(card)}
      {m.more.length > 0 && (
        <details className="panel">
          <summary>More that may help</summary>
          {m.more.map(card)}
        </details>
      )}
      <button type="button" className="btn" onClick={build}>Build her week</button>
    </>
  );
}

// ---------- 4 · Week ----------
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: Record<number, number[]> = { 1: [2], 2: [1, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
export function Week({ s, update, next }: P) {
  const plan = (s.plan ?? []).filter((e) => e.s !== "day_care_transport");
  // Change one service's count in place (keeps the order); 0 removes it. Transport's n: 0 opt-out is kept.
  const set = (id: string, n: number) => {
    const cur = s.plan ?? [];
    const changed = cur.some((e) => e.s === id) ? cur.map((e) => (e.s === id ? { s: id, n } : e)) : [...cur, { s: id, n }];
    update({ plan: changed.filter((e) => e.n > 0 || e.s === "day_care_transport") });
  };
  const addable = rules.serviceTypes.filter((x) => prices.has(x.serviceId) && x.unit !== "month" && x.serviceId !== "nursing_home"
    && !plan.some((e) => e.s === x.serviceId));
  const hasDayCare = plan.some((e) => e.s === "day_care" || e.s === "dementia_day_care");
  const transportOn = (s.plan ?? []).find((e) => e.s === "day_care_transport")?.n !== 0;
  const respiteMatched = matchServices(rules, s).matches.some((m) => m.serviceId === "respite");

  // Display only: each service goes on weekdays first, spread out (2 a week → Tue and Thu), so services share days
  // as they usually do (a carer in the morning, day care after) instead of spilling onto the weekend.
  const days: string[][] = DAYS.map(() => []);
  for (const e of plan) for (const i of SLOTS[e.n] ?? []) days[i]!.push(shortName(e.s));

  if (plan.length === 0) {
    return (
      <>
        <h1>Her plan is empty</h1>
        <p>Add a service, or see who to call for advice.</p>
        <AddService options={addable} onAdd={(id) => set(id, services.get(id)?.defaultUnitsPerWeek ?? 1)} />
        <button type="button" className="btn sec" onClick={() => next({ ...s, plan: [] })}>See who to call</button>
      </>
    );
  }
  return (
    <>
      <h1>Build her week</h1>
      <p className="help">We've filled in a starting point. It's our assumption, so change it to fit.</p>
      {plan.map((e) => {
        const svc = services.get(e.s)!;
        return (
          <div className="panel" key={e.s}>
            <div className="row" style={{ alignItems: "center" }}>
              <h3>{svc.name}</h3>
              <Stepper value={e.n} min={0} max={7} onChange={(n) => set(e.s, n)} label={svc.name}
                less={`Remove one from ${svc.name}`} more={`Add one to ${svc.name}`} />
            </div>
            <p className="meta">{UNIT_WEEK[svc.unit ?? ""] ?? "a week"}{e.n === 7 && e.s.includes("day_care") ? " · most centres open weekdays; check weekend care when you call" : ""}</p>
          </div>
        );
      })}
      {hasDayCare && (
        <label className="opt">
          <input type="checkbox" checked={transportOn}
            onChange={(ev) => update({ plan: [...plan, ...(ev.target.checked ? [] : [{ s: "day_care_transport", n: 0 }])] })} />
          <span>Include transport to and from day care</span>
        </label>
      )}
      <div className="panel" style={{ gap: 0 }} aria-label="Her week">
        {DAYS.map((day, i) => (
          <div className="day" key={day}><b>{day}</b>
            <span className="tags">{days[i]!.length ? days[i]!.map((t, j) => <span className="tag" key={j}>{t}</span>) : <span className="meta">—</span>}</span>
          </div>
        ))}
      </div>
      {respiteMatched && !plan.some((e) => e.s === "respite") && (
        <p className="note">A break for you isn't in the week: respite is booked as a stay of at least 7 days. Ask about it when you call.</p>
      )}
      <AddService options={addable} onAdd={(id) => set(id, services.get(id)?.defaultUnitsPerWeek ?? 1)} />
      <button type="button" className="btn" onClick={() => next()}>See the cost</button>
    </>
  );
}
function shortName(id: string) {
  return ({ day_care: "Day care", dementia_day_care: "Dementia day care", home_personal_care: "Home care", home_nursing: "Nurse",
    home_therapy: "Therapy", medical_escort: "Escort", meals_on_wheels: "Meals", respite: "Respite" } as Record<string, string>)[id] ?? svcName(id);
}
function AddService({ options, onAdd }: { options: typeof rules.serviceTypes; onAdd: (id: string) => void }) {
  const [pick, setPick] = useState("");
  if (options.length === 0) return null;
  return (
    <div className="field">
      <label htmlFor="add">Add a service</label>
      <div className="row">
        <select id="add" className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Choose a service</option>
          {options.map((o) => <option key={o.serviceId} value={o.serviceId}>{o.name}</option>)}
        </select>
        <button type="button" className="btn sec" style={{ flex: "0 0 auto", width: "auto" }} disabled={!pick}
          onClick={() => { onAdd(pick); setPick(""); }}>Add</button>
      </div>
    </div>
  );
}

// ---------- 5 · Cost ----------
const TIER_LABEL: Record<TierId, string> = {
  T0: "$1,500 and below", T1: "$1,501 – $2,300", T2: "$2,301 – $2,600", T3: "$2,601 – $3,600", T4: "$3,601 – $4,800", T5: "Above $4,800",
};
export function CostScreen({ s, update, next }: P) {
  const nursing = s.w === "in_nursing_home";
  const c = costPlan(rules, s);
  const m = matchServices(rules, s);
  const grants = potentialGrants(rules, s, m.adlCount);
  const nh = nursingHome(rules, s);
  const [showNh, setShowNh] = useState(nursing);
  const hcgHidden = s.t && s.r !== "none" && m.adlCount < 3 && !nursing;

  return (
    <>
      <h1>{nursing ? "What a nursing home may cost" : "What her care may cost each month"}</h1>
      <div className="panel">
        <div className="field">
          <label htmlFor="tier">Household income per person (PCHI)</label>
          <select id="tier" className="input" value={s.t ?? ""} onChange={(e) => update({ t: (e.target.value || undefined) as TierId | undefined })}>
            <option value="">Choose her range</option>
            {(Object.keys(TIER_LABEL) as TierId[]).map((t) => <option key={t} value={t}>{TIER_LABEL[t]} · range {t}</option>)}
          </select>
        </div>
        <IncomeHelper onPick={(t) => update({ t })} />
        <Sources ids={rules.subsidyTiers.schemes.filter((x) => (x.scheme === "residential") === nursing).map((x) => x.sourceId)} />
        <Seg name="res" legend="She is a" value={s.r} onChange={(r) => update({ r })}
          options={[["sc", "Singapore Citizen"], ["pr", "PR"], ["none", "Neither"]]} />
        {s.r !== "pr" && s.r !== "none" && (
          <Seg name="born" legend="She was born" value={s.b ?? "le1969"} onChange={(b) => update({ b })}
            options={[["le1969", "1969 or earlier"], ["gt1969", "After 1969"]]} />
        )}
      </div>

      {s.r === "none" && <p className="help">Government subsidies are for Singapore Citizens and PRs. These are full prices.</p>}
      {s.t === "T5" && s.r !== "none" && <p className="help">At this income, there's no government subsidy. Both columns show full price.</p>}

      {!nursing && c.total && (
        <div className="total" aria-label="Estimated monthly total">
          {c.total.withSubsidy && !c.total.sameAsFullPrice ? (
            <>
              <div><p className="lbl">At a government-funded provider, with subsidy</p>
                <p className="big">{range(c.total.withSubsidy)}</p><p className="sub">a month · estimate</p></div>
              <hr />
              <div><p className="lbl">Full price, at a private provider</p>
                <p className="mid">{range(c.total.fullPrice)} a month</p><p className="sub">may add 9% GST</p></div>
            </>
          ) : (
            <div>
              <p className="lbl">{!s.t || !s.r ? "Full price (pick her income range to see the subsidy)" : "Full price"}</p>
              <p className="big">{range(c.total.fullPrice)}</p><p className="sub">a month · estimate · may add 9% GST</p>
            </div>
          )}
        </div>
      )}
      {!nursing && !c.total && <p className="help">Her plan is empty, so there's nothing to cost yet.</p>}

      {!nursing && c.lines.length > 0 && (
        <details className="panel lines">
          <summary>Cost of each service, and your own quotes</summary>
          {c.lines.map((l) => {
          const svc = services.get(l.serviceId)!;
          const entry = planEntries(s).find((e) => e.s === l.serviceId);
          const freq = svc.unit === "month" ? ""
            : svc.unit === "hour" ? ` · ${entry?.n} ${entry?.n === 1 ? "visit" : "visits"} of ${svc.blockHours ?? 4} hours a week`
            : ` · ${entry?.n} ${UNIT_WEEK[svc.unit ?? ""] ?? ""}`;
          return (
            <div className="line panel" key={l.serviceId}>
              <h3>{svc.name}{freq}</h3>
              <div className="two">
                <span><small>With subsidy</small>{l.withSubsidy ? range(l.withSubsidy) : "—"}</span>
                <span><small>Full price</small>{range(l.fullPrice)}</span>
              </div>
              {l.serviceId === "day_care_transport"
                ? <p className="note">Full price in both columns: no source says transport is subsidised.</p>
                : <Quote id={l.serviceId} value={s.q?.[l.serviceId]} unit={svc.unit ?? ""}
                    onChange={(v) => { const q = { ...(s.q ?? {}) }; if (v == null) delete q[l.serviceId]; else q[l.serviceId] = v; update({ q }); }} />}
            </div>
          );
          })}
        </details>
      )}
      {!nursing && c.unpriced.length > 0 && <p className="note">No published price for: {c.unpriced.map(svcName).join(", ")}. Ask when you call.</p>}

      {(showNh || nursing) ? (
        <div className="panel">
          <h3>Nursing home</h3>
          <p className="big" style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem" }}>from {money(nh.from)} a month{s.t && s.r ? "" : " before subsidy"}</p>
          <p className="meta">{s.t && s.r
            ? `${nh.label}. ${nh.subsidyPct}% residential subsidy on AIC's "from" fee of $4,900. Estimate.`
            : `AIC's "from" fee before subsidy. Pick her income range and residency to see the subsidised figure.`}</p>
          {nh.realBills && <p>What families actually pay at one home: {money(nh.realBills.low)} – {money(nh.realBills.high)} a month for subsidised residents (Ren Ci, Jul 2026).</p>}
          <p className="note">Bills vary with the ward and the care needed. Private homes set their own fees and get no subsidy.</p>
          <Sources ids={[...nh.sourceIds, nh.realBills?.sourceId]} />
        </div>
      ) : (
        <button type="button" className="link" onClick={() => setShowNh(true)}>See what a nursing home may cost</button>
      )}

      <div className="panel">
        <h3>{grants.length ? "You may qualify for" : "Grants and payouts"}</h3>
        {grants.length ? (
          <ul className="plain">
            {grants.map((g) => (
              <li key={g.grantId}><b>{g.name}</b>: {g.period === "once_then_yearly" && g.amountMeaning ? g.amountMeaning.replace(/\.$/, "")
                : <>{g.isMaximum ? "up to " : ""}{money(g.amount)}{g.period === "month" ? " a month" : ""}</>}
                {g.needsAgeCheck ? " (if she is 67 or older)" : ""}. <a href={g.officialUrl}>Check the official page</a></li>
            ))}
          </ul>
        ) : <p className="meta">{!s.t || !s.r ? "Pick her income range and residency to see what she may qualify for." : "None found from her answers."}</p>}
        {hcgHidden && <p className="note">Not shown: the Home Caregiving Grant. It needs help with 3 or more daily activities. Ask about it if her needs grow.</p>}
        <p className="note">Grants are never taken off the totals above.</p>
        <Sources ids={grants.map((g) => g.sourceId)} />
      </div>

      {!nursing && c.lines.length > 0 && (
        <details className="panel">
          <summary>How is this worked out</summary>
          <table className="calc">
            <thead><tr><th>Service</th><th>Per month</th><th>Price</th><th>Subsidy</th></tr></thead>
            <tbody>
              {c.lines.map((l) => (
                <tr key={l.serviceId}><td>{svcName(l.serviceId)}</td><td>{l.unitsPerMonth.toFixed(1)}</td>
                  <td>{l.quoted ? `${money(l.priceLow)} (your quote)` : l.priceLow === l.priceHigh ? money(l.priceLow) : `${money(l.priceLow)}–${money(l.priceHigh)}`}</td>
                  <td>{l.withSubsidy ? `${l.subsidyPct}%` : "—"}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="note">Weekly amounts × 52 ÷ 12. Rounded to $5. Sources:</p>
          <ul className="plain note">
            {[...new Set([...c.lines.flatMap((l) => l.sourceIds), rules.priceReferences.gstSourceId])].map((id) => {
              const src = source(id);
              return src ? <li key={id}><a href={src.url}>{src.title}</a> · checked {longDate(src.checkedOn)}</li> : null;
            })}
          </ul>
        </details>
      )}

      <p className="note">{DISCLAIMER}</p>
      <button type="button" className="btn" onClick={() => next()}>{nursing ? "See what to ask" : "See who to call"}</button>
    </>
  );
}

function Quote({ id, value, unit, onChange }: { id: string; value?: number; unit: string; onChange: (v: number | undefined) => void }) {
  const [open, setOpen] = useState(value != null);
  const [text, setText] = useState(value?.toString() ?? "");
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <button type="button" className="link" onClick={() => setOpen(true)}>Enter a quote</button>;
  const commit = () => {
    if (!text) { setErr(null); onChange(undefined); return; }
    const n = Number(text);
    if (!Number.isInteger(n) || n < 1 || n > 10_000) { setErr(n === 0 ? "If it's free, remove it from her plan instead." : "Enter a fee between $1 and $10,000."); return; }
    setErr(null); onChange(n);
  };
  return (
    <div className="field">
      <label htmlFor={`q-${id}`}>Quoted fee ({UNIT_ONE[unit] ?? "per unit"}, $)</label>
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
  if (!open) return <button type="button" className="link" onClick={() => setOpen(true)}>Not sure which range? Work it out in 3 questions.</button>;
  const opts = incomeOptions(rules, size);
  return (
    <div className="panel" style={{ background: "var(--bg-sunken)" }}>
      <fieldset>
        <legend><h3>1. Does anyone living at her address earn an income?</h3></legend>
        <p className="help">Count everyone on the NRIC address, including her. Income includes salary, bonuses, allowances and self-employed earnings.</p>
        <div className="row">
          <Radio name="earns" value="yes" checked={earns === "yes"} onChange={() => setEarns("yes")}>Yes</Radio>
          <Radio name="earns" value="no" checked={earns === "no"} onChange={() => setEarns("no")}>No</Radio>
        </div>
      </fieldset>
      {earns === "yes" && (
        <>
          <div className="row" style={{ alignItems: "center" }}>
            <h3>2. How many people live there, including her?</h3>
            <Stepper value={size} min={1} max={10} onChange={setSize} label="People in the household" less="Fewer people" more="More people" />
          </div>
          <fieldset>
            <legend><h3>3. Roughly how much do they earn in total each month, before CPF?</h3></legend>
            {opts.map((o) => (
              <Radio key={o.tierId} name="band" value={o.tierId} checked={false} onChange={() => { onPick(o.tierId); setOpen(false); }}>
                {o.max == null ? `Above ${money(o.min - 1)}` : o.min === 0 ? `Up to ${money(o.max)}` : `${money(o.min)} – ${money(o.max)}`}
              </Radio>
            ))}
          </fieldset>
        </>
      )}
      {earns === "no" && (
        <fieldset>
          <legend><h3>2. What type of home is it?</h3></legend>
          <Radio name="home" value="hdb" checked={home === "hdb"} onChange={() => { setHome("hdb"); onPick("T0"); setOpen(false); }}>HDB flat (likely the lowest range)</Radio>
          <Radio name="home" value="private" checked={home === "private"} onChange={() => setHome("private")}>Condominium or landed property</Radio>
          {home === "private" && <p className="help">Without income, subsidy depends on the home's Annual Value. Check it on IRAS, then pick a range above.</p>}
        </fieldset>
      )}
    </div>
  );
}

// ---------- 6 · Who to call ----------
export function ContactsScreen({ s, update, next }: P) {
  const geo = useGeo();
  if (!geo) return <p className="help" aria-busy="true">Finding the nearest places…</p>;
  const { contacts: contactsBundle, places, sectors } = geo;
  const point = pointForSession(sectors, s.loc);
  const branch = matchServices(rules, s).branch;
  if (!point) {
    const REGIONS: [Region, string][] = [["central", "Central"], ["north", "North"], ["northeast", "North-East"], ["east", "East"], ["west", "West"]];
    return (
      <>
        <h1>Who to call first</h1>
        <fieldset className="panel">
          <legend><h3>Pick her area to see the nearest places:</h3></legend>
          <div className="grid2">{REGIONS.map(([r, l]) => <button key={r} type="button" className="chip" onClick={() => update({ loc: { reg: r } })}>{l}</button>)}</div>
        </fieldset>
      </>
    );
  }
  const near = nearbyContacts(point, contactsBundle.contacts, places, branch);
  const dist = (km: number | null, precision: string | null) =>
    km == null ? null : precision === "sector" && km < 1 ? "In your area" : `About ${km} km`;
  const LINK_LABEL: Record<string, string> = {
    aic_aac: "Find Active Ageing Centres near her on AIC's site",
    aic_day_care: "Find day care centres near her on AIC's map",
    aic_nursing_home: "Find nursing homes on AIC's site",
  };
  return (
    <>
      <h1>Who to call first</h1>
      {near.items.map((i, k) => (
        <div className={`contact${i.kind === "ward_msw" ? " first" : ""}`} key={`${i.kind}-${i.id ?? k}`}>
          <h3>{i.name}</h3>
          {i.kind === "ward_msw" && <p>Ask before she's discharged. Some help can only be requested through them.</p>}
          {i.address && <p className="meta">{[dist(i.km, i.precision), i.address].filter(Boolean).join(" · ")}</p>}
          {i.hours && <p className="meta">{i.hours}</p>}
          {(i.checkedOn || i.updatedOn) && <p className="meta">{i.checkedOn ? `checked ${longDate(i.checkedOn)}` : `record updated ${longDate(i.updatedOn!)}`}</p>}
        </div>
      ))}
      <div className="contact">
        <h3>{contactsBundle.hotline.name}</h3>
        <p className="meta"><a href="tel:18006506060">{contactsBundle.hotline.phone}</a> · {contactsBundle.hotline.hours}</p>
      </div>
      {near.linkOutSourceIds.map((id) => source(id) && <a key={id} className="link" href={source(id)!.url}>{LINK_LABEL[id] ?? source(id)!.title}</a>)}
      <p className="note">Distances are from the centre of her area, so they're approximate.</p>
      <button type="button" className="btn" onClick={() => next()}>See her action plan</button>
    </>
  );
}

// ---------- 7 · Action plan ----------
export function Action({ s, update, restart }: Pick<P, "s" | "update" | "restart">) {
  const m = matchServices(rules, s);
  const c = costPlan(rules, s);
  const grants = potentialGrants(rules, s, m.adlCount);
  const geo = useGeo();
  const point = geo ? pointForSession(geo.sectors, s.loc) : null;
  const aicLink = geo && point ? nearbyContacts(point, geo.contacts.contacts, geo.places, m.branch).items.find((i) => i.kind === "aic_link") : null;
  const routes = new Map(rules.howToApply.routes.map((r) => [r.applyId, r]));
  const extraDocs = [...new Set(planEntries(s).flatMap((e) => routes.get(services.get(e.s)?.howToApplyId ?? "")?.extraDocuments ?? []))];
  const today = new Date().toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  const share = typeof window !== "undefined" ? window.location.href : "";
  const discharge = m.branch.links?.map((l) => source(l.sourceId) && { ...l, url: source(l.sourceId)!.url }).filter(Boolean) ?? [];

  return (
    <>
      <div className="top no-print">
        <button type="button" className="link" onClick={restart}>Change answers</button>
        <span>{today}</span>
      </div>
      <h1>Mum's care plan</h1>
      <p className="print-only meta">{today} · Care-pacity Planner</p>
      <ol className="steps">
        <li>
          <h3>Call {m.branch.firstContact.charAt(0).toLowerCase() + m.branch.firstContact.slice(1)}{m.branchId === "in_hospital" && !s.d ? ", before she's discharged" : ""}</h3>
          <ul className="plain">{m.askList.map((q) => <li key={q}>"{q}"</li>)}</ul>
          {discharge.map((l) => l && <a key={l.label} className="link no-print" href={l.url}>{l.label}</a>)}
        </li>
        <li>
          <h3>Bring</h3>
          <p className="meta">Our suggestion. There's no official list.</p>
          <ul className="plain">{[...rules.howToApply.alwaysBring, ...extraDocs].map((d) => <li key={d}>{d}</li>)}</ul>
        </li>
        <li>
          <h3>If you need help later</h3>
          <p className="meta">{aicLink ? `${aicLink.name}, or the` : "The"} AIC hotline on 1800-650-6060.</p>
        </li>
      </ol>

      {c.total && (
        <div className="panel">
          <h3>Estimated monthly cost</h3>
          <p style={{ fontVariantNumeric: "tabular-nums" }}>
            {c.total.withSubsidy ? <>{range(c.total.withSubsidy)} with subsidy<br /></> : null}
            <span className="meta">{range(c.total.fullPrice)} at full price</span>
          </p>
          <div className="row no-print" style={{ alignItems: "center" }}>
            <span>Split between</span>
            <Stepper value={s.x ?? 1} min={1} max={10} onChange={(x) => update({ x })} label="People sharing the cost" less="Fewer people" more="More people" />
          </div>
          {c.split && <p><b>{range(c.split.each)} each</b> a month{c.total.withSubsidy ? ", with subsidy" : ""}</p>}
          <Sources ids={c.lines.flatMap((l) => l.sourceIds)} />
        </div>
      )}
      {grants.length > 0 && (
        <div className="panel">
          <h3>She may qualify for</h3>
          <p className="meta">{grants.map((g) => g.name).join(", ")}. Confirm on the official pages.</p>
        </div>
      )}
      <a className="btn no-print" href={`https://wa.me/?text=${encodeURIComponent(`Mum's care plan: ${share}`)}`}>Share on WhatsApp</a>
      <div className="row no-print">
        <button type="button" className="btn sec" onClick={() => window.print()}>Print plan</button>
        <button type="button" className="btn sec" onClick={() => window.print()}>Save as PDF</button>
      </div>
      <p className="note">{DISCLAIMER}</p>
    </>
  );
}
