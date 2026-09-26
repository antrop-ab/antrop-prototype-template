# Kom igång: från tom dator till delad prototyp

Den här guiden är för dig som inte har kodat så mycket. Du behöver inte förstå allt. **Tips:** så fort Claude är igång kan du skriva *"Hjälp mig igenom docs/kom-igang.md"*, så tar Claude dig igenom resten och kör kommandona åt dig.

## Det här behöver du

| | Varför | Skaffa |
|---|---|---|
| **Claude-appen** | Här jobbar du med Claude, fliken *Code* | [claude.com/download](https://claude.com/download) |
| **GitHub-konto** i `antrop-ab` | Mallen och dina prototyper ligger där | [github.com/signup](https://github.com/signup), be sedan någon på Antrop bjuda in dig till [antrop-ab](https://github.com/antrop-ab) |
| **Vercel-konto** | Länkar att dela och AI-funktioner | [vercel.com/signup](https://vercel.com/signup), välj *Continue with GitHub* |
| **Figma** (valfritt) | Om Claude ska läsa dina skisser | Du loggar in första gången Claude behöver det |

## Snabbast på Mac: ett kommando

Öppna **Terminal** (Cmd+Mellanslag, skriv "Terminal"), klistra in raden och tryck Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/antrop-ab/antrop-prototype-template/main/scripts/bootstrap.sh | bash
```

Det här gör du själv under tiden:

1. **Homebrew eller inte.** Är ditt konto administratör frågar skriptet om det ska installera Homebrew. Svara ja och skriv ditt datorlösenord (det syns inte medan du skriver). Saknar du administratörsbehörighet hoppas Homebrew över och allt annat fungerar ändå. Då kan en ruta om utvecklarverktyg dyka upp: klicka *Installera* (ger git, tar 5 till 15 minuter).
2. **Logga in på GitHub.** Webbläsaren öppnas och koden i Terminal är redan kopierad. Klistra in och klicka *Authorize*.
3. **Döp prototypen**, gärna efter kund och ämne, till exempel `forsakring-skadeanmalan`. Den hamnar i `Dokument/` och som ett privat repo i `antrop-ab`.
4. **Koppla till Vercel.** Svara ja och logga in med GitHub i webbläsaren. Då kan Claude publicera och använda AI direkt.

Öppna sedan Claude-appen, fliken *Code*, starta en ny chatt och välj mappen. Frågar Claude om du litar på mappen: svara ja, annars laddas inte mallens inställningar. Klart.

Skriptet kan köras igen när som helst, till exempel om något avbröts. Det som redan är klart hoppas över. Vill du bara installera verktygen: lägg till `-s -- --no-project` efter `bash`.

## Utan Terminal: låt Claude göra det

1. Skapa en tom mapp, till exempel `Dokument/kund-prototyp`.
2. Öppna Claude-appen, fliken *Code*, starta en ny chatt och välj mappen.
3. Klistra in länken till mallen: `https://github.com/antrop-ab/antrop-prototype-template`
4. Claude installerar det som saknas och ber dig ibland klicka *Installera* eller logga in.
5. När Claude ber dig: starta en ny chatt i **samma mapp**. Då laddas allt Claude behöver.

## Första prototypen

Kolla att modellväljaren i Claude-appen står på **Opus**, den senaste versionen. Mallen väljer den automatiskt, men det går att ändra. Opus gör tydligt bättre design än de mindre modellerna.

Börja med kundens utseende, sedan första vyn:

- *"Kunden är Fjällbanken. Huvudfärgen är #0B5FFF och typsnittet Inter. Sätt temat."*
- *"Här är Figma-skissen: <länk>. Bygg den."* (högerklicka på framen i Figma och välj *Copy link to selection*)
- *"Gör en vy där kunden ser sina lån och kan ansöka om ett nytt. Ingen skiss finns."*

Claude visar prototypen i en förhandsvisning bredvid chatten. Säg vad du vill ändra, precis som till en kollega.

## Dela med kunden

Säg *"publicera"*. Claude sparar, laddar upp till GitHub och publicerar på Vercel. Du får en länk, till exempel `fjallbanken-lan.vercel.app`, som uppdateras varje gång du publicerar.

- **Varianter:** *"Gör en variant B och publicera den separat."* Varianten får en egen länk.
- **På telefonen:** öppna länken och välj *Lägg till på hemskärmen*. Då öppnas prototypen i helskärm, som en app.
- **Skärmdumpar:** *"Ta skärmdumpar av flödet till presentationen."*

> **Kom ihåg:** GitHub och Vercel ligger utanför kundens system. Använd påhittad data. Lägg inte kundens interna underlag, riktiga personuppgifter eller nycklar i prototypen. Claude frågar om den är osäker.

## Claude i GitHub (valfritt)

Med Claudes GitHub-app kan du och kollegor skriva `@claude byt rubriken på startsidan` i ett ärende på GitHub, så gör Claude ändringen och Vercel ger en länk att titta på. Säg *"sätt upp Claude i GitHub"* så guidar Claude dig. En sak gör du själv i Terminal: klistrar in en token som bara ska synas för dig.

## När något krånglar

- Skriv till Claude vad som hände. Claude kör `npm run doctor` och tar det därifrån.
- *"command not found"* direkt efter en installation: stäng Terminal och öppna igen.
- Claude verkar inte känna till shadcn eller Figma: starta en ny chatt i prototypens mapp.
- Prototypen visar fel innehåll: en annan prototyp kan redan köra på port 3000. Titta i utskriften från `npm run dev` vilken adress den fick.
- Något i mallen fungerar inte som det ska: Claude skriver ned det i `feedback-till-mallen.md`. Säg *"skicka feedbacken"* när ni är klara, så hamnar det hos den som förvaltar mallen.

## Windows

Mallen är gjord för Mac. På Windows: installera [Git](https://git-scm.com/downloads/win), [Node.js LTS](https://nodejs.org) och [GitHub CLI](https://cli.github.com), logga in med `gh auth login --hostname github.com --git-protocol https --web --scopes workflow`, och följ sedan "Utan Terminal" ovan.
