---
name: antrop-prototyp
description: Antrops sätt att bygga prototyper i kundprojekt med Next.js, shadcn/ui och Vercel. Använd när en vy, ett flöde eller en AI-funktion ska byggas eller granskas i den här mallen, när kundens tema (färger, typsnitt, logga) ska sättas, när texter i gränssnittet skrivs, när rörelse eller animationer ska läggas till, eller när exempeldata behövs. Trigger: "bygg en vy", "gör en prototyp", "kundens färger", "tema", "skriv texterna", "animation", "exempeldata", "AI-funktion", "chatt", "databas", "spara på riktigt", "Neon", "dashboard", "diagram", "insikter", "publicera".
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
| Exempeldata och delat tillstånd mellan sidor | [references/data.md](references/data.md) |
| Spara på riktigt: databas (Neon), schema, inloggning, koppling till Vercel | [references/backend.md](references/backend.md) |
| Insiktsdashboards: nyckeltal, diagram, filter, citat, siffror som stämmer | [references/dashboards.md](references/dashboards.md) |
| Visa prototypen: skärmdumpar, användartester, kunden | [references/presenting.md](references/presenting.md) |
| Kontrollera i Safari på iPhone: simulatorn, WebKit, kända fällor | [references/ios-safari.md](references/ios-safari.md) |
| Underlag: Figma, referenser från Mobbin, varianter och Claude Design | [references/underlag.md](references/underlag.md) |
| Första gången på en ny dator, eller mallen i ett befintligt repo | [references/ny-dator.md](references/ny-dator.md) |

## Arbetsgång och definition av klart

Står i `CLAUDE.md`, så att det bara finns på ett ställe: "Innan du designar", "Visa innan du bygger", "Ny sida: receptet" och "När något är klart". Utöver det gäller för en färdig vy:

- den fungerar på 375 px och 1440 px, i ljust och mörkt läge, och mobilprototyper också i Safari på iPhone (`ios-safari.md`)
- kontrollerna är minst 44 px och har synlig fokus, och det finns en tydlig huvudhandling
- tomt, laddar och fel är hanterade där de kan uppstå
- texterna är korta, konkreta och i kundens ton (kör `avoid-ai-swedish` på längre svenska texter)
- inga hårdkodade färger, inga emojis, inga kort i kort
