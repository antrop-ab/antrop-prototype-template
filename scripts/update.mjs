#!/usr/bin/env node
// Håller prototypen på senaste versionen: npm-paket, shadcn-komponenter och skills.
//
//   npm run update            säkra uppdateringar (inga nya major-versioner av paket)
//   npm run update -- --fresh allt till senaste, även major (körs när en ny prototyp skapas)
//   npm run update -- --check visa bara vad som är inaktuellt
//
// Komponenter i components/ui och components/ai-elements skrivs bara över om de
// inte har ändrats för hand sedan de hämtades (se .shadcn-lock.json). En komponent
// du har anpassat lämnas i fred och listas, så att du kan välja själv.
//
// Tål att vara offline: då hoppas stegen över med en varning.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { config, exec, run, say, step } from "./lib/util.mjs";

const argv = process.argv.slice(2);
const fresh = argv.includes("--fresh");
const checkOnly = argv.includes("--check");
const only = argv.find((a) => ["--packages", "--components", "--skills"].includes(a));
const LOCK = ".shadcn-lock.json";

// Paket som uppdateras. Allt annat i package.json följer med som beroenden.
const TRACKED = [
  "next",
  "eslint-config-next",
  "react",
  "react-dom",
  "shadcn",
  "radix-ui",
  "lucide-react",
  "tailwindcss",
  "@tailwindcss/postcss",
  "tw-animate-css",
  "ai",
  "@ai-sdk/react",
  "streamdown",
  "motion",
  "zod",
  "next-themes",
  "sonner",
  "vaul",
];

const summary = [];

if (!only || only === "--packages") updatePackages();
if (!only || only === "--components") updateComponents();
if (!only || only === "--skills") updateSkills();

if (!checkOnly) {
  const state = (() => {
    try {
      return JSON.parse(readFileSync(".mall-state.json", "utf8"));
    } catch {
      return {};
    }
  })();
  writeFileSync(".mall-state.json", `${JSON.stringify({ ...state, lastUpdate: new Date().toISOString() }, null, 2)}\n`);
}

say(`\n${summary.length ? summary.map((s) => `- ${s}`).join("\n") : "Inget att uppdatera."}`);
if (!checkOnly && summary.some((s) => s.startsWith("Skills"))) {
  say("\nNya eller uppdaterade skills laddas när Claude startas om i den här mappen (ny chatt).");
}

// ---------------------------------------------------------------------------

function updatePackages() {
  step("npm-paket");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const names = TRACKED.filter((n) => n in deps);
  const out = run("npm", ["outdated", "--json", ...names], { timeout: 120_000 }) ?? "";
  let outdated = {};
  try {
    outdated = JSON.parse(out || "{}");
  } catch {
    say("Kunde inte nå npm-registret. Hoppar över paketen.");
    return;
  }
  const major = (v) => Number(String(v ?? "0").split(".")[0]);
  const install = [];
  const held = [];
  for (const [name, info] of Object.entries(outdated)) {
    if (!info.latest || info.current === info.latest) continue;
    if (fresh || major(info.current) === major(info.latest)) install.push(`${name}@${info.latest}`);
    else held.push(`${name} ${info.current} -> ${info.latest}`);
  }
  // next och eslint-config-next ska alltid ha samma version.
  const next = install.find((p) => p.startsWith("next@"));
  if (next && "eslint-config-next" in deps && !install.some((p) => p.startsWith("eslint-config-next@"))) {
    install.push(`eslint-config-next@${next.split("@")[1]}`);
  }
  if (install.length === 0) say("Alla paket är på senaste versionen.");
  else say(`Nyare versioner: ${install.join(", ")}`);
  if (held.length) say(`Nya major-versioner (uppdateras inte automatiskt, kör med --fresh):\n  ${held.join("\n  ")}`);
  if (checkOnly || install.length === 0) {
    if (install.length) summary.push(`Paket: ${install.length} kan uppdateras`);
    return;
  }
  if (exec("npm", ["install", "--no-fund", "--no-audit", ...install])) summary.push(`Paket: ${install.join(", ")}`);
  else summary.push("Paket: uppdateringen misslyckades, se utskriften ovan");
}

function updateComponents() {
  step("shadcn-komponenter");
  const lock = readLock();
  const dirs = [
    { dir: "components/ui", item: (n) => n },
    { dir: "components/ai-elements", item: (n) => `@ai-elements/${n}` },
  ];
  const items = [];
  const edited = [];
  for (const { dir, item } of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
      const path = `${dir}/${file}`;
      const hash = sha(path);
      if (lock[path] && lock[path] !== hash) edited.push(path);
      else items.push({ path, name: item(file.replace(/\.tsx$/, "")) });
    }
  }
  if (edited.length) {
    say(`Ändrade för hand, lämnas orörda (${edited.length}):\n  ${edited.join("\n  ")}`);
    say("  Vill du ändå hämta senaste versionen av en: npx shadcn@latest add <namn> --overwrite");
  }
  if (checkOnly) {
    say(`${items.length} komponenter hämtas på nytt vid npm run update.`);
    return;
  }
  if (items.length === 0) return;
  say(`Hämtar senaste versionen av ${items.length} komponenter från shadcn och AI Elements...`);
  // En i taget vid fel, så att en komponent som tagits bort i registret inte stoppar resten.
  const names = items.map((i) => i.name);
  let ok = exec("npx", ["-y", "shadcn@latest", "add", ...names, "--overwrite", "--yes"]);
  if (!ok) {
    say("Hela listan gick inte igenom. Försöker en i taget.");
    ok = names.map((n) => exec("npx", ["-y", "shadcn@latest", "add", n, "--overwrite", "--yes"])).some(Boolean);
  }
  // Svenska standardtexter, och temat tillbaka (shadcn kan skriva om färgvariabler).
  exec("node", ["scripts/translate-components.mjs"]);
  exec("node", ["scripts/theme.mjs", "--apply"]);
  const next = { ...lock };
  for (const { path } of items) if (existsSync(path)) next[path] = sha(path);
  writeFileSync(LOCK, `${JSON.stringify(sortKeys(next), null, 2)}\n`);
  summary.push(ok ? `Komponenter: ${items.length} hämtade på nytt` : "Komponenter: hämtningen misslyckades, se utskriften ovan");
}

function updateSkills() {
  step("Skills");
  if (checkOnly) {
    say(`Installeras från: ${config.skills.map((s) => s.source.replace("https://github.com/", "")).join(", ")}`);
    return;
  }
  // Skills är publika. Ta bort GitHub-inställningar som kan peka fel.
  const { GH_HOST: _h, GH_TOKEN: _t, GITHUB_TOKEN: _g, ...env } = process.env;
  let failed = 0;
  for (const s of config.skills) {
    const skills = [s.skill].flat().filter(Boolean).flatMap((name) => ["--skill", name]);
    say(`\n${s.source.replace("https://github.com/", "")}: ${s.why}`);
    const ok = exec("npx", ["-y", "skills@latest", "add", s.source, ...skills, "-a", "claude-code", "-y"], { env });
    if (!ok) failed++;
  }
  summary.push(
    failed
      ? `Skills: ${failed} av ${config.skills.length} källor misslyckades (offline?). Kör npm run update -- --skills igen.`
      : `Skills: ${config.skills.length} källor uppdaterade`,
  );
}

function readLock() {
  try {
    return JSON.parse(readFileSync(LOCK, "utf8"));
  } catch {
    return {};
  }
}

function sha(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16);
}

function sortKeys(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}
