#!/usr/bin/env node
// Klickar sig igenom ett flöde i prototypen och sparar en skärmdump efter varje steg.
// Bra för presentationer och rapporter, och för lägen som kräver klick (ett öppet sheet).
//
//   npm run screenshots -- / "Kom igång" "Skapa konto"
//   npm run screenshots -- /boka "Välj tid" --desktop --dark
//
// Ett steg som börjar med / är en adress. Ett steg med = fyller i ett fält:
// "Namn=Anna Andersson" skriver i fältet vars etikett är Namn. "vänta:Text"
// väntar tills texten syns (till exempel ett AI-svar) innan bilden tas. Allt annat
// är namnet på en knapp eller länk att klicka på (samma text som skärmläsaren läser upp).
//
//   npm run screenshots -- /boka/uppgifter "Namn=Anna Andersson" "Telefon=070-123 45 67" "Fortsätt"
//
//   --url <adress>   dev-serverns adress (standard: servern som körs från den här mappen, annars :3000)
//   --desktop        även 1440×900, inte bara mobil 375×812
//   --dark           mörkt läge
//   --both           både ljust och mörkt läge
//   --full           hela sidan, inte bara det som syns i fönstret
//
// Bilderna hamnar i screenshots/ (checkas inte in), med format och läge i namnet,
// till exempel mobil-ljust-03-valj-tid.png. Bilder från tidigare körningar med
// samma namn skrivs över, andra lämnas. Dev-servern måste vara igång.

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const urlIndex = argv.indexOf("--url");
const base = (urlIndex >= 0 ? argv[urlIndex + 1] : findOwnDevServer()).replace(/\/$/, "");

/**
 * Hittar dev-servern som startats från just den här mappen. Kör flera prototyper
 * samtidigt hamnar de på olika portar (3000, 3001 …), och då ska bilderna tas på rätt.
 */
function findOwnDevServer() {
  const fallback = "http://localhost:3000";
  if (process.platform === "win32") return fallback;
  try {
    const listening = execFileSync("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN", "-Fpn"], { encoding: "utf8" });
    let pid = null;
    for (const line of listening.split("\n")) {
      if (line.startsWith("p")) pid = line.slice(1);
      const port = line.startsWith("n") ? /:(3\d{3})$/.exec(line)?.[1] : null;
      if (!port || !pid) continue;
      const cwd = execFileSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], { encoding: "utf8" })
        .split("\n")
        .find((l) => l.startsWith("n"))
        ?.slice(1);
      if (cwd === process.cwd()) return `http://localhost:${port}`;
    }
  } catch {
    // lsof saknas eller ger inget: använd standardporten.
  }
  return fallback;
}
const steps = argv.filter((a, i) => !a.startsWith("--") && !(urlIndex >= 0 && i === urlIndex + 1));

if (steps.length === 0) {
  console.log('Användning: npm run screenshots -- / "Knapptext" "Fältets etikett=text" "vänta:Text" [--desktop] [--dark|--both] [--full] [--url <adress>]');
  process.exit(0);
}

const { chromium } = await import("playwright");

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    console.log("Laddar ner Chromium för skärmdumpar (bara första gången)...");
    const result = spawnSync("npx", ["playwright", "install", "chromium"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) process.exit(1);
    return chromium.launch();
  }
}

const viewports = [{ name: "mobil", width: 375, height: 812 }];
if (flag("desktop")) viewports.push({ name: "desktop", width: 1440, height: 900 });

const slug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "start";

async function click(page, name) {
  const candidates = [
    page.getByRole("button", { name, exact: true }),
    page.getByRole("link", { name, exact: true }),
    page.getByRole("button", { name }),
    page.getByRole("link", { name }),
    page.getByText(name, { exact: true }),
  ];
  for (const locator of candidates) {
    if ((await locator.count()) > 0) {
      await locator.first().click();
      return;
    }
  }
  throw new Error(`Hittade ingen knapp eller länk som heter "${name}".`);
}

mkdirSync("screenshots", { recursive: true });
const schemes = flag("both") ? ["light", "dark"] : [flag("dark") ? "dark" : "light"];
const schemeName = { light: "ljust", dark: "morkt" };

const browser = await launch();
let failed = false;
try {
  for (const viewport of viewports) for (const scheme of schemes) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: scheme,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    // Dölj Next.js utvecklarknapp ("N") så att den inte syns i bilderna.
    await page.addInitScript(() => {
      const hide = () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal { display: none !important; }";
        document.head?.appendChild(style);
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hide);
      else hide();
    });
    for (const [index, step] of steps.entries()) {
      if (step.startsWith("/")) {
        await page.goto(base + step, { waitUntil: "networkidle" });
      } else if (step.startsWith("vänta:")) {
        await page.getByText(step.slice(6).trim()).first().waitFor({ timeout: 60_000 });
      } else if (step.includes("=")) {
        const [label, ...rest] = step.split("=");
        await page.getByLabel(label.trim(), { exact: true }).first().fill(rest.join("="));
      } else {
        await click(page, step);
        await page.waitForLoadState("networkidle");
      }
      // Låt Sheets och andra lager animera klart.
      await page.waitForTimeout(700);
      const file = `screenshots/${viewport.name}-${schemeName[scheme]}-${String(index + 1).padStart(2, "0")}-${slug(step)}.png`;
      await page.screenshot({ path: file, fullPage: flag("full") });
      console.log(`Sparade ${file}`);
    }
    await context.close();
  }
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : error);
  if (String(error).includes("ERR_CONNECTION_REFUSED")) {
    console.error(`Når inte ${base}. Kör \`npm run dev\` och ange porten Next skriver ut med --url.`);
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
