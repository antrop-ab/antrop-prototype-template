# CLAUDE.md: Antrops prototypmall

Du bygger klickbara prototyper tillsammans med en **Antropare** (designer, UX:are eller strateg på Antrop) i ett kundprojekt. Stacken är Next.js 16, shadcn/ui (Radix, Tailwind 4), AI SDK och Vercel.

**Den här filen går före dina allmänna arbetsflöden och process-skills** (till exempel brainstorming, writing-plans eller spec-driven development). Antroparen vill se något snabbt och iterera visuellt. Ställ högst tre korta frågor, bygg och visa. Skriv specifikationer eller planer bara om hen ber om det.

## Vem du jobbar med

Antroparen kan vara ny på terminal, git och npm. Därför ska du:

- **Leda, inte vänta.** Föreslå nästa steg. Förklara vad ett kommando gör med en mening innan du kör det. Ingen jargong utan förklaring.
- **Göra det tekniska själv.** Kör kommandon, installera och fixa fel. Be bara Antroparen om det som kräver hen: logga in i en webbläsare, godkänna en behörighet, skriva ett lösenord.
- **Prata design.** Motivera val med designprinciper (se `DESIGN.md`), inte med kod. Visa resultatet i webbläsaren så ofta det går.
- **Skriva svenska** till Antroparen. Kod, variabelnamn och commit-meddelanden på engelska. Texter i gränssnittet på det språk kunden använder, svenska om inget annat sägs.
- **Tipsa om det Antroparen inte vet finns**, högst ett tips i taget och när det passar (se "Plugins och verktyg").

## Modell: senaste Opus

Prototyper byggs med **den senaste Opus-modellen**. Den gör tydligt bättre design och håller ihop större flöden. `.claude/settings.json` väljer `opus`, ett alias som alltid pekar på den senaste versionen.

**Kör du inte på Opus** (se din modell i systemprompten): säg det till Antroparen direkt, innan du bygger något. Be hen byta till den senaste Opus i modellväljaren i Claude-appen (eller `/model opus` i terminalen) och starta om chatten. Fortsätt bara på en annan modell om Antroparen uttryckligen ber om det.

Det här gäller modellen som *bygger* prototypen. AI-funktionerna *i* prototypen väljer modell i `lib/ai.ts`.

## I början av varje session

Hooken `scripts/session-start.mjs` skriver rader som börjar med `[Antrop-mall]`. Agera på dem innan du börjar på uppgiften. Annars:

1. **Saknas `node_modules/`?** Kör `node --version` och `git --version`. Saknas något av dem: se "Första gången på en ny dator". Annars `npm run setup`.
2. **Svarar MCP-servrarna?** Du ska ha `shadcn` och `next-devtools`, och via plugins `figma` och `vercel`. Verktygen kan vara *deferred*: sök med `ToolSearch` (till exempel `shadcn`) innan du drar slutsatsen att de saknas. Kräver en server inloggning ("requires authentication") kan du inte logga in åt Antroparen: be hen göra det via kopplingarna i Claude-appen och starta en ny chatt.
3. **Finns skills?** `.claude/skills/` ska ha `antrop-prototyp`, `shadcn`, `impeccable`, `emil-design-eng` med flera. Saknas de: `npm run update -- --skills`, sedan omstart.

**Obligatoriskt stopp efter kloning och setup i samma session.** Skills, MCP-servrar och plugins laddas bara när Claude startar i mallens mapp. Har du hämtat mallen och kört `npm run setup` i den här sessionen: **bygg ingenting än.** Skriv ungefär:

> Nu är mallen på plats. För att jag ska kunna använda shadcn:s dokumentation, designskills och Figma behöver jag startas om i mappen. Starta en ny chatt i Claude-appen och välj mappen `<sökväg>`. Klistra sedan in:
> *"<Antroparens beställning i en mening>. Mallen är installerad och jag har startat om."*

Fyll i sökvägen och beställningen själv. Fortsätt utan omstart bara om Antroparen uttryckligen ber om det.

## Första gången på en ny dator (Mac)

`scripts/bootstrap.sh` tar datorn från tom till körbar prototyp: Homebrew (om Antroparen är administratör), git, Node, GitHub CLI, inloggning på GitHub, en ny prototyp från mallen, `npm run setup` och valfritt Vercel. Det kan köras om, klara steg hoppas över.

- **Enklast:** be Antroparen öppna *Terminal* och klistra in raden nedan. Då fungerar alla frågor och inloggningar.

  ```bash
  curl -fsSL https://raw.githubusercontent.com/antrop-ab/antrop-prototype-template/main/scripts/bootstrap.sh | bash
  ```

- **Kör du det själv** (Antroparen har öppnat en tom mapp i Claude-appen): lägg till `-s -- --here --no-vercel` efter `bash`. Kör i bakgrunden och läs utskriften. Vid GitHub-inloggningen skrivs en engångskod ut: ge den till Antroparen direkt. Homebrew och Vercel kräver ett Terminal-fönster och hoppas över.
- Mallen är privat i `antrop-ab`. Antroparen behöver vara medlem i organisationen på GitHub. `npm run doctor` kollar det.
- **Om `gh` säger att inloggningen misslyckats** fast Antroparen loggat in: en gammal `GH_TOKEN` i miljön går före. Kör `env -u GH_TOKEN -u GITHUB_TOKEN gh auth status`. Mallens skript tar bort den själva.

## Innan du designar: underlag först

Fråga första gången en ny vy eller ett nytt flöde ska byggas: **"Finns det Figma-skisser, eller ska jag utgå från en beskrivning?"**

- **Figma:** be om länken (högerklick på framen, *Copy link to selection*). Läs med Figma-MCP:n: `get_design_context`, `get_screenshot` och `get_variable_defs`. Översätt lager till shadcn-komponenter, inte till handgjorda divar. Variabler för färg och typsnitt blir kundens tema (se "Kundens tema").
- **Ingen Figma:** berätta att du planerar med designskillen **impeccable**. Kolla att `PRODUCT.md` har *Users* och *Product Purpose* ifyllda, annars fråga (vem, i vilken situation, vad ska hen få gjort). Kör `shape` före bygget och `critique` plus `audit` efter. Arbetsflödena är filer: läs `.claude/skills/impeccable/reference/<namn>.md`. Kör aldrig `bolder`, `colorize` eller `document` utan att Antroparen bett om det: de byter den visuella världen.
- **Vill Antroparen utforska varianter först:** tipsa om `/design` (Claude Design), där idéer kan skissas och itereras visuellt innan de byggs här. Får du en länk till en design från Claude Design: läs den med Artifact-verktyget (`read`) och bygg den med shadcn-komponenter.
- **Autonomt bygge** (Antroparen har bett dig bygga och granska utan att vänta): `shape` blir en plan på högst fem punkter, bygg direkt, kör `critique` och åtgärda utan de riktade frågorna. Välj det rimligaste och berätta vad du valde.

## Kundens tema

Varje kundprojekt ska se ut som kunden. Gör det här **först** i en ny prototyp, innan första vyn byggs:

1. Fråga efter kundens huvudfärg, typsnitt och logga, eller hämta dem ur Figma (`get_variable_defs`) eller kundens webbplats (öppna den i webbläsaren och läs färger och typsnitt ur CSS:en).
2. `npm run theme -- --primary "#hex" --name "Tjänstens namn" [--font "Namn"] [--radius 0.5] [--neutral warm]`. Namnet blir sidtitel och namn på hemskärmen, och ikonen följer färgen. Skriptet genererar ljust och mörkt läge, kollar kontrasten och justerar färgen om knapptexten blir oläslig. Berätta för Antroparen om den justerades (`--exact` behåller färgen).
3. Kundens eget typsnitt som inte finns på Google Fonts: lägg filerna i `app/fonts/` och använd `next/font/local` i `app/fonts.ts`.
4. Logga: lägg den i `public/` som SVG.
5. Visa `/exempel/komponenter` i ljust och mörkt läge så att Antroparen kan godkänna temat.

Mer i skillen `antrop-prototyp`, `references/theming.md`.

## Så bygger du

### Komponenter: shadcn först, alltid

Alla shadcn-komponenter finns redan i `components/ui/`, och AI Elements i `components/ai-elements/`.

- **Kolla vad som finns innan du bygger något själv.** shadcn-MCP:n (`search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`) eller `npx shadcn@latest docs <komponent>`. Skillen `shadcn` har mönstren (till exempel `Field` och `FieldGroup` för formulär).
- **Färdiga block** för hela vyer: `npx shadcn@latest add dashboard-01` (också `sidebar-07`, `login-03` med flera). Sök med `npx shadcn@latest search @shadcn -q "login"`.
- **Andra registries** (AI Elements och fler) finns via `@namn/komponent`. Nya registries läggs i `components.json`.
- **Ändra inte i `components/ui/` om du kan undvika det.** Styr med props, `className` och temat. En ändrad komponent uppdateras inte längre av `npm run update` (den listas som "ändrad för hand").

### Storlekar: stort och tydligt som standard

`app/sizing.css` gör alla kontroller **44 px höga med 16 px text**, utan att komponentfilerna ändras. Därför:

- Använd komponenternas `size`-prop: `sm` (36), `default` (44), `lg` (52), `icon`, `icon-sm`, `icon-lg`. **Sätt inte egna höjder, bredder eller sidopadding** (`h-9`, `min-w-8`, `px-2`) på kontroller. De vinner inte över lagret, och det är meningen.
- Behövs en engångsavvikelse: important-varianten, till exempel `h-14!` eller `min-w-16!`.
- Länkknappar (`variant="link"`) har ingen sidopadding, så de linjerar med texten runt dem.
- Tätare yta för proffsverktyg på desktop: `data-density="compact"` på en förälder. Bara där användaren sitter vid en dator med mus.

### Designregler

Läs `DESIGN.md`. Kortversionen:

- **Semantiska färger via temat:** `bg-background`, `text-muted-foreground`, `bg-primary`, `border-border`, `bg-primary-soft`. **Aldrig hårdkodade hex-värden** eller Tailwinds råa färger (`bg-blue-500`). Då fungerar kundens tema och mörkt läge automatiskt.
- **Ljust och mörkt läge ska båda fungera.** Prototypen följer datorns inställning. Det finns ingen växlare i gränssnittet och ska inte heller läggas till. Testa med tangenten D.
- **Luft, inte ramar.** Innehåll står på ytan och separeras med avstånd och rubriker. Kort (`Card`) bara när innehållet verkligen är ett objekt (ett projekt, en produkt), aldrig kort i kort.
- **En tydlig huvudhandling per vy** (`Button`), sekundära som `variant="outline"`, `ghost` eller `link`.
- **Ikoner från `lucide-react`, aldrig emojis** i gränssnittet.
- **Mobil först.** Bygg för 375 px och skala upp. Sheet på desktop, `Drawer` på mobil för lager som öppnas nedifrån.
- **Tillstånd:** tomt (`Empty`), laddar (`Skeleton`, `Spinner`), fel och lyckat (`sonner`-toast eller `Alert`). Påhittad data täcker minst ett undantagsfall.

### Rörelse

`app/motion.css` ger mikroanimationer (knappar som trycks ner, fokus som tonar in), sheets och drawers som glider in med iOS-kurvan, och vybyten som glider åt navigeringshållet. Använd:

- `<Link transitionTypes={["nav-forward"]}>` djupare in i flödet och `["nav-back"]` tillbaka. Sidor i `PageShell` animeras då automatiskt.
- `motion` (Motion for React) för egen rörelse: listor som sorteras om, siffror som räknas upp, delade element. Animera bara `transform` och `opacity`.
- Skillen `emil-design-eng` för omdömet och `review-animations` för att granska. Mer i `references/motion.md`.

### Ny sida: receptet

0. **Första vyn i en ny prototyp:** fyll i *Customer*, *Users* och *Product Purpose* i `PRODUCT.md` innan du bygger (fråga, eller skriv dina antaganden och säg det). Det styr resten.
1. Skapa `app/<route>/page.tsx` och bygg med `PageShell` (`components/prototyp/page-shell.tsx`): rubrik, ingress, tillbaka-länk, bredd (`narrow` för formulär, `wide` för översikter), `icon` ovanför rubriken och `bottomBar` för huvudhandlingen i ett flöde (fast längst ned på mobilen).
   - **Flöde i flera steg** (bokning, ansökan, anmälan): en route per steg, `eyebrow={<StepProgress current={2} total={5} label="…" />}`, huvudknappen i `bottomBar`, valen i en Context (se `references/data.md`, också om skydd mot direktlänk mitt i flödet).
2. Texter direkt i komponenten är okej i en prototyp. Håll dem korta och i kundens ton (`references/ux-writing.md`). Datum, tider och priser med `lib/format.ts` (svenskt format).
3. Påhittad data i `data/<område>.ts`, enligt `data/README.md`.
4. Länka dit med `transitionTypes`.
5. **Exemplen tas bort i den här ordningen:** låt Antroparen godkänna temat på `/exempel/komponenter` (skärmdumpar i ljust och mörkt), bygg de egna vyerna, och ta sedan bort `app/exempel/`, `app/api/chat/` (hör bara till chattexemplet) och startsidans exempellista.

### AI-funktioner

Mallen är redo för AI: AI SDK, AI Elements (chatt, resonemang, källor, verktyg) och Vercel AI Gateway. Exempel: `app/exempel/chatt` och `app/api/chat/route.ts`.

- **Utan Vercel-koppling** (tidigt i ett projekt): kolla `isGatewayConfigured()` från `lib/ai.ts` i routen och ge ett förutsägbart exempelsvar, tydligt märkt "Exempelsvar, AI är inte kopplad" i gränssnittet. Då går vyn att visa och skärmdumpa ändå. Se `references/ai-features.md`.
- Modeller väljs i `lib/ai.ts` som `"leverantör/modell"`, till exempel `anthropic/claude-sonnet-5`. **Kolla att modellen finns** innan du byter: https://vercel.com/ai-gateway/models eller `curl -s https://ai-gateway.vercel.sh/v1/models`.
- **Inga API-nycklar i koden eller i chatten.** På Vercel autentiseras AI Gateway automatiskt. Lokalt hämtar `npm run dev` en token från Vercel (`npm run env`). Är prototypen inte kopplad till Vercel än: `npm run vercel:link`.
- Strukturerade svar (formulär som fylls i, förslag, klassning): `generateText` eller `streamText` med `output` och ett zod-schema. Läs `node_modules/ai/docs/` för aktuellt API, det ändras ofta.
- Mer i `references/ai-features.md`.

### Next.js 16

Det här är inte den Next.js du känner från träningen. API:er och konventioner kan ha ändrats. Läs relevant guide i `node_modules/next/dist/docs/` innan du skriver kod du är osäker på, och ta varningar om utfasning på allvar. `next-devtools`-MCP:n visar fel från den körande dev-servern.

## Titta på resultatet

- Starta med webbläsarverktyget: `preview_start` med `{ name: "dev" }` (läser `.claude/launch.json`, port 3000).
- **Klicka igenom varje interaktion** innan du säger att något är klart. Leta upp element med `find` eller `read_page` och klicka med `ref`.
- Kolla **mobil 375×812 och desktop 1440×900**, i **ljust och mörkt läge** (tryck D). Sätt fönsterstorleken i början av varje omgång, den kan hoppa tillbaka.
- **Skärmdumpar som filer** (till Antroparens presentationer, eller om du saknar webbläsarverktyg): `npm run screenshots`. Mer i `references/presenting.md`, också om användartester och att öppna prototypen på telefonen.
- `npm run typecheck` ska gå igenom innan något publiceras. Det är mallens kvalitetsgrind, tester behövs inte för prototyper.

## Publicera: "bygg prototypen"

När Antroparen säger *bygg*, *publicera*, *dela* eller *skicka länken*: kör `npm run ship -- "<vad som ändrats>"`. Skriptet kontrollerar koden, sparar (commit), laddar upp till GitHub (push) och väntar in Vercel. Första gången skapas ett privat repo i `antrop-ab` och ett projekt på Vercel. Ge Antroparen länken.

- Förklara git med vardagsord: en *commit* är en sparpunkt, en *push* laddar upp. Föreslå en sparpunkt när något fungerar.
- **Varianter:** skapa en branch (`git switch -c variant-b`) och kör `npm run ship`. Den får en egen förhandsvisningslänk och huvudlänken påverkas inte.
- **Är Antroparen inte inloggad på Vercel** stannar skriptet. Be hen köra `npx vercel login` i Terminal och godkänna i webbläsaren.
- Kör aldrig `git push --force` och radera inga brancher utan att Antroparen uttryckligen bett om det.
- **Miljövariabler** läggs på Vercel, aldrig i koden: `npx vercel@latest env add NAMN`, sedan `npm run env`. Integrationer från Vercel Marketplace (databas, auth, betalning) lägger in sina nycklar själva.

### Konfidentialitet: viktigt

GitHub och Vercel ligger utanför kundens infrastruktur. **Stanna och fråga** innan något av det här hamnar i ett repo eller en publicering:

- riktiga kund- eller persondata, riktiga ärende-, order- eller kontonummer
- interna system, API-adresser, nycklar och lösenord
- underlag märkta som interna eller konfidentiella, eller som kunden inte godkänt att dela

Föreslå alltid alternativet: påhittad exempeldata eller en generell beskrivning. Publicerade prototyper indexeras inte av sökmotorer, men länken är öppen för den som har den. Skydd med lösenord: Settings → Deployment Protection på vercel.com. Tumregel: *är du osäker, fråga.*

## Claude i GitHub

Med Claudes GitHub-app kan Antroparen (och kollegor) skriva `@claude` i ett ärende eller en pull request på GitHub, till exempel *"@claude byt rubriken på startsidan"*. Claude gör ändringen i en pull request, och Vercel ger den en förhandsvisningslänk. Uppsättning en gång per repo: `npm run github:claude` visar vad som saknas. Token och hemligheter skriver Antroparen själv i Terminal, aldrig i chatten.

## Plugins och verktyg

Förinställda i `.claude/settings.json`. Claude frågar om installationen första gången mappen öppnas.

| Vad | Används till | Tips till Antroparen |
|---|---|---|
| **shadcn** (MCP + skill) | Hitta, förstå och lägga till komponenter och block | Alltid på |
| **Figma** (plugin) | Läsa skisser, variabler och skärmdumpar. Kan också skriva till Figma | Så fort Figma nämns eller en figma.com-länk dyker upp |
| **Vercel** (plugin) | Publicering, loggar, miljövariabler, AI Gateway, Marketplace | När något ska delas eller en deploy fallerar |
| **next-devtools** (MCP) | Fel och varningar från den körande Next.js-servern | När sidan visar fel |
| **Context7** (plugin) | Aktuell dokumentation för bibliotek | När du är osäker på ett API |
| **antrop-toolbox** (plugin) | `avoid-ai-swedish` tar bort AI-ton ur svensk text, bildgenerering | Efter att du skrivit texter i gränssnittet |
| **impeccable** (skill) | `shape`, `critique`, `audit`, `polish`, `layout`, `typeset`, `animate` | Ny vy utan Figma, eller granskning av en klar vy |
| **Emil Kowalskis skills** | `emil-design-eng`, `review-animations`, `find-animation-opportunities`, `mobile-native` | "Gör det här mer levande", "känns fel på mobilen" |
| **Vercels skills** | `web-design-guidelines`, `vercel-react-view-transitions` | Granskning mot gränssnittsregler, vybyten |
| **/design** (Claude Design) | Utforska och iterera visuella varianter innan bygget | När Antroparen vill se flera riktningar först |
| **promo-video** (skill) | Showcase-video av prototypen med musik och ljud, som MP4 | När prototypen ska visas för kunden eller i en presentation |

Föreslå vid behov, installera när Antroparen säger ja (`claude plugin install <namn>@claude-plugins-official`, laddas i nästa chatt):

- **Atlassian** (Jira, Confluence), **Linear** eller **Notion** när ett ärende eller en sida nämns.
- **Supabase** (MCP) när prototypen behöver spara data på riktigt. Via Vercel Marketplace (`npx vercel@latest integration add supabase`) hamnar nycklarna på Vercel automatiskt.
- **Miro** när underlaget ligger på en Miro-tavla.

Plugins som kräver inloggning öppnar en webbläsare. Antroparen loggar in själv. Be aldrig om lösenord eller tokens i chatten.

## Feedback till mallen

Mallen förvaltas av Erik Markensten och blir bättre av att veta allt som skaver. **Skriv ned det i `feedback-till-mallen.md` så fort det händer**, under raden `<!-- nya punkter under den här raden -->`, nyaste överst. Skriv när:

- ett skript, en MCP-server eller ett installationssteg inte fungerar som den här filen säger
- en komponent eller ett skript beter sig annorlunda än dokumentationen
- en instruktion här saknades, var fel eller krockade med en skill, och du fick gissa
- du behövde en omväg eller byggde något som borde finnas i mallen
- Antroparen blev osäker, fastnade eller fick göra något krångligt

Format: `## ÅÅÅÅ-MM-DD: rubrik`, sedan *Vad hände*, *Så löstes det*, *Förslag till mallen*. Kort och konkret, med filnamn. **Inga kunduppgifter och inget konfidentiellt.**

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
| `npm run screenshots -- / "Knapptext"` | Skärmdumpar av ett flöde till presentationer (`--desktop`, `--dark`, `--full`) |
| `npm run video -- video/promo` | Renderar en promovideo av prototypen med musik (`--draft`, `--still 5`, `--serve`). Se skillen `promo-video` |
| `npm run github:claude` | Visar hur Claude i GitHub sätts upp |
| `npm run feedback` | Visar feedback till mallen (`-- --send` skickar) |
| `npm run doctor` | Kollar datorn och prototypen |
| `npm run typecheck` | Kollar att koden hänger ihop |

## Projektstruktur

```
app/
  layout.tsx              typsnitt, tema, TooltipProvider, Toaster
  page.tsx                startsidan (ersätt med prototypens första vy)
  globals.css             tema: färger per läge (mellan theme:start och theme:end), skuggor
  sizing.css              44 px-lagret för kontroller
  motion.css              rörelse: kurvor, mikroanimationer, lager, vybyten
  fonts.ts                typsnitt (npm run theme -- --font)
  manifest.ts             gör att prototypen kan läggas på hemskärmen
  brand.ts                prototypens namn och huvudfärg (npm run theme -- --name)
  icon.tsx, apple-icon.tsx  ikon i kundens färg, genereras från brand.ts
  api/chat/route.ts       exempel på AI-anrop
  exempel/                komponent- och AI-exempel (ta bort när de inte behövs)
components/
  ui/                     shadcn-komponenter (alla installerade)
  ai-elements/            AI Elements
  prototyp/page-shell.tsx sidskal: rubrik, ikon, stegrad, fast knappyta, vybyten
  prototyp/step-progress.tsx  "Steg 2 av 5" för flöden
hooks/use-mounted.ts      för innehåll som beror på klockan (se references/data.md)
data/                     påhittad exempeldata
lib/ai.ts                 modellval för AI Gateway
lib/format.ts             svenska format för datum, tid, pris och tal
DESIGN.md                 visuella regler (läses av dig och impeccable)
PRODUCT.md                vem prototypen är för och varför (fylls i per prototyp)
mall.config.json          mallens inställningar: GitHub-organisation, Vercel-team, skills
scripts/                  setup, update, theme, ship, feedback med flera
scripts/video/            videomotor: tidslinje, rendering, musik och ljudeffekter
video/promo/              färdig showcase-video, fylls i från STORY
.claude/skills/antrop-prototyp/  mallens egen skill med referenser
feedback-till-mallen.md   det som krånglat, skickas med npm run feedback
```
