#!/usr/bin/env node
// Installerar allt en ny prototyp behöver, och hämtar senaste versionen av
// shadcn-komponenterna, AI Elements och skills innan du börjar bygga.
//
//   npm run setup
//
// Första gången i en ny prototyp (package.json heter fortfarande som mallen)
// uppdateras allt till senaste, även nya major-versioner, och prototypen får
// mappens namn. Senare körningar, och kollegor som klonar prototypen, får den
// säkra varianten: anpassade komponenter lämnas i fred.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { exec, readJson, say, step } from "./lib/util.mjs";

const TEMPLATE_NAME = "antrop-prototype-template";
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const inTemplateRepo = readJson("mall.config.json", {}).templateRepo?.endsWith(`/${basename(process.cwd())}`);
const first = process.argv.includes("--fresh") || (pkg.name === TEMPLATE_NAME && !inTemplateRepo);
// Fanns skills redan är de laddade i en chatt som startades här, och då behövs ingen omstart.
const hadSkills = existsSync(".claude/skills/shadcn") && existsSync(".claude/skills/impeccable");

if (first && pkg.name === TEMPLATE_NAME && !inTemplateRepo) {
  const name = basename(process.cwd()).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "prototyp";
  writeFileSync("package.json", `${JSON.stringify({ ...pkg, name }, null, 2)}\n`);
  say(`Ny prototyp: ${name}`);
}

step("Kollar datorn");
if (!exec("node", ["scripts/doctor.mjs", "--pre-install"])) {
  say("\nFixa det som saknas först (Claude kan hjälpa till), och kör sedan npm run setup igen.");
  process.exit(1);
}

step("Installerar paket");
if (!exec("npm", ["install", "--no-fund", "--no-audit"])) process.exit(1);

step(first ? "Hämtar senaste versionen av allt" : "Uppdaterar");
exec("node", ["scripts/update.mjs", ...(first ? ["--fresh"] : [])]);

step("Kontrollerar installationen");
const ok = exec("node", ["scripts/doctor.mjs", "--deps-only"]);

const state = readJson(".mall-state.json", {});
writeFileSync(
  ".mall-state.json",
  `${JSON.stringify({ ...state, createdAt: state.createdAt ?? new Date().toISOString(), lastUpdate: new Date().toISOString() }, null, 2)}\n`,
);

say(
  !ok
    ? "\nNågot blev inte helt rätt (se ovan). Be Claude om hjälp."
    : hadSkills
      ? "\nKlart. Skills fanns redan, så en chatt som startades i den här mappen kan fortsätta direkt utan omstart."
      : "\nKlart. VIKTIGT: starta en ny chatt i Claude i den här mappen, så att skills och MCP-servrar laddas.",
);
process.exit(ok ? 0 : 1);
