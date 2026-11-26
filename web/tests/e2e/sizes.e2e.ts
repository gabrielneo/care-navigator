// R21 and N1 (design, older users): text and tap targets big enough, measured on every screen at phone size, and pages
// that reflow at 320 px wide (what 400% zoom on a 1280 px screen looks like, WCAG 1.4.10), in every language.
import type { Page } from "@playwright/test";
import { encodeHash, type Session, type Step } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";

const STEPS: Step[] = ["where", "adl", "alone", "memory", "helper", "limits", "postal", "matches", "week", "cost", "contacts", "action"];
const RICH: Session = { ...MEI, adl: ["bath", "dress", "toilet"], sev: ["bath"], cond: ["eol"], hlp: "yes", lim: "cant" };

/** Everything too small on the screen: text under 14 px, main text under 18 px, controls under 48 px, other targets under 24 px. */
async function tooSmall(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const shown = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
    const label = (e: Element) => `${e.tagName.toLowerCase()}${e.className ? "." + String(e.className).split(" ")[0] : ""} "${(e.textContent ?? "").trim().slice(0, 30)}"`;
    const main = document.querySelector("main")!;
    // 1. No visible text below 14 px (screen-reader-only text excepted).
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement!;
      if (!n.textContent?.trim() || !shown(el) || el.closest(".sr-only, svg")) continue;
      if (parseFloat(getComputedStyle(el).fontSize) < 14) out.push(`text < 14px: ${label(el)}`);
    }
    // 2. Main text at 18 px or more: headings, questions, answers, buttons and plain paragraphs.
    for (const el of main.querySelectorAll<HTMLElement>("h1, .opt > span, .btn, main p:not([class])")) {
      if (shown(el) && parseFloat(getComputedStyle(el).fontSize) < 18) out.push(`main text < 18px: ${label(el)}`);
    }
    // 3. Controls at least 48 px tall; every other target at least 24 × 24 (links inside sentences excepted, as WCAG 2.5.8 allows).
    for (const el of main.querySelectorAll<HTMLElement>(".btn, .opt, .chip, select, input.input")) {
      if (shown(el) && el.getBoundingClientRect().height < 47.5) out.push(`control < 48px: ${label(el)}`);
    }
    for (const el of document.querySelectorAll<HTMLElement>("button, a, select, summary, input")) {
      if (!shown(el) || el.closest(".opt, .seg")) continue;            // a radio or checkbox is reached through its whole label
      const inline = el.tagName === "A" && el.closest("p, li") && !el.matches(".link, .btn");
      const r = el.getBoundingClientRect();
      if (!inline && (r.height < 23.5 || r.width < 23.5)) out.push(`target < 24px: ${label(el)}`);
    }
    return out;
  });
}

for (const step of STEPS) {
  test(`sizes: ${step} at phone size`, async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "measured once, at 375 px");
    await page.goto(`/plan/${encodeHash(step, RICH)}`);
    await expect(page.locator("h1").first()).toBeVisible();
    if (step === "contacts") await expect(page.locator(".contact").first()).toBeVisible();
    expect(await tooSmall(page)).toEqual([]);
  });
}

test("sizes: Start page at phone size", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "measured once, at 375 px");
  await page.goto("/");
  expect(await tooSmall(page)).toEqual([]);
});

for (const l of [undefined, "zh", "ms", "ta"] as const) {
  test(`reflow: every screen at 320 px, ${l ?? "en"} (400% zoom)`, async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "checked once");
    await page.setViewportSize({ width: 320, height: 640 });
    for (const step of STEPS) {
      await page.goto(`/plan/${encodeHash(step, { ...RICH, l })}`);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${step} scrolls sideways`).toBe(true);
    }
  });
}
