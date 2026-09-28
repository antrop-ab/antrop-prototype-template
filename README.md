# Antrops prototypmall

> ## Till Claude: börja här
>
> Antroparen har gett dig länken till en **mall**. Läs inte bara om den, och skriv inga planer ännu. Gör så här, i ordning:
>
> 0. **Är mallens mapp redan öppen** (det finns en `CLAUDE.md` och en `mall.config.json` i arbetsmappen)? Hoppa till steg 5.
> 1. **Kolla verktygen:** `git --version`, `node --version` och `gh auth status --hostname github.com`. Saknas något **på Mac** och är mappen tom: kör `curl -fsSL https://raw.githubusercontent.com/antrop-ab/antrop-prototype-template/main/scripts/bootstrap.sh | bash -s -- --here --no-vercel` i bakgrunden och läs utskriften. Skriptet installerar git (Antroparen klickar *Installera* i en ruta), Node och GitHub CLI, loggar in på GitHub (ge Antroparen engångskoden som skrivs ut), skapar ett privat repo i `antrop-ab` från mallen i mappen och kör `npm run setup`. Gå sedan till steg 4.
> 2. **Hämta mallen till mappen du står i**, om den är tom (`ls -A` visar inget, eller bara `.DS_Store` eller `.claude`). Mallen är publik, men prototypen skapas som ett privat repo i `antrop-ab`, så GitHub-inloggningen behövs:
>    `gh repo create antrop-ab/<namn> --template antrop-ab/antrop-prototype-template --private` och sedan `git init -b main && git remote add origin https://github.com/antrop-ab/<namn>.git && git fetch origin main && git checkout -f -B main --track origin/main`. Välj `<namn>` efter kund och ämne, till exempel `forsakring-skadeanmalan`, eller mappens namn. Är mappen inte tom: föreslå att Antroparen skapar en tom mapp och öppnar den i Claude-appen.
> 3. **Kör `npm run setup`.** Det installerar allt och hämtar senaste versionen av shadcn-komponenterna och skills.
> 4. **Stanna och be Antroparen starta en ny chatt i mappen** (se "Obligatoriskt stopp" i `CLAUDE.md`). Först då laddas skills, MCP-servrar och plugins. Ge ett färdigt meddelande att klistra in efter omstarten. Bygg ingenting före omstarten.
> 5. **Läs `CLAUDE.md` och följ den.** Den går före dina allmänna arbetsflöden och skills.

En mall för Antropare som vill bygga klickbara prototyper i kod i sina kundprojekt, tillsammans med Claude. Visa en Figma-skiss eller beskriv vad du vill ha, så bygger Claude det. Säg "publicera" så får du en länk att skicka till kunden.

- **Snyggt från start.** shadcn/ui med ett genomtänkt standardutseende: rent, luftigt och linjärt. Stora, tydliga kontroller (44 punkter) och rörelse som känns rätt.
- **Kundens utseende på fem minuter.** Ett kommando byter färger, typsnitt och hörnradie, i både ljust och mörkt läge, med kontrollerad kontrast.
- **Claude kan designsystemet.** shadcn:s MCP-server och skill, designskills (impeccable, Emil Kowalskis skills för rörelse, Vercels gränssnittsregler) och Figma.
- **Redo för AI.** AI SDK, AI Elements och Vercel AI Gateway. Inga API-nycklar att hantera.
- **Publicera med ett ord.** Claude sparar, laddar upp till GitHub och publicerar på Vercel. Nycklar och miljövariabler ligger på Vercel.
- **Alltid senaste versionen.** Setup och `npm run update` hämtar senaste shadcn-komponenterna och skills, utan att skriva över det du anpassat.
- **Lär sig av er.** Det som krånglar skrivs ned och kan skickas till mallens repo med ett kommando.

## Kom igång

### Snabbast på Mac: ett kommando

Öppna **Terminal** (Cmd+Mellanslag, skriv "Terminal") och klistra in:

```bash
curl -fsSL https://raw.githubusercontent.com/antrop-ab/antrop-prototype-template/main/scripts/bootstrap.sh | bash
```

Skriptet installerar det som saknas (Homebrew, git, Node, GitHub CLI), loggar in dig på GitHub, skapar din prototyp som ett privat repo i `antrop-ab`, installerar allt och kopplar till Vercel om du vill. Öppna sedan mappen i Claude-appen, fliken *Code*. Mer i [docs/kom-igang.md](docs/kom-igang.md). Verktygen och inloggningen sköts av [antrop-setup](https://github.com/antrop-ab/antrop-setup), som är gemensamt för Antrops mallar.

Du behöver: ett GitHub-konto som är medlem i [antrop-ab](https://github.com/antrop-ab), ett Claude-konto och gärna ett Vercel-konto (logga in med GitHub).

### Via Claude

Skapa en **tom mapp** (till exempel `Dokument/kund-prototyp`), öppna den i Claude-appen och klistra in länken till den här sidan. Claude hämtar mallen och installerar allt. Starta sedan en ny chatt i samma mapp.

## Så jobbar du

Bygg med **den senaste Opus-modellen** (mallen väljer den automatiskt). Den gör tydligt bättre design. För små ändringar, som en text eller en knapp, räcker Sonnet, som drar ungefär hälften så mycket av kvoten. Kostar Opus för mycket? Se [testet där Opus och Sonnet byggde samma prototyp](https://claude.ai/artifact/2johoTbNDTfzz2moQQMDKv).

Skriv till Claude som till en kollega:

- *"Kunden är ett försäkringsbolag, huvudfärgen är #0B5FFF och de använder typsnittet Inter. Sätt temat."*
- *"Här är Figma-skissen på skadeanmälan: <länk>. Bygg den."*
- *"Gör en vy där kunden ser sina ärenden. Ingen skiss finns."*
- *"Lägg till en AI-assistent som hjälper kunden att beskriva skadan."*
- *"Granska vyn och gör den bättre."*
- *"Gör det mer levande."*
- *"Publicera"* eller *"bygg prototypen"* (du får en länk att dela)
- *"Gör en variant B med stegen i en annan ordning"* (egen länk, huvudlänken påverkas inte)
- *"Ta skärmdumpar av flödet till presentationen."*
- *"Gör en promovideo av prototypen."* (en MP4 med musik, i kundens färger)

Vill du utforska flera visuella riktningar innan något byggs: prova `/design` (Claude Design).

## Kommandon

Claude kör dem åt dig, men de finns här om du vill veta vad som händer.

| Kommando | Gör |
|---|---|
| `npm run setup` | Installerar allt och hämtar senaste komponenterna och skills |
| `npm run dev` | Startar prototypen på http://localhost:3000 |
| `npm run theme -- --primary "#0B5FFF" --font "Inter"` | Byter till kundens tema |
| `npm run ship -- "Vad som ändrats"` | Sparar, laddar upp och publicerar. Skriver ut länken |
| `npm run screenshots -- / "Knapptext"` | Skärmdumpar av ett flöde, mobil och desktop, ljust och mörkt |
| `npm run video -- video/promo` | Showcase-video av prototypen med musik och ljud |
| `npm run update` | Uppdaterar paket, komponenter och skills |
| `npm run feedback` | Visar feedback till mallen (`-- --send` skickar) |
| `npm run doctor` | Kollar att datorn och prototypen har allt |

Fler i [CLAUDE.md](CLAUDE.md).

## Vad som ingår

| | |
|---|---|
| **Ramverk** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Komponenter** | Alla shadcn/ui-komponenter (Radix, stilen vega), AI Elements |
| **Utseende** | Figtree, Lucide-ikoner (tunnare streck), indigo huvudfärg, gråskala med en aning färg, mjuka skuggor, 12 px radie |
| **Storlekar** | Kontroller 44 px och 16 px text som standard (`app/sizing.css`), tät variant för proffsverktyg |
| **Rörelse** | Knapptryck, sheets och drawers med iOS-kurva, vybyten åt navigeringshållet, Motion for React (`app/motion.css`) |
| **AI** | AI SDK, AI Elements, Vercel AI Gateway (Claude, GPT, Gemini med flera) |
| **MCP-servrar** | shadcn, Next.js devtools. Via plugins: Figma, Vercel, Context7 |
| **Skills** | antrop-prototyp (mallens egen), shadcn, impeccable, Emil Kowalskis skills för rörelse och mobil, Vercels gränssnittsregler och vybyten, avoid-ai-swedish |
| **Publicering** | GitHub (privat repo i antrop-ab) och Vercel. Claude i GitHub via `@claude` |
| **Telefon** | Kan läggas på hemskärmen och öppnas i helskärm, bra i användartester |
| **Video** | Promovideor av prototypen med syntetiserad musik och ljudeffekter, renderade lokalt (Playwright, GSAP, ffmpeg) |

## Hur det hänger ihop

| Fil | För vem |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Claudes instruktioner: arbetssätt, regler, kommandon |
| [DESIGN.md](DESIGN.md) | Visuella regler (läses av Claude och designskillen impeccable) |
| [PRODUCT.md](PRODUCT.md) | Vem prototypen är för och varför. Fylls i per prototyp |
| [mall.config.json](mall.config.json) | GitHub-organisation, Vercel-team och vilka skills som installeras |
| `.claude/settings.json`, `.mcp.json` | Plugins, MCP-servrar, behörigheter och starthook |
| `.claude/skills/antrop-prototyp/` | Mallens egen skill: tema, komponenter, texter, rörelse, AI, data, presentation |
| [feedback-till-mallen.md](feedback-till-mallen.md) | Det som krånglat, skickas med `npm run feedback -- --send` |
| [docs/kom-igang.md](docs/kom-igang.md) | Steg för steg från tom dator till delad prototyp |

## För den som förvaltar mallen

- **Feedback** kommer som ärenden i [mallens repo](https://github.com/antrop-ab/antrop-prototype-template/issues), skickade med `npm run feedback -- --send`.
- **Vercel-team:** sätt `vercelScope` i `mall.config.json` till Antrops team när det finns, så hamnar alla prototyper där. Med ett team på Pro-planen kan privata repon i `antrop-ab` kopplas så att varje push publiceras, och AI Gateway faktureras samlat.
- **Vercels GitHub-app** behöver vara installerad för `antrop-ab` för att push ska publicera automatiskt. Utan den publicerar `npm run ship` direkt från datorn i stället.
- **Claude i GitHub:** installera [Claudes GitHub-app](https://github.com/apps/claude) för `antrop-ab` en gång. Varje repo behöver sedan hemligheten `CLAUDE_CODE_OAUTH_TOKEN` (`npm run github:claude`).
- **Skills** läggs till eller tas bort i `mall.config.json`. De hämtas färska vid varje setup och update och checkas inte in, utom `antrop-prototyp`.
- **Mallen själv** uppdateras genom att köra `npm run update -- --fresh` här, granska och committa. Kontrollera `/exempel/komponenter` i ljust och mörkt läge efteråt.
- GitHub-repot ska vara markerat som *Template repository* (Settings → General), annars fungerar inte `gh repo create --template`.
