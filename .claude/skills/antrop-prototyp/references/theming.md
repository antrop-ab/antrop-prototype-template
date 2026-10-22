# Kundens tema

Målet: prototypen ska se ut som kunden på fem minuter, utan att någon komponent ändras.

## Vad temat består av

| Del | Var | Hur det byts |
|---|---|---|
| Färger, ljust och mörkt läge | `app/globals.css`, mellan `theme:start` och `theme:end` | `npm run theme -- --primary "#hex"` |
| Huvudfärg i mörkt läge | samma block | Räknas fram ur `--primary` (se "Mörkt läge"). Kundens egen: `--primary-dark "#hex"` |
| Gråskalans ton | samma block | `--neutral tinted` (standard), `cool`, `warm`, `pure` |
| Hörnradie | `--radius` i samma block | `--radius 0.5` (skarpt), `0.75` (standard), `1` (mjukt) |
| Typsnitt | `app/fonts.ts` | `--font "Namn"` och `--heading-font "Namn"` (Google Fonts). Kundens egna: se "Typsnitt" nedan |
| Kontrollernas storlek | `app/sizing.css` | Variablerna i `:root` (sällan) |
| Skuggor | `@theme` i `globals.css` | För hand (sällan) |
| Namn (sidtitel, hemskärmen) | `app/brand.ts` | `--name "Kundens tjänst"` |
| Ikon (flik, hemskärmen) | `app/icon.tsx`, `app/apple-icon.tsx` | Följer `--primary` och `--name` automatiskt. Kundens riktiga ikon: ersätt filerna med `app/icon.png` och `app/apple-icon.png` |
| Logga | `public/` | Lägg SVG där, använd med `next/image` eller inline |

Blocket mellan `theme:start` och `theme:end` skrivs över av skriptet. Ändra aldrig i det för hand, använd skriptet.

## Hitta kundens färger och typsnitt

Pröva i den här ordningen:

1. **Antroparen vet dem.** Fråga: huvudfärg (hex), typsnitt, logga.
2. **Figma:** `get_variable_defs` på en frame ger kundens variabler. Leta efter en primär- eller varumärkesfärg och typsnittsfamiljen. Finns ett helt färgsystem: använd den färg som används på huvudknappar.
3. **Kundens webbplats:** öppna den i webbläsaren. Läs `getComputedStyle` på huvudknappen (`background-color`) och på `body` (`font-family`). Ta en skärmdump och bekräfta med Antroparen.
4. **Grafisk profil som PDF:** be Antroparen dela den, läs färgkoderna.

Huvudfärgen är den färg kunden använder för sin viktigaste knapp, inte nödvändigtvis loggans färg. En ljus eller gul varumärkesfärg fungerar ofta dåligt som knappfärg: skriptet väljer då mörk knapptext. Fråga hellre Antroparen om kunden har en mörkare accentfärg.

## Kontrast

Skriptet kontrollerar WCAG AA och skriver ut en tabell. Blir knapptexten för svag justeras huvudfärgen lite mörkare (eller ljusare i mörkt läge) och skriptet säger det. Berätta för Antroparen. Kräver kunden exakt färg: `--exact`, och notera i `PRODUCT.md` att kontrasten är för låg.

### Mörkt läge

I mörkt läge räknar skriptet fram en egen huvudfärg ur `--primary`:

- **Färgad huvudfärg** (blå, grön, röd): en ljusare ton av samma färg, med vit knapptext.
- **Nästan svart huvudfärg** (designsystem med svarta knappar): en ljus, nästan vit knapp med mörk text. Det är så de flesta sådana designsystem gör i mörkt läge, och skriptet säger till när det händer.
- **Kunden har ett eget mörkt läge:** läs huvudknappens färg där (Figma eller webbplatsen i mörkt läge) och ange den med `--primary-dark "#hex"`. Skriptet väljer knapptext och kollar kontrasten som vanligt.

Byts `--primary` senare försvinner `--primary-dark`, om den inte anges igen.

"Huvudfärg mot bakgrund LÅG" betyder att färgen inte syns som tunn linje eller ikon på vit bakgrund (typiskt gult). Använd den då bara som ytfärg på knappar, inte för länkar eller ikoner. Använd `text-primary-soft-foreground` på `bg-primary-soft` i stället.

## Typsnitt

- Alla typsnitt på Google Fonts fungerar med `--font`. Skriptet kontrollerar namnet.
- **Kundens egna typsnitt** (licensierade): be om webbfonter (woff2), lägg dem i `app/fonts/` och skriv om `app/fonts.ts` med `next/font/local`:

  ```ts
  import localFont from "next/font/local"
  export const fontSans = localFont({
    src: [
      { path: "./fonts/Kund-Regular.woff2", weight: "400" },
      { path: "./fonts/Kund-Medium.woff2", weight: "500" },
      { path: "./fonts/Kund-Bold.woff2", weight: "700" },
    ],
    variable: "--font-sans",
    display: "swap",
  })
  ```

- **Kundens typsnitt som npm-paket** (vissa designsystem ger ut sina typsnitt så): installera paketet och peka `next/font/local` på filerna i `node_modules/`. Då checkas filerna inte in i prototypens repo:

  ```ts
  import localFont from "next/font/local"
  export const fontSans = localFont({
    src: [
      { path: "../node_modules/@kund/fonts/KundSans-Regular.woff2", weight: "400" },
      { path: "../node_modules/@kund/fonts/KundSans-Bold.woff2", weight: "700" },
    ],
    variable: "--font-sans",
    display: "swap",
  })
  ```

  Sökvägen är relativ till `app/fonts.ts`. Kräver paketet inloggning (ett privat register): det måste också gå att installera på Vercel, annars misslyckas publiceringen. Fråga Antroparen hur kunden delar det.
- **Licensen gäller den publicerade länken.** Next.js lägger typsnittsfilerna i den publicerade prototypen, så den som har länken kan ladda ner dem. Det gäller också när filerna kommer från npm och inte ligger i repot. Publicera inte med kundens typsnitt utan att kunden godkänt det. Fråga.
- Saknas kundens typsnitt: välj ett på Google Fonts med liknande karaktär och säg det.

## Kontrollera

1. Öppna `/exempel/komponenter` och ta skärmdumpar i ljust och mörkt läge (tryck D).
2. Kolla huvudknappen, fält i fokus, valda lägen (checkbox, flikar) och en `Badge`.
3. Visa Antroparen och fråga om det känns som kunden.

## Utanför temat

- **Egna färger för en enstaka yta** (till exempel en kampanjbanner): lägg till en variabel i `:root` och `.dark` **utanför** temablocket, och registrera den i `@theme inline` som `--color-<namn>`. Då fungerar `bg-<namn>`.
- **Täthet:** kund med proffsverktyg på desktop kan få `data-density="compact"` på verktygsytan, inte globalt.
