# Safari på iPhone

De flesta prototyper testas av kunden och testpersonerna i Safari på en iPhone. Chrome i mobilstorlek är inte samma sak: Safari har en annan motor (WebKit) och ett eget verktygsfält och tangentbord. Fel som bara syns där har stoppat hela flöden, till exempel ett steg som hoppades över och datumfält som gick utanför skärmen.

## Kontrollera

| Kommando | Vad det visar | Vad det inte visar |
|---|---|---|
| `npm run ios-check -- / /boka` | Riktig Safari i iOS-simulatorn om Xcode finns, annars WebKit som iPhone. Skriver ut vilket som användes | Klick i simulatorn. Utan Xcode: verktygsfältet och tangentbordet |
| `npm run screenshots -- /boka "Välj tid" "Fortsätt" --safari` | Klickflödet i WebKit som en iPhone 13 mini | Verktygsfältet och tangentbordet |
| Antroparens egen iPhone | Allt, också tangentbordet | — |

- **Mobilprototyp:** kör `ios-check` på vyerna du ändrat, och `screenshots --safari` på flödet, innan du säger att något är klart. Lägg bilderna i tråden.
- **Xcode** finns bara om Antroparen har installerat det (15 GB från App Store). Be inte om det för en enskild prototyp: WebKit räcker för det mesta, och Antroparens iPhone tar resten.
- **I molnet** finns ingen simulator. WebKit laddas ner automatiskt. Säg i rapporten att verktygsfältet och tangentbordet inte är kontrollerade.
- **Telefonen:** `npm run dev` skriver ut en *Network*-adress som telefonen når i samma wifi, eller publicera och öppna länken.

## Fällor

Mallen rättar det som går i sin egen kod. Det här är det du själv behöver tänka på.

- **Datum- och tidsfält** (`<input type="date">`): Safari ritar en egen kontroll som centrerar texten, ignorerar höjden och kan bli bredare än skärmen. `app/sizing.css` sätter `appearance: none` och `min-width: 0`. Ligger fältet i en grid eller flex-rad: ge också cellen `min-w-0`.
- **En knapp som byter typ mitt i ett klick.** En knapp i ett formulär som renderas om från `type="button"` till `type="submit"` (till exempel "Nästa" som blir "Skicka" i sista steget) kan skicka formuläret i samma tryck i Safari. Ge knapparna olika `key`, eller låt bara den sista vara `type="submit"`.
- **Fast knappyta och tangentbordet.** När tangentbordet är uppe kan `PageShell`s `bottomBar` hamna mitt i skärmen eller bakom tangentbordet. Lägg inte textfält som behöver tangentbordet i samma vy som en fast knapp utan att prova på en iPhone, eller låt formuläret ha knappen i flödet.
- **Verktygsfältets färg.** Safari färgar sitt verktygsfält efter sidans bakgrund och efter fasta ytor längst ned. En halvgenomskinlig yta (`bg-background/80`, `backdrop-blur`) ger fel färg, ofta vitt i mörkt läge. Håll fasta ytor ogenomskinliga.
- **`100vh`** räknar inte med Safaris adressfält. Använd `min-h-dvh` eller `h-dvh`.
- **Vybyten** (`ViewTransition`) och `backdrop-filter` beter sig annorlunda i Safari. Klicka igenom flödet med `--safari`.
- **Länkar som öppnas i en annan app** (WhatsApp, Messenger, Mail) öppnas i appens egen webbläsare, utan Safaris inloggningar och sparade data. Prova en delad länk på det sättet om flödet börjar där.

Hittar du en ny fälla: lägg till den här, och skriv den i `feedback-till-mallen.md` så att mallen kan rätta den.
