#!/usr/bin/env node
// Kollar och guidar uppsättningen av Claude i GitHub (@claude i ärenden och
// pull requests). Se .github/workflows/claude.yml.
//
//   npm run github:claude           visa vad som saknas
//   npm run github:claude -- --set  spara din Claude-token som hemlighet i repot
//                                   (kör i Terminal: den frågar efter token dolt)

import { existsSync } from "node:fs";
import { cleanGhEnv, exec, repoSlug, run, say } from "./lib/util.mjs";

const env = cleanGhEnv();
const slug = repoSlug();

if (!existsSync(".github/workflows/claude.yml")) {
  say("Filen .github/workflows/claude.yml saknas. Återställ den från mallen.");
  process.exit(1);
}
if (!slug) {
  say("Prototypen ligger inte på GitHub än. Publicera först med npm run ship.");
  process.exit(1);
}

if (process.argv.includes("--set")) {
  if (!process.stdin.isTTY) {
    say("Kör det här i Terminal, inte via Claude, så att token inte syns i chatten:");
    say("  npm run github:claude -- --set");
    process.exit(2);
  }
  say("Klistra in token från `claude setup-token` och tryck Enter:");
  process.exit(exec("gh", ["secret", "set", "CLAUDE_CODE_OAUTH_TOKEN", "--repo", slug], { env, input: "inherit" }) ? 0 : 1);
}

const secrets = run("gh", ["secret", "list", "--repo", slug], { env }) ?? "";
const hasSecret = /CLAUDE_CODE_OAUTH_TOKEN|ANTHROPIC_API_KEY/.test(secrets);

say(`Claude i GitHub för ${slug}\n`);
say(`${hasSecret ? "OK    " : "SAKNAS"} Hemligheten CLAUDE_CODE_OAUTH_TOKEN`);
say("?      Claudes GitHub-app (kan inte kollas härifrån)\n");

if (!hasSecret) {
  say("Så här gör du, en gång per repo. Öppna Terminal i prototypens mapp:");
  say("  1. Installera appen och välj repot: https://github.com/apps/claude");
  say("  2. claude setup-token        (loggar in med ditt Claude-konto och skriver ut en token)");
  say("  3. npm run github:claude -- --set   (klistra in token)");
  say("\nEnklare om du har Claude Code i terminalen: kör `claude` och skriv /install-github-app.");
} else {
  say(`Klart. Skriv @claude i ett ärende på https://github.com/${slug}/issues så börjar Claude jobba.`);
}
