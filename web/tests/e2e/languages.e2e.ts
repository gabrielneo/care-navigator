// 8.13: the draft translations (Chinese, Malay, Tamil), end to end. Every screen is in Chinese apart from official names (kept in English on purpose),
// place names and source titles; it's labelled as a draft; and it switches back to English.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { decodeHash, encodeHash, type Session } from "../../src/lib/engine/urlCodec";
import manifest from "../../public/data/manifest.json" with { type: "json" };
import { LANGS, type Lang } from "../../src/lib/i18n";
import { ZH } from "../../src/lib/zh";
import { expect, test } from "./helpers";

// Official scheme, service and organisation names stay in English in the draft.
const NAMES = ["Pioneer Generation Disability Assistance Scheme", "Caregivers Training Catalogue", "Care Services Recommender",
  "Interim Caregiver Service", "Hospital-to-Home", "Home Caregiving Grant", "Caregivers Training Grant", "CareShield Life", "MediShield Life",
  "MediSave Care", "Functional Assessment Report", "Lasting Power of Attorney", "Advance Care Plan", "Caregiver Support Network",
  "Dementia Singapore", "Club HEAL", "Mindfull Community", "AIC Link", "Care Navigator"];

// Every English sentence the planner can show (the dictionary keys without values to fill in).
const ENGLISH = Object.keys(ZH).filter((k) => k.length >= 20 && !k.includes("{") && !NAMES.includes(k));

/** Untranslated English left on the screen: any known English sentence, and (for non-Latin scripts) any run of
 *  4 or more English words. */
async function leftoverEnglish(page: Page, lang: Lang = "zh"): Promise<string[]> {
  const text = await page.locator("main").evaluate((main) => {
    const c = main.cloneNode(true) as HTMLElement;
    // Links (source titles), places and their addresses, official terms in brackets, and the language switch are exempt.
    c.querySelectorAll("a, .contact, .svc h3 .meta, .lang, select, script").forEach((e) => e.remove());
    return c.innerText;
  });
  const verbatim = ENGLISH.filter((e) => text.includes(e));
  if (lang === "ms") return verbatim;                         // Malay uses the Latin alphabet, so only the verbatim check
  let rest = text.replace(/@ [A-Za-z][A-Za-z ]*/g, " ");      // place names, e.g. "AIC Link @ Tan Tock Seng Hospital"
  for (const n of NAMES) rest = rest.split(n).join(" ");
  return [...verbatim, ...[...rest.matchAll(/[A-Za-z][A-Za-z'’-]*(?:[ ,]+[A-Za-z][A-Za-z'’-]*){3,}/g)].map((m) => m[0])];
}
async function checkScreen(page: Page, lang: Lang = "zh") {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter((a) => a.timeline === document.timeline && a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));
  });
  await expect(page.getByText(LANGS.find((x) => x.id === lang)!.banner!)).toBeVisible();
  expect(await leftoverEnglish(page, lang)).toEqual([]);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
}
const next = (page: Page) => page.getByRole("button", { name: "下一步", exact: true }).click();

test("8.13: the whole planner in the Chinese draft, then back to English", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Language / 语言 / Bahasa / மொழி").selectOption("zh");
  await expect(page).toHaveURL(/\/zh\/$/);
  await page.getByRole("link", { name: "开始规划" }).first().click();
  await expect(page.getByRole("heading", { name: "妈妈现在在哪里？" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-SG");
  await checkScreen(page);

  await page.getByLabel("即将出院", { exact: true }).check(); await next(page);
  await page.getByLabel("洗澡或擦身", { exact: true }).check();
  await page.getByLabel("穿衣", { exact: true }).first().check();
  await checkScreen(page);
  await next(page);
  await page.getByLabel("是，平日").check(); await next(page);
  await page.getByLabel("没有", { exact: true }).check(); await next(page);       // memory
  await page.getByLabel("没有", { exact: true }).check(); await next(page);       // helper
  await page.getByLabel("我很累，需要休息").check(); await next(page);
  await page.getByLabel("邮区编号").fill("560123"); await next(page);

  await expect(page.getByRole("heading", { name: /项服务可能适合/ })).toBeVisible();
  await checkScreen(page);
  await page.getByRole("button", { name: "安排她的一周" }).click();
  await expect(page.getByRole("heading", { name: "安排她的一周" })).toBeVisible();
  await checkScreen(page);
  await page.getByRole("button", { name: "查看费用" }).click();
  await page.getByLabel("家庭人均月收入（PCHI）").selectOption("T1");
  await page.locator("label", { hasText: /^新加坡公民$/ }).click();
  await expect(page.getByText("在政府资助的机构，扣除津贴后")).toBeVisible();
  await checkScreen(page);
  await page.getByRole("button", { name: "看看该联系谁" }).click();
  await expect(page.locator(".contact").first()).toBeVisible();
  await checkScreen(page);
  await page.getByRole("button", { name: "查看她的行动计划" }).click();
  await expect(page.getByRole("heading", { name: "妈妈的护理计划" })).toBeVisible();
  await expect(page.getByText("在她出院前，联系她病房的医疗社工。")).toBeVisible();
  await checkScreen(page);

  // The language travels in the link, so a sibling opens the same Chinese plan; the switch goes back to English.
  expect(decodeHash(new URL(page.url()).hash)!.session.l).toBe("zh");
  await page.getByLabel("Language / 语言 / Bahasa / மொழி").selectOption("en");
  await expect(page.getByRole("heading", { name: "Mum's care plan" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-SG");
  expect(decodeHash(new URL(page.url()).hash)!.session.l).toBeUndefined();
});

for (const lang of ["zh", "ms", "ta"] as const) test(`8.13: every screen and branch in ${lang} (Mei, dementia, serious illness, a carer at their limit, nursing home)`, async ({ page }) => {
  const v = manifest.dataVersion;
  const mei: Session = { v, l: lang, w: "in_hospital", d: false, adl: ["bath", "dress"], al: "weekdays", mem: "no", hlp: "no", lim: "tired",
    loc: { sec: "56" }, plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }], t: "T1", r: "sc", b: "le1969", x: 3 };
  const tan: Session = { v, l: lang, w: "struggling", adl: ["bath", "dress", "toilet"], sev: ["bath", "dress", "toilet"], cond: ["eol", "stroke"],
    al: "most", mem: "dx", hlp: "yes", lim: "cant", loc: { reg: "north" }, plan: [{ s: "dementia_day_care", n: 5 }, { s: "meals_on_wheels", n: 5 }],
    t: "T0", r: "sc", b: "le1969", g: "pg", x: 2 };
  const nh: Session = { v, l: lang, w: "in_nursing_home", t: "T1", r: "sc", lim: "tired" };
  const questions = ["where", "adl", "alone", "memory", "helper", "limits", "postal"] as const;
  for (const [step, sess] of [...questions.map((q) => [q, mei] as const), ["matches", mei], ["week", mei], ["cost", mei], ["contacts", mei],
    ["action", mei], ["matches", tan], ["week", tan], ["cost", tan], ["action", tan], ["cost", nh], ["action", nh]] as const) {
    await page.goto(`/plan/${encodeHash(step, sess)}`);
    await expect(page.locator("h1").first()).toBeVisible();
    if (step === "cost") {
      for (const d of await page.locator("details").all()) await d.evaluate((e) => ((e as HTMLDetailsElement).open = true));
      const nhBtn = page.locator("button.link", { hasText: /\S/ }).filter({ hasNotText: /Not sure|不确定|Tidak pasti/ }).last();
      void nhBtn;                                                 // the nursing-home panel is checked on the nursing-home flow
    }
    if (step === "contacts") await expect(page.locator(".contact").first()).toBeVisible();
    if (step === "action") await page.locator("details.handover-box").evaluate((e) => ((e as HTMLDetailsElement).open = true));
    await expect(page.locator("html")).toHaveAttribute("lang", `${lang}-SG`);
    await checkScreen(page, lang);
  }
});

test("8.13: the Start page's menu offers each draft, and the planner's menu switches between them", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByLabel("Language / 语言 / Bahasa / மொழி");
  for (const x of LANGS) await expect(menu.locator(`option[value="${x.id}"]`)).toHaveText(x.name);
  await menu.selectOption("ms");
  await page.getByRole("link", { name: "Mula merancang" }).first().click();
  await expect(page.getByRole("heading", { name: "Di manakah Ibu sekarang?" })).toBeVisible();
  await page.getByLabel("Language / 语言 / Bahasa / மொழி").selectOption("ta");
  await expect(page.getByRole("heading", { name: "அம்மா இப்போது எங்கே இருக்கிறார்?" })).toBeVisible();
  expect(decodeHash(new URL(page.url()).hash)!.session.l).toBe("ta");
  await page.getByLabel("Language / 语言 / Bahasa / மொழி").selectOption("en");
  await expect(page.getByRole("heading", { name: "Where is Mum right now?" })).toBeVisible();
});

test("the site banner and footer follow the plan's language, and go back to English on the other pages", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  await page.goto(`/plan/${encodeHash("where", { v: manifest.dataVersion, l: "ms" } as Session)}`);
  await expect(page.locator(".proto")).toHaveText(/^Prototaip untuk ujian/);
  await expect(page.locator(".ft")).toContainText("Kecemasan perubatan: 995");
  await expect(page.locator(".ft")).toContainText("1800-650-6060");
  await page.locator(".ft").getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator(".proto")).toHaveText(/^Prototype for testing/);
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("en-SG");
});

for (const lang of ["zh", "ms", "ta"] as const) {
  test(`the Start page in the ${lang} draft: labelled, no English left, axe clean`, async ({ page }, info) => {
    test.skip(info.project.name === "firefox", "checked in the other browsers");
    await page.goto(`/${lang}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", LANGS.find((x) => x.id === lang)!.html);
    await expect(page.locator(".proto")).not.toHaveText(/^Prototype/);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await checkScreen(page, lang);
    await page.getByLabel("Language / 语言 / Bahasa / மொழி").selectOption("en");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Plan care for someone you look after");
  });
}

test("9.14: the Chinese and Tamil drafts name their own fonts, with no Latin serif in headings", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "checked once");
  for (const [lang, font] of [["zh", "PingFang SC"], ["ta", "Noto Sans Tamil"]] as const) {
    for (const url of [`/${lang}/`, `/plan/${encodeHash("where", { v: manifest.dataVersion, l: lang } as Session)}`]) {
      await page.goto(url);
      await expect(page.locator("html")).toHaveAttribute("lang", `${lang}-SG`);
      const h1 = await page.locator("h1").first().evaluate((e) => getComputedStyle(e).fontFamily);
      expect(h1, url).toContain(font);
      expect(h1, url).not.toContain("Charter");
    }
  }
});
