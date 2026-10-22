#!/usr/bin/env node
// Kopplar en Neon-databas till prototypen: lägger adressen som DATABASE_URL på
// Vercel (produktion, förhandsvisning och lokalt) och hämtar den till .env.local.
//
//   printf '%s' "postgresql://..." | npm run db:connect
//
// Adressen läses från stdin, så att den inte hamnar i kommandoraden, i koden
// eller i git. Använd den poolade adressen (värdnamnet innehåller "-pooler").
// Vercel är källan: `npm run env` och `npm run dev` skriver över .env.local
// med det som ligger där, så en adress som bara finns lokalt försvinner.

import { readFileSync } from "node:fs";
import { linkedProject, say, step, vercel, vercelExec } from "./lib/util.mjs";

if (process.stdin.isTTY) {
  say("Skicka databasens adress via stdin:");
  say(`  printf '%s' "postgresql://..." | npm run db:connect`);
  process.exit(2);
}

const url = readFileSync(0, "utf8").trim();
if (!/^postgres(ql)?:\/\/\S+$/.test(url)) {
  say("Det där ser inte ut som en Postgres-adress (postgresql://...). Inget ändrades.");
  process.exit(1);
}
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
})();
if (!host.includes("-pooler")) {
  say("Obs: adressen är inte poolad. På Vercel fungerar den poolade (-pooler i värdnamnet) bäst.");
}

if (!linkedProject()) {
  say("Prototypen är inte kopplad till Vercel än. Kör npm run vercel:link och sedan det här igen.");
  process.exit(2);
}

step("Lägger DATABASE_URL på Vercel");
// Känsliga variabler går inte att använda lokalt, så utvecklingsmiljön får en vanlig.
// --yes: förhandsvisningen ska gälla alla brancher, utan att CLI:n frågar efter en.
for (const [environment, extra] of [
  ["production,preview", []],
  ["development", ["--no-sensitive"]],
]) {
  const out = vercel(["env", "add", "DATABASE_URL", "--environment", environment, "--force", "--yes", ...extra], { input: url });
  if (out === null) {
    say(`Kunde inte lägga DATABASE_URL i ${environment}. Kör npx vercel@latest whoami för att se om du är inloggad.`);
    process.exit(1);
  }
  say(`  ${environment}: ok`);
}

step("Hämtar nycklarna till .env.local");
if (!vercelExec(["env", "pull", ".env.local", "--yes"])) process.exit(1);
say("\nKlart. Databasen finns nu lokalt och på Vercel. Nästa publicering använder den.");
