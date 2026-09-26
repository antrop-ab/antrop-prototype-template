#!/usr/bin/env node
// Skickar feedback om mallen till mallens repo på GitHub, som ett ärende (issue).
//
//   npm run feedback              visa det som skulle skickas
//   npm run feedback -- --send    skapa ärendet och markera punkterna som skickade
//
// Punkterna skrivs i feedback-till-mallen.md, av Claude eller av dig. Efter att
// de skickats flyttas de till avsnittet "Skickat" längst ned i filen.

import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanGhEnv, config, exec, readJson, run } from "./lib/util.mjs";

const FILE = "feedback-till-mallen.md";
const MARK = "<!-- nya punkter under den här raden -->";
const SENT = "\n## Skickat\n";

const text = readFileSync(FILE, "utf8");
const start = text.indexOf(MARK);
if (start < 0) {
  console.error(`Hittar inte markeringen i ${FILE}. Återställ filen från mallen.`);
  process.exit(1);
}
const rest = text.slice(start + MARK.length);
const sentAt = rest.indexOf(SENT);
const pending = (sentAt >= 0 ? rest.slice(0, sentAt) : rest).trim();
const alreadySent = sentAt >= 0 ? rest.slice(sentAt + SENT.length).trim() : "";

if (!pending) {
  console.log("Ingen ny feedback att skicka. Punkter skrivs i feedback-till-mallen.md.");
  process.exit(0);
}

const pkg = readJson("package.json", {});
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const context = [
  `- Mallens version: ${run("git", ["log", "-1", "--format=%h %cs", "--", "CLAUDE.md"]) ?? "okänd"}`,
  `- Node ${process.versions.node}, ${process.platform} ${process.arch}`,
  `- next ${deps.next ?? "?"}, shadcn ${deps.shadcn ?? "?"}, ai ${deps.ai ?? "?"}`,
].join("\n");
const count = (pending.match(/^## /gm) ?? []).length || 1;
const title = `Feedback från en prototyp: ${pending.match(/^## .*?: (.*)$/m)?.[1] ?? `${count} punkt(er)`}${count > 1 ? ` (+${count - 1})` : ""}`;
const body = `${pending}\n\n---\n**Miljö**\n${context}\n\n_Skickat med \`npm run feedback\` från en prototyp byggd på mallen._\n`;

if (!process.argv.includes("--send")) {
  console.log(`Det här skickas som ett ärende till github.com/${config.templateRepo}:\n`);
  console.log(`Rubrik: ${title}\n`);
  console.log(body);
  console.log("Kör npm run feedback -- --send för att skicka.");
  process.exit(0);
}

const bodyFile = join(tmpdir(), `mall-feedback-${Date.now()}.md`);
writeFileSync(bodyFile, body);
const env = cleanGhEnv();
const ok = exec("gh", ["issue", "create", "--repo", config.templateRepo, "--title", title, "--body-file", bodyFile], { env });
if (!ok) {
  console.error(
    `\nKunde inte skapa ärendet. Är du inloggad på GitHub (gh auth status) och har du tillgång till ${config.templateRepo}?\n` +
      "Du kan också skicka filen feedback-till-mallen.md till den som förvaltar mallen.",
  );
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const archived = `${alreadySent ? `${alreadySent}\n\n` : ""}<!-- skickat ${date} -->\n${pending}`;
writeFileSync(FILE, `${text.slice(0, start + MARK.length)}\n\n${SENT}\n${archived}\n`);
console.log("\nTack! Punkterna är flyttade till avsnittet Skickat i feedback-till-mallen.md.");
