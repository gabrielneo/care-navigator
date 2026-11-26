// Stage 6 part 2: licence notices, secrets, sources on every figure, storage and indexing.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "../../public/data/manifest.json" with { type: "json" };
import { encodeHash, type Session } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";

const OUT = fileURLToPath(new URL("../../out", import.meta.url));
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));

test("data sources: one Open Data Licence notice per dataset, no endorsement", async ({ page }) => {
  await page.goto("/data-sources/");
  const notices = page.getByText(/accessed on .+ from data\.gov\.sg, which is made available under the terms of the Singapore Open Data Licence version 1\.0/);
  await expect(notices).toHaveCount(5);
  for (const d of ["Family Services", "Community Club / PAssion WaVe outlets", "CHAS Clinics", "Retail Pharmacy Locations", "Dementia Go-To-Points"]) {
    await expect(notices.filter({ hasText: `from ${d} accessed` })).toHaveCount(1);
  }
  await expect(page.getByText("doesn't mean the agencies endorse this site")).toBeVisible();
  // Every cited page is listed with its checked date.
  for (const s of manifest.sources) await expect(page.getByRole("link", { name: s.title, exact: true }).first()).toBeVisible();
});

test("build: no API keys or tokens in web/out", () => {
  test.skip(test.info().project.name !== "desktop", "file scan runs once");
  const SECRET = [/AIza[0-9A-Za-z_-]{35}/, /\bsk-[A-Za-z0-9]{20,}/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/,
    /api[_-]?key["':= ]+[A-Za-z0-9]{16,}/i, /Bearer [A-Za-z0-9._-]{20,}/];
  const found = files(OUT).filter((f) => /\.(html|js|json|txt|css)$/.test(f))
    .flatMap((f) => { const t = readFileSync(f, "utf8"); return SECRET.filter((r) => r.test(t)).map((r) => `${f}: ${r}`); });
  expect(found).toEqual([]);
});

// Any card or panel that shows a $ amount or a % must also say where it's from and when that was checked.
const FIGURE = /\$\d|\d%/;
const CHECKED = /checked \d{1,2} \w{3} \d{4}/;
const NURSING: Session = { v: manifest.dataVersion, w: "in_nursing_home", t: "T1", r: "sc", b: "le1969" };
const TAN: Session = { v: manifest.dataVersion, w: "struggling", adl: ["bath"], al: "most", mem: "dx", hlp: "no", lim: "cant", loc: { reg: "north" },
  plan: [{ s: "dementia_day_care", n: 5 }, { s: "respite", n: 1 }], t: "T0", r: "sc", b: "le1969" };

for (const [name, hash] of [
  ["Mei matches", encodeHash("matches", MEI)], ["Mei cost", encodeHash("cost", MEI)], ["Mei action", encodeHash("action", MEI)],
  ["Mr Tan matches", encodeHash("matches", TAN)], ["Mr Tan cost", encodeHash("cost", TAN)], ["Mr Tan action", encodeHash("action", TAN)],
  ["nursing home cost", encodeHash("cost", NURSING)],
] as const) {
  test(`sources: every figure on ${name} names its source and checked date`, async ({ page }) => {
    await page.goto(`/plan/${hash}`);
    await expect(page.locator("h1")).toBeVisible();
    const more = page.getByRole("button", { name: "See what a nursing home may cost" });
    if (await more.count()) await more.click();
    // .handover-box repeats her own answers (e.g. her income range), whose sources are on the cost screen.
    const boxes = page.locator(".svc, .panel:not(.line):not(.lines):not(.handover-box), p.why");
    let figures = 0;
    for (const box of await boxes.all()) {
      const text = (await box.textContent()) ?? "";
      if (!FIGURE.test(text)) continue;
      figures++;
      // p.why (the dementia wait note) carries its source on the next line.
      const scope = (await box.evaluate((e) => e.tagName)) === "P" ? box.locator("xpath=following-sibling::p[1]") : box;
      await expect(scope, `no source for: ${text.slice(0, 80)}`).toContainText(CHECKED);
      for (const a of await scope.locator("a").all()) await expect(a).toHaveAttribute("href", /^https:\/\//);
    }
    expect(figures).toBeGreaterThan(0);
    // Each cost line's figures are explained in "How is this worked out", which lists the same sources.
    if (await page.locator(".line").count()) await expect(page.locator("details.panel", { has: page.locator("table") })).toContainText(CHECKED);
  });
}

test("privacy: no cookies, nothing in storage, after a whole plan", async ({ page, context }) => {
  for (const step of ["where", "postal", "matches", "week", "cost", "contacts", "action"] as const) {
    await page.goto(`/plan/${encodeHash(step, MEI)}`);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  const html = files(OUT).filter((f) => f.endsWith(".html")).map((f) => readFileSync(f, "utf8")).join("\n");
  expect(html).not.toMatch(/<script[^>]+src="https?:\/\//);   // no third-party scripts
});

test("every page: noindex, OG image and the prototype banner", async ({ page }) => {
  for (const path of ["/", "/plan/", "/about/", "/privacy/", "/data-sources/"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og\.png$/);
    await expect(page.getByText(/prototype/i).first()).toBeVisible();
  }
});

test("headers: CSP allows only this site, no referrer, no type sniffing", async ({ request }) => {
  for (const path of ["/", "/plan/", "/data/manifest.json", "/does-not-exist/"]) {
    const h = (await request.get(path)).headers();
    expect(h["content-security-policy"], path).toMatch(/default-src 'self'.*frame-ancestors 'none'/);
    expect(h["content-security-policy"]).not.toMatch(/https?:|\*/);   // no outside origin is allowed anywhere
    expect(h["referrer-policy"], path).toBe("no-referrer");
    expect(h["x-content-type-options"], path).toBe("nosniff");
  }
});
