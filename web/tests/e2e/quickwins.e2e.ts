// The five quick wins from the UX audit (26 Nov 2026): errors that point at the question, the activities screen's
// required part kept together, the monthly total in reach on a phone, plain income wording, and a way back to any answer.
import { encodeHash, type Session } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";

test("a missing answer outlines its question, says what's missing there, and moves focus to it", async ({ page }) => {
  await page.goto("/plan/");
  await page.getByLabel("Soon to be discharged from hospital").check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  // Health events and medical care are optional; the activities still need an answer.
  await page.getByLabel("A broken hip").check();
  await page.getByLabel(/Medical care at home/).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const group = page.getByRole("group", { name: "Which of these does she need help with?" });
  await expect(group).toHaveClass(/invalid/);
  await expect(group.getByRole("alert")).toHaveText('Choose at least one, or "None of these" or "Not sure".');
  await expect(group.getByLabel("Washing or bathing")).toBeFocused();
  await expect(group.getByLabel("Washing or bathing")).toBeInViewport();
  // "None of these" sits inside the same question, and answering clears the message.
  await group.getByLabel("None of these").check();
  await expect(group).not.toHaveClass(/invalid/);
  await expect(group.getByRole("alert")).toHaveText("");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Is she alone for most of the day?" })).toBeVisible();
});

test("every question points at itself when skipped", async ({ page }) => {
  await page.goto(`/plan/${encodeHash("memory", { ...MEI, mem: undefined })}`);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const group = page.getByRole("group", { name: "Does she have memory problems?" });
  await expect(group.getByRole("alert")).toHaveText("Choose one answer to go on.");
  await expect(group.getByRole("radio").first()).toBeFocused();
});

test("the chips go back to their answer, and a new plan starts fresh in the same language", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("week", { ...MEI, l: undefined } as Session)}`);
  await page.getByRole("complementary", { name: "Her plan so far" }).getByRole("button", { name: /Alone on weekdays/ }).click();
  await expect(page.getByRole("heading", { name: "Is she alone for most of the day?" })).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Start a new plan" }).click();
  await expect(page.getByRole("heading", { name: "Where is Mum right now?" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Her plan so far" })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Is she alone for most of the day?" })).toBeVisible();   // the old plan is a Back away
});

test("on a phone the monthly total stays in reach, and the income question is in plain words", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "the bar is for phones");
  await page.goto(`/plan/${encodeHash("cost", MEI)}`);
  await expect(page.getByLabel("Monthly household income, per person")).toBeVisible();
  await expect(page.getByRole("option", { name: /range T/ })).toHaveCount(0);
  const peek = page.locator(".peek");
  await expect(peek).toContainText("a month with subsidy");
  await peek.click();
  await expect(page.locator("#total")).toBeInViewport();
  await expect(peek).toHaveCount(0);                                       // gone once the total itself is on screen
  await expect(page.locator("#total")).toContainText(/Figures as of \d{1,2} \w{3} \d{4}/);
});

test("the total bar never covers the buttons below the total, even after a jump to the bottom", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "the bar is for phones");
  await page.goto(`/plan/${encodeHash("cost", MEI)}`);
  await expect(page.locator(".peek")).toBeVisible();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator(".peek")).toHaveCount(0);
  await page.getByRole("button", { name: "See who to call" }).click({ trial: true });   // nothing in the way
});
