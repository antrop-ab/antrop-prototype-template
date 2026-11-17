# Kontroller som ändringen utlöser

Läs ändringen (`git diff`, och nya filer med `git status`) och gör bara de kontroller vars utlösare finns i den, oftast två till fem. Resten hoppar du över. Listan ersätter inte grundkraven för klart i `CLAUDE.md`, den samlar fällorna som annars ligger utspridda i referenserna.

| Utlösare i ändringen | Kontroll |
|---|---|
| Filer i `db/`, en route under `app/api/`, inloggning eller sessioner | Kör `security-review`. Kolla att exempeldatan (seed) är påhittad och att ingen nyckel eller adress till databasen står i koden. Se `backend.md`. |
| En ny AI-funktion (`streamText`, `generateObject`, `useChat`) | Routen ger ett tydligt märkt exempelsvar när `isGatewayConfigured()` är falskt, och vyn har lägen för laddar och fel. Se `ai-features.md`. |
| En ny route i ett flöde med flera steg | En direktlänk till steget mitt i flödet skickar användaren till början eller visar ett begripligt läge, inte en trasig sida. Se `data.md`. |
| `fixed`, `sticky`, `bottomBar`, `100vh`, `h-screen`, `backdrop-blur`, `type="date"`, en knapp som byter `type` | Gå igenom fällorna i `ios-safari.md` och kör `npm run verify -- --full` på flödet (Safaris motor). |
| Ett textfält i samma vy som en fast knapp längst ned | Föreslå att prova på en iPhone: tangentbordet kan lägga sig över knappen. |
| Färger i klassnamn eller CSS | Bara semantiska färger (`bg-primary`, `text-muted-foreground`). Sök efter `#`, `rgb(` och Tailwinds råa färger (`bg-blue-500`) i ändringen. Kolla mörkt läge. |
| `globals.css`, `brand.ts` eller ett nytt typsnitt | Visa `/exempel/komponenter` (eller prototypens egna vyer) i ljust och mörkt läge. |
| Filer i `components/ui/` | Behövs ändringen, eller går det med props, `className` eller temat? En ändrad komponent uppdateras inte längre av `npm run update`. |
| En ny lista, tabell eller vy som visar data | Tomt, laddar och fel är hanterade, och datan har minst ett undantagsfall (långt namn, noll, många rader). Föreslå `break-ui`. |
| Datum, tider eller priser i gränssnittet | Formaterade med `lib/format.ts`, inte för hand. |
| Nya eller ändrade texter i gränssnittet | Korta, konkreta och i kundens ton (`ux-writing.md`). Längre svensk text: `avoid-ai-swedish`. |
| En ny bild | Alt-texten beskriver bilden och säger att den är AI-skapad när den är det. |
| Animationer eller `motion` | Bara `transform` och `opacity`, och vyn fungerar med reducerad rörelse. Se `motion.md`. |
| Namn, adresser, telefonnummer eller ärendenummer i `data/` eller `db/` | Är de påhittade? Riktiga kund- eller persondata: stanna och fråga (se Konfidentialitet i `CLAUDE.md`). |
| Ett nytt eller ändrat kärnflöde | Flödet finns i `flows.json` och `npm run verify` går igenom. |

## Hålla listan användbar

- En ny punkt ska ha en utlösare som går att se i en ändring, och en kontroll som går att göra på några minuter.
- Lägg bara till fel som har hänt i minst två prototyper. Ett fel som hänt en gång skrivs i `feedback-till-mallen.md`.
- Ta bort en punkt som inte längre kan hända, till exempel för att mallen nu förhindrar felet.
