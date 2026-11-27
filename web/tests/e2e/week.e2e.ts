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

test("the activities question explains the 6 daily activities from CPF; source lines show short names", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("adl", { v: MEI.v, w: "changed_at_home" })}`);
  await page.getByRole("button", { name: /What's this\? The 6 daily activities/ }).click();
  await expect(page.locator(".explain-text")).toContainText("moving between bed and chair");
  await expect(page.locator(".explain-text")).toContainText(/Source: CPF: the six Activities of Daily Living, checked/);
  await page.goto(`/plan/${encodeHash("matches", MEI)}`);
  const src = page.locator(".svc .sources a", { hasText: /^AIC Day Care$/ }).first();
  await expect(src).toHaveAttribute("title", /fees from \$55/);           // the full title stays in the tooltip
});

test("second audit: levy as a cost, honest 'more' count, share near the top, her week on the plan, singular units", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  const s: Session = { ...MEI, adl: ["bath", "dress", "toilet"], cond: ["stroke"], med: true, hlp: "yes", lim: "tired",
    plan: [{ s: "day_care", n: 5 }, { s: "community_rehab", n: 1 }] };
  await page.goto(`/plan/${encodeHash("matches", s)}`);
  const more = page.locator("details", { has: page.locator("summary", { hasText: /more fits? your answers|More that may help/ }) });
  await expect(more.locator("summary")).toBeVisible();                     // the screen loads on demand
  const cards = await more.locator(".svc").count();
  await expect(more.locator("summary")).toHaveText(`${cards} more fit your answers`);
  await expect(page.locator(".svc", { hasText: "Therapy at a centre" }).locator(".price")).toHaveText("From $55 a session before subsidy");

  await page.goto(`/plan/${encodeHash("week", s)}`);
  const rehab = page.locator(".panel", { has: page.getByRole("group", { name: "Days for Therapy at a centre" }) });
  await expect(rehab).toContainText("Wed · 1 session a week");
  const dayCare = page.locator(".panel", { has: page.getByRole("group", { name: "Days for Day care centre" }) });
  await expect(dayCare.getByLabel("Include transport to and from day care")).toBeVisible();

  await page.goto(`/plan/${encodeHash("cost", s)}`);
  await expect(page.locator("#grants")).toContainText("Helper levy concession: You pay a $60 monthly levy instead of $300");

  await page.goto(`/plan/${encodeHash("action", s)}`);
  const top = page.locator(".quick-share");
  await expect(top.getByRole("link", { name: "Share on WhatsApp" })).toBeVisible();
  await expect(top.getByRole("button", { name: "Print one page" })).toBeVisible();
  expect(await top.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(
    await page.getByRole("heading", { name: "Your next steps" }).evaluate((el) => el.getBoundingClientRect().top));
  await expect(page.getByText("Her week:")).toBeVisible();
  await expect(page.locator(".panel", { hasText: "Estimated monthly cost" })).toContainText("Day care (Mon–Fri) · Centre therapy (Wed)");
});

test("next tier: directions, no-days message, folded sources, one-letter days, trimmed cards", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone-sized checks");
  await page.goto(`/plan/${encodeHash("contacts", MEI)}`);
  const card = page.locator(".contact", { hasText: "AIC Link @" }).first();
  const href = (await card.getByRole("link", { name: /^Directions/ }).getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=AIC%20Link/);
  expect(href).not.toContain("5601");                                    // her postal code never goes out
  await expect(card).toContainText(/Address checked \d/);

  await page.goto(`/plan/${encodeHash("cost", { ...MEI, plan: [{ s: "day_care", n: 0, d: 0 }] })}`);
  await expect(page.getByText("No days chosen yet. Go back to her week to pick days.")).toBeVisible();
  await page.getByRole("button", { name: "Back to her week" }).click();
  await expect(page.getByRole("heading", { name: "Build her week" })).toBeVisible();

  await page.goto(`/plan/${encodeHash("action", MEI)}`);
  const long = page.locator(".sources.folded").first();
  await expect(long.locator(".src-more").first()).toBeHidden();
  await long.getByRole("button", { name: /and \d+ more/ }).click();
  await expect(page.locator(".sources").first().locator(".src-more").first()).toBeVisible();
  // On paper, folded lists print in full: the hidden sources' own display rule switches back on.
  const folded = page.locator(".sources.folded .src-more").first();
  await page.emulateMedia({ media: "print" });
  expect(await folded.evaluate((e) => getComputedStyle(e).display)).toBe("inline");
  await page.emulateMedia({ media: "screen" });
  expect(await folded.evaluate((e) => getComputedStyle(e).display)).toBe("none");

  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`/plan/${encodeHash("week", MEI)}`);
  const mon = page.getByRole("group", { name: "Days for Day care centre" }).getByRole("button", { name: "Mon" });
  await expect(mon).toBeVisible();
  await expect(mon.locator(".d-letter")).toHaveText("M");
  // Seven in a row can't reach 44 px at 320 px wide; they stay well over WCAG AA's 24 px (phones 375 px and up get ~45 px).
  expect((await mon.boundingBox())!.width).toBeGreaterThan(30);
  await page.goto(`/plan/${encodeHash("matches", MEI)}`);
  await expect(page.locator(".svc", { hasText: "Interim Caregiver" }).first()).toContainText("A carer at home for up to 2 weeks after she leaves hospital.");
});

test("services move between days in Her week: drag a tag, or tap it and then Move here", async ({ page }, info) => {
  const s: Session = { ...MEI, plan: [{ s: "day_care", n: 5 }, { s: "community_rehab", n: 1, d: 0b100 }] };   // rehab on Wed
  await page.goto(`/plan/${encodeHash("week", s)}`);
  const board = page.getByLabel("Her week");
  const row = (day: string) => board.locator(".day", { has: page.locator("b", { hasText: new RegExp(`^${day}$`) }) });
  await expect(row("Wed").getByRole("button", { name: /Centre therapy/ })).toBeVisible();
  const where = () => decodeHash(new URL(page.url()).hash)!.session.plan!.find((e) => e.s === "community_rehab");

  if (info.project.name !== "iphone") {
    // Drag (mouse here; a finger sends the same pointer events): Wed → Sat.
    await row("Sun").scrollIntoViewIfNeeded();
    const tag = (await row("Wed").getByRole("button", { name: /Centre therapy/ }).boundingBox())!;
    const sat = (await row("Sat").boundingBox())!;
    await page.mouse.move(tag.x + tag.width / 2, tag.y + tag.height / 2);
    await page.mouse.down();
    await page.mouse.move(sat.x + sat.width / 2, sat.y + sat.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(row("Sat").getByRole("button", { name: /Centre therapy/ })).toBeVisible();
    expect(where()).toEqual({ s: "community_rehab", n: 1, d: 0b100000 });
  } else {
    await row("Wed").getByRole("button", { name: /Centre therapy/ }).click();
    await row("Sat").getByRole("button", { name: /Move here/ }).click();
    await expect(row("Sat").getByRole("button", { name: /Centre therapy/ })).toBeVisible();
  }
  // Tap, then Move here: Sat → Sun. Days that already have the service offer no Move here.
  await row("Sat").getByRole("button", { name: /Centre therapy/ }).click();
  await expect(row("Sat").getByRole("button", { name: /Centre therapy/ })).toHaveAttribute("aria-pressed", "true");
  await expect(row("Sat").getByRole("button", { name: /Move here/ })).toHaveCount(0);
  await row("Sun").getByRole("button", { name: /Move here/ }).click();
  await expect(row("Sun").getByRole("button", { name: /Centre therapy/ })).toBeVisible();
  expect(where()?.d).toBe(0b1000000);
  // Day care is on every weekday, so its Mon tag can only go to the weekend.
  await row("Mon").getByRole("button", { name: /Day care/ }).click();
  await expect(row("Tue").getByRole("button", { name: /Move here/ })).toHaveCount(0);
  await expect(row("Sat").getByRole("button", { name: /Move here/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(board.getByRole("button", { name: /Move here/ })).toHaveCount(0);
  // The strip for the service shows the same days.
  const strip = page.getByRole("group", { name: "Days for Therapy at a centre" });
  await expect(strip.getByRole("button", { pressed: true })).toHaveCount(1);
  await expect(strip.getByRole("button", { name: "Sun", pressed: true })).toBeVisible();
});

test("the add-a-service dropdown draws its own arrow inside the box", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "checked once");
  await page.goto(`/plan/${encodeHash("week", MEI)}`);
  const sel = page.getByLabel("Add a service");
  expect(await sel.evaluate((e) => getComputedStyle(e).appearance)).toBe("none");
  expect(await sel.evaluate((e) => parseFloat(getComputedStyle(e).paddingRight))).toBeGreaterThanOrEqual(44);
});

test("the dragged tag stays under the pointer, where it was picked up", async ({ page }, info) => {
  test.skip(info.project.name === "iphone", "mouse drag");
  await page.goto(`/plan/${encodeHash("week", { ...MEI, plan: [{ s: "home_personal_care", n: 3, d: 0b111000 }] })}`);
  const board = page.getByLabel("Her week");
  await board.scrollIntoViewIfNeeded();
  const tag = board.getByRole("button", { name: /Home care/ }).first();
  await expect(page.locator(".scr")).toHaveCSS("opacity", "1");                    // the slide-in has finished
  const b = (await tag.boundingBox())!;
  const grab = { x: b.x + 12, y: b.y + b.height / 2 };                             // near the tag's left edge
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  for (const [x, y] of [[grab.x + 40, grab.y + 30], [grab.x - 60, grab.y + 90]] as const) {
    await page.mouse.move(x, y, { steps: 4 });
    const g = (await page.locator(".tag.ghost").boundingBox())!;
    expect(x).toBeGreaterThan(g.x - 4);
    expect(x).toBeLessThan(g.x + g.width + 4);
    expect(y).toBeGreaterThan(g.y - 4);
    expect(y).toBeLessThan(g.y + g.height + 4);
    expect(Math.abs(g.x + 12 - x)).toBeLessThan(10);                                // same grab point as picked up
    expect(g.height).toBeLessThan(60);                                              // one line, not wrapped
  }
  await page.mouse.up();
  await expect(page.locator(".tag.ghost")).toHaveCount(0);
});
