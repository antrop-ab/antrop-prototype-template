#!/usr/bin/env node
// Kontrollerar att prototypens kärnflöden fungerar, som en användare: öppnar sidorna i
// en riktig webbläsare (Playwright), klickar, fyller i och kollar att rätt saker syns.
// Flödena står i flows.json, med samma steg som npm run screenshots.
//
//   npm run verify                    vardag: alla flöden i Chromium, mobil, ljust läge (snabbt)
//   npm run verify -- --full          skarpt: mobil och desktop, ljust och mörkt, Safaris motor
//                                     (WebKit som iPhone) och iOS-simulatorn om Xcode finns.
//                                     Sparar en skärmdump av varje steg i screenshots/verify/.
//   npm run verify -- "Boka tid"      bara flödet med det namnet (flera namn går bra)
//   npm run verify -- --url <adress>  en annan server, till exempel den publicerade länken
//
// Standardnivån är "vardag". Sätt "verify": "skarp" i mall.config.json när prototypen
// närmar sig kund eller användartest, så kör varje npm run verify den skarpa nivån.
// --vardag kör då ändå den snabba nivån, till exempel medan ett fel rättas.
//
// Utöver stegen i flows.json räknas det här som fel: en sida som svarar med fel (404, 500),
// ett JavaScript-fel i webbläsaren och en sida som går att skrolla i sidled på mobil.
// Fel i webbläsarens konsol (till exempel hydreringsvarningar) skrivs ut som varningar.
//
// Avslutas med kod 0 när allt gick igenom, 1 när något flöde fallerade och 2 när
// kontrollen inte gick att göra (servern svarar inte, flows.json saknas).

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { findOwnDevServer, launchBrowser, slug } from "./lib/browser.mjs";
import { newContext, runStep, schemeName, viewports } from "./lib/flow.mjs";

const argv = process.argv.slice(2);
const urlIndex = argv.indexOf("--url");
const base = (urlIndex >= 0 ? argv[urlIndex + 1] : findOwnDevServer()).replace(/\/$/, "");
const only = argv.filter((a, i) => !a.startsWith("--") && !(urlIndex >= 0 && i === urlIndex + 1));
const config = JSON.parse(readFileSync("mall.config.json", "utf8"));
const full = argv.includes("--full") || (config.verify === "skarp" && !argv.includes("--vardag"));

if (!existsSync("flows.json")) {
  console.error("flows.json saknas. Lägg prototypens kärnflöden där (se mallens flows.json).");
  process.exit(2);
}
let flows = JSON.parse(readFileSync("flows.json", "utf8")).flows ?? [];
if (only.length) {
  const missing = only.filter((name) => !flows.some((f) => f.name === name));
  if (missing.length) {
    console.error(`Hittar inga flöden som heter ${missing.map((m) => `"${m}"`).join(", ")} i flows.json.`);
    process.exit(2);
  }
  flows = flows.filter((f) => only.includes(f.name));
}
if (flows.length === 0) {
  console.error("flows.json har inga flöden än. Lägg till prototypens kärnflöde först.");
  process.exit(2);
}

try {
  await fetch(base, { signal: AbortSignal.timeout(15_000) });
} catch {
  console.error(`Når inte ${base}. Kör \`npm run dev\` och ange porten Next skriver ut med --url.`);
  console.error("Ingenting är kontrollerat.");
  process.exit(2);
}

// Varje körning är en kombination av motor, format och läge.
const runs = [{ engine: "chromium", format: "mobil", scheme: "light" }];
if (full) {
  runs.push({ engine: "chromium", format: "mobil", scheme: "dark" });
  runs.push({ engine: "chromium", format: "desktop", scheme: "light" });
  runs.push({ engine: "chromium", format: "desktop", scheme: "dark" });
  runs.push({ engine: "webkit", format: "iphone", scheme: "light" });
  runs.push({ engine: "webkit", format: "iphone", scheme: "dark" });
}
const runName = (run) => `${run.engine === "webkit" ? "safari" : run.format}-${schemeName[run.scheme]}`;
const label = (run) =>
  `${run.engine === "webkit" ? "Safaris motor (WebKit som iPhone)" : `Chromium ${run.format}`}, ${schemeName[run.scheme].replace("morkt", "mörkt")}`;

mkdirSync("screenshots/verify", { recursive: true });
const failures = [];
const warnings = [];
const checked = [];
const notChecked = [];
const browsers = {};

for (const run of runs) {
  browsers[run.engine] ??= await launchBrowser(run.engine, { optional: true });
  const browser = browsers[run.engine];
  if (!browser) {
    notChecked.push(label(run));
    continue;
  }
  console.log(`\n${label(run)}`);
  for (const flow of flows) {
    const context = await newContext(browser, { viewport: viewports[run.format], scheme: run.scheme });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message.split("\n")[0]));
    page.on("console", (message) => {
      if (message.type() === "error") warnings.push(`${flow.name} (${runName(run)}): ${message.text().split("\n")[0].slice(0, 200)}`);
    });
    let error = null;
    let stepIndex = 0;
    try {
      for (const [index, step] of flow.steps.entries()) {
        stepIndex = index;
        await runStep(page, base, step);
        if (pageErrors.length) throw new Error(`JavaScript-fel i webbläsaren: ${pageErrors[0]}`);
        if (run.format !== "desktop") {
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 1) throw new Error(`Sidan är ${overflow} px bredare än skärmen och går att skrolla i sidled.`);
        }
        // Kontrollsteg (syns:, inte:) ändrar inget på sidan och får ingen egen bild.
        if (full && !/^(syns|inte):/.test(step)) {
          const file = `screenshots/verify/${slug(flow.name)}/${runName(run)}-${String(index + 1).padStart(2, "0")}-${slug(step)}.png`;
          mkdirSync(`screenshots/verify/${slug(flow.name)}`, { recursive: true });
          await page.screenshot({ path: file, animations: "disabled" });
        }
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message.split("\n")[0] : String(caught);
    }
    if (error) {
      const file = `screenshots/verify/fel-${slug(flow.name)}-${runName(run)}.png`;
      await page.screenshot({ path: file, animations: "disabled" }).catch(() => {});
      failures.push({ flow: flow.name, run: label(run), step: `${stepIndex + 1} "${flow.steps[stepIndex]}"`, error, file });
      console.log(`  ✗ ${flow.name}: steg ${stepIndex + 1} "${flow.steps[stepIndex]}": ${error}`);
    } else {
      console.log(`  ✓ ${flow.name}`);
    }
    await context.close();
  }
  checked.push(label(run));
}
for (const browser of Object.values(browsers)) await browser?.close();

// iOS-simulatorn: riktig Safari, men den kan bara öppna adresser, inte klicka.
// Den visar det som WebKit inte gör: verktygsfältet, adressfältet och säkra ytor.
if (full) {
  const routes = [...new Set(flows.flatMap((f) => f.steps.filter((s) => s.startsWith("/"))))];
  if (process.platform === "darwin" && !process.env.CLAUDE_CODE_REMOTE) {
    console.log("\nRiktig Safari i iOS-simulatorn");
    const result = spawnSync(process.execPath, ["scripts/ios-check.mjs", ...routes, "--both", "--simulator-only", "--url", base], { stdio: "inherit" });
    if (result.status === 0) checked.push("riktig Safari i iOS-simulatorn (bara adresserna, inga klick: titta på bilderna i screenshots/ios/)");
    else notChecked.push("riktig Safari i iOS-simulatorn (Xcode saknas eller simulatorn krånglade)");
  } else {
    notChecked.push("riktig Safari i iOS-simulatorn (kräver Xcode på Antroparens Mac)");
  }
} else {
  notChecked.push("mörkt läge, desktop, Safari och iOS-simulatorn (kör npm run verify -- --full)");
}

console.log("\n────────────────────────────────────────");
if (failures.length) {
  console.log(`${failures.length} fel:`);
  for (const f of failures) console.log(`  ✗ ${f.flow}, ${f.run}: steg ${f.step}: ${f.error}\n    Bild: ${f.file}`);
} else {
  console.log(`Alla ${flows.length} flöden gick igenom.`);
}
if (warnings.length) {
  console.log(`\nVarningar från webbläsarens konsol (${warnings.length}, kolla om de spelar roll):`);
  for (const w of [...new Set(warnings)].slice(0, 10)) console.log(`  ! ${w}`);
}
console.log(`\nKontrollerat i: ${checked.join("; ") || "ingenting"}.`);
if (notChecked.length) console.log(`INTE kontrollerat: ${notChecked.join("; ")}.`);
if (full) console.log("Skärmdumpar av varje steg: screenshots/verify/. Titta på dem innan du säger klart.");
process.exit(failures.length ? 1 : checked.length ? 0 : 2);
