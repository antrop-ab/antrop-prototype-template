# Visa prototypen

## Länk att dela

`npm run ship` ger en länk på Vercel. Huvudlänken (`<namn>.vercel.app`) uppdateras vid varje publicering från `main`. En branch ger en egen förhandsvisningslänk, bra för att visa varianter A och B.

- Länken är öppen för den som har den, men indexeras inte av sökmotorer.
- **Förhandsvisningar och produktion skyddas olika.** Med Vercels standardinställning (*Standard Protection*) kräver förhandsvisningar av brancher inloggning på Vercel, medan produktionslänken (`<namn>.vercel.app`) är öppen. Vill Antroparen ha en enkel länk till kunden: publicera från `main`. Ska ingenting vara öppet: Settings → Deployment Protection → *All Deployments* på vercel.com (lösenord kräver Vercels Pro-plan). Kontrollera med `curl -sI <länk>` att svaret är en omdirigering till inloggningen.
- **Kommentarer från kunden:** Vercels verktygsrad på förhandsvisningar låter inloggade kommentera direkt på sidan. Kommentarerna syns på vercel.com och kan läsas av Claude via Vercel-pluginen.

## På telefonen

- Öppna länken på telefonen och välj *Lägg till på hemskärmen*. Prototypen öppnas då i helskärm utan webbläsarens adressfält (`app/manifest.ts`), som en riktig app. Bra i användartester.
- Lokalt: `npm run dev` och öppna datorns adress i nätverket (Next skriver ut den som *Network*) på telefonen, i samma wifi.

## Skärmdumpar till presentationer och rapporter

```bash
npm run screenshots -- / /exempel/komponenter
npm run screenshots -- /boka "Välj tid" "Bekräfta" --desktop --dark
```

Ett steg som börjar med `/` är en adress, ett steg med `=` fyller i ett fält (`"E-post=anna@exempel.se"`, etiketten före likhetstecknet), och allt annat är texten på något att klicka på: en knapp, länk, radioknapp, kryssruta eller flik. Skärmdumpar tas efter varje steg. Bilderna hamnar i `screenshots/` i mobilformat, med `--desktop` även i 1440 px och med `--dark` i mörkt läge. `--full` tar hela sidan. Dev-servern måste vara igång.

Bilderna tas med reducerad rörelse, så att element som tonar in syns direkt (`--motion` behåller rörelsen). **Kommer innehållet från ett CMS eller en tjänst som dev-servern inte når** (vanligt i molnet): ta bilderna mot den publicerade prototypen med `--url https://<namn>.vercel.app`, gärna på Antroparens dator. I molnet används den förinstallerade Chromium automatiskt.

Vill Antroparen ha bilderna i Figma: Figma-pluginen kan skriva in dem, eller bygga om vyn som redigerbara lager (`/figma-generate-design`).

## Användartester

- **Förutsägbart:** påhittad data som är likadan varje gång, och en återställning mellan testpersoner (se `references/data.md`).
- **Inga återvändsgränder:** knappar som inte är byggda ska göra något rimligt (en toast "Finns inte i prototypen") hellre än ingenting.
- **Scenarier:** behöver testet olika utgångslägen (ny kund, kund med skuld), lägg dem som `?scenario=ny` i adressen och läs med `useSearchParams`.
- **Mät om det behövs:** `@vercel/analytics` ger sidvisningar och klick. Fråga först, och berätta för testpersonerna.
