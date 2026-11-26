// 9.5 (guards N2): the JavaScript each page loads up front, gzipped, from the static export in out/. Fails the build
// when a page goes over its budget. Chunks loaded later (the 3D home, places and contacts) aren't counted.
// Budget: the Next.js and React baseline (about 173 KB) plus about 50 KB of our code and data (Stage 5 decision).
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_KB = { "/": 190, "/plan/": 225 };
let failed = false;
for (const [page, budget] of Object.entries(BUDGET_KB)) {
  const html = readFileSync(`out${page}index.html`, "utf8");
  const srcs = [...new Set([...html.matchAll(/<script[^>]+src="(\/_next\/[^"]+\.js)"/g)].map((m) => m[1]))];
  const kb = srcs.reduce((sum, s) => sum + gzipSync(readFileSync(`out${s}`)).length, 0) / 1024;
  const ok = kb <= budget;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "OVER"} ${page.padEnd(7)} ${kb.toFixed(1)} KB gzipped of ${budget} KB (${srcs.length} scripts)`);
}
process.exit(failed ? 1 : 0);
