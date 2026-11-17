#!/usr/bin/env node
// Kontrollerar prototypen i Safari på iPhone innan något kallas klart.
//
//   npm run ios-check -- / /boka /boka/bekrafta
//   npm run ios-check -- / /boka --both
//
// Finns Xcode på datorn öppnas varje adress i riktig Safari i iOS-simulatorn, och en
// skärmdump sparas i screenshots/ios/. Där syns det som bara riktig Safari visar:
// verktygsfältets färg, adressfältet och säkra ytor runt kanterna.
//
// Finns inte Xcode (vanligt, det är 15 GB från App Store) eller körs skriptet i molnet,
// tas bilderna i stället med WebKit, Safaris motor, som en iPhone (npm run screenshots
// -- --safari). Det hittar de flesta Safari-fel, men inte verktygsfältet och tangentbordet.
// Skriptet skriver ut vilket som användes, så att rapporten kan säga vad som är kontrollerat.
//
// Simulatorn kan bara öppna adresser, inte klicka. Klickflöden: npm run screenshots --
// /boka "Välj tid" --safari, eller klicka i Simulator-fönstret själv.
//
//   --url <adress>   dev-serverns adress (standard: servern som körs från den här mappen)
//   --dark           mörkt läge
//   --both           både ljust och mörkt läge
//   --wait <sek>     väntetid per sida i simulatorn (standard 4)
//   --webkit         hoppa över simulatorn och använd WebKit direkt
//   --simulator-only bara simulatorn: finns den inte avslutas skriptet med kod 3 utan
//                    WebKit-bilder (npm run verify -- --full har redan kört WebKit)

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { findOwnDevServer, slug } from "./lib/browser.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const valueOf = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const valueFlags = ["--url", "--wait"];
const routes = argv.filter((a, i) => a.startsWith("/") && !valueFlags.includes(argv[i - 1]));

if (routes.length === 0) {
  console.log("Användning: npm run ios-check -- / /boka [--dark|--both] [--url <adress>] [--webkit]");
  process.exit(0);
}

const base = (valueOf("url") ?? findOwnDevServer()).replace(/\/$/, "");
const schemes = flag("both") ? ["light", "dark"] : [flag("dark") ? "dark" : "light"];
const schemeName = { light: "ljust", dark: "morkt" };

const simctl = (...args) => execFileSync("xcrun", ["simctl", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** En iPhone i simulatorn: en som redan är igång, annars den nyaste som finns. Null utan Xcode. */
function findIphone() {
  if (process.platform !== "darwin" || flag("webkit") || process.env.CLAUDE_CODE_REMOTE) return null;
  try {
    const { devices } = JSON.parse(simctl("list", "devices", "available", "--json"));
    const iphones = Object.entries(devices)
      .filter(([runtime]) => runtime.includes("iOS"))
      .flatMap(([runtime, list]) => list.map((d) => ({ ...d, runtime })))
      .filter((d) => d.name.startsWith("iPhone"));
    const booted = iphones.find((d) => d.state === "Booted");
    if (booted) return booted;
    // Nyaste iOS, och helst en vanlig storlek: en stor Plus eller Pro Max döljer fel
    // som syns på en smalare telefon.
    const byRuntime = (a, b) => a.runtime.localeCompare(b.runtime, "en", { numeric: true });
    const regular = iphones.filter((d) => !/Plus|Max|Air/.test(d.name));
    return (regular.length ? regular : iphones).sort(byRuntime).at(-1) ?? null;
  } catch {
    return null; // xcrun saknas eller Xcode är inte installerat (bara kommandoradsverktygen).
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withSimulator(device) {
  // Simulatorn sparar annars bilder av Safaris felsida och rapporterar ändå "kontrollerat".
  try {
    await fetch(base, { signal: AbortSignal.timeout(10_000) });
  } catch {
    console.error(`Når inte ${base}. Kör \`npm run dev\` och ange porten Next skriver ut med --url.`);
    process.exit(1);
  }
  console.log(`Öppnar ${device.name} (${device.runtime.split(".").at(-1)}) i iOS-simulatorn.`);
  if (device.state !== "Booted") simctl("boot", device.udid);
  spawnSync("open", ["-a", "Simulator"]);
  simctl("bootstatus", device.udid, "-b");
  mkdirSync("screenshots/ios", { recursive: true });
  const wait = Number(valueOf("wait") ?? 4) * 1000;
  for (const scheme of schemes) {
    simctl("ui", device.udid, "appearance", scheme);
    for (const [index, route] of routes.entries()) {
      simctl("openurl", device.udid, base + route);
      // Första gången startar Safari och sidan kompileras av dev-servern: vänta längre.
      await sleep(index === 0 ? wait * 2 : wait);
      const file = `screenshots/ios/${schemeName[scheme]}-${String(index + 1).padStart(2, "0")}-${slug(route)}.png`;
      simctl("io", device.udid, "screenshot", file);
      console.log(`Sparade ${file}`);
    }
  }
  console.log("\nKontrollerat i: riktig Safari i iOS-simulatorn (bara de här adresserna, inga klick).");
  console.log("Titta på bilderna: verktygsfältets färg, fält som går utanför kanten, knappytan längst ned.");
}

const device = findIphone();
if (!device && flag("simulator-only")) {
  console.log("iOS-simulatorn finns inte här (kräver Xcode på en Mac). Riktig Safari på iPhone är INTE kontrollerad.");
  process.exit(3);
}
if (device) {
  try {
    await withSimulator(device);
    process.exit(0);
  } catch (error) {
    console.error(`Simulatorn krånglade: ${String(error.stderr ?? error.message ?? error).split("\n")[0]}`);
    if (flag("simulator-only")) process.exit(3);
    console.error("Tar bilderna med WebKit i stället.\n");
  }
} else if (process.platform === "darwin" && !flag("webkit") && !process.env.CLAUDE_CODE_REMOTE) {
  console.log("Xcode finns inte på datorn, så iOS-simulatorn går inte att använda. Tar bilderna med WebKit, Safaris motor.\n");
}

const passOn = [];
for (const name of ["dark", "both"]) if (flag(name)) passOn.push(`--${name}`);
const result = spawnSync(process.execPath, ["scripts/screenshots.mjs", ...routes, "--safari", "--url", base, ...passOn], { stdio: "inherit" });
if (result.status === 0) {
  console.log("\nKontrollerat i: WebKit som iPhone (Safaris motor, inte riktig Safari).");
  console.log("INTE kontrollerat: Safaris verktygsfält och adressfält, tangentbordet. Säg det i rapporten,");
  console.log("eller be Antroparen öppna sidan på sin iPhone.");
  if (process.platform === "darwin") {
    console.log("Tips: Safari 27 och senare kan styras av Claude via sin inbyggda MCP-server, med riktig Safari och klick.");
    console.log("Se .claude/skills/antrop-prototyp/references/ios-safari.md.");
  }
}
process.exit(result.status ?? 1);
