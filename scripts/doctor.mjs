#!/usr/bin/env node
// Kollar att datorn och prototypen har det som behövs. Ändrar ingenting.
//
//   npm run doctor
//
// --pre-install: körs av setup före npm install (trasiga beroenden stoppar inte)
// --deps-only:   kollar bara att beroendena går att ladda

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { cleanGhEnv, config, linkedProject, repoSlug, run } from "./lib/util.mjs";

const preInstall = process.argv.includes("--pre-install");
const depsOnly = process.argv.includes("--deps-only");
const rows = [];
let blocking = 0;

function check(label, ok, detail, { required = true, fix } = {}) {
  const status = ok ? "OK     " : required ? "SAKNAS " : "VALFRI ";
  if (!ok && required) blocking++;
  rows.push(`${status} ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok && fix) rows.push(`        -> ${fix}`);
}

if (depsOnly) {
  checkDependencies();
  finish();
}

// Verktyg
const [major, minor] = process.versions.node.split(".").map(Number);
check("Node.js 20.9 eller senare", major > 20 || (major === 20 && minor >= 9), `v${process.versions.node}`, {
  fix: "Mac: bash scripts/bootstrap.sh --no-project. Annars https://nodejs.org (LTS)",
});

const git = run("git", ["--version"]);
check("Git", !!git, git ?? undefined, { fix: "Mac: bash scripts/bootstrap.sh --no-project" });
if (git) {
  const name = run("git", ["config", "--global", "user.name"]);
  const email = run("git", ["config", "--global", "user.email"]);
  check("Git vet vem du är", !!name && !!email, name && email ? `${name} <${email}>` : undefined, {
    fix: 'git config --global user.name "Förnamn Efternamn" && git config --global user.email "namn@antrop.se"',
  });
}

const env = cleanGhEnv();
const gh = run("gh", ["--version"], { env });
check("GitHub CLI (gh)", !!gh, gh?.split("\n")[0], { fix: "Mac: bash scripts/bootstrap.sh --no-project. Annars https://cli.github.com" });
if (gh) {
  const status = run("gh", ["auth", "status", "--hostname", "github.com"], { env });
  const loggedIn = !!status && /Logged in/i.test(status);
  const user = loggedIn ? run("gh", ["api", "user", "--jq", ".login"], { env }) : null;
  check("Inloggad på GitHub", loggedIn, user ?? undefined, {
    fix: "gh auth login --hostname github.com --git-protocol https --web  (sedan: gh auth setup-git)",
  });
  if (loggedIn) {
    const member = run("gh", ["api", `user/memberships/orgs/${config.githubOwner}`, "--jq", ".state"], { env });
    check(`Medlem i ${config.githubOwner} på GitHub`, member === "active", member ?? "nej", {
      required: false,
      fix: `Be någon på Antrop bjuda in dig till github.com/${config.githubOwner}. Utan det hamnar prototypen på ditt eget konto.`,
    });
    const scopes = /Token scopes: (.*)/.exec(status)?.[1] ?? "";
    check("GitHub-inloggningen får skapa repon och workflows", /repo/.test(scopes) && /workflow/.test(scopes), undefined, {
      required: false,
      fix: "gh auth refresh -h github.com -s repo,workflow",
    });
  }
}

const vercelWho = run("npx", ["-y", "vercel@latest", "whoami"], { timeout: 60_000 });
check("Inloggad på Vercel", !!vercelWho, vercelWho?.split("\n").pop(), {
  required: false,
  fix: "Behövs för att publicera och för AI-funktioner. Kör: npx vercel login",
});

// Prototypen
if (existsSync(".git")) {
  const slug = repoSlug();
  check("Kopplad till ett repo på GitHub", !!slug, slug ?? undefined, {
    required: false,
    fix: "npm run ship skapar repot första gången du publicerar",
  });
}
const project = linkedProject();
check("Kopplad till Vercel", !!project, project?.projectName ?? undefined, {
  required: false,
  fix: "npm run vercel:link",
});
const envFile = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
check("Nycklar för AI lokalt (.env.local)", /VERCEL_OIDC_TOKEN|AI_GATEWAY_API_KEY/.test(envFile), undefined, {
  required: false,
  fix: "npm run env  (hämtar från Vercel. På Vercel fungerar AI utan nycklar)",
});

checkDependencies();
check("Skills installerade (shadcn, impeccable m.fl.)", existsSync(".claude/skills/shadcn") && existsSync(".claude/skills/impeccable"), undefined, {
  required: false,
  fix: "npm run update -- --skills",
});

const ffmpeg = run("ffmpeg", ["-version"]);
check("ffmpeg (för promovideor)", !!ffmpeg || existsSync("node_modules/ffmpeg-static"), ffmpeg?.split("\n")[0]?.split(" ").slice(0, 3).join(" "), {
  required: false,
  fix: "Behövs bara för npm run video. Mac: brew install ffmpeg, annars npm install -D ffmpeg-static",
});

const claude = run("claude", ["--version"]);
check("Claude Code i terminalen", !!claude, claude ?? undefined, {
  required: false,
  fix: "Behövs bara för Claude i GitHub (npm run github:claude). Claude-appen räcker annars",
});

if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
  check("Ingen GH_TOKEN/GITHUB_TOKEN i miljön", false, "kan dölja din riktiga inloggning", {
    required: false,
    fix: "Skripten tar bort den själva. I egna gh-kommandon: env -u GH_TOKEN -u GITHUB_TOKEN gh …",
  });
}

finish();

function checkDependencies() {
  if (!existsSync("node_modules")) {
    check("Paket installerade (node_modules)", false, undefined, { required: !preInstall, fix: "npm run setup" });
    return;
  }
  const require = createRequire(`${process.cwd()}/`);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const broken = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((name) => {
    if (name.startsWith("@types/") || name === "typescript") return !existsSync(`node_modules/${name}/package.json`);
    try {
      require.resolve(`${name}/package.json`);
      return false;
    } catch {
      return !existsSync(`node_modules/${name}/package.json`);
    }
  });
  check("Paket installerade och hela", broken.length === 0, broken.length ? `saknas: ${broken.slice(0, 4).join(", ")}` : undefined, {
    required: !preInstall,
    fix: "npm install   (hjälper det inte: npm ci)",
  });
}

function finish() {
  console.log(depsOnly ? "\nKontroll efter installation\n" : "\nMiljökoll för Antrops prototypmall\n");
  console.log(rows.join("\n"));
  console.log(
    blocking === 0
      ? "\nAllt som krävs finns på plats."
      : `\n${blocking} sak(er) måste fixas först. Be Claude om hjälp, eller läs docs/kom-igang.md.`,
  );
  process.exit(blocking === 0 ? 0 : 1);
}
