// Builds the fixture bundle with esbuild, then serves the fixtures directory so
// Playwright can drive the real controllers against real Choices.js / flatpickr.
import { build } from "esbuild";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "fixtures");
const port = 4173;

await build({
  entryPoints: [join(fixtures, "app.js")],
  bundle: true,
  format: "esm",
  outdir: join(fixtures, "dist"),
});

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

http
  .createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(req.url.split("?")[0]);
      if (path === "/") path = "/index.html";
      const file = normalize(join(fixtures, path));
      if (!file.startsWith(fixtures)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        "content-type":
          contentTypes[extname(file)] || "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`fixture server listening on http://127.0.0.1:${port}`);
  });
