// The four journeys in docs/architecture-prompts-v2.md, Stage 6.
import rulesJson from "../../public/data/rules.json" with { type: "json" };
import { range } from "../../src/components/planner/ui";
import type { RulesBundle } from "../../src/lib/data/types";
import { costPlan } from "../../src/lib/engine/cost";
import { decodeHash, encodeHash } from "../../src/lib/engine/urlCodec";
import { answer, expect, MEI, startPlan, test } from "./helpers";

const rules = rulesJson as unknown as RulesBundle;

test("Mei: mother in hospital after a fall", async ({ page }) => {
  await startPlan(page);
  await answer(page, "Soon to be discharged from hospital");
  await answer(page, "Washing or bathing", "Dressing");
  await answer(page, "Yes, on weekdays");
  await answer(page, "No");                                     // memory
  await answer(page, "No");                                     // helper
  await answer(page, "I'm managing");
  await page.getByLabel("Postal code").fill("560123");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByRole("heading", { name: /services may fit/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Short-term carer after discharge/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Day care centre/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Help with washing and dressing/ })).toBeVisible();
  await page.getByRole("button", { name: "Build her week" }).click();

  // Default is day care Mon–Fri and home care 3 visits (Mon, Wed, Fri); Mei wants home care on Tue and Thu.
  const dayCare = page.getByRole("group", { name: "Days for Day care centre" });
  await expect(dayCare.getByRole("button", { pressed: true })).toHaveCount(5);
  const home = page.getByRole("group", { name: "Days for Help with washing and dressing at home" });
  await page.locator(".panel", { has: home }).getByRole("button", { name: "Clear" }).click();
  await home.getByRole("button", { name: "Tue" }).click();
  await home.getByRole("button", { name: "Thu" }).click();
  await expect(page.locator(".panel", { has: home })).toContainText("Tue, Thu · 2 visits of 4 hours a week");
  // Weekdays first: day care Mon–Fri, home care Tue and Thu, nothing pushed onto the weekend.
  const week = page.getByLabel("Her week");
  await expect(week.locator(".day", { hasText: "Tue" })).toContainText("Home care");
  await expect(week.locator(".day", { hasText: "Sat" })).toContainText("—");
  await expect(week.locator(".day", { hasText: "Sun" })).toContainText("—");
  await page.getByRole("button", { name: "See the cost" }).click();

  await page.getByLabel("Monthly household income, per person").selectOption("T1");
  await page.locator("label", { hasText: "Singapore Citizen" }).click();
  await expect(page.getByLabel("Singapore Citizen")).toBeChecked();
  await expect(page.getByLabel("1969 or earlier")).toBeChecked();
  const total = page.getByLabel("Estimated monthly total");
  await expect(total).toContainText("with subsidy");
  await expect(total).toContainText("Full price, at a private provider");
  // The amounts on screen are the engine's, for exactly the answers in the link (T1, citizen born ≤1969: 85% off).
  const cost = costPlan(rules, decodeHash(new URL(page.url()).hash)!.session);
  await expect(total).toContainText(range(cost.total!.withSubsidy!));
  await expect(total).toContainText(range(cost.total!.fullPrice));
  expect(cost.lines.map((l) => [l.serviceId, l.subsidyPct])).toEqual(
    [["day_care", 85], ["home_personal_care", 85], ["day_care_transport", 0]]);
  await expect(page.getByText("Grants are never taken off the totals above.")).toBeVisible();
  await page.getByRole("button", { name: "See who to call" }).click();

  const contacts = page.locator(".contact");
  await expect(contacts.first()).toContainText("The medical social worker on her ward");
  await expect(page.getByText(/^About [\d.]+ km|In your area/).first()).toBeVisible();
  await page.getByRole("button", { name: "See her action plan" }).click();

  await expect(page.getByRole("heading", { name: "Mum's care plan" })).toBeVisible();
  await expect(page.getByText("Call the medical social worker on her ward, before she's discharged.")).toBeVisible();
  await expect(page.getByText('"When is she likely to be discharged?"')).toBeVisible();
  await page.getByRole("button", { name: "More people" }).click();
  await page.getByRole("button", { name: "More people" }).click();
  const split = costPlan(rules, decodeHash(new URL(page.url()).hash)!.session).split!;
  await expect(page.getByText(`${range(split.each)} each`)).toBeVisible();

  // The WhatsApp link carries this page's URL; opening it shows the same plan.
  const wa = await page.getByRole("link", { name: "Share on WhatsApp" }).first().getAttribute("href");
  const shared = decodeURIComponent(new URL(wa!).searchParams.get("text")!).replace("Mum's care plan: ", "");
  expect(shared).toBe(page.url());
  const got = decodeHash(new URL(shared).hash)!;
  expect(got.step).toBe("action");
  expect(got.session).toMatchObject({ t: "T1", r: "sc", x: 3, loc: { sec: "56" } });
  expect(got.session.plan).toEqual(expect.arrayContaining([{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2, d: 0b1010 }]));   // Tue, Thu
  expect(shared).not.toContain("560123");

  await expect(page.getByText(/^AIC Link .+, or the AIC hotline/)).toBeVisible();   // location data has loaded
  const before = await page.locator("main").innerText();
  const fresh = await page.context().newPage();
  await fresh.goto(shared);
  await expect(fresh.getByRole("heading", { name: "Mum's care plan" })).toBeVisible();
  await expect(fresh.getByText(/ each a month/)).toBeVisible();
  // The nearest AIC Link fills in once the location data loads, so retry until the page settles.
  await expect.poll(() => fresh.locator("main").innerText()).toBe(before);

});

test("Mr Tan: wife with memory problems, skips the postal code", async ({ page }) => {
  await startPlan(page);
  await answer(page, "Living at home, and we're struggling to cope");
  await answer(page, "Washing or bathing");
  await answer(page, "Yes, most days");
  await answer(page, "Yes, diagnosed with dementia");
  await answer(page, "No");
  await answer(page, "I can't keep going like this");
  await page.getByRole("button", { name: "Skip and pick a region" }).click();
  await page.getByRole("button", { name: "North", exact: true }).click();

  await expect(page.getByText(/Nursing home beds for psychiatric care needs take longer to get/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Day care for dementia/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^A break for you/ })).toBeVisible();
  await page.getByRole("button", { name: "Build her week" }).click();
  await expect(page.getByText(/respite is booked as a stay of at least 7 days/)).toBeVisible();
  await page.getByRole("button", { name: "See the cost" }).click();
  await page.getByRole("button", { name: "See who to call" }).click();

  // Region-based: an AIC Link and distances that say they're approximate.
  await expect(page.locator(".contact").first()).toContainText("AIC Link");
  await expect(page.getByText("Distances are from the centre of her area")).toBeVisible();
  await page.getByRole("button", { name: "See her action plan" }).click();
  await expect(page.getByText(/^Call an AIC Link/)).toBeVisible();
  expect(decodeHash(new URL(page.url()).hash)!.session.loc).toEqual({ reg: "north" });
});

test("Nursing home: a 'from' figure next to real bills, nothing subtracted", async ({ page }) => {
  await startPlan(page);
  await answer(page, "In a nursing home");
  await expect(page.getByRole("heading", { name: "What a nursing home may cost" })).toBeVisible();
  // Before her income range and residency are picked, no subsidy is claimed.
  await expect(page.getByText("from $4,900 a month before subsidy", { exact: true })).toBeVisible();
  await expect(page.getByText(/0% residential subsidy/)).toHaveCount(0);
  await page.getByLabel("Monthly household income, per person").selectOption("T1");
  await page.locator("label", { hasText: "Singapore Citizen" }).click();
  await expect(page.getByLabel("Singapore Citizen")).toBeChecked();

  // T1, citizen born 1969 or earlier: 65% residential subsidy on AIC's $4,900 "from" fee = $1,715.
  // A payout taken off (CareShield Life $689, MediSave Care $200) would show a lower figure.
  await expect(page.getByText("from $1,715 a month", { exact: true })).toBeVisible();
  await expect(page.getByText(/\$620 – \$3,069 a month for subsidised residents \(Ren Ci/)).toBeVisible();
  await expect(page.getByText("Grants are never taken off the totals above.")).toBeVisible();
  await page.getByRole("button", { name: "See what to ask" }).click();
  await expect(page.getByText(/^Call the nursing home's office/)).toBeVisible();
});

test("Unknown area: the region picker, all the way to the action plan", async ({ page }) => {
  await startPlan(page);
  await answer(page, "Living at home, and something has just changed");
  await answer(page, "Walking or moving around");
  await answer(page, "No, someone is usually with her");
  await answer(page, "No");
  await answer(page, "No");
  await answer(page, "I'm tired and need a break");
  await page.getByLabel("Postal code").fill("701234");          // sector 70 isn't in sectors.json
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("We can't place that area. Pick yours:")).toBeVisible();
  await page.getByRole("button", { name: "East", exact: true }).click();

  await page.getByRole("button", { name: "Build her week" }).click();
  await page.getByRole("button", { name: "See the cost" }).click();
  await page.getByRole("button", { name: "See who to call" }).click();
  await expect(page.locator(".contact").first()).toBeVisible();
  await page.getByRole("button", { name: "See her action plan" }).click();
  await expect(page.getByRole("heading", { name: "Mum's care plan" })).toBeVisible();

  expect(page.url()).not.toContain("701234");
  expect(decodeHash(new URL(page.url()).hash)!.session.loc).toEqual({ reg: "east" });
});

test("8.1: severe-only payouts appear only when she can't do 3 activities at all", async ({ page }) => {
  await startPlan(page);
  await answer(page, "Living at home, and something has just changed");
  for (const a of ["Washing or bathing", "Dressing", "Using the toilet"]) await page.getByLabel(a, { exact: true }).check();
  await expect(page.getByRole("heading", { name: "Which of these can't she do at all?" })).toBeVisible();
  const base = decodeHash(new URL(page.url()).hash)!.session;
  const cost = (sev: string[]) => `/plan/${encodeHash("cost", { ...base, sev: sev as never, al: "no", mem: "no", hlp: "no", lim: "ok",
    loc: { reg: "central" }, plan: [{ s: "home_personal_care", n: 2 }], t: "T0", r: "sc", b: "le1969" })}`;

  // Needs help with 3, can't do none of them: some-help grants listed, severe payouts named as not shown.
  await page.goto(cost([]));
  const grants = page.locator(".panel", { hasText: "You may qualify for" });
  await expect(grants).toContainText("Home Caregiving Grant");
  await expect(grants).toContainText("(if she is a Pioneer Generation member)");
  await expect(grants.getByText(/^CareShield Life payout:/)).toHaveCount(0);
  await expect(grants).toContainText("Not shown: MediSave Care, CareShield Life payout and ElderFund. They need her to be unable to do 3 or more daily activities at all.");

  // Can't do all 3: the severe payouts are listed and the note goes.
  await page.goto(cost(["bath", "dress", "toilet"]));
  await expect(grants).toContainText("CareShield Life payout: $689 a month");
  await expect(grants).toContainText("MediSave Care: up to $200 a month");
  await expect(grants).not.toContainText("Not shown: MediSave Care");
});

test("8.2 and 8.6: next steps in order, ticks saved in the shared link", async ({ page, context }) => {
  const s = { v: (await import("../../public/data/manifest.json", { with: { type: "json" } })).default.dataVersion,
    w: "in_hospital", d: false, adl: ["bath", "dress", "toilet"], al: "weekdays", mem: "no", hlp: "no", lim: "tired",
    loc: { sec: "56" }, plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }], t: "T1", r: "sc", b: "le1969" } as const;
  await page.goto(`/plan/${encodeHash("action", s as never)}`);
  const steps = page.locator(".timeline");
  await expect(steps.getByRole("heading", { name: "Now" })).toBeVisible();
  await expect(steps.getByText("After: Functional Assessment Report")).toBeVisible();
  await expect(steps.getByText(/Apply about 4 weeks before you need the break/)).toBeVisible();
  await expect(steps.getByText(/^0 of \d+ done/)).toBeVisible();

  await page.getByRole("checkbox", { name: /Call the medical social worker/ }).check();
  await page.getByRole("checkbox", { name: /Book a Functional Assessment Report/ }).check();
  await expect(steps.getByText(/^2 of \d+ done/)).toBeVisible();
  expect(decodeHash(new URL(page.url()).hash)!.session.done).toEqual(["call_first", "far"]);

  // A sibling opening the same link sees the same ticks.
  const sibling = await context.newPage();
  await sibling.goto(page.url());
  await expect(sibling.getByRole("checkbox", { name: /Book a Functional Assessment Report/ })).toBeChecked();
  await expect(sibling.getByRole("checkbox", { name: /Apply for the Home Caregiving Grant/ })).not.toBeChecked();
});

test("8.4: the summary for her social worker shows her answers and prints on its own page", async ({ page }, info) => {
  const s = { v: (await import("../../public/data/manifest.json", { with: { type: "json" } })).default.dataVersion,
    w: "in_hospital", d: false, adl: ["bath", "dress", "toilet"], sev: ["bath"], al: "weekdays", mem: "no", hlp: "no", lim: "tired",
    loc: { sec: "56" }, plan: [{ s: "day_care", n: 5 }], t: "T1", r: "sc", b: "le1969" } as const;
  await page.goto(`/plan/${encodeHash("action", s as never)}`);
  await page.getByText("Summary for her social worker or AIC Link").click();
  const sum = page.locator(".handover");
  await expect(sum).toContainText("Can't do at all");
  await expect(sum).toContainText("washing");
  await expect(sum).toContainText("$1,501 – $2,300 a month (range T1)");
  await expect(sum).not.toContainText("560123");
  if (info.project.name !== "desktop") return;
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.documentElement.classList.add("print-handover"));
  const pdf = (await page.pdf({ format: "A4" })).toString("latin1");
  expect(pdf.match(/\/Type\s*\/Page[^s]/g)?.length).toBe(1);
});

test("8.5 and 8.3: grant criteria up front, and questions for each provider", async ({ page }) => {
  const s = { v: (await import("../../public/data/manifest.json", { with: { type: "json" } })).default.dataVersion,
    w: "changed_at_home", adl: ["bath", "dress", "toilet"], al: "no", mem: "no", hlp: "no", lim: "ok", loc: { reg: "east" },
    plan: [{ s: "day_care", n: 5 }, { s: "meals_on_wheels", n: 5 }], t: "T0", r: "sc", b: "le1969" } as const;
  await page.goto(`/plan/${encodeHash("cost", s as never)}`);
  const hcg = page.locator(".panel li", { hasText: "Home Caregiving Grant" }).first();
  await expect(hcg.locator("ul.criteria li")).toContainText(["Needs some help with 3 or more of the 6 daily activities, for good"]);
  await expect(hcg.getByRole("link", { name: "Official page and how to apply" })).toHaveAttribute("href", /aic\.sg\/financial-assistance\/home-caregiving-grant-hcg/);

  await page.goto(`/plan/${encodeHash("action", s as never)}`);
  const ask = page.locator(".providers");
  await expect(ask.getByRole("heading", { name: "Day care centre" })).toBeVisible();
  await expect(ask).toContainText("Is transport included, and what does it cost?");
  await expect(ask.getByRole("heading", { name: "Meals delivered" })).toBeVisible();
  await expect(ask).toContainText("Can you do a special diet, such as halal, vegetarian or soft food?");
});

test("8.7 to 8.10: health events, For you, Also worth doing, top 3 first, On this page", async ({ page }) => {
  await startPlan(page);
  await answer(page, "Living at home, and something has just changed");
  await page.getByLabel("Washing or bathing", { exact: true }).check();
  await page.getByLabel("A serious illness, with doctors expecting less than a year").check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const v = decodeHash(new URL(page.url()).hash)!.session;
  expect(v.cond).toEqual(["eol"]);

  const s = { ...v, al: "most", mem: "dx", hlp: "no", lim: "cant", loc: { reg: "east" } } as never;
  await page.goto(`/plan/${encodeHash("matches", s)}`);
  await expect(page.locator(".svc").first()).toBeVisible();
  // Top 3 first; anything else waits under "More that may help".
  const shown = await page.locator(".scr > .svc").count();          // cards outside "More that may help"
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThanOrEqual(3);
  await expect(page.getByRole("heading", { name: /^Palliative care at home/ })).toBeVisible();
  await expect(page.getByText("Charges may apply. A medical social worker can help with fees")).toBeVisible();

  const plan = { ...(s as object), plan: [{ s: "dementia_day_care", n: 5 }], t: "T0", r: "sc", b: "le1969" } as never;
  await page.goto(`/plan/${encodeHash("cost", plan)}`);
  const nav = page.getByRole("navigation", { name: "On this page" });
  const link = page.url();
  await nav.getByRole("link", { name: "Grants" }).click();
  await expect(page.locator("#grants")).toBeInViewport();
  expect(page.url()).toBe(link);                     // the plan stays in the address, so it can still be shared

  await page.goto(`/plan/${encodeHash("action", plan)}`);
  await expect(page.getByText(/^Ask her doctor at the hospital, polyclinic or GP clinic to refer her for palliative care at home/)).toBeVisible();
  const forYou = page.locator(".timeline", { has: page.getByRole("heading", { name: "For you" }) });
  await expect(forYou).toContainText("call mindline on 1771");
  await expect(forYou).toContainText("Dementia Singapore (6377 0700)");
  const ahead = page.locator(".timeline", { has: page.getByRole("heading", { name: "Also worth doing" }) });
  await expect(ahead).toContainText("Lasting Power of Attorney");
  await expect(ahead).toContainText("specially trained Advance Care Plan facilitator");
  // Ticks in these sections are saved in the link too.
  await ahead.getByRole("checkbox", { name: /Lasting Power of Attorney/ }).check();
  expect(decodeHash(new URL(page.url()).hash)!.session.done).toContain("lpa");
});

test("8.11 and 8.12: calendar reminders from the plan; Pioneer and Merdeka answers", async ({ page }) => {
  const s = { v: (await import("../../public/data/manifest.json", { with: { type: "json" } })).default.dataVersion,
    w: "changed_at_home", adl: ["bath", "dress", "toilet"], al: "no", mem: "no", hlp: "no", lim: "tired", loc: { reg: "east" },
    plan: [{ s: "day_care", n: 5 }], t: "T1", r: "sc", b: "le1969" } as const;
  await page.goto(`/plan/${encodeHash("action", s as never)}`);
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Add reminders to your calendar" }).click()]);
  expect(file.suggestedFilename()).toBe("care-plan-reminders.ics");
  const ics = (await (await import("node:fs/promises")).readFile((await file.path())!)).toString();
  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("SUMMARY:Care plan: Functional Assessment Report");
  expect(ics).toContain("SUMMARY:Care plan: review it");
  expect(ics.replace(/\r\n /g, "")).toContain(`The plan: ${page.url()}`);       // the link to her plan, unfolded

  await page.goto(`/plan/${encodeHash("cost", s as never)}`);
  const grants = page.locator(".panel", { hasText: "You may qualify for" });
  await expect(grants).toContainText("Pioneer Generation Disability Assistance Scheme");
  await expect(grants).toContainText("(if she is a Pioneer Generation member)");
  await page.getByText("More about her (optional)").click();
  await page.locator("label", { hasText: /^Pioneer$/ }).click();
  await expect(grants).not.toContainText("(if she is a Pioneer Generation member)");
  await expect(grants).toContainText("Pioneer Generation Disability Assistance Scheme");
  await page.locator("label", { hasText: /^Merdeka$/ }).click();
  await expect(grants).not.toContainText("Pioneer Generation Disability Assistance Scheme");
  await expect(grants).toContainText("The Merdeka Generation Package helps with MediShield Life and CareShield Life premiums.");
  expect(decodeHash(new URL(page.url()).hash)!.session.g).toBe("mg");
});

test("9.8: an older link says the figures changed and links to what changed", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("cost", { ...MEI, v: "2026.01.01-1" })}`);
  await page.getByRole("link", { name: "See what changed" }).click();
  await expect(page.getByRole("heading", { name: "What changed", level: 1 })).toBeVisible();
  await expect(page.getByText(/version \d{4}\.\d{2}\.\d{2}-\d+/).first()).toBeVisible();
});
