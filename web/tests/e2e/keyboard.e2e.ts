// N1: the planner works with a keyboard alone (Tab to move, Space to choose, Enter to go on), with a visible focus ring
// on every stop. Covers the seven questions through to the matches and the week.
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers";

/** Tab forward until the focused element matches, checking each stop shows a focus ring. */
async function tabTo(page: Page, matches: (el: { tag: string; text: string; type: string; inHome?: boolean }) => boolean, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const el = await page.evaluate(() => {
      const a = document.activeElement as HTMLElement;
      const ring = (x: Element | null) => !!x && getComputedStyle(x).outlineStyle !== "none" && parseFloat(getComputedStyle(x).outlineWidth) > 0;
      return { tag: a.tagName.toLowerCase(), type: (a as HTMLInputElement).type ?? "", text: a.getAttribute("aria-label") ?? (a.closest("label") ?? a).textContent?.trim() ?? "",
        inHome: (a.closest("[role=group]")?.getAttribute("aria-label") ?? "").includes("Help with washing"),
        ring: ring(a) || ring(a.closest(".opt")) || ring(a.closest(".seg label")) };
    });
    expect(el.ring, `no visible focus on ${el.tag} "${el.text.slice(0, 40)}"`).toBe(true);
    if (matches(el)) return;
  }
  throw new Error("never reached the control by Tab");
}
const choose = async (page: Page, text: string) => {
  await tabTo(page, (e) => e.tag === "input" && e.text.startsWith(text));
  await page.keyboard.press("Space");
};
const next = async (page: Page) => {
  await tabTo(page, (e) => e.tag === "button" && e.text === "Next");
  await page.keyboard.press("Enter");
};

test("keyboard only: the seven questions, the matches and the week", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "keyboard runs once, on desktop");
  await page.goto("/plan/");
  await expect(page.getByRole("heading", { name: "Where is Mum right now?" })).toBeVisible();
  await choose(page, "Soon to be discharged");                 // first radio of the group gets focus; Space selects it
  await next(page);
  await expect(page.getByRole("heading", { name: "Which of these does she need help with?" })).toBeVisible();
  await choose(page, "Washing or bathing");
  await choose(page, "Dressing");
  await next(page);
  for (const [heading, answer] of [["Is she alone for most of the day?", "Yes, on weekdays"], ["Does she have memory problems?", "No"],
    ["Is there a live-in helper?", "No"], ["How are you coping?", "I'm managing"]] as const) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    // In a radio group Tab lands on the first option and the arrow keys move between them, as screen readers expect.
    await tabTo(page, (e) => e.tag === "input" && e.type === "radio");
    for (let i = 0; i < 4 && !(await page.evaluate((a) => (document.activeElement?.closest("label")?.textContent ?? "").trim() === a, answer)); i++) {
      await page.keyboard.press("ArrowDown");
    }
    await page.keyboard.press("Space");
    await next(page);
  }
  await expect(page.getByRole("heading", { name: "Where does she live?" })).toBeVisible();
  await tabTo(page, (e) => e.tag === "input" && e.type !== "radio");
  await page.keyboard.type("560123");
  await next(page);
  await expect(page.getByRole("heading", { name: /services may fit/ })).toBeVisible();
  await tabTo(page, (e) => e.tag === "button" && e.text === "Build her week");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Build her week" })).toBeVisible();
  // The day buttons work from the keyboard: Space turns Monday off for home care (Mon, Wed, Fri → Wed, Fri).
  const home = page.getByRole("group", { name: "Days for Help with washing and dressing at home" });
  await tabTo(page, (e) => e.tag === "button" && e.text === "Mon" && !!e.inHome);
  await page.keyboard.press("Space");
  await expect(home.getByRole("button", { pressed: true })).toHaveCount(2);
});
