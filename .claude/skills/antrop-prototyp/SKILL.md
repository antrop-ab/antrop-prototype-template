---
name: antrop-prototyp
description: Antrops sätt att bygga prototyper i kundprojekt med Next.js, shadcn/ui och Vercel. Använd när en vy, ett flöde eller en AI-funktion ska byggas eller granskas i den här mallen, när kundens tema (färger, typsnitt, logga) ska sättas, när texter i gränssnittet skrivs, när rörelse eller animationer ska läggas till, eller när exempeldata behövs. Trigger: "bygg en vy", "gör en prototyp", "kundens färger", "tema", "skriv texterna", "animation", "exempeldata", "AI-funktion", "chatt", "publicera".
---

# Antrops prototyper

Den här skillen kompletterar `CLAUDE.md` och `DESIGN.md` med fördjupning. Läs referensen som gäller uppgiften:

| Uppgift | Referens |
|---|---|
| Sätta kundens färger, typsnitt, radie och logga | [references/theming.md](references/theming.md) |
| Välja och kombinera shadcn-komponenter, block och registries | [references/components.md](references/components.md) |
| Skriva texter i gränssnittet: knappar, fel, tomma lägen, ton | [references/ux-writing.md](references/ux-writing.md) |
| Rörelse: mikroanimationer, lager, vybyten, Motion | [references/motion.md](references/motion.md) |
| AI-funktioner: chatt, strukturerade svar, modeller, nycklar | [references/ai-features.md](references/ai-features.md) |
| Exempeldata, delat tillstånd, spara på riktigt | [references/data.md](references/data.md) |
| Visa prototypen: skärmdumpar, användartester, kunden | [references/presenting.md](references/presenting.md) |

## Arbetsgång för en ny vy

1. **Underlag:** Figma-länk, beskrivning eller Claude Design. Fyll i `PRODUCT.md` om *Users* eller *Product Purpose* saknas.
2. **Tema:** är kundens tema satt? (`npm run theme -- --show`). Om inte: gör det först.
3. **Plan:** impeccables `shape`, eller högst fem punkter vid autonomt bygge. Välj shadcn-block om ett passar.
4. **Bygg** med `PageShell`, shadcn-komponenter, semantiska färger och påhittad data med undantagsfall.
5. **Texter:** skriv i kundens ton. Kör `avoid-ai-swedish` (antrop-toolbox) på längre svenska texter.
6. **Rörelse:** `transitionTypes` på länkar, `Drawer` på mobil. Fråga `find-animation-opportunities` om något ska kännas mer levande.
7. **Granska** i webbläsaren: mobil och desktop, ljust och mörkt, varje klick. Kör impeccables `critique` och `audit`, åtgärda.
8. **Publicera** med `npm run ship` när Antroparen vill dela.

## Kvalitetsribba

En vy är klar när:

- den fungerar på 375 px och 1440 px, i ljust och mörkt läge
- alla kontroller är minst 44 px och har synlig fokus
- det finns en tydlig huvudhandling
- tomt, laddar och fel är hanterade där de kan uppstå
- texterna är korta, konkreta och på kundens språk
- inga hårdkodade färger, inga emojis, inga kort i kort
- `npm run typecheck` går igenom
