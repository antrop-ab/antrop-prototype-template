---
name: Antrop prototyp
description: Antrops standardutseende för prototyper. Rent, luftigt och linjärt, och byggt för att ta kundens färger och typsnitt.
---

# Design: Antrops prototyper

> **Till Claude och designskills (till exempel impeccable):** prototyperna använder shadcn/ui med Antrops tema. Grundutseendet är medvetet valt: rent och linjärt som Linear, luftigt och vänligt som Airbnb. I ett kundprojekt byts färger, typsnitt och radie till kundens med `npm run theme`. Förbättra hierarki, flöde, avstånd, text, rörelse och tillgänglighet inom ramarna nedan. Byt inte den visuella världen på eget initiativ.

## Overview

Gränssnitten är till för att **få något gjort** (impeccables läge *Operate*): tydlighet och förutsägbara mönster går före uttryck. Varumärket syns i precisa detaljer: huvudfärgen på rätt ställen, ett välvalt typsnitt, mjuka skuggor och rörelse som känns fysisk. Kvalitetsribban är produkter som Linear, Airbnb och Stripe: generös luft, få men tydliga nivåer, inget brus.

## Colors

Strategin är **återhållsam**: neutrala ytor och en huvudfärg. Allt går via temats semantiska variabler, så att kundens färger och mörkt läge fungerar automatiskt.

| Roll | Klass | Används till |
|---|---|---|
| Bakgrund | `bg-background`, `text-foreground` | Sidan |
| Huvudfärg | `bg-primary`, `text-primary-foreground` | Huvudhandlingen, valda lägen, fokus. Sparsamt |
| Mjuk huvudfärg | `bg-primary-soft`, `text-primary-soft-foreground` | Markerade rader, ikoner i en platta, taggar |
| Dämpad | `bg-muted`, `text-muted-foreground` | Sekundär text, inaktiva ytor |
| Sekundär | `bg-secondary` | Sekundära knappar, filter |
| Kant | `border-border`, `border-input` | Avdelare och fält |
| Fel | `bg-destructive`, `text-destructive` | Fel och destruktiva val |
| Diagram | `chart-1` till `chart-5` | Serier i diagram, `chart-1` är huvudfärgen |

- **Aldrig hårdkodade färger** (`#fff`, `bg-blue-500`). De bryter mot kundens tema och mörkt läge.
- Gråskalan har en aning av huvudfärgen (`--neutral tinted`), så att allt hänger ihop.
- Färg bär aldrig information ensam. Komplettera med text eller ikon.
- **Ljust och mörkt läge ska båda fungera** och följer datorns inställning. Ingen växlare i gränssnittet.

## Typography

Ett typsnitt för allt, som standard **Figtree**: geometriskt, vänligt och mycket läsbart i små storlekar. Kunden kan få sitt eget (`npm run theme -- --font "Namn"`), och rubriker kan få ett eget (`--heading-font`).

| Nivå | Klasser |
|---|---|
| Sidrubrik (h1) | `text-3xl sm:text-4xl font-semibold` |
| Sektion (h2) | `text-xl font-semibold` |
| Underrubrik (h3) | `text-base font-semibold` |
| Brödtext | `text-base` (16 px) |
| Sekundär text | `text-sm text-muted-foreground` |
| Siffror i tabeller | `tabular-nums` |

- Rubriker har tight spärrning (−0,02 em) och `text-wrap: balance`, redan i basstilen.
- Hierarki skapas med vikt och färg före storlek. Högst tre storlekar per vy.
- Radlängd för löptext: högst cirka 70 tecken (`max-w-prose` eller `max-w-2xl`).

## Layout

- **Avstånd i steg om 4 px** (Tailwinds skala). Vanligast: `gap-2` (8) inom en grupp, `gap-4` (16) mellan element, `gap-6`–`gap-10` (24–40) mellan sektioner, `gap-14` (56) mellan stora block.
- **Sidmarginal** 20 px på mobil, 32 px från `sm`. `PageShell` sköter det.
- **Bredd:** formulär och flöden 576 px (`narrow`), läsning 768 (`default`), översikter 1152 (`wide`).
- **Mobil först:** 375 px, sedan uppåt. Kolla alltid båda.
- **Klickytor minst 44×44 px.** `app/sizing.css` gör det till standard.
- Tät yta för proffsverktyg: `data-density="compact"` (se `app/sizing.css`).

## Elevation & Depth

Djup skapas med **lager och mjuka skuggor**, inte med ramar. Skuggorna i `globals.css` är lågkontrastiga och i flera lager.

- Sida: platt. Kort: kant eller `shadow-sm`, inte båda kraftigt.
- Menyer och popovers: `shadow-md`. Dialoger och sheets: `shadow-lg` eller `shadow-xl`.
- Detaljer öppnas i ett lager (`Sheet`, `Drawer`, `Dialog`, `Popover`) i stället för att staplas på sidan.

## Shapes

Radien kommer från `--radius` (standard 0,75 rem = 12 px). Knappar och fält får lite mindre, kort och dialoger lite mer, automatiskt. Sätt inga egna `rounded-*` på komponenter.

## Motion

Rörelse förklarar var saker kommer ifrån och vart de tar vägen. Se `app/motion.css` och skillen `emil-design-eng`.

- **150–250 ms** för det mesta, **400–500 ms** för stora lager och vybyten. Ut är snabbare än in.
- **ease-out** (`--ease-out`) för det som dyker upp, iOS-kurvan (`--ease-drawer`) för sheets och drawers. Aldrig `linear` för rörelse.
- Bara `transform` och `opacity`.
- Det som används ofta (menyer, tangentbordsgenvägar) är nästan omedelbart.
- `prefers-reduced-motion` respekteras.

## Components

shadcn/ui i `components/ui/`, alla installerade. AI Elements i `components/ai-elements/`.

- **Knappar:** en huvudhandling per vy (`Button`). Sekundära: `outline`, `secondary`, `ghost`, `link`. Ikonknappar har `aria-label`.
- **Formulär:** `FieldGroup` > `Field` > `FieldLabel` + kontroll + `FieldDescription`/`FieldError`. Etiketter ovanför fälten.
- **Listor:** `Item` (med `ItemMedia`, `ItemContent`, `ItemActions`) eller `Table` för data med kolumner.
- **Tomma lägen:** `Empty`. **Laddning:** `Skeleton`. **Bekräftelse:** `sonner`-toast.
- **Navigering:** `Sidebar` för verktyg på desktop, flikar (`Tabs`) för vyer på samma nivå, `Breadcrumb` i djupa strukturer.

## Do's and Don'ts

**Gör:**
- Låt innehållet andas. Hellre för mycket luft än för lite.
- Använd färdiga shadcn-komponenter och block före egna.
- Skriv korta, konkreta texter i kundens ton (se skillen `antrop-prototyp`, `references/ux-writing.md`).
- Visa verkliga lägen: tomt, laddar, fel, många och få poster.
- Kolla mobil och desktop, ljust och mörkt.

**Gör inte:**
- Lägg inte kort i kort, ramar i ramar eller "tiles" runt allt.
- Inga gradienter, glaseffekter, neonskuggor eller dekorativa blobbar.
- Inga emojis i gränssnittet. Använd `lucide-react`.
- Inga egna höjder på kontroller (`h-9`). Använd `size`.
- Ingen växlare för ljust och mörkt läge.
