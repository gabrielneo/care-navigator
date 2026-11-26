// The week builder: drag across days to choose when each service comes, and the days follow the plan through the
// cost, "Her plan so far" and the summary for the social worker. Also the remaining UX audit fixes (26 Nov 2026).
import AxeBuilder from "@axe-core/playwright";
import { decodeHash, encodeHash, type Session } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";

const WEEK: Session = { ...MEI, plan: [{ s: "day_care", n: 5 }] };

test("drag across the days to choose them; the days reach the cost, the chips and the handover", async ({ page }, info) => {
  test.skip(info.project.name === "iphone", "mouse drag; touch uses the same pointer events");
  await page.goto(`/plan/${encodeHash("week", WEEK)}`);
  const strip = page.getByRole("group", { name: "Days for Day care centre" });
  await expect(strip.getByRole("button", { pressed: true })).toHaveCount(5);          // starts Mon–Fri
  // Start on Wed (chosen) and drag to Fri: clears Wed–Fri.
  const box = async (d: string) => (await strip.getByRole("button", { name: d }).boundingBox())!;
  const wed = await box("Wed"), fri = await box("Fri"), sat = await box("Sat"), sun = await box("Sun");
  await page.mouse.move(wed.x + wed.width / 2, wed.y + wed.height / 2);
  await page.mouse.down();
  await page.mouse.move(fri.x + fri.width / 2, fri.y + fri.height / 2, { steps: 6 });
  await page.mouse.up();
  // Start on Sat (not chosen) and drag to Sun: adds the weekend.
  await page.mouse.move(sat.x + sat.width / 2, sat.y + sat.height / 2);
  await page.mouse.down();
  await page.mouse.move(sun.x + sun.width / 2, sun.y + sun.height / 2, { steps: 4 });
  await page.mouse.up();
  const panel = page.locator(".panel", { has: strip });
  await expect(panel).toContainText("Mon, Tue, Sat, Sun · 4 days a week");
  await expect(panel).toContainText("check weekend care when you call");
  const plan = decodeHash(new URL(page.url()).hash)!.session.plan!;
  expect(plan.find((e) => e.s === "day_care")).toEqual({ s: "day_care", n: 4, d: 0b1100011 });
  await expect(page.getByLabel("Her week").locator(".day", { hasText: "Wed" })).toContainText("—");

  await page.getByRole("button", { name: "See the cost" }).click();
  await expect(page.locator("#each")).toContainText("(Mon, Tue, Sat, Sun)");
  if (info.project.name === "desktop") {
    await expect(page.getByRole("complementary", { name: "Her plan so far" })).toContainText("Day care (Mon, Tue, Sat, Sun)");
  }
  await page.goto(`/plan/${encodeHash("action", decodeHash(new URL(page.url()).hash)!.session)}`);
  await expect(page.locator(".handover")).toContainText("Day care (Mon, Tue, Sat, Sun)");
});

test("clearing every day keeps the service on screen but out of the cost; Remove takes it out", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("week", { ...MEI, plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }] })}`);
  const panel = page.locator(".panel", { has: page.getByRole("group", { name: "Days for Day care centre" }) });
  await panel.getByRole("button", { name: "Clear" }).click();
  await expect(panel).toContainText("No days chosen, so it isn't costed.");
  await panel.getByRole("button", { name: "Weekdays" }).click();
  await expect(panel).toContainText("Mon–Fri · 5 days a week");
  await panel.getByRole("button", { name: /^Remove/ }).click();
  await expect(page.getByRole("group", { name: "Days for Day care centre" })).toHaveCount(0);
});

test("matches say which answers led to them, and ones from her own ticks are open", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("matches", { ...MEI, adl: ["bath", "dress", "toilet"], cond: ["hip"], med: true })}`);
  await expect(page.locator(".svc").first().locator(".because")).toContainText("Because you said:");
  const more = page.locator("details", { has: page.getByText(/more fits? your answers/) });
  await expect(more).toHaveAttribute("open", "");
  await expect(more).toContainText("Broken hip");
});

test("a stroke or fall shows the 995 line; None of these greys out the activities; Back sits beside Next", async ({ page }) => {
  await page.goto(`/plan/${encodeHash("adl", { v: MEI.v, w: "changed_at_home" })}`);
  await expect(page.getByText("If it's happening now, call")).toHaveCount(0);
  await page.getByLabel("A stroke").check();
  await expect(page.getByRole("note").filter({ hasText: "If it's happening now, call 995." })).toBeVisible();
  await expect(page.getByRole("link", { name: "995" })).toHaveAttribute("href", "tel:995");
  await page.getByLabel("None of these").check();
  await expect(page.locator(".grid2")).toHaveClass(/muted/);
  const row = page.locator(".nav-row");
  await expect(row.getByRole("button", { name: "Back" })).toBeVisible();
  await expect(row.getByRole("button", { name: "Next" })).toBeVisible();
});

test("the generation question waits under 'More about her'", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("cost", MEI)}`);
  const more = page.locator("details.more-about");
  await expect(more).not.toHaveAttribute("open", "");
  await more.locator("summary").click();
  await expect(page.getByRole("group", { name: "Pioneer or Merdeka Generation?" })).toBeVisible();
});

test("'What's this?' explains a term in plain words, with its official source, without ticking the step", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("action", { ...MEI, lim: "tired" })}`);
  const step = page.locator(".tl li", { hasText: "monthly income of everyone living at her NRIC address" });
  await step.getByRole("button", { name: /What's this\? Means test/ }).click();
  await expect(step.getByRole("button", { name: /What's this/ })).toHaveAttribute("aria-expanded", "true");
  await expect(step).toContainText("The means test sets her subsidy.");
  await expect(step).toContainText(/Source: .*checked \d{1,2} \w{3} \d{4}/);
  await expect(step.getByRole("checkbox")).not.toBeChecked();
  const respite = page.locator(".tl li", { hasText: "refer her for respite care" });
  await respite.getByRole("button", { name: /What's this\? Respite care/ }).click();
  await expect(respite).toContainText("at least 7 days, and up to 30 days a year");
  await page.goto(`/plan/${encodeHash("cost", MEI)}`);
  await page.getByRole("button", { name: /What's this\? Government-funded provider/ }).click();
  await expect(page.locator("#total")).toContainText("Subsidies are for Singapore Citizens and PRs");
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  const { violations } = await new AxeBuilder({ page }).include("#total").analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});
