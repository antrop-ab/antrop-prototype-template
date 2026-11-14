# Underlag: Figma, referenser och varianter

Läses när en ny vy eller ett nytt flöde ska formas. Grundfrågan och arbetsgången utan Figma står under "Innan du designar" i `CLAUDE.md`.

## Figma

Be om länken (högerklick på framen, *Copy link to selection*). Läs med Figma-MCP:n: `get_design_context`, `get_screenshot` och `get_variable_defs`. Översätt lager till shadcn-komponenter, inte till handgjorda divar. Variabler för färg och typsnitt blir kundens tema (se "Kundens tema" i `CLAUDE.md`).

## Referenser från Mobbin

Innan du formar ett nytt flöde eller en ny vy utan Figma: erbjud i en mening att hämta hur andra appar löst samma sak. Gör det bara om Antroparen vill, annars går du vidare till `shape`. Mobbin-MCP:n söker i skärmar och flöden från riktiga appar: `search_flows` för flöden i flera steg (onboarding, bokning, betalning), `search_screens` för en enskild vy (inställningar, profil, tomt läge) och `search_sections` för delar av webbsidor (prissättning, sidfot). Välj `platform` efter hur prototypen används: `ios` för mobil, `web` för desktop. Titta på bilderna, inte bara metadatan. Visa Antroparen 3–5 relevanta exempel som länkar (`mobbin_url`) med en mening om vad varje exempel gör bra, och vilka mönster du tänker använda. Kopiera mönster och struktur, aldrig någon annans varumärke, bilder eller texter. Bygget görs med shadcn och kundens tema. Svarar Mobbin att inloggning krävs: säg det i en mening och fortsätt utan referenser. Vid autonomt bygge: sök i Mobbin om du tror att det finns bra referenser där (vanliga flöden som onboarding, bokning, betalning, inställningar), en sökning per flöde. Välj själv och nämn kort vilka exempel du utgick från.

## Varianter och Claude Design

Tipsa om `/design` (Claude Design), där idéer kan skissas och itereras visuellt innan de byggs här. Gäller det en enskild del (ett kort, en knapp, ett steg i flödet) i prototypen: tipsa om `/prototype`, som bygger 3–5 tydligt olika varianter med kundens tema och en väljare att bläddra mellan. Antroparen måste skriva kommandot själv. Får du en länk till en design från Claude Design: läs den med Artifact-verktyget (`read`) och bygg den med shadcn-komponenter.
