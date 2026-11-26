// 9.6: a plan for Dad (or a husband, or "someone else (he)") says he and his on every screen, in English and the Chinese
// draft, and the choice is kept in the link.
import { encodeHash, type Session, type Step } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";

const STEPS: Step[] = ["where", "adl", "alone", "memory", "helper", "limits", "postal", "matches", "week", "cost", "contacts", "action"];
const DAD: Session = { ...MEI, who: "dad", adl: ["bath", "dress", "toilet"], sev: ["bath"], cond: ["eol"], hlp: "yes", lim: "cant" };

test("choosing Dad changes the question and is kept in the link", async ({ page }) => {
  await page.goto("/plan/");
  await expect(page.getByRole("heading", { name: "Where is Mum right now?" })).toBeVisible();
  await page.getByRole("group", { name: "Who are you planning for?" }).getByText("Dad", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Where is Dad right now?" })).toBeVisible();
  await page.getByLabel("Soon to be discharged from hospital").check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Which of these does he need help with?" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Which of these does he need help with?" })).toBeVisible();
});

for (const l of [undefined, "zh"] as const) {
  test(`a plan for Dad never says she or her (${l ?? "en"})`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "checked once");
    for (const step of STEPS) {
      await page.goto(`/plan/${encodeHash(step, { ...DAD, l })}`);
      await expect(page.locator("h1").first()).toBeVisible();
      if (step === "contacts" || step === "action") await expect(page.getByText(/AIC Link @/).first()).toBeVisible();
      const text = await page.locator("main").evaluate((m) => {         // the chooser itself lists Mum and "she"
        const c = m.cloneNode(true) as HTMLElement; c.querySelector(".who")?.remove(); document.body.append(c);
        const out = c.innerText; c.remove(); return out;
      });
      expect(text.match(l ? /她|妈妈/g : /\b(she|her|She|Her|herself|Mum)\b/g), `${step}`).toBeNull();
    }
    await expect(page.locator("h1").first()).toHaveText(l ? "爸爸的护理计划" : "Dad's care plan");
  });
}
