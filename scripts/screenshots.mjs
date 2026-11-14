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
// ett menyval (samma text som skärmläsaren läser upp).
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
const { devices } = await import("playwright");
// --safari: WebKit (Safaris motor) som en iPhone 13 mini, 375 px bred. Fönstret är
// lägre än skärmen eftersom Safaris adressfält och verktygsfält tar plats.
const iphone = { ...devices["iPhone 13 Mini"], deviceScaleFactor: 2 };
delete iphone.defaultBrowserType;
const viewports = [
  safari
    ? { name: "safari", options: iphone }
    : { name: "mobil", options: { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 } },
];
if (flag("desktop")) {
  viewports.push({ name: safari ? "safari-desktop" : "desktop", options: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } });
}

// Radioknappar, flikar och liknande: val av tjänst, tid eller dag är ofta RadioGroup,
// ToggleGroup (role="radio") eller Tabs, inte knappar.
const clickableRoles = ["button", "link", "radio", "tab", "checkbox", "switch", "option", "menuitem"];

async function click(page, name) {
  const candidates = [
    ...clickableRoles.map((role) => page.getByRole(role, { name, exact: true })),
    ...clickableRoles.map((role) => page.getByRole(role, { name })),
    page.getByText(name, { exact: true }),
  ];
  for (const locator of candidates) {
    if ((await locator.count()) > 0) {
      await locator.first().click();
      return;
    }
  }
  throw new Error(`Hittade inget att klicka på som heter "${name}".`);
}

mkdirSync("screenshots", { recursive: true });
const schemes = flag("both") ? ["light", "dark"] : [flag("dark") ? "dark" : "light"];
const schemeName = { light: "ljust", dark: "morkt" };

const browser = await launchBrowser(safari ? "webkit" : "chromium");
let failed = false;
try {
  for (const viewport of viewports) for (const scheme of schemes) {
    const context = await browser.newContext({
      ...viewport.options,
      colorScheme: scheme,
      // Som en svensk telefon: datumfält, veckodagar och tider visas på svenska.
      locale: "sv-SE",
      timezoneId: "Europe/Stockholm",
      // Utan rörelse syns allt direkt: element som tonar in vid scroll är annars
      // osynliga i helsidesbilder, och öppna lager hinner inte glida klart.
      reducedMotion: flag("motion") ? "no-preference" : "reduce",
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
