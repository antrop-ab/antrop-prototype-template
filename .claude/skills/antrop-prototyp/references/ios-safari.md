# Safari på iPhone

De flesta prototyper testas av kunden och testpersonerna i Safari på en iPhone. Chrome i mobilstorlek är inte samma sak: Safari har en annan motor (WebKit) och ett eget verktygsfält och tangentbord. Fel som bara syns där har stoppat hela flöden, till exempel ett steg som hoppades över och datumfält som gick utanför skärmen.

## Kontrollera

| Kommando | Vad det visar | Vad det inte visar |
|---|---|---|
| `npm run ios-check -- / /boka` | Riktig Safari i iOS-simulatorn om Xcode finns, annars WebKit som iPhone. Skriver ut vilket som användes | Klick i simulatorn. Utan Xcode: verktygsfältet och tangentbordet |
| `npm run screenshots -- /boka "Välj tid" "Fortsätt" --safari` | Klickflödet i WebKit som en iPhone 13 mini | Verktygsfältet och tangentbordet |
| Safari på datorn via MCP (se nedan) | Riktig Safari med samma motor som på iPhone, där du själv klickar, skriver, läser konsolen och tar skärmbilder i 375 px bredd | iPhones verktygsfält, tangentbord och säkra ytor |
| Antroparens egen iPhone | Allt, också tangentbordet | — |

- **Föreslå, kör vid ja.** Innan en mobilprototyp visas för kund eller testas: föreslå i en mening att kontrollera den i Safari, och säg varför (Safari visar fel som Chrome döljer). Kör `ios-check` på vyerna och `screenshots --safari` på flödet när Antroparen säger ja, och lägg bilderna i tråden. Säger hen nej: skriv i rapporten att Safari inte är kontrollerat.
- **Xcode** finns bara om Antroparen har installerat det (15 GB från App Store). Be inte om det för en enskild prototyp: WebKit räcker för det mesta, och Antroparens iPhone tar resten.
- **I molnet** finns ingen simulator. WebKit laddas ner automatiskt. Säg i rapporten att verktygsfältet och tangentbordet inte är kontrollerade.
- **Telefonen:** `npm run dev` skriver ut en *Network*-adress som telefonen når i samma wifi, eller publicera och öppna länken.

## Safari på datorn via MCP

Safari 27 och senare (och Safari Technology Preview 247 och senare) har en inbyggd MCP-server. Med den styr du riktig Safari på Antroparens Mac: öppna sidor, klicka och skriva, läsa konsolen och nätverket, och ta skärmbilder. Motorn är densamma som på iPhone, så fel i layout, formulär och klick syns här. Med `set_viewport_size` till 375 × 812 blir fönstret lika brett som en telefon. Tangentbordet, Safaris verktygsfält och säkra ytor på en iPhone syns inte.

Det är det snabbaste sättet att felsöka ett Safari-fel interaktivt, snabbare än simulatorn och utan Xcode. Föreslå det när ett fel bara syns i Safari, eller när du vill klicka igenom ett flöde i Safari i stället för att bara ta bilder. Det fungerar bara på Antroparens Mac, inte i molnet.

**Finns det redan?** Sök efter `safari` med `ToolSearch`. Finns verktyg som `navigate_to_url` och `page_interactions` är det klart. Annars, med Antroparens ja:

1. **Safari-versionen:** `defaults read /Applications/Safari.app/Contents/Info.plist CFBundleShortVersionString` ska vara 27 eller högre. Är den lägre: uppdatera macOS, eller använd `ios-check` och `screenshots --safari` i stället.
2. **Antroparen slår på det i Safari** (två kryssrutor, bara första gången): under *Safari → Inställningar → Avancerat* kryssa i *Show features for web developers*, och under fliken *Developer* (Utvecklare) som då dyker upp kryssa i *Allow remote automation and external agents*. På en svensk Mac heter rutorna ungefär *Visa funktioner för webbutvecklare* och *Tillåt fjärrstyrning*. Be Antroparen läsa upp vad det står om du är osäker.
3. **Du kopplar det till Claude Code**, för alla projekt på datorn: `claude mcp add --scope user safari -- /usr/bin/safaridriver --mcp`. För Technology Preview: byt sökvägen till `"/Applications/Safari Technology Preview.app/Contents/MacOS/safaridriver"`.
4. **Starta om.** MCP-servrar laddas när Claude startar. Be Antroparen starta en ny chatt i samma mapp och klistra in vad ni höll på med.

Arbeta sedan mot dev-servern (`http://localhost:3000`): `set_viewport_size` 375 × 812, `navigate_to_url`, läs sidan med `get_page_content` (bättre än skärmbilder för att hitta element), klicka och skriv med `page_interactions`, kolla `browser_console_messages` och ta en `screenshot` att lägga i tråden. Säg i rapporten att det är Safari på datorn, inte på en iPhone.

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
