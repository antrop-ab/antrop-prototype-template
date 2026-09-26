#!/usr/bin/env node
// Översätter shadcn:s och AI Elements engelska standardtexter till svenska:
// skärmläsartexter ("Close", "Loading") och synliga texter ("Previous", "Thinking...").
//
//   node scripts/translate-components.mjs
//
// Körs automatiskt av `npm run update` efter att komponenterna hämtats, så att
// de stannar på svenska och ändå kan uppdateras. Hittar skriptet inte en text
// (komponenten har ändrats upstream) hoppas den över tyst. Lägg till nya par här.

import { existsSync, readFileSync, writeFileSync } from "node:fs";

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

let changed = 0;
for (const [file, pairs] of Object.entries(TRANSLATIONS)) {
  if (!existsSync(file)) continue;
  const before = readFileSync(file, "utf8");
  const after = pairs.reduce((text, [en, sv]) => text.split(en).join(sv), before);
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}
if (changed) console.log(`Översatte engelska standardtexter till svenska i ${changed} komponenter.`);
