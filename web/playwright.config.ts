// Stage 6 end-to-end tests against the static build (web/out), at phone and desktop sizes. Run `npm run build` first.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;
// E2E_BASE_URL=https://… runs the same checks against a deployed site instead of the local build.
const LIVE = process.env.E2E_BASE_URL;
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.e2e.ts",            // .e2e.ts so Vitest's default *.test/*.spec pattern skips these
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: LIVE ?? `http://127.0.0.1:${PORT}`, browserName: "chromium",
    // In CI, keep a trace and screenshot of each failure; the workflow uploads them (test-results/).
    trace: process.env.CI ? "retain-on-failure" : "off", screenshot: process.env.CI ? "only-on-failure" : "off",
  },
  projects: [
    { name: "phone", use: { viewport: { width: 375, height: 812 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    // Safari's engine on an iPhone-sized touch screen, and Firefox: the browsers families use besides Chrome.
    { name: "iphone", use: { ...devices["iPhone 14"], browserName: "webkit" } },
    { name: "firefox", use: { browserName: "firefox", viewport: { width: 1280, height: 800 } } },
  ],
  webServer: LIVE ? undefined : {
    command: `node tests/e2e/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
