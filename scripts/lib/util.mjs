// Gemensamma hjälpfunktioner för mallens skript.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

export const isWin = process.platform === "win32";

export const config = JSON.parse(readFileSync(new URL("../../mall.config.json", import.meta.url), "utf8"));

/** Kör ett kommando och returnerar utskriften, eller null om det misslyckas. */
export function run(cmd, args, { timeout = 60_000, env, cwd } = {}) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout,
      shell: isWin,
      env: env ?? process.env,
      cwd,
    }).trim();
  } catch (error) {
    const text = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    return error.status === 0 ? text : null;
  }
}

/** Kör ett kommando med utskriften direkt i terminalen. Returnerar true om det gick bra. */
export function exec(cmd, args, { env, cwd, input = "ignore" } = {}) {
  const result = spawnSync(cmd, args, { stdio: [input, "inherit", "inherit"], shell: isWin, env: env ?? process.env, cwd });
  return result.status === 0;
}

/** Miljö utan GitHub-inställningar som kan peka fel (till exempel en gammal GH_TOKEN). */
export function cleanGhEnv() {
  const { GH_HOST: _h, GH_TOKEN: _t, GITHUB_TOKEN: _g, GH_ENTERPRISE_TOKEN: _e, ...env } = process.env;
  return env;
}

export const vercel = (args, opts) => run("npx", ["-y", "vercel@latest", ...args], { timeout: 180_000, ...opts });
export const vercelExec = (args, opts) => exec("npx", ["-y", "vercel@latest", ...args], opts);

export function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export const linkedProject = () => (existsSync(".vercel/project.json") ? readJson(".vercel/project.json") : null);

export function repoSlug() {
  const url = run("git", ["remote", "get-url", "origin"]);
  const m = url && /github\.com[:/]([^/]+)\/(.+?)(\.git)?$/.exec(url);
  return m ? `${m[1]}/${m[2]}` : null;
}

export const say = (text = "") => console.log(text);
export const step = (text) => console.log(`\n==> ${text}`);
