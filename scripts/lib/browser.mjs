// Gemensamt för skript som öppnar prototypen i en webbläsare (skärmdumpar, ios-check,
// egna testskript). Importera härifrån i stället för direkt från playwright, så hittas
// webbläsaren både på Antroparens Mac och i Claudes molnmiljö.
//
//   import { launchBrowser, findOwnDevServer } from "./lib/browser.mjs";
//   const browser = await launchBrowser("webkit"); // eller "chromium"

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// I Claudes molnmiljö finns Chromium förinstallerat här, ofta i en annan version
// än mallens Playwright. Då används den i stället för att ladda ner en egen.
export const PREINSTALLED_CHROMIUM = "/opt/pw-browsers/chromium";

/**
 * Startar Chromium eller WebKit (samma motor som Safari). Saknas webbläsaren laddas
 * den ner första gången. Går det inte (till exempel utan nät) avslutas skriptet med
 * ett meddelande som säger vad som inte gick att kontrollera. Med { optional: true }
 * returneras null i stället, så att skriptet kan kontrollera resten.
 */
export async function launchBrowser(engine = "chromium", { optional = false } = {}) {
  const giveUp = () => {
    if (optional) return null;
    process.exit(2);
  };
  const playwright = await import("playwright");
  const type = playwright[engine];
  try {
    return await type.launch();
  } catch (error) {
    if (engine === "chromium" && existsSync(PREINSTALLED_CHROMIUM)) {
      return type.launch({ executablePath: PREINSTALLED_CHROMIUM, args: ["--no-sandbox"] });
    }
    const missing = /Executable doesn't exist|install/i.test(String(error));
    if (!missing) throw error;
    const name = engine === "webkit" ? "WebKit (Safaris motor)" : "Chromium";
    console.log(`Laddar ner ${name} (bara första gången, ett par minuter)...`);
    const npx = (...args) => spawnSync("npx", ["playwright", ...args], { stdio: "inherit", shell: process.platform === "win32" }).status === 0;
    // Själva webbläsaren först: --with-deps kräver sudo och apt, som ofta saknas.
    if (!/Executable doesn't exist/i.test(String(error)) || !npx("install", engine)) {
      // Systembibliotek saknas (vanligt för WebKit på Linux, till exempel i molnet).
      if (process.platform !== "linux" || !npx("install", "--with-deps", engine)) {
        console.error(`Kunde inte ladda ner ${name}. Det som skulle kontrolleras i den är INTE kontrollerat.`);
        return giveUp();
      }
    }
    try {
      return await type.launch();
    } catch (retryError) {
      if (process.platform === "linux" && /missing dependencies/i.test(String(retryError)) && npx("install-deps", engine)) {
        return type.launch();
      }
      console.error(`${name} startar inte här: ${String(retryError).split("\n")[0]}`);
      console.error("Det som skulle kontrolleras i den är INTE kontrollerat. Kör kommandot på Antroparens Mac.");
      return giveUp();
    }
  }
}

/**
 * Hittar dev-servern som startats från just den här mappen. Kör flera prototyper
 * samtidigt hamnar de på olika portar (3000, 3001 …), och då ska bilderna tas på rätt.
 */
export function findOwnDevServer() {
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

/** Gör en text till en del av ett filnamn: "Välj tid" blir "valj-tid". */
export const slug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "start";
