# Databas och backend med Neon

När prototypen ska spara på riktigt: flera användare, inloggning, data som finns kvar efter en omladdning, eller en dashboard med riktig data. Allt annat klarar sig med påhittad data i `data/` (se `data.md`).

**Fråga Antroparen först** om riktig data ska in. Se "Konfidentialitet" i `CLAUDE.md`. Påminn om att prototypen inte är produktion.

## Varför Neon

Neon är vanlig Postgres. Gratiskontot har många projekt, så varje prototyp får sitt eget och det är lätt att radera när uppdraget är slut. Databasen somnar när ingen använder den och vaknar på någon sekund. Mallen använder bara Neon. Behöver ett projekt något annat, fråga Antroparen.

## Verktygen

Pluginen `neon-postgres@neon` är förinställd i `.claude/settings.json`. Den ger:

- **Neon-MCP:n** (`https://mcp.neon.tech/mcp`): skapa projekt, köra SQL, se tabeller, hämta adressen. Första gången kräver den inloggning. Säg till Antroparen: *"Skriv `/mcp`, välj neon och logga in i webbläsaren. Har du inget konto: välj Continue with GitHub på neon.com."*
- **Neons skills:** `neon` (översikt), `neon-postgres` (anslutning, schema, frågor), `neon-auth` (inloggning) med flera. Läs dem när du skriver koden. De går före allmän kunskap om Neon, som ändras ofta.
- **Neons CLI** (`npx neon@latest`): bra för att skicka adressen vidare utan att den syns, och som reserv om MCP:n inte svarar. `npx neon@latest login` loggar in i webbläsaren. Kolla flaggorna med `--help`.

## Så kopplar du en ny databas

1. **Vercel först.** Prototypen måste vara kopplad: `npm run vercel:link` (eller en första `npm run ship`).
2. **Skapa ett Neon-projekt** med samma namn som prototypen, i **`aws-eu-central-1`** (Frankfurt). Data om kundens användare ska ligga i EU.
3. **Koppla den poolade adressen** (värdnamnet innehåller `-pooler`). Enklast med CLI:n, så att adressen aldrig syns i chatten:
   ```bash
   npx neon@latest connection-string --project-id <id> --pooled | npm run db:connect
   ```
   Har du adressen från MCP:n: `printf '%s' "postgresql://..." | npm run db:connect`.
   Skriptet lägger `DATABASE_URL` på Vercel för produktion, förhandsvisning och lokalt, och hämtar den till `.env.local`. Vercel är källan: `npm run env` skriver över `.env.local`, så lägg aldrig adressen bara lokalt. Skriv den aldrig i koden, i en fil som checkas in eller i chatten till Antroparen.
4. **Schema som filer.** Spara varje ändring som en numrerad SQL-fil i `db/` (`db/001-schema.sql`, `db/002-uppdrag-status.sql`) och kör den mot databasen. Då kan en kollega bygga upp samma databas, och ändringarna syns i git.
5. **Exempeldata** i `db/seed.sql`: påhittad, trovärdig och med undantagsfall, enligt samma regler som `data/README.md`.

## I koden

- Följ `neon-postgres` för drivrutin och anslutning. På Vercel rekommenderar Neon `pg` med `attachDatabasePool` från `@vercel/functions`.
- Fråga databasen **bara på servern**: serverkomponenter, server actions eller route handlers. Aldrig i `"use client"`-filer, och aldrig `NEXT_PUBLIC_` före en databasvariabel.
- Lägg frågorna i `lib/db.ts` eller `lib/queries/`, inte utspridda i sidorna.
- Alla värden från användaren går in som parametrar (`$1`), aldrig ihopklistrade i SQL-strängen.
- Tillstånd: laddar (`Skeleton`), tomt (`Empty`) och fel (`Alert`) gäller också när datan kommer från databasen.

## Inloggning

Använd Neon Auth (skillen `neon-auth`, Managed Better Auth). Testkonton med påhittade namn och ett enkelt gemensamt lösenord räcker i en prototyp. Skriv dem i README:n så att Antroparen kan dela dem.

## Ändringar som inte går att ångra

Radera aldrig ett Neon-projekt, en branch eller en tabell med data, och kör aldrig `DROP` eller `TRUNCATE` på data som Antroparen har lagt in, utan att hen uttryckligen bett om det. Ska schemat ändras på ett riskabelt sätt: gör det först på en Neon-branch (se `neon-postgres-branches`).

## Innan publicering

Kör `code-review` och `security-review` när en ändring rör databasen, inloggningen eller ett API (se "Kodgranskning" i `CLAUDE.md`).

## När uppdraget är slut

Föreslå att Neon-projektet raderas när kunden inte längre behöver prototypen. Gör det bara när Antroparen säger ja.
