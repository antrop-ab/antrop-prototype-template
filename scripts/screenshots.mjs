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
// är namnet på något att klicka på: en knapp, länk, radioknapp, kryssruta, flik eller
// ett menyval (samma text som skärmläsaren läser upp). Alla stegtyper: scripts/lib/flow.mjs.
// Att kontrollera att flödena fungerar: npm run verify (flödena i flows.json).
//
//   npm run screenshots -- /boka/uppgifter "Namn=Anna Andersson" "Telefon=070-123 45 67" "Fortsätt"
//
//   --url <adress>   dev-serverns adress (standard: servern som körs från den här mappen, annars :3000)
//   --desktop        även 1440×900, inte bara mobil 375×812
//   --dark           mörkt läge
//   --both           både ljust och mörkt läge
//   --full           hela sidan, inte bara det som syns i fönstret
//   --motion         behåll rörelse (standard: reducerad rörelse, så att allt syns direkt)
//   --safari         i WebKit, Safaris motor, som en iPhone (bilderna heter safari-...).
//                    Hittar de flesta Safari-fel som Chrome döljer, men inte Safaris
//                    verktygsfält eller tangentbord: se npm run ios-check.
//
// Med --url går det också att ta bilder av den publicerade prototypen, till exempel
// när bilderna kommer från ett CMS som dev-servern inte når:
//   npm run screenshots -- / "Boka" --url https://prototypen.vercel.app
//
// Bilderna hamnar i screenshots/ (checkas inte in), med format och läge i namnet,
// till exempel mobil-ljust-03-valj-tid.png. Bilder från tidigare körningar med
// samma namn skrivs över, andra lämnas. Dev-servern måste vara igång.

import { mkdirSync } from "node:fs";
import { findOwnDevServer, launchBrowser, slug } from "./lib/browser.mjs";
import { newContext, runStep, schemeName, viewports } from "./lib/flow.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const urlIndex = argv.indexOf("--url");
const base = (urlIndex >= 0 ? argv[urlIndex + 1] : findOwnDevServer()).replace(/\/$/, "");
const steps = argv.filter((a, i) => !a.startsWith("--") && !(urlIndex >= 0 && i === urlIndex + 1));

if (steps.length === 0) {
  console.log('Användning: npm run screenshots -- / "Knapptext" "Fältets etikett=text" "vänta:Text" [--desktop] [--dark|--both] [--full] [--safari] [--url <adress>]');
  process.exit(0);
}

const safari = flag("safari");
const formats = [safari ? { name: "safari", viewport: viewports.iphone } : { name: "mobil", viewport: viewports.mobil }];
if (flag("desktop")) formats.push({ name: safari ? "safari-desktop" : "desktop", viewport: viewports.desktop });

mkdirSync("screenshots", { recursive: true });
const schemes = flag("both") ? ["light", "dark"] : [flag("dark") ? "dark" : "light"];

const browser = await launchBrowser(safari ? "webkit" : "chromium");
let failed = false;
try {
  for (const format of formats) for (const scheme of schemes) {
    const context = await newContext(browser, { viewport: format.viewport, scheme, motion: flag("motion") });
    const page = await context.newPage();
    for (const [index, step] of steps.entries()) {
      await runStep(page, base, step);
      const file = `screenshots/${format.name}-${schemeName[scheme]}-${String(index + 1).padStart(2, "0")}-${slug(step)}.png`;
      await page.screenshot({ path: file, fullPage: flag("full"), animations: "disabled" });
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
