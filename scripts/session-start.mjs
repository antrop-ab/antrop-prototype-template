#!/usr/bin/env node
// Körs av Claude Code när en session startar (.claude/settings.json).
// Skriver korta statusrader som Claude ser, så att den vet om något behöver
// göras innan ni börjar. Ändrar ingenting, går snabbt och misslyckas aldrig.

import { existsSync, readFileSync, statSync } from "node:fs";

const notes = [];
const state = (() => {
  try {
    return JSON.parse(readFileSync(".mall-state.json", "utf8"));
  } catch {
    return {};
  }
})();

try {
  if (!existsSync("node_modules")) {
    notes.push("Paketen är inte installerade: kör `npm run setup` (det hämtar också senaste shadcn-komponenterna och skills).");
  } else {
    const days = state.lastUpdate ? (Date.now() - Date.parse(state.lastUpdate)) / 86_400_000 : Infinity;
    if (days > 7) notes.push("Mer än en vecka sedan senaste uppdateringen: föreslå `npm run update` (säkert, rör inte anpassade komponenter).");
  }
  if (!existsSync(".claude/skills/shadcn") || !existsSync(".claude/skills/impeccable")) {
    notes.push("Skills saknas: kör `npm run update -- --skills` och be sedan designern starta en ny chatt i mappen.");
  }
  const pkgName = JSON.parse(readFileSync("package.json", "utf8")).name;
  if (pkgName === "antrop-prototype-template" && !/antrop-prototype-template$/.test(process.cwd())) {
    notes.push("Det här är en ny prototyp som inte har körts med `npm run setup` än. Kör det först (det hämtar senaste komponenterna och ger prototypen ett eget namn).");
  }
  if (!existsSync(".vercel/project.json")) {
    notes.push("Inte kopplad till Vercel än. Det görs första gången prototypen publiceras (`npm run ship`).");
  } else if (!existsSync(".env.local") || Date.now() - statSync(".env.local").mtimeMs > 12 * 3_600_000) {
    notes.push("Nycklarna i .env.local kan vara gamla. `npm run dev` hämtar nya automatiskt, eller kör `npm run env`.");
  }
  const feedback = existsSync("feedback-till-mallen.md") ? readFileSync("feedback-till-mallen.md", "utf8") : "";
  const pending = feedback.split("<!-- nya punkter under den här raden -->")[1]?.split("\n## Skickat\n")[0]?.trim();
  if (pending) notes.push("Det finns oskickad feedback i feedback-till-mallen.md. Påminn om `npm run feedback -- --send` när ni avslutar.");
  notes.push("Skriv ned allt som krånglar med mallen i feedback-till-mallen.md medan ni jobbar (se CLAUDE.md).");
} catch (error) {
  notes.push(`Statuskollen misslyckades: ${error.message}`);
}

console.log(notes.map((n) => `[Antrop-mall] ${n}`).join("\n"));
