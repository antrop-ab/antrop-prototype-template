#!/usr/bin/env node
// Publicerar prototypen: kontrollerar koden, sparar (commit), laddar upp till
// GitHub (push) och väntar in Vercel. Skriver ut länken att dela.
//
//   npm run ship
//   npm run ship -- "Lägg till betalsidan"      eget meddelande för sparpunkten
//   npm run ship -- --no-check                  hoppa över typkontrollen
//   npm run ship -- --template                  bara för mallens förvaltare: publicera mallen själv
//
// Första gången skapas ett privat repo på GitHub (i organisationen i
// mall.config.json om du är medlem) och ett projekt på Vercel.
// Står du på en annan branch än main blir det en förhandsvisning med egen länk.

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { cleanGhEnv, config, exec, linkedProject, repoSlug, run, say, step, vercel } from "./lib/util.mjs";

const argv = process.argv.slice(2);
const message = argv.find((a) => !a.startsWith("--")) ?? "Uppdatera prototypen";
const env = cleanGhEnv();
const gh = (args, opts) => run("gh", args, { env, ...opts });

// 1. Kontroll ------------------------------------------------------------------
if (!argv.includes("--no-check")) {
  step("Kontrollerar koden");
  if (!exec("npx", ["tsc", "--noEmit"])) {
    say("\nKoden har fel (se ovan). Rätta dem först, annars misslyckas bygget på Vercel.");
    process.exit(1);
  }
  say("Inga fel.");
}

// 2. Spara ---------------------------------------------------------------------
step("Sparar");
if (!run("git", ["rev-parse", "--is-inside-work-tree"])) exec("git", ["init", "-q", "-b", "main"]);
exec("git", ["add", "-A"]);
const staged = run("git", ["diff", "--cached", "--name-only"]);
if (staged) {
  exec("git", ["commit", "-q", "-m", message]);
  say(`Sparpunkt: ${message}`);
} else {
  say("Inga nya ändringar att spara.");
}
const branch = run("git", ["branch", "--show-current"]) || "main";
const sha = run("git", ["rev-parse", "HEAD"]);

// 3. GitHub --------------------------------------------------------------------
step("Laddar upp till GitHub");
let slug = repoSlug();
// En prototyp som klonats direkt från mallen pekar på mallens repo. Publicera aldrig dit.
if (slug === config.templateRepo && !argv.includes("--template")) {
  say(`Prototypen pekar på mallens repo (${slug}). Skapar ett eget repo i stället.`);
  exec("git", ["remote", "remove", "origin"]);
  slug = null;
}
if (!gh(["auth", "status", "--hostname", "github.com"])) {
  say("Du är inte inloggad på GitHub. Kör: gh auth login --hostname github.com --git-protocol https --web");
  process.exit(2);
}
if (!slug) {
  const login = gh(["api", "user", "--jq", ".login"]);
  const member = gh(["api", `user/memberships/orgs/${config.githubOwner}`, "--jq", ".state"]) === "active";
  const owner = member ? config.githubOwner : login;
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const name = (pkg.name && pkg.name !== "antrop-prototype-template" ? pkg.name : basename(process.cwd())).toLowerCase();
  say(`Skapar det privata repot ${owner}/${name}`);
  if (!exec("gh", ["repo", "create", `${owner}/${name}`, "--private", "--source", ".", "--remote", "origin", "--push"], { env })) {
    say("Kunde inte skapa repot. Finns det redan ett med samma namn? Byt namn i package.json och försök igen.");
    process.exit(1);
  }
  slug = `${owner}/${name}`;
} else if (!exec("git", ["push", "-u", "origin", branch])) {
  say("Uppladdningen misslyckades. Har någon annan pushat? Kör git pull och försök igen.");
  process.exit(1);
}
say(`https://github.com/${slug}`);

// 4. Vercel --------------------------------------------------------------------
step("Publicerar på Vercel");
if (!linkedProject()) {
  if (!exec("node", ["scripts/vercel-link.mjs"])) process.exit(2);
}

const url = (await waitForGitDeployment()) ?? deployDirectly();
if (!url) {
  say("Publiceringen misslyckades. Be Claude titta på loggen: npx vercel logs eller vercel.com.");
  process.exit(1);
}
const alias = branch === "main" ? productionAlias(url) : null;
say(`\nKlart! ${branch === "main" ? "Länken att dela" : "Förhandsvisning av branchen"}:\n  ${alias ?? url}`);
if (alias) say(`(Den här versionen: ${url})`);

// ---------------------------------------------------------------------------

/** Vercel bygger själv vid push om GitHub-kopplingen finns. Vänta in resultatet. */
async function waitForGitDeployment() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let deployment = null;
  for (let i = 0; i < 8 && !deployment; i++) {
    await sleep(3000);
    const list = gh(["api", `repos/${slug}/deployments?sha=${sha}`, "--jq", "[.[] | {id, creator: .creator.login}]"]);
    deployment = JSON.parse(list || "[]").find((d) => /vercel/i.test(d.creator ?? ""));
  }
  if (!deployment) return null;
  say("Vercel bygger prototypen. Det tar ungefär en minut.");
  for (let i = 0; i < 120; i++) {
    const status = gh(["api", `repos/${slug}/deployments/${deployment.id}/statuses`, "--jq", ".[0] | {state, environment_url, target_url}"]);
    const s = JSON.parse(status || "{}");
    if (s.state === "success") return s.environment_url || s.target_url;
    if (s.state === "failure" || s.state === "error") {
      say(`Bygget misslyckades: ${s.target_url ?? ""}`);
      return null;
    }
    await sleep(5000);
  }
  say("Bygget tar ovanligt lång tid. Kolla vercel.com.");
  return null;
}

/** Utan GitHub-koppling: bygg och publicera direkt från datorn. */
function deployDirectly() {
  say("Publicerar direkt från datorn (ingen GitHub-koppling hos Vercel).");
  const out = vercel(["deploy", "--yes", ...(branch === "main" ? ["--prod"] : [])], { timeout: 600_000 });
  return out?.match(/https:\/\/[^\s]+\.vercel\.app/g)?.pop() ?? null;
}

function productionAlias(deploymentUrl) {
  const out = vercel(["inspect", deploymentUrl]);
  const aliases = out?.match(/https:\/\/[^\s]+\.vercel\.app/g) ?? [];
  return aliases.filter((a) => a !== deploymentUrl).sort((a, b) => a.length - b.length)[0] ?? null;
}
