#!/usr/bin/env node
// Kopplar prototypen till ett projekt på Vercel, kopplar GitHub-repot så att
// varje push publiceras, och hämtar nycklarna till .env.local.
//
//   npm run vercel:link
//
// Kräver att du är inloggad på Vercel (npx vercel login). Teamet på Vercel
// styrs av "vercelScope" i mall.config.json (null = ditt eget konto).

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { config, linkedProject, repoSlug, say, step, vercel, vercelExec } from "./lib/util.mjs";

const scope = config.vercelScope ? ["--scope", config.vercelScope] : [];

step("Inloggning på Vercel");
const who = vercel(["whoami"]);
if (!who) {
  say("Du är inte inloggad på Vercel. Kör det här i Terminal och godkänn i webbläsaren:");
  say("  npx vercel login");
  say("Kör sedan npm run vercel:link igen.");
  process.exit(2);
}
say(`Inloggad som ${who.split("\n").pop()}`);

step("Vercel-projekt");
if (linkedProject()) {
  say(`Redan kopplad till ${linkedProject().projectName}.`);
} else {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const name = (pkg.name && pkg.name !== "antrop-prototype-template" ? pkg.name : basename(process.cwd()))
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  // Finns projektet inte skapas det först.
  const linked =
    vercelExec(["link", "--yes", "--project", name, ...scope]) ||
    (vercelExec(["project", "add", name, ...scope]) && vercelExec(["link", "--yes", "--project", name, ...scope]));
  if (!linked) {
    say("Kopplingen misslyckades. Se felet ovan.");
    process.exit(1);
  }
}

step("GitHub-koppling");
const slug = repoSlug();
if (!slug) {
  say("Inget GitHub-repo än. npm run ship skapar det och kopplar sedan.");
} else {
  const out = vercel(["git", "connect", `https://github.com/${slug}`, "--yes", ...scope]);
  if (out !== null) say(`Varje push till ${slug} publiceras nu automatiskt.`);
  else
    say(
      "Kunde inte koppla GitHub-repot automatiskt. npm run ship publicerar ändå direkt via Vercel.\n" +
        "Vill du att varje push publiceras: installera Vercels GitHub-app för organisationen (se docs/kom-igang.md).",
    );
}

step("Nycklar");
vercelExec(["env", "pull", ".env.local", "--yes"]);
say("\nKlart. AI-funktioner fungerar både lokalt och på Vercel.");
