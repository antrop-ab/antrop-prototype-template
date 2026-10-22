# Insiktsdashboards

En dashboard för kundinsikter, enkätsvar eller nyckeltal, byggd med samma mall, komponenter och tema som en prototyp. Datan ligger oftast i Neon (se `backend.md`), men en första version kan gärna bygga på påhittad data i `data/`.

## Skillen dataviz

Läs Claude Codes inbyggda skill **`dataviz`** innan du ritar första diagrammet: vilken form frågan kräver, färger, linjer och staplar, hover, filter och tillgänglighet. Den har ett skript som kontrollerar färgerna (`scripts/validate_palette.js`). Kör det, gissa inte.

Saknas skillen har Antroparen en äldre Claude Code. Be hen uppdatera Claude-appen och följ under tiden reglerna nedan.

Så kopplas dataviz till mallen:

| dataviz säger | I mallen |
|---|---|
| Kategoriska färger i fast ordning | `chart-1` till `chart-5` i `app/globals.css`, i den ordningen. `npm run theme` tar fram dem ur kundens färg och kontrollerar dem för färgblindhet i ljust och mörkt läge (`npm run theme -- --show`). |
| Ytan som färgerna kontrolleras mot | `background` i ljust och mörkt läge |
| Statusfärger (bra, varning, kritisk) | Hålls skilda från `chart-1..5`. `destructive` för kritiskt. Alltid med ikon och text, aldrig bara färg. |
| Filter | shadcn `Select`, `ToggleGroup` och `Calendar` i en rad ovanför diagrammen |

Egna färger utanför temat: kör dataviz validator mot båda lägena innan de används.

## Börja med frågorna

1. **Vem läser och vad ska de få veta?** Skriv 3–5 frågor som dashboarden ska svara på, till exempel *"Hur nöjda är kunderna, och skiljer sig privat- och företagskunder åt?"* Lägg dem i `PRODUCT.md`.
2. **Formen följer frågan.** En siffra blir ett nyckeltal, inte ett diagram. Förändring över tid blir en linje. Jämförelse mellan grupper blir staplar. Andelar av en helhet blir en stapel med delar, sällan ett cirkeldiagram.
3. **Rubriken säger insikten**, inte vad diagrammet visar: *"Väntetiden halverades efter mars"*, inte *"Väntetid per månad"*. Underrubriken säger vad som mäts och varifrån.

## Komponenter

- **Diagram:** shadcn `Chart` (`components/ui/chart.tsx`, Recharts) med `ChartContainer`, `ChartTooltip` och `ChartLegend`. Färdiga exempel: `npx shadcn@latest search @shadcn -q "chart"`. Färger som `var(--chart-1)` i `ChartConfig`, aldrig hex.
- **Nyckeltal:** stor siffra med `tabular-nums`, en rad om vad den betyder och jämförelsen (*"+4 sedan Q2"*). Använd inte `Card` runt varje siffra om de står i en rad. Luft räcker.
- **Tabell:** varje diagram ska gå att se som tabell (`Table`), för skärmläsare och för den som vill ha siffrorna.
- **Citat:** ett eller två citat som stöder insikten, med anonym källa (*"Privatkund, intervju 12"*). Aldrig namn eller detaljer som pekar ut någon.

## Regler

- **En y-axel.** Två mått med olika skala blir två diagram.
- **Färgen följer serien**, inte ordningen. Ett filter som tar bort en serie får inte måla om de andra.
- **Punktdiagram, kartor och små multipler: högst tre serier.** Där kan vilka två färger som helst hamna bredvid varandra, och bara `chart-1` till `chart-3` är kontrollerade mot varandra. Fler serier: slå ihop till "Övrigt" eller dela upp i flera diagram.
- **Legend** när det finns två serier eller fler. Direkta etiketter på några punkter, inte på alla.
- **Visa n.** Små grupper får en synlig siffra (*"n = 7"*). Under 30 svar: visa antal i stället för procent, eller båda.
- **Text i textfärger** (`foreground`, `muted-foreground`), aldrig i seriens färg.
- **Desktop först** för dashboards som läses vid en dator, men den ska gå att läsa på 375 px (diagram under varandra, filtren i en `Drawer`).

## Data

- Räkna i SQL, inte i webbläsaren. En fråga per nyckeltal eller diagram, i `lib/queries/`, som körs i en serverkomponent.
- Filter i adressen (`searchParams`), så att en länk till ett filtrerat läge går att dela.
- **Kontrollera varje siffra** mot databasen innan dashboarden visas för någon. Kör frågan för hand och jämför. En dashboard som ser bra ut men räknar fel är värre än ingen.

## Rörelse

Siffror räknas upp en gång när sidan laddas, och staplar och linjer växer fram när de kommer in i bild (`motion`, `whileInView`). Med reducerad rörelse (`useReducedMotion`) står allt still. Ingen animation får dölja en siffra som borde synas. Mer i `motion.md`.

## Granska

1. `dataviz` mot formen och färgerna, och dess lista över vanliga fel.
2. `break-ui` med värsta tänkbara data: tom period, en grupp med tre svar, väldigt långa etiketter.
3. impeccables `critique` och `audit`.
4. `code-review` (se "Kodgranskning" i `CLAUDE.md`).
