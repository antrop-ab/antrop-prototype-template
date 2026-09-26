#!/usr/bin/env node
// Renderar en videokomposition till MP4 med musik och ljudeffekter.
//
//   npm run video -- video/promo                 full kvalitet (60 bilder/s)
//   npm run video -- video/promo --draft         snabbt utkast (30 bilder/s, lägre kvalitet)
//   npm run video -- video/promo --still 12.5    en bild vid 12,5 s (för att granska)
//   npm run video -- video/promo --from 10 --to 20   bara en del
//   npm run video -- video/promo --audio         bara ljudet (WAV)
//   npm run video -- video/promo --serve         förhandsvisa i webbläsaren (spela och skrubba)
//
// Kompositionen är video/<namn>/index.html och använder scripts/video/timeline.js.
// Resultatet hamnar i video/<namn>/out/. Kräver ffmpeg (Homebrew: brew install ffmpeg,
// annars npm install -D ffmpeg-static).

import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { renderSoundtrack } from "./audio.mjs";
import { writeWav } from "./dsp.mjs";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const dir = resolve(argv.find((a) => !a.startsWith("--") && !/^\d/.test(a)) ?? "video/promo");
const html = join(dir, "index.html");
if (!existsSync(html)) {
  console.error(`Hittar ingen komposition: ${html}`);
  process.exit(1);
}

const draft = flag("draft");
const fps = Number(opt("fps") ?? (draft ? 30 : 60));
const outDir = join(dir, "out");
mkdirSync(outDir, { recursive: true });

const require = createRequire(join(process.cwd(), "package.json"));
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright saknas. Kör: npm install -D playwright");
  process.exit(1);
}

function findFfmpeg() {
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return "ffmpeg";
  try {
    return require("ffmpeg-static");
  } catch {
    console.error("ffmpeg saknas. Installera med `brew install ffmpeg`, eller `npm install -D ffmpeg-static`.");
    process.exit(1);
  }
}

// Kompositionen serveras över http, så att typsnitt, bilder och video laddas som på en webbplats.
const root = process.cwd();
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".otf": "font/otf", ".ttf": "font/ttf", ".mp4": "video/mp4", ".webm": "video/webm", ".json": "application/json" };
const server = createServer((req, res) => {
  const path = resolve(root, `.${decodeURIComponent(new URL(req.url, "http://x").pathname)}`);
  if (!path.startsWith(root + sep) || !existsSync(path) || statSync(path).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[extname(path).toLowerCase()] ?? "application/octet-stream", "access-control-allow-origin": "*" });
  createReadStream(path).pipe(res);
});
await new Promise((r) => server.listen(Number(opt("port") ?? 0), "127.0.0.1", r));
const pageUrl = `http://127.0.0.1:${server.address().port}/${relative(root, html).split(sep).join("/")}`;

if (flag("serve")) {
  console.log(`Förhandsvisning: ${pageUrl}  (Ctrl+C för att stänga)`);
  await new Promise(() => {});
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("Fel i kompositionen:", e.message));
await page.goto(`${pageUrl}?render`);
await page.waitForFunction(() => window.__video?.ready, null, { timeout: 60_000 });
const meta = await page.evaluate(() => ({
  duration: window.__video.duration,
  music: window.__video.music,
  cues: window.__video.cues,
  width: window.__video.width,
  height: window.__video.height,
}));
if (meta.width !== 1920 || meta.height !== 1080) await page.setViewportSize({ width: meta.width, height: meta.height });

// En stillbild.
if (opt("still") !== undefined) {
  const t = Number(opt("still"));
  await page.evaluate((t) => window.__video.seek(t), t);
  await page.waitForTimeout(50);
  const file = join(outDir, `still-${t.toFixed(2)}.png`);
  await page.locator(".stage").screenshot({ path: file });
  console.log(file);
  await browser.close();
  server.close();
  process.exit(0);
}

// Ljudet.
const wav = join(outDir, "soundtrack.wav");
const t0 = Date.now();
writeWav(wav, renderSoundtrack({ duration: meta.duration, music: meta.music, cues: meta.cues }), writeFileSync);
console.log(`Ljud klart (${meta.cues.length} ljudeffekter, ${((Date.now() - t0) / 1000).toFixed(1)} s): ${wav}`);
if (flag("audio")) {
  await browser.close();
  server.close();
  process.exit(0);
}

// Bilderna, direkt in i ffmpeg.
const from = Number(opt("from") ?? 0);
const to = Math.min(Number(opt("to") ?? meta.duration), meta.duration);
const frames = Math.round((to - from) * fps);
const name = opt("out") ?? (draft ? "utkast.mp4" : "video.mp4");
const out = join(outDir, name);
const ffmpeg = spawn(findFfmpeg(), [
  "-y", "-hide_banner", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  "-ss", String(from), "-t", String(to - from), "-i", wav,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-preset", draft ? "veryfast" : "slow", "-crf", draft ? "24" : "16",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "256k", "-shortest",
  out,
], { stdio: ["pipe", "inherit", "inherit"] });

const stage = page.locator(".stage");
const started = Date.now();
for (let i = 0; i < frames; i++) {
  const t = from + i / fps;
  await page.evaluate((t) => window.__video.seek(t), t);
  const jpg = await stage.screenshot({ type: "jpeg", quality: draft ? 85 : 95 });
  if (!ffmpeg.stdin.write(jpg)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  if (i % fps === 0) {
    const pct = ((i / frames) * 100).toFixed(0);
    const eta = i ? (((Date.now() - started) / i) * (frames - i)) / 1000 : 0;
    process.stdout.write(`\rRenderar ${pct} % (${(t).toFixed(0)} av ${to.toFixed(0)} s, cirka ${Math.round(eta)} s kvar)   `);
  }
}
ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on("close", r));
await browser.close();
server.close();
console.log(`\nKlart: ${out}`);
