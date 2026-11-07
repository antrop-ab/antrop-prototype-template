#!/usr/bin/env node
// Översätter shadcn:s och AI Elements engelska standardtexter till svenska:
// skärmläsartexter ("Close", "Loading") och synliga texter ("Previous", "Thinking...").
//
//   node scripts/translate-components.mjs          språket i mall.config.json ("sv" som standard)
//   node scripts/translate-components.mjs --lang en  tillbaka till engelska, för en prototyp på engelska
//
// Är prototypen på engelska: sätt "language": "en" i mall.config.json och
// lang="en" i app/layout.tsx, och kör skriptet. Då stannar komponenterna på
// engelska också efter `npm run update`.
//
// Körs automatiskt av `npm run update` efter att komponenterna hämtats, så att
// de stannar på svenska och ändå kan uppdateras. Hittar skriptet inte en text
// (komponenten har ändrats upstream) hoppas den över tyst. Lägg till nya par här.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { config } from "./lib/util.mjs";

const TRANSLATIONS = {
  "components/ui/spinner.tsx": [['aria-label="Loading"', 'aria-label="Laddar"']],
  "components/ui/dialog.tsx": [['sr-only">Close<', 'sr-only">Stäng<']],
  "components/ui/sheet.tsx": [['sr-only">Close<', 'sr-only">Stäng<']],
  "components/ui/breadcrumb.tsx": [['sr-only">More<', 'sr-only">Fler<']],
  "components/ui/carousel.tsx": [
    ['sr-only">Previous slide<', 'sr-only">Föregående<'],
    ['sr-only">Next slide<', 'sr-only">Nästa<'],
  ],
  "components/ui/pagination.tsx": [
    ['text = "Previous"', 'text = "Föregående"'],
    ['text = "Next"', 'text = "Nästa"'],
    ['aria-label="Go to previous page"', 'aria-label="Till föregående sida"'],
    ['aria-label="Go to next page"', 'aria-label="Till nästa sida"'],
    ['sr-only">More pages<', 'sr-only">Fler sidor<'],
  ],
  "components/ui/command.tsx": [
    ['title = "Command Palette"', 'title = "Kommandon"'],
    ['description = "Search for a command to run..."', 'description = "Sök efter ett kommando"'],
  ],
  "components/ui/sidebar.tsx": [
    ['aria-label="Toggle Sidebar"', 'aria-label="Visa eller dölj sidomenyn"'],
    ['title="Toggle Sidebar"', 'title="Visa eller dölj sidomenyn"'],
    ['sr-only">Toggle Sidebar<', 'sr-only">Visa eller dölj sidomenyn<'],
    [">Sidebar<", ">Sidomeny<"],
    [">Displays the mobile sidebar.<", ">Sidomenyn i mobilen.<"],
  ],
  "components/ai-elements/conversation.tsx": [
    ['title = "No messages yet"', 'title = "Inga meddelanden än"'],
    ['description = "Start a conversation to see messages here"', 'description = "Skriv något för att börja"'],
  ],
  "components/ai-elements/prompt-input.tsx": [
    ['aria-label={isGenerating ? "Stop" : "Submit"}', 'aria-label={isGenerating ? "Stoppa" : "Skicka"}'],
    ['aria-label="Upload files"', 'aria-label="Bifoga filer"'],
    ['title="Upload files"', 'title="Bifoga filer"'],
  ],
  "components/ai-elements/reasoning.tsx": [
    [">Thinking...<", ">Tänker …<"],
    [">Thought for a few seconds<", ">Tänkte några sekunder<"],
    [">Thought for {duration} seconds<", ">Tänkte i {duration} sekunder<"],
  ],
  "components/ai-elements/sources.tsx": [[">Used {count} sources<", ">Använde {count} källor<"]],
  "components/ai-elements/inline-citation.tsx": [
    ['aria-label="Previous"', 'aria-label="Föregående"'],
    ['aria-label="Next"', 'aria-label="Nästa"'],
  ],
  "components/ai-elements/message.tsx": [
    ['aria-label="Previous branch"', 'aria-label="Föregående svar"'],
    ['aria-label="Next branch"', 'aria-label="Nästa svar"'],
  ],
};

const langIndex = process.argv.indexOf("--lang");
const language = (langIndex >= 0 ? process.argv[langIndex + 1] : config.language) ?? "sv";
const toEnglish = language === "en";

const LOCK = ".shadcn-lock.json";
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);
const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : {};

let changed = 0;
for (const [file, pairs] of Object.entries(TRANSLATIONS)) {
  if (!existsSync(file)) continue;
  const before = readFileSync(file, "utf8");
  const after = pairs.reduce((text, [en, sv]) => (toEnglish ? text.split(sv).join(en) : text.split(en).join(sv)), before);
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
    // Komponenten är inte ändrad för hand bara för att språket byttes: uppdatera
    // fingeravtrycket som `npm run update` jämför med.
    if (lock[file] === sha(before)) lock[file] = sha(after);
  }
}
if (changed && existsSync(LOCK)) writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
if (changed) console.log(`Bytte standardtexterna till ${toEnglish ? "engelska" : "svenska"} i ${changed} komponenter.`);
