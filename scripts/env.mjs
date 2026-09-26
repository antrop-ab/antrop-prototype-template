#!/usr/bin/env node
// Hämtar prototypens miljövariabler (nycklar) från Vercel till .env.local.
//
//   npm run env           hämta nu
//   node scripts/env.mjs --quiet   körs av `npm run dev`: hämtar bara om det behövs och tyst
//
// AI-funktionerna går via Vercel AI Gateway. På Vercel fungerar de utan nycklar.
// Lokalt behövs en kortlivad token (VERCEL_OIDC_TOKEN, giltig i 12 timmar) som
// hämtas härifrån. Nycklar från integrationer (till exempel en databas via
// Vercel Marketplace) följer med på samma sätt. Lägg aldrig nycklar i koden.

import { existsSync, readFileSync, statSync } from "node:fs";
import { linkedProject, vercel, vercelExec } from "./lib/util.mjs";

const quiet = process.argv.includes("--quiet");
const project = linkedProject();

if (!project) {
  if (!quiet) console.log("Prototypen är inte kopplad till Vercel än. Kör: npm run vercel:link");
  process.exit(0);
}

if (quiet) {
  const file = ".env.local";
  const fresh =
    existsSync(file) &&
    /VERCEL_OIDC_TOKEN|AI_GATEWAY_API_KEY/.test(readFileSync(file, "utf8")) &&
    Date.now() - statSync(file).mtimeMs < 10 * 60 * 60 * 1000;
  if (fresh) process.exit(0);
  const out = vercel(["env", "pull", ".env.local", "--yes"], { timeout: 60_000 });
  console.log(out ? "Hämtade nycklar från Vercel till .env.local." : "Kunde inte hämta nycklar från Vercel (offline eller utloggad). AI-funktioner kan saknas lokalt.");
  process.exit(0);
}

process.exit(vercelExec(["env", "pull", ".env.local", "--yes"]) ? 0 : 1);
