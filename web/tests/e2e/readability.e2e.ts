// Spec 08: sentences under 20 words, reading age about 12. Measured on every screen for three scenarios.
import manifest from "../../public/data/manifest.json" with { type: "json" };
import { encodeHash, type Session, type Step } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";
import { MAX_WORDS, ourSentences, readability } from "./readability";

// Grade 8 ≈ reading age 13. "Diagnosed" and "dementia" alone push the memory question to about 7.8, and they can't be avoided.
const MAX_GRADE = 8;
const TAN: Session = { v: manifest.dataVersion, w: "struggling", adl: ["bath"], al: "most", mem: "dx", hlp: "no", lim: "cant",
  loc: { reg: "north" }, plan: [{ s: "dementia_day_care", n: 5 }], t: "T0", r: "sc" };
const NURSING: Session = { v: manifest.dataVersion, w: "in_nursing_home", t: "T1", r: "sc" };
const STEPS: Step[] = ["where", "adl", "alone", "memory", "helper", "limits", "postal", "matches", "week", "cost", "contacts", "action"];
const SCREENS: [string, string][] = [
  ["Start", "/"],
  ...STEPS.map((s): [string, string] => [`Mei ${s}`, `/plan/${encodeHash(s, MEI)}`]),
  ["Mr Tan matches", `/plan/${encodeHash("matches", TAN)}`], ["Mr Tan action", `/plan/${encodeHash("action", TAN)}`],
  ["nursing home cost", `/plan/${encodeHash("cost", NURSING)}`], ["nursing home action", `/plan/${encodeHash("action", NURSING)}`],
];

for (const [name, url] of SCREENS) {
  test(`readability: ${name}`, async ({ page }) => {
    test.skip(test.info().project.name !== "phone", "wording is the same at both sizes");
    await page.goto(url);
    await expect(page.locator("h1").first()).toBeVisible();
    if (name.endsWith("contacts") || name.endsWith("action")) await expect(page.getByText(/AIC Link|nursing home's office/).first()).toBeVisible();
    const r = readability(await ourSentences(page));
    expect(r.sentences).toBeGreaterThan(0);
    expect(r.long, `sentences of ${MAX_WORDS}+ words`).toEqual([]);
    expect(r.grade, "Flesch–Kincaid grade").toBeLessThanOrEqual(MAX_GRADE);
  });
}
