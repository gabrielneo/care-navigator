// 9.13: once opened, a plan reopens with no signal, and nothing she answered is kept in the cache.
import { encodeHash } from "../../src/lib/engine/urlCodec";
import { expect, MEI, test } from "./helpers";

test("a plan opened once reopens offline, and the cache holds no answers", async ({ page, context, browserName }, info) => {
  test.skip(info.project.name !== "desktop" || browserName !== "chromium", "service workers checked once, in Chromium");
  const link = `/plan/${encodeHash("action", MEI)}`;
  await page.goto(link);
  await expect(page.getByText(/AIC Link @/).first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-offline-ready", "", { timeout: 10_000 });
  // Saving files must settle: a loop (save → fetch → observed → save) once kept the CPU busy forever.
  const loaded = () => page.evaluate(() => performance.getEntriesByType("resource").length);
  const before = await loaded();
  await page.waitForTimeout(1500);
  expect(await loaded() - before).toBeLessThan(3);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mum's care plan");
  await expect(page.getByText(/AIC Link @/).first()).toBeVisible();      // nearby places came from the cache too
  const keys = await page.evaluate(async () => (await (await caches.open("care-navigator-v1")).keys()).map((r) => r.url));
  expect(keys.length).toBeGreaterThan(5);
  expect(keys.filter((u) => u.includes("#") || u.includes("p=") || u.includes("5601"))).toEqual([]);
  await context.setOffline(false);
});
