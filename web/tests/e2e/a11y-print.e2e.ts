// axe on every screen (both viewports come from the projects), and the action plan on one A4 page.
import AxeBuilder from "@axe-core/playwright";
import { encodeHash, type Session, type Step } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";

const STEPS: Step[] = ["where", "adl", "alone", "memory", "helper", "limits", "postal", "matches", "week", "cost", "contacts", "action"];
const PAGES = ["/", "/zh/", "/about/", "/privacy/", "/data-sources/", "/changes/", "/accessibility/", "/terms/", "/does-not-exist/"];

async function axe(page: import("@playwright/test").Page) {
  // Check the screen people read: scrolled through, so scroll-revealed sections have risen in, and after the slide-ins
  // finish (time-based animations only; scroll-driven ones follow the scroll position and never "finish").
  await page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(requestAnimationFrame);
    await Promise.all(document.getAnimations().filter((a) => a.timeline === document.timeline && a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));
  });
  const { violations } = await new AxeBuilder({ page }).analyze();
  const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

for (const step of STEPS) {
  test(`axe: plan step ${step}`, async ({ page }) => {
    await page.goto(`/plan/${encodeHash(step, MEI)}`);
    await expect(page.locator("h1")).toBeVisible();
    if (step === "cost") {   // open everything that can be opened
      await page.getByText("How is this worked out").click();
      await page.getByText("Cost of each service").click();
      await page.getByRole("button", { name: "See what a nursing home may cost" }).click();
      await page.getByRole("button", { name: /Not sure which range/ }).click();
    }
    if (step === "contacts") await expect(page.locator(".contact").first()).toBeVisible();
    await axe(page);
  });
}

// States a journey passes through but the screens above don't show: errors, banners, empty and fallback screens.
const BASE: Session = { v: MEI.v, w: "changed_at_home", adl: [], al: "no", mem: "no", hlp: "no", lim: "ok" };
const STATES: [string, string, ((p: import("@playwright/test").Page) => Promise<void>)?][] = [
  ["question with no answer", "", (p) => p.getByRole("button", { name: "Next", exact: true }).click()],
  ["postal code error", encodeHash("postal", BASE), async (p) => { await p.getByLabel("Postal code").fill("12"); await p.getByLabel("Postal code").blur(); }],
  ["region picker", encodeHash("postal", BASE), (p) => p.getByRole("button", { name: "Skip and pick a region" }).click()],
  ["damaged link", "#s=cost&p=xxxx"],
  ["figures updated banner", encodeHash("where", { ...BASE, v: "2020.01.01-1" })],
  ["nursing home cost", encodeHash("cost", { v: MEI.v, w: "in_nursing_home", t: "T1", r: "sc" })],
  ["empty plan", encodeHash("week", { ...BASE, plan: [] })],
  ["contacts with no area", encodeHash("contacts", { ...BASE, plan: [] })],
  ["quote error", encodeHash("cost", MEI), async (p) => {
    await p.getByText("Cost of each service").click();
    await p.getByRole("button", { name: "Enter a quote" }).first().click();
    await p.getByLabel(/Quoted fee/).first().fill("0"); await p.getByLabel(/Quoted fee/).first().blur();
  }],
];
for (const [name, hash, act] of STATES) {
  test(`axe: ${name}`, async ({ page }) => {
    await page.goto(`/plan/${hash}`);
    await expect(page.locator("h1").first()).toBeVisible();
    if (act) await act(page);
    await axe(page);
  });
}

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await axe(page);
  });
}

test("print: the action plan fits on one A4 page", async ({ page, browserName }, info) => {
  test.skip(info.project.name !== "desktop" || browserName !== "chromium", "page.pdf runs once, in Chromium");
  await page.goto(`/plan/${encodeHash("action", MEI)}`);
  await expect(page.getByText(/^About|In your area|AIC Link/).first()).toBeVisible();
  await page.emulateMedia({ media: "print" });
  const pdf = (await page.pdf({ format: "A4", printBackground: true })).toString("latin1");
  expect(pdf.match(/\/Type\s*\/Page[^s]/g)?.length).toBe(1);
});

// 9.2: in every language, since the Malay and Tamil wording runs longer than the English.
for (const l of [undefined, "zh", "ms", "ta"] as const) {
test(`print: a rich plan fits the 1-page print, and the full plan stays within 2 pages (${l ?? "en"})`, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "page.pdf runs once, in Chromium");
  // The heaviest plan we test: every activity, a serious illness, a stroke, a helper and a carer at their limit.
  const heavy: Session = { ...MEI, adl: ["bath", "dress", "toilet", "move", "eat", "transfer"], sev: ["bath", "dress", "toilet"], med: true,
    hlp: "yes", lim: "cant", cond: ["stroke", "eol"],
    plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 3 }, { s: "home_nursing", n: 1 }, { s: "home_therapy", n: 1 },
      { s: "medical_escort", n: 1 }, { s: "meals_on_wheels", n: 5 }], l };
  await page.goto(`/plan/${encodeHash("action", heavy)}`);
  await expect(page.getByText(/AIC Link @/).first()).toBeVisible();          // the nearby places have loaded (any language)
  const pages = async () => (await page.pdf({ format: "A4", printBackground: true })).toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length;
  await page.emulateMedia({ media: "print" });
  expect(await pages()).toBeLessThanOrEqual(2);                                // "Print full plan"
  await page.evaluate(() => document.documentElement.classList.add("print-compact"));
  expect(await pages()).toBe(1);                                               // "Print 1-page plan"
  // With room to spare: it also fits a sheet 6% shorter, since phones' fonts and printers' margins vary.
  const short = (await page.pdf({ width: "210mm", height: "279mm", printBackground: true })).toString("latin1");
  expect(short.match(/\/Type\s*\/Page[^s]/g)?.length, "one-page plan has under 6% headroom").toBe(1);
  if (!l) await expect(page.getByText("Later steps, support for you and things worth doing ahead are in this plan's link.")).toBeVisible();
});
}

test("Start: the 3D home appears, and reduced motion keeps the still mark", async ({ page, browser }) => {
  await page.goto("/");
  // Without hardware graphics (CI's Linux machines) the 3D is skipped on purpose and the still mark stays.
  const hardware = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true }));
  if (!hardware) {
    await page.waitForTimeout(2500);
    await expect(page.locator(".hero-3d .mark")).toBeVisible();
    await expect(page.locator(".hero-3d canvas")).toHaveCount(0);
    return;
  }
  await expect(page.locator(".hero-3d > .scene.shown canvas")).toBeVisible({ timeout: 10_000 });
  const calm = await browser.newContext({ reducedMotion: "reduce" });
  const still = await calm.newPage();
  await still.goto(test.info().project.use.baseURL + "/");
  await expect(still.locator(".hero-3d .mark")).toBeVisible();
  await still.waitForTimeout(2500);                                   // past the idle load
  await expect(still.locator(".hero-3d canvas")).toHaveCount(0);
  await calm.close();
});
