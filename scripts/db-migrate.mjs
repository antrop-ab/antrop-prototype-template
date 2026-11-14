#!/usr/bin/env node
// Kör SQL-filerna i db/ i nummerordning mot DATABASE_URL (från miljön eller .env.local).
//
//   npm run db:migrate              alla numrerade filer: db/001-schema.sql, db/002-...
//   npm run db:migrate -- 003       bara filer vars namn börjar med 003
//   npm run db:migrate -- seed      db/seed.sql (exempeldata)
//
// Skriv filerna så att de går att köra om (create table if not exists, on conflict do
// nothing). Neons HTTP-drivrutin används, så det fungerar också där port 5432 är stängd,
// till exempel i Claudes molnmiljö. Kör mot en dev-branch först (se references/backend.md).

import { existsSync, readdirSync, readFileSync } from "node:fs";

if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^DATABASE_URL=(.+)$/);
    if (m) process.env.DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, "");
  }
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL saknas. Kör npm run db:connect (ny databas) eller npm run env (hämtar från Vercel).");
  process.exit(1);
}

let neon;
try {
  ({ neon } = await import("@neondatabase/serverless"));
} catch {
  console.error("Neons drivrutin saknas. Installera den med: npm install @neondatabase/serverless");
  process.exit(1);
}

/**
 * Delar en SQL-fil i satser vid semikolon, men inte inuti strängar, kommentarer eller
 * $$-block (funktioner och triggers). HTTP-drivrutinen kör en sats per anrop.
 */
function splitStatements(text) {
  const statements = [];
  let current = "";
  let i = 0;
  // Sticky regex och startsWith med position: ingen kopia av resten av filen per tecken,
  // så att stora seed-filer inte tar kvadratisk tid.
  const dollarTag = /\$[A-Za-z0-9_]*\$/y;
  while (i < text.length) {
    dollarTag.lastIndex = i;
    const dollar = text[i] === "$" ? dollarTag.exec(text) : null;
    if (text.startsWith("--", i)) {
      const end = text.indexOf("\n", i);
      i = end === -1 ? text.length : end;
    } else if (text.startsWith("/*", i)) {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
    } else if (dollar) {
      const end = text.indexOf(dollar[0], i + dollar[0].length);
      const stop = end === -1 ? text.length : end + dollar[0].length;
      current += text.slice(i, stop);
      i = stop;
    } else if (text[i] === "'") {
      let j = i + 1;
      while (j < text.length && !(text[j] === "'" && text[j + 1] !== "'")) j += text[j] === "'" ? 2 : 1;
      current += text.slice(i, j + 1);
      i = j + 1;
    } else if (text[i] === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      i++;
    } else {
      current += text[i++];
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

const only = process.argv[2];
if (!existsSync("db")) {
  console.error("Mappen db/ finns inte. Spara schemat som db/001-schema.sql först.");
  process.exit(1);
}
const files = readdirSync("db")
  .filter((f) => f.endsWith(".sql"))
  .filter((f) => (only ? f.startsWith(only) : /^\d+/.test(f)))
  // Numerisk ordning, så att 10-x.sql kommer efter 9-x.sql även utan inledande nollor.
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
if (files.length === 0) {
  console.error(only ? `Ingen SQL-fil i db/ börjar med "${only}".` : "Inga numrerade SQL-filer i db/.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
for (const file of files) {
  const statements = splitStatements(readFileSync(`db/${file}`, "utf8"));
  try {
    for (const statement of statements) await sql.query(statement);
  } catch (error) {
    console.error(`FEL i ${file}: ${error.message}`);
    process.exit(1);
  }
  console.log(`OK  ${file} (${statements.length} satser)`);
}
