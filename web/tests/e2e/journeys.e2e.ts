// The four journeys in docs/architecture-prompts-v2.md, Stage 6.
import rulesJson from "../../public/data/rules.json" with { type: "json" };
import { range } from "../../src/components/planner/ui";
import type { RulesBundle } from "../../src/lib/data/types";
import { costPlan } from "../../src/lib/engine/cost";
import { decodeHash, encodeHash } from "../../src/lib/engine/urlCodec";
import { answer, expect, startPlan, test } from "./helpers";

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

  // Default is day care 5 and home care 3 blocks; Mei wants 2 blocks.
  await expect(page.getByRole("group", { name: "Day care centre" }).locator("output")).toHaveText("5");
  await page.getByRole("button", { name: "Remove one from Help with washing and dressing at home" }).click();
  await expect(page.getByRole("group", { name: "Help with washing and dressing at home" }).locator("output")).toHaveText("2");
  // Weekdays first: day care Mon–Fri, home care Tue and Thu, nothing pushed onto the weekend.
  const week = page.getByLabel("Her week");
  await expect(week.locator(".day", { hasText: "Tue" })).toContainText("Home care");
  await expect(week.locator(".day", { hasText: "Sat" })).toContainText("—");
  await expect(week.locator(".day", { hasText: "Sun" })).toContainText("—");
  await page.getByRole("button", { name: "See the cost" }).click();

  await page.getByLabel("Household income per person (PCHI)").selectOption("T1");
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
  await expect(page.getByRole("heading", { name: /^Call the medical social worker on her ward, before she's discharged/ })).toBeVisible();
  await expect(page.getByText('"When is she likely to be discharged?"')).toBeVisible();
  await page.getByRole("button", { name: "More people" }).click();
  await page.getByRole("button", { name: "More people" }).click();
  const split = costPlan(rules, decodeHash(new URL(page.url()).hash)!.session).split!;
  await expect(page.getByText(`${range(split.each)} each`)).toBeVisible();

  // The WhatsApp link carries this page's URL; opening it shows the same plan.
  const wa = await page.getByRole("link", { name: "Share on WhatsApp" }).getAttribute("href");
  const shared = decodeURIComponent(new URL(wa!).searchParams.get("text")!).replace("Mum's care plan: ", "");
  expect(shared).toBe(page.url());
  const got = decodeHash(new URL(shared).hash)!;
  expect(got.step).toBe("action");
  expect(got.session).toMatchObject({ t: "T1", r: "sc", x: 3, loc: { sec: "56" } });
  expect(got.session.plan).toEqual(expect.arrayContaining([{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }]));
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
  await expect(page.getByRole("heading", { name: /^Call an AIC Link/ })).toBeVisible();
  expect(decodeHash(new URL(page.url()).hash)!.session.loc).toEqual({ reg: "north" });
});

test("Nursing home: a 'from' figure next to real bills, nothing subtracted", async ({ page }) => {
  await startPlan(page);
  await answer(page, "In a nursing home");
  await expect(page.getByRole("heading", { name: "What a nursing home may cost" })).toBeVisible();
  // Before her income range and residency are picked, no subsidy is claimed.
  await expect(page.getByText("from $4,900 a month before subsidy", { exact: true })).toBeVisible();
  await expect(page.getByText(/0% residential subsidy/)).toHaveCount(0);
  await page.getByLabel("Household income per person (PCHI)").selectOption("T1");
  await page.locator("label", { hasText: "Singapore Citizen" }).click();
  await expect(page.getByLabel("Singapore Citizen")).toBeChecked();

  // T1, citizen born 1969 or earlier: 65% residential subsidy on AIC's $4,900 "from" fee = $1,715.
  // A payout taken off (CareShield Life $689, MediSave Care $200) would show a lower figure.
  await expect(page.getByText("from $1,715 a month", { exact: true })).toBeVisible();
  await expect(page.getByText(/\$620 – \$3,069 a month for subsidised residents \(Ren Ci/)).toBeVisible();
  await expect(page.getByText("Grants are never taken off the totals above.")).toBeVisible();
  await page.getByRole("button", { name: "See what to ask" }).click();
  await expect(page.getByRole("heading", { name: /^Call the nursing home's office/ })).toBeVisible();
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
