# Databas och backend med Neon

När prototypen ska spara på riktigt: flera användare, inloggning, data som finns kvar efter en omladdning, eller en dashboard med riktig data. Allt annat klarar sig med påhittad data i `data/` (se `data.md`).

**Kärnflödet först.** Bygg och visa flödet med påhittad data innan databasen kopplas in. Allt som byggs innan flödet håller måste följa med i varje omtag.

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
4. **Schema som filer.** Spara varje ändring som en numrerad SQL-fil i `db/` (`db/001-schema.sql`, `db/002-uppdrag-status.sql`) och kör den mot databasen, med Neon-MCP:n eller `npm run db:migrate` (kräver `npm install @neondatabase/serverless`). Skriv filerna så att de går att köra om. Då kan en kollega bygga upp samma databas, och ändringarna syns i git.
5. **Exempeldata** i `db/seed.sql` (`npm run db:migrate -- seed`): påhittad, trovärdig och med undantagsfall, enligt samma regler som `data/README.md`.

## I koden

- Följ `neon-postgres` för drivrutin och anslutning. På Vercel rekommenderar Neon `pg` med `attachDatabasePool` från `@vercel/functions`.
- **Port 5432 är ofta stängd** i Claudes molnmiljö, så `psql` och `pg` får "connection refused" där. Neons HTTP-drivrutin `@neondatabase/serverless` går över vanlig HTTPS och fungerar både i molnet och på Vercel. Den kör en fråga per anrop, vilket räcker för en prototyp:
  ```ts
  // lib/db.ts
  import "server-only"
  import { neon } from "@neondatabase/serverless"
  export const sql = neon(process.env.DATABASE_URL!)
  // const rows = await sql`select * from uppdrag where id = ${id}`
  ```
- Fråga databasen **bara på servern**: serverkomponenter, server actions eller route handlers. Aldrig i `"use client"`-filer, och aldrig `NEXT_PUBLIC_` före en databasvariabel.
- Lägg frågorna i `lib/db.ts` eller `lib/queries/`, inte utspridda i sidorna.
- Alla värden från användaren går in som parametrar (`$1`), aldrig ihopklistrade i SQL-strängen.
- Tillstånd: laddar (`Skeleton`), tomt (`Empty`) och fel (`Alert`) gäller också när datan kommer från databasen.

## Inloggning

Använd Neon Auth (skillen `neon-auth`, Managed Better Auth). Testkonton med påhittade namn och ett enkelt gemensamt lösenord räcker i en prototyp. Skriv dem i README:n så att Antroparen kan dela dem.

## Dev och produktion

När riktiga användare (eller kunden) har lagt in data i prototypen: arbeta mot en Neon-branch för utveckling (`dev`) och låt huvudbranchen vara produktion. Kör nya SQL-filer i `db/` mot `dev` först och mot produktion när de fungerar. Skapa en backup-branch innan en ändring körs mot produktion, och fråga Antroparen innan du skriver till produktion.

**Saknas Neon-MCP:n och Neons skills** (pluginen installeras bara när Claude startas i mappen och någon godkänner den, och inte i molnet): skriv inte egna skript som kör SQL som ägare mot den enda branchen. Be Antroparen starta en ny chatt i mappen och godkänna pluginen, eller använd Neons CLI (`npx neonctl@latest`). Claudes molnmiljö når ofta inte `*.neon.tech`: då görs databasarbetet på Antroparens dator.

## Testa flödet som flera personer

Är flera personer inblandade i samma flöde (en bjuder in, andra svarar), räcker det inte att klicka som en. Skriv ett testskript i `scripts/`, till exempel `scripts/test-flode.mjs`, som spelar hela loppet:

- En webbläsarkontext per person (`browser.newContext()`), så att var och en har egna cookies och egen lagring, som fyra olika telefoner. Starta webbläsaren med `launchBrowser()` från `scripts/lib/browser.mjs`.
- Personerna turas om i den ordning det händer på riktigt: den första skapar och delar länken, de andra öppnar den, och den första ser svaren.
- Ta med de sneda fallen från rollspelet (se "Visa innan du bygger" i `CLAUDE.md`): någon svarar inte, ingen tid passar.
- Kör mot en egen Neon-branch för test (`test`), aldrig mot produktion, och nollställ den mellan körningarna (`reset_from_parent` i Neon-MCP:n).
- Spara en skärmbild per person och steg, och visa de viktigaste i tråden.

Testet ersätter inte att en människa provar, men hittar fel i samspelet innan Antroparen gör det.

## Ändringar som inte går att ångra

Radera aldrig ett Neon-projekt, en branch eller en tabell med data, och kör aldrig `DROP` eller `TRUNCATE` på data som Antroparen har lagt in, utan att hen uttryckligen bett om det. Ska schemat ändras på ett riskabelt sätt: gör det först på en Neon-branch (se `neon-postgres-branches`).

## Innan publicering

Kör `code-review` och `security-review` när en ändring rör databasen, inloggningen eller ett API (se "Kodgranskning" i `CLAUDE.md`).

## När uppdraget är slut

Föreslå att Neon-projektet raderas när kunden inte längre behöver prototypen. Gör det bara när Antroparen säger ja.
