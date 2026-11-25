// Serves web/out like Vercel does (dir/ → dir/index.html, unknown → 404.html, headers from vercel.json), so the
// tests run under the real security headers. Python's http.server stalls under parallel browsers.
import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const ROOT = new URL("../../out", import.meta.url).pathname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain",
  ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const RULES = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8")).headers
  .map((r) => ({ match: new RegExp(`^${r.source}$`), headers: Object.fromEntries(r.headers.map((h) => [h.key, h.value])) }));
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, path.endsWith("/") ? `${path}index.html` : path);
  let status = 200;
  if (!isFile(file)) { file = join(ROOT, "404.html"); status = 404; }
  const extra = Object.assign({}, ...RULES.filter((r) => r.match.test(path)).map((r) => r.headers));
  res.writeHead(status, { ...extra, "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(Number(process.argv[2] ?? 4174), "127.0.0.1");
