import { test as base, expect, type Page, type Request } from "@playwright/test";
import manifest from "../../public/data/manifest.json" with { type: "json" };
import type { Session } from "../../src/lib/engine/urlCodec";

// Mei's finished plan; every step can be opened straight from a link because all questions are answered.
export const MEI: Session = {
  v: manifest.dataVersion, w: "in_hospital", d: false, adl: ["bath", "dress"], al: "weekdays", mem: "no", hlp: "no", lim: "ok",
  loc: { sec: "56" }, plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }], t: "T1", r: "sc", b: "le1969", x: 3,
};


/** Pick an answer by its visible label, then press Next. */
export async function answer(page: Page, ...labels: string[]) {
  for (const l of labels) await page.getByLabel(l, { exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

export async function startPlan(page: Page) {
  await page.goto("/plan/");
  await expect(page.getByRole("heading", { name: "Where is Mum right now?" })).toBeVisible();
}

/** Every postal code the tests type. None may appear in any request. */
export const POSTAL_CODES = ["560123", "701234"];

/** `test` with checks after every test: each request from every page stayed on this site and carried no postal code,
 *  and the security headers (vercel.json) blocked nothing the site itself needs. */
export const test = base.extend<{ privateRequests: void }>({
  privateRequests: [async ({ context, baseURL }, use) => {
    const seen: Request[] = [];
    const blocked: string[] = [];
    context.on("request", (r) => seen.push(r));
    context.on("console", (m) => { if (/Content Security Policy|Refused to|Hydration|did not match/i.test(m.text())) blocked.push(m.text()); });
    await use();
    expect(blocked, "blocked by the Content-Security-Policy, or a hydration error").toEqual([]);
    const origin = new URL(baseURL!).origin;
    for (const r of seen) {
      expect(new URL(r.url()).origin, `off-site request: ${r.url()}`).toBe(origin);
      for (const code of POSTAL_CODES) {
        expect(r.url(), `request carries ${code}`).not.toContain(code);
        expect(r.postData() ?? "", `request body carries ${code}`).not.toContain(code);
      }
    }
  }, { auto: true }],
});
export { expect };
