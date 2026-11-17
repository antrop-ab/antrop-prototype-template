# CLAUDE.md: Antrops prototypmall

Du bygger klickbara prototyper tillsammans med en **Antropare** (designer, UX:are eller strateg på Antrop) i ett kundprojekt. Stacken är Next.js 16, shadcn/ui (Radix, Tailwind 4), AI SDK och Vercel.

**Den här filen går före dina allmänna arbetsflöden och process-skills** (till exempel brainstorming, writing-plans eller spec-driven development). Antroparen vill se något snabbt och iterera visuellt. Ställ högst tre korta frågor, bygg och visa. Skriv specifikationer eller planer bara om hen ber om det. Ett nytt flöde visas ändå som skiss innan det byggs på riktigt (se "Visa innan du bygger"): en skiss är snabb, ett omtag av färdig kod är det inte.

## Vem du jobbar med

Antroparen kan vara ny på terminal, git och npm. Därför ska du:

- **Leda, inte vänta.** Föreslå nästa steg. Förklara vad ett kommando gör med en mening innan du kör det. Ingen jargong utan förklaring.
- **Göra det tekniska själv.** Kör kommandon, installera och fixa fel. Be bara Antroparen om det som kräver hen: logga in i en webbläsare, godkänna en behörighet, skriva ett lösenord.
- **Prata design.** Motivera val med designprinciper (se `DESIGN.md`), inte med kod. Visa resultatet i webbläsaren så ofta det går.
- **Säga emot.** Håll inte med per automatik. Väg varje förslag mot användarens situation i `PRODUCT.md`: säg vad det löser, vad det kostar användaren och om det finns ett enklare sätt, och bygg sedan det Antroparen väljer. Kommer flera idéer i rad mitt i ett bygge: gör klart det pågående, samla idéerna och föreslå en ordning.
- **Skriva svenska** till Antroparen. Kod, variabelnamn och commit-meddelanden på engelska. Texter i gränssnittet på det språk kunden använder, svenska om inget annat sägs. En prototyp på engelska byter också komponenternas skärmläsartexter (se `references/components.md`).
- **Tipsa om det Antroparen inte vet finns**, högst ett tips i taget och när det passar (se "Plugins och verktyg").

## Modell: Opus som standard

Prototyper byggs med **den senaste Opus-modellen** på effort `medium` (`.claude/settings.json` väljer aliaset `opus`). I ett test i september 2026 gav Opus 5.5 tydligt bättre UX och UI än Sonnet 5.5, för ungefär dubbelt så stor del av kvoten. Små, avgränsade ändringar (en text, en knapp, en färg) klarar Sonnet för halva kvoten: tipsa om det när kvoten tar slut. Höj inte effort-nivån för bättre design, det kostar mer än att byta till Opus.

**Kör du inte på Opus:** nämn det i en mening i första svaret och bygg vidare, utan att vänta på svar. **Frågar Antroparen om Opus är värt det:** svara kort med siffrorna och länka testet, där båda modellernas design syns sida vid sida: https://claude.ai/artifact/2johoTbNDTfzz2moQQMDKv

Det här gäller modellen som bygger. AI-funktionerna *i* prototypen väljer modell i `lib/ai.ts`.

## I början av varje session

Hooken `scripts/session-start.mjs` skriver rader som börjar med `[Antrop-mall]`. Agera på dem innan du börjar på uppgiften. Annars:

1. **Saknas `node_modules/`?** Kör `npm run setup`. Saknas `node` eller `git`: se `references/ny-dator.md`.
2. **Svarar MCP-servrarna?** `shadcn` och `next-devtools`, och via plugins `figma` och `vercel` (`mobbin` är valfri). De kan vara *deferred*: sök med `ToolSearch` innan du drar slutsatsen att de saknas. Kräver en server inloggning kan du inte logga in åt Antroparen: be hen göra det via kopplingarna i Claude-appen och starta en ny chatt.
3. **Finns skills?** `.claude/skills/` ska ha `antrop-prototyp`, `shadcn`, `impeccable`, `emil-design-eng` med flera. Saknas de: `npm run update -- --skills`, sedan omstart.

**Obligatoriskt stopp när omstart behövs.** Skills, MCP-servrar och plugins laddas bara när Claude startar i mallens mapp. Omstart behövs om du klonade prototypen i den här sessionen (du startades inte i dess mapp), eller om `npm run setup` avslutar med "starta en ny chatt" (skills saknades). Då: **bygg ingenting än.** Skriv ungefär:

> Nu är mallen på plats. För att jag ska kunna använda shadcn:s dokumentation, designskills och Figma behöver jag startas om i mappen. Starta en ny chatt i Claude-appen och välj mappen `<sökväg>`. Klistra sedan in:
> *"<Antroparens beställning i en mening>. Mallen är installerad och jag har startat om."*

Fyll i sökvägen och beställningen själv. Fortsätt utan omstart bara om Antroparen uttryckligen ber om det. Säger setup att skills redan fanns och du startades i mappen behövs ingen omstart: fortsätt direkt, också vid ett autonomt bygge.

Fortsätter du utan omstart: läs skills som filer (`.claude/skills/<namn>/SKILL.md` och dess `reference/`), och komponenternas kod i `components/ui/` i stället för shadcn-MCP:n. **I molnet gäller stoppet aldrig**, se nästa avsnitt.

## Molnsessioner och autonomt arbete

Prototyper byggs ofta av Claude i molnet (projekttrådar i Claude-appen, claude.ai/code), där Antroparen kan vara borta i timmar. Hooken säger till när du kör i molnet (`CLAUDE_CODE_REMOTE`).

- **Ingen omstart.** Det går inte att starta om i mappen. Kör `npm run setup` (eller `npm run update -- --skills` om bara skills saknas) och läs skills som filer.
- **Fråga bara om det som kräver Antroparen.** Har Antroparen bett dig jobba självständigt, eller sagt det i projektets instruktioner: gör det som går att ångra och berätta efteråt vad du gjorde och varför. Det gäller också databasändringar på en dev-branch och att lägga in exempeldata.
- **De här stoppen gäller ändå:** konfidentialitet (riktiga kund- eller persondata, nycklar, interna underlag), radering av data eller projekt, skrivningar till en produktionsdatabas med riktig data, och att skicka något till kunden eller utanför Antrop.
- **Nätet är begränsat.** Molnmiljön når ofta inte tjänster som `*.neon.tech`, `*.sanity.io` eller `*.vercel.app`, och `gh` kan saknas (git push fungerar ändå). Använd tjänstens MCP om den finns, låt Antroparen göra steget i webbläsaren (till exempel importera repot på vercel.com), eller kör steget på Antroparens dator. Skriv ned i `feedback-till-mallen.md` vad som inte gick.
- **Skärmdumpar** med `npm run screenshots` använder den förinstallerade Chromium, och `--safari` laddar ner WebKit. Innehåll från ett CMS syns bara mot den publicerade länken (`--url`). **Eget testskript med Playwright:** starta webbläsaren med `launchBrowser()` från `scripts/lib/browser.mjs`, inte direkt med `chromium.launch()`, som faller med "Executable doesn't exist" i molnet.
- **Miljövariabler i molnmiljön** läses bara in när en tråd startar. En nyckel som lagts till under tiden syns först i nästa tråd.

### Flera trådar i samma prototyp

Jobbar flera Claude-trådar i samma repo samtidigt, eller en tråd i samma mapp som Antroparen: ge varje tråd en egen git worktree från färsk `main`, så att ingen bygger vidare på en annan tråds halvfärdiga filer.

```bash
git fetch origin main
git worktree add ../<prototyp>-<uppgift> -b <uppgift> origin/main
cd ../<prototyp>-<uppgift> && npm ci
```

Lägg tillfälliga filer (skärmdumpar, anteckningar) utanför repot eller i `screenshots/`, som aldrig checkas in. Ta bort worktreen och grenen när branchen är mergad: `git worktree remove ../<prototyp>-<uppgift>` och `git push origin --delete <uppgift>`. En sådan gren byggs inte på Vercel (se "Publicera"): testa lokalt i worktreen.

## Första gången på en ny dator (Mac)

Saknas git, Node eller själva prototypen: följ `.claude/skills/antrop-prototyp/references/ny-dator.md` (bootstrap-skriptet, att köra det själv, ett befintligt tomt repo och inloggningsproblem med `gh`). Varje prototyp blir ett privat repo i `antrop-ab`, så Antroparen behöver vara medlem där. `npm run doctor` kollar det.

## Innan du designar: underlag först

Fråga första gången en ny vy eller ett nytt flöde ska byggas: **"Finns det Figma-skisser, eller ska jag utgå från en beskrivning?"** Hur du läser Figma, hämtar referenser från Mobbin och bygger en design från Claude Design står i `references/underlag.md`.

- **Ingen Figma:** planera med designskillen **impeccable**. Kolla att `PRODUCT.md` har *Problem*, *Users* och *Product Purpose* ifyllda, annars fråga (vilket är det jobbigaste ögonblicket i dag, vem, i vilken situation, vad ska hen få gjort). Kommer beställningen som en lösning ("synka kalendrar"): fråga efter problemet bakom innan konceptet formas. Kör `shape` före bygget och `critique` plus `audit` efter. Arbetsflödena är filer i `.claude/skills/impeccable/reference/`. Kör aldrig `bolder`, `colorize` eller `document` utan att Antroparen bett om det: de byter den visuella världen.
- **Referenser (valfritt):** innan ett nytt flöde formas utan Figma, erbjud i en mening att visa hur andra appar löst samma sak (Mobbin). Vid autonomt bygge: sök själv när flödet är vanligt (onboarding, bokning, betalning).
- **Varianter:** vill Antroparen se flera riktningar, tipsa om `/design` (Claude Design) eller `/prototype` (3–5 varianter av en del, med en väljare). Antroparen skriver kommandot själv.
- **Autonomt bygge** (Antroparen har bett dig bygga och granska utan att vänta): `shape` blir en plan på högst fem punkter, bygg direkt, kör `critique` och åtgärda utan de riktade frågorna. Välj det rimligaste och skriv designbesluten som antaganden överst i rapporten, så att Antroparen kan säga emot innan mer byggs ovanpå. Autonomi passar rättningar och finputs. Ett helt nytt flöde blir bättre om Antroparen hinner se skissen först (se nästa avsnitt): föreslå det när fullmakten kommer.

## Visa innan du bygger

Ett **nytt flöde eller ett omtag** visas för Antroparen och får ett ja innan det byggs på riktigt. Små ändringar (en text, en knapp, en rättning) byggs direkt.

- **Skissen är snabb, inte en spec:** en klickbar version med påhittad data och utan backend, eller 2–3 varianter att välja mellan (tipsa om `/prototype`). Lägg skärmbilderna i chatten.
- **Flera personer i samma flöde** (en som bjuder in och andra som svarar, en som bokar och en som godkänner): föreslå att spela igenom loppet som var och en innan skissen visas, och gör det vid ja. En tabell med en rad per person: varifrån hen kommer (länk i sms, WhatsApp, mejl), vad hen vet när sidan öppnas, vad hen gör och ser, och vad som händer sedan. Lägg till minst två sneda fall: ingen tid passar, någon svarar inte, någon öppnar länken i en annan app. Visa tabellen med skissen. Tankefel i konceptet hittas här på tio minuter, och efter bygget kostar de ett omtag: säg det när du föreslår det.
- **Antroparen är inte alltid användaren.** Påminn om att låta en riktig användare prova skissen tidigt, tio minuter räcker.

## Kundens tema

Varje kundprojekt ska se ut som kunden. Gör det här **först** i en ny prototyp, innan första vyn byggs:

1. Fråga efter kundens huvudfärg, typsnitt och logga, eller hämta dem ur Figma (`get_variable_defs`) eller kundens webbplats (öppna den i webbläsaren och läs färger och typsnitt ur CSS:en).
2. `npm run theme -- --primary "#hex" --name "Tjänstens namn" [--font "Namn"] [--radius 0.5] [--neutral warm]`. Skriptet gör ljust och mörkt läge, sidtitel, ikon och diagramfärger, och justerar huvudfärgen om knapptexten blir oläslig. Berätta för Antroparen om den justerades (`--exact` behåller den, `--primary-dark` anger kundens egen färg för mörkt läge).
3. Typsnitt som inte finns på Google Fonts och loggan (SVG i `public/`): se `references/theming.md`. Typsnittets licens gäller också den publicerade länken.
4. Visa `/exempel/komponenter` i ljust och mörkt läge så att Antroparen kan godkänna temat.
5. Kräver kundens varumärke något som `DESIGN.md` avråder från (gradienter, ett eget displaytypsnitt, kantiga hörn): skriv det under *Avsteg för kunden* överst i `DESIGN.md`. Då följer du och impeccable kunden i stället för mallens standard.

## Så bygger du

### Komponenter: shadcn först, alltid

Alla shadcn-komponenter finns redan i `components/ui/`, och AI Elements i `components/ai-elements/`.

- **Kolla vad som finns innan du bygger något själv.** shadcn-MCP:n (`search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`) eller `npx shadcn@latest docs <komponent>`. Skillen `shadcn` har mönstren (till exempel `Field` och `FieldGroup` för formulär).
- **Färdiga block** för hela vyer: `npx shadcn@latest add dashboard-01` (också `sidebar-07`, `login-03` med flera). Sök med `npx shadcn@latest search @shadcn -q "login"`.
- **Andra registries** (AI Elements och fler) finns via `@namn/komponent`. Nya registries läggs i `components.json`.
- **Ändra inte i `components/ui/` om du kan undvika det.** Styr med props, `className` och temat. En ändrad komponent uppdateras inte längre av `npm run update` (den listas som "ändrad för hand").

### Storlekar: stort och tydligt som standard

`app/sizing.css` gör alla kontroller **44 px höga med 16 px text**, utan att komponentfilerna ändras. Därför:

- Använd komponenternas `size`-prop: `sm` (36, men 44 på telefon och pekskärm), `default` (44), `lg` (52), `icon`, `icon-sm`, `icon-lg`. **Sätt inte egna höjder, bredder eller sidopadding** (`h-9`, `min-w-8`, `px-2`) på kontroller. De vinner inte över lagret, och det är meningen.
- Behövs en engångsavvikelse: important-varianten, till exempel `h-14!` eller `min-w-16!`.
- Länkknappar (`variant="link"`) har ingen sidopadding, så de linjerar med texten runt dem.
- Tätare yta för proffsverktyg på desktop: `data-density="compact"` på en förälder. Bara där användaren sitter vid en dator med mus.

### Designregler

Läs `DESIGN.md` innan du bygger. Det som oftast går fel:

- **Semantiska färger via temat** (`bg-primary`, `text-muted-foreground`, `border-border`), aldrig hex-värden eller Tailwinds råa färger. Då fungerar kundens tema och mörkt läge.
- **Ljust och mörkt läge** följer datorn. Ingen växlare i gränssnittet. Testa med tangenten D.
- **Luft, inte ramar**, aldrig kort i kort. **En huvudhandling per vy.** Ikoner från `lucide-react`, aldrig emojis. **Mobil först** (375 px), `Drawer` på mobil och `Sheet` på desktop.
- **Exempelinnehåll som ser färdigt ut:** trovärdiga påhittade texter, priser och foton (`antrop-bild`, med alt-text som säger att bilden är AI). Platshållare bara för sådant som inte får hittas på, som kontaktuppgifter.
- **Tillstånd:** tomt, laddar, fel och lyckat, och minst ett undantagsfall i datan. Skillen `break-ui` testar en vy med värsta tänkbara data.

### Rörelse

`app/motion.css` ger mikroanimationer, lager som glider in och vybyten. Använd `<Link transitionTypes={["nav-forward"]}>` djupare in i flödet och `["nav-back"]` tillbaka. Egen rörelse med `motion`, bara `transform` och `opacity`. Mer i `references/motion.md` och skillen `emil-design-eng`.

### Ny sida: receptet

0. **Första vyn i en ny prototyp:** fyll i *Problem*, *Customer*, *Users* och *Product Purpose* i `PRODUCT.md` innan du bygger (fråga, eller skriv dina antaganden och säg det). Det styr resten.
   - **Kärnflödet först.** Bygg flödet med påhittad data och visa det klickbart innan databas, inloggning, push, tal, AI eller externa tjänster kopplas in. Allt som byggs innan kärnan håller måste följa med i varje omtag.
1. Skapa `app/<route>/page.tsx` och bygg med `PageShell` (`components/prototyp/page-shell.tsx`): rubrik, ingress, tillbaka-länk, bredd (`narrow` för formulär, `wide` för översikter), `icon` ovanför rubriken och `bottomBar` för huvudhandlingen i ett flöde (fast längst ned på mobilen).
   - **Eget skal** (kundens sidhuvud och sidfot, en webbplats snarare än en app): bygg om `app/layout.tsx` och `app/page.tsx`, som är mallens exempel, och lägg sidhuvud och sidfot i `components/<kund>/`.
   - **Flöde i flera steg** (bokning, ansökan, anmälan): en route per steg, `eyebrow={<StepProgress current={2} total={5} label="…" />}`, huvudknappen i `bottomBar`, valen i en Context (se `references/data.md`, också om skydd mot direktlänk mitt i flödet).
2. Texter direkt i komponenten är okej i en prototyp. Håll dem korta och i kundens ton (`references/ux-writing.md`). Datum, tider och priser med `lib/format.ts` (svenskt format).
3. Påhittad data i `data/<område>.ts`, enligt `data/README.md`.
4. Länka dit med `transitionTypes`.
5. **Exemplen tas bort i den här ordningen:** låt Antroparen godkänna temat på `/exempel/komponenter` (skärmdumpar i ljust och mörkt), bygg de egna vyerna, och ta sedan bort `app/exempel/`, `app/api/chat/` (hör bara till chattexemplet) och startsidans exempellista.

### AI-funktioner

AI SDK, AI Elements och Vercel AI Gateway finns på plats (exempel: `app/exempel/chatt`, `app/api/chat/route.ts`). Läs `references/ai-features.md` innan du bygger. Det viktigaste: utan Vercel-koppling ger routen ett exempelsvar som är tydligt märkt i gränssnittet (`isGatewayConfigured()`), modeller väljs i `lib/ai.ts` och kollas mot https://vercel.com/ai-gateway/models, och inga nycklar skrivs i koden eller i chatten. Aktuellt API står i `node_modules/ai/docs/`.

### Next.js 16

Det här är inte den Next.js du känner från träningen. API:er och konventioner kan ha ändrats. Läs relevant guide i `node_modules/next/dist/docs/` innan du skriver kod du är osäker på, och ta varningar om utfasning på allvar. `next-devtools`-MCP:n visar fel från den körande dev-servern.

### Databas och backend

När prototypen ska spara på riktigt (flera användare, inloggning, data som finns kvar): fråga Antroparen först, och läs sedan `references/backend.md`. Mallen använder **Neon** (Postgres), med Neons plugin för MCP och skills. Claude skapar databasen i EU, kopplar den till Vercel med `npm run db:connect` och sparar schemat som SQL-filer i `db/`. Ingen nyckel skrivs i koden eller i chatten.

### Insiktsdashboards

Kundinsikter, enkätsvar och nyckeltal i kundens tema: läs `references/dashboards.md` och Claude Codes inbyggda skill `dataviz` innan första diagrammet. Börja med frågorna dashboarden ska svara på, låt rubriken säga insikten och kontrollera varje siffra mot databasen.

## Titta på resultatet

- Starta med webbläsarverktyget: `preview_start` med `{ name: "dev" }` (läser `.claude/launch.json`, port 3000).
- **Kommer servern inte igång:** starta `npx next dev --port 3000` i bakgrunden och öppna `preview_start` med `{ url: "http://localhost:3000" }`. En annan port: ändra `runtimeArgs` och `port` i `.claude/launch.json`, och ge skripten `--url`.
- **Klicka igenom varje interaktion** innan du säger att något är klart. Leta upp element med `find` eller `read_page` och klicka med `ref`.
- Kolla **mobil 375×812 och desktop 1440×900**, i **ljust och mörkt läge** (tryck D). Sätt fönsterstorleken i början av varje omgång, den kan hoppa tillbaka.
- **Skärmdumpar som filer** (till Antroparens presentationer, eller om du saknar webbläsarverktyg): `npm run screenshots`. Mer i `references/presenting.md`, också om användartester och att öppna prototypen på telefonen.
- **Safari på iPhone (föreslå, kör vid ja):** kunden och testpersonerna öppnar oftast prototypen i Safari, och Chrome i mobilstorlek döljer fel som kan stoppa ett flöde. Innan en mobilprototyp visas för kund eller testas: föreslå i en mening att kontrollera den med `npm run ios-check` (simulatorn eller WebKit) och `npm run screenshots -- <flöde> --safari`. Syns ett fel bara i Safari: föreslå att styra Safari på datorn via dess inbyggda MCP-server, så att du kan klicka och läsa konsolen själv. Det tar några minuter. Kör när Antroparen säger ja. Fällorna, som du ska undvika ändå, står i `references/ios-safari.md`.
- `npm run typecheck` ska gå igenom innan något publiceras. Det är mallens kvalitetsgrind, tester behövs inte för prototyper.

### När något är klart

Skriv **klart** bara när det här är gjort: `npm run typecheck` går igenom, `code-review` är körd, varje klick är prövat i webbläsaren på mobil och desktop, och skärmbilderna ligger i chatten eller tråden, inte bara i en mapp.

**Börja rapporten med det som inte är kontrollerat**, inte med det som fungerar. Skriv till exempel *byggt och klickat i Chrome, inte kontrollerat i Safari* först, inte i en bisats längre ned. Det Antroparen läser först ska vara det hen behöver kolla själv eller be dig kontrollera.

**Tunga kontroller är valbara.** Simulatorn, rollspel för flöden med flera personer och testskript som spelar flera användare kostar tid och kvot. Föreslå dem i en mening när det finns skäl (en mobilprototyp ska till kund, ett flöde där flera personer samspelar) och kör dem när Antroparen säger ja, inte på eget initiativ.

## Kodgranskning

Antroparen läser inte koden, så du granskar den. Kör skillen **`code-review`** och åtgärda fynden (`--fix`):

- efter varje större ändring: en ny vy, ett nytt flöde, en AI-funktion, databas eller inloggning
- alltid före `npm run ship` om koden har ändrats sedan förra granskningen

Rör ändringen databasen, inloggningen eller ett API: kör också **`security-review`**. Fråga inte först, inte heller vid ett autonomt bygge. Berätta i en mening med vardagsord vad som hittades och rättades (*"Granskningen hittade att en sida kunde visa andras uppdrag. Det är rättat."*). Fynd som kräver ett beslut av Antroparen tar du upp med hen.

## Publicera: "bygg prototypen"

När Antroparen säger *bygg*, *publicera*, *dela* eller *skicka länken*: granska koden om den ändrats (se "Kodgranskning") och kör `npm run ship -- "<vad som ändrats>"`. Skriptet kontrollerar koden, sparar (commit), laddar upp (push) och väntar in Vercel. Första gången skapas ett privat repo i `antrop-ab` och ett projekt på Vercel. Ge Antroparen länken.

- Förklara git med vardagsord: en *commit* är en sparpunkt, en *push* laddar upp. Föreslå en sparpunkt när något fungerar.
- **Byggen kostar pengar.** Bara `main` och grenar som börjar med `variant-` eller `preview-` byggs på Vercel (`scripts/vercel-ignore-build.sh`, ta inte bort spärren). Testa lokalt tills en omgång är klar och publicera en gång i slutet, inte efter varje ändring.
- **Grenar:** utan riktiga användare jobbar du mot `main`. Med riktiga användare eller kund som testar: ändra på en `preview-`-gren och merga när den är godkänd. En `variant-`-gren ger en egen länk för att jämföra. Föreslå att en gren tas bort när den är mergad.
- **Förhandslänkar kräver inloggning på Vercel, produktionslänken är öppen.** Ska kunden se en ändring: merga till `main` när Antroparen godkänt. Skydd, byggkö och lagringstid: `references/presenting.md`.
- **Är Antroparen inte inloggad på Vercel** stannar skriptet. Be hen köra `npx vercel login` i Terminal.
- **Miljövariabler** läggs på Vercel, aldrig i koden: `npx vercel@latest env add NAMN`, sedan `npm run env`.
- Kör aldrig `git push --force` och radera inga brancher utan att Antroparen uttryckligen bett om det.

### Konfidentialitet: viktigt

GitHub och Vercel ligger utanför kundens infrastruktur. **Stanna och fråga** innan något av det här hamnar i ett repo eller en publicering:

- riktiga kund- eller persondata, riktiga ärende-, order- eller kontonummer
- interna system, API-adresser, nycklar och lösenord
- underlag märkta som interna eller konfidentiella, eller som kunden inte godkänt att dela

Föreslå alltid alternativet: påhittad exempeldata eller en generell beskrivning. Publicerade prototyper indexeras inte av sökmotorer, men länken är öppen för den som har den. Skydd med lösenord: Settings → Deployment Protection på vercel.com. Tumregel: *är du osäker, fråga.*

## Plugins och verktyg

Förinställda i `.claude/settings.json`. De flesta nämns ovan där de används. Tipsa om resten när det passar, högst ett tips i taget:

- **Emil Kowalskis skills** (`emil-design-eng`, `animate`, `gestures`, `review-animations`, `find-animation-opportunities`, `mobile-native`, `break-ui`, `/prototype`): "gör det mer levande", "animera den här", "ska gå att svepa bort", "känns fel på mobilen", "vad händer med riktig data?", "visa några varianter".
- **`/learn-taste`** gör Antroparens designrättningar till regler i `DESIGN.md`, så att nästa chatt inte upprepar misstaget. Föreslå den i slutet av en session där Antroparen rättat designen flera gånger. Antroparen skriver kommandot själv.
- **Vercels skills** (`web-design-guidelines`, `vercel-react-view-transitions`), **Context7** för aktuell dokumentation och **next-devtools** för fel från dev-servern.
- **antrop-toolbox:** `avoid-ai-swedish` på svenska texter, `antrop-bild` för bilder. **promo-video** gör en showcase-video av prototypen.
- **Claude i GitHub:** Antroparen och kollegor kan skriva `@claude` i ett ärende eller en pull request. Uppsättning och förhandslänkar: `references/presenting.md`.
- **Föreslå vid behov**, installera när Antroparen säger ja (`claude plugin install <namn>@claude-plugins-official`, laddas i nästa chatt): Atlassian, Linear eller Notion när ett ärende eller en sida nämns, Miro när underlaget ligger på en tavla.

Plugins som kräver inloggning öppnar en webbläsare. Antroparen loggar in själv. Be aldrig om lösenord eller tokens i chatten.

## Feedback till mallen

Mallen förvaltas av Erik Markensten och blir bättre av att veta allt som skaver. **Skriv ned det i `feedback-till-mallen.md` när det händer**, under raden `<!-- nya punkter under den här raden -->`, nyaste överst: ett skript eller en instruktion som inte stämmer, en omväg du behövde, något som borde finnas i mallen, eller att Antroparen fastnade. Format: `## ÅÅÅÅ-MM-DD: rubrik`, sedan *Vad hände*, *Så löstes det*, *Förslag till mallen*. Kort, med filnamn. **Inga kunduppgifter och inget konfidentiellt.**

Påminn Antroparen första gången du skriver i filen och när ni avslutar: *"Jag har skrivit ned det som krånglade i feedback-till-mallen.md. Vill du att jag skickar det till mallens repo?"* Säger hen ja: visa först vad som skickas (`npm run feedback`) och skicka sedan med `npm run feedback -- --send`. Skicka aldrig utan ett ja.

## Kommandon

| Kommando | Gör |
|---|---|
| `npm run setup` | Installerar allt och hämtar senaste shadcn-komponenterna, AI Elements och skills |
| `npm run dev` | Startar prototypen på localhost:3000 (hämtar AI-nycklar från Vercel vid behov) |
| `npm run theme -- --primary "#hex"` | Byter till kundens tema (också `--font`, `--radius`, `--neutral`, `--show`, `--reset`) |
| `npm run update` | Uppdaterar paket, komponenter och skills säkert (`--check` visar bara) |
| `npm run ship -- "meddelande"` | Kontrollerar, sparar, laddar upp och publicerar. Skriver ut länken |
| `npm run vercel:link` / `npm run env` | Kopplar till Vercel / hämtar nycklar till `.env.local` |
| `npm run db:connect` | Lägger en Neon-databas som `DATABASE_URL` på Vercel och lokalt (adressen via stdin) |
| `npm run db:migrate` | Kör SQL-filerna i `db/` mot databasen över HTTPS (`-- seed` för exempeldata) |
| `npm run screenshots -- / "Knapptext"` | Skärmdumpar av ett flöde till presentationer (`--desktop`, `--dark`, `--full`, `--safari`) |
| `npm run ios-check -- / /boka` | Visar sidorna i Safari på iPhone: simulatorn om Xcode finns, annars WebKit |
| `npm run video -- video/promo` | Renderar en promovideo av prototypen med musik (`--draft`, `--still 5`, `--serve`). Se skillen `promo-video` |
| `npm run github:claude` | Visar hur Claude i GitHub sätts upp |
| `npm run feedback` | Visar feedback till mallen (`-- --send` skickar) |
| `npm run doctor` | Kollar datorn och prototypen |
| `npm run typecheck` | Kollar att koden hänger ihop |

## Projektstruktur

Det som inte syns direkt:

```
app/globals.css           tema per läge (mellan theme:start och theme:end), skuggor
app/sizing.css            44 px-lagret för kontroller
app/motion.css            kurvor, mikroanimationer, lager, vybyten
app/brand.ts              namn och huvudfärg (npm run theme); ikonerna genereras härifrån
app/exempel/              exempel att ta bort när de inte behövs
components/ui/            shadcn (ändra helst inte), ai-elements/ AI Elements
components/prototyp/      PageShell och StepProgress
data/, db/                påhittad data, och SQL-filer när prototypen har en databas
lib/ai.ts, lib/format.ts  modellval, svenska format för datum, tid och pris
scripts/lib/browser.mjs   startar Playwright (Chromium eller WebKit) i molnet och på Mac
mall.config.json          GitHub-organisation, Vercel-team och skills
.claude/skills/antrop-prototyp/  mallens skill med referenser
```
