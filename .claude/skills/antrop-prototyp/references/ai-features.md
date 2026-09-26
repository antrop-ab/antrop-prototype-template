# AI-funktioner

Mallen har AI SDK (`ai`, `@ai-sdk/react`), AI Elements och Vercel AI Gateway. Ett fungerande exempel finns i `app/exempel/chatt/page.tsx` och `app/api/chat/route.ts`.

**API:et ändras ofta.** Läs `node_modules/ai/docs/` (till exempel `04-ai-sdk-ui` för `useChat` och `03-ai-sdk-core` för `generateText`) innan du skriver ny AI-kod. Skillen `ai-sdk` i Vercel-pluginen hjälper också.

## Modeller och nycklar

- Modellen anges som en sträng `"leverantör/modell"` i `lib/ai.ts` och går via AI Gateway. Byt leverantör utan att byta kod.
- **Kolla att modellen finns** innan du använder den: `curl -s https://ai-gateway.vercel.sh/v1/models | grep anthropic/`. Modellnamn ändras ofta.
- **Nycklar:** på Vercel autentiseras AI Gateway automatiskt (OIDC). Lokalt hämtar `npm run dev` en token från Vercel. Är prototypen inte kopplad: `npm run vercel:link`. Be aldrig om en API-nyckel i chatten och skriv aldrig nycklar i koden.
- Får du felet att AI Gateway saknar behörighet: kör `npm run env` och starta om `npm run dev`. Hjälper inte det: kontrollera att AI Gateway är aktiverat för teamet på vercel.com.

## Vanliga mönster i prototyper

| Behov | Hur |
|---|---|
| Chatt eller assistent | `useChat` + `streamText` + AI Elements (`Conversation`, `Message`, `PromptInput`) |
| Fylla i ett formulär från fritext | `generateText` med `output` och ett zod-schema, i en server action eller route |
| Förslag medan man skriver | `FAST_MODEL`, kort prompt, debounce 300 ms |
| Sammanfatta eller omformulera | `streamText` och `MessageResponse` för att visa markdown medan den strömmar |
| Klassa eller sortera | `generateText` med `output` som enum |
| Verktyg (hämta data, räkna) | `tool()` med zod-schema, visa anropet med `Tool` från AI Elements |
| Visa resonemang | `Reasoning` med `sendReasoning: true` på serversidan |

Strukturerade svar (kolla exakt API i `node_modules/ai/docs/`):

```ts
import { generateText, Output } from "ai"
import { z } from "zod"
import { FAST_MODEL } from "@/lib/ai"

const { output } = await generateText({
  model: FAST_MODEL,
  output: Output.object({
    schema: z.object({
      kategori: z.enum(["faktura", "leverans", "reklamation", "övrigt"]),
      sammanfattning: z.string(),
    }),
  }),
  prompt: `Klassa ärendet: ${text}`,
})
```

## Design av AI-funktioner

- **Visa att något händer** direkt: `Shimmer` eller `Loader` inom 100 ms, strömma texten.
- **Låt användaren avbryta** (`stop` från `useChat`, knappen i `PromptInputSubmit`).
- **Förslag i tomt läge** (`Suggestions`) sänker tröskeln.
- **Säg vad AI:n gjort** och låt användaren rätta: redigerbara fält i stället för färdiga beslut.
- **Källor** (`Sources`, `InlineCitation`) när svaret bygger på dokument.
- **Fel** i klartext med en väg framåt: "Svaret tog för lång tid. Försök igen."

## Innan Vercel är kopplat

Tidigt i ett projekt finns ofta ingen koppling till Vercel, och då svarar inte AI Gateway. Bygg funktionen på riktigt ändå, men låt routen falla tillbaka på ett exempelsvar:

```ts
import { isGatewayConfigured } from "@/lib/ai"

if (!isGatewayConfigured()) {
  return Response.json({ ...exempelsvar(text), example: true })
}
```

Gör exempelsvaret förutsägbart (till exempel utifrån nyckelord i texten) och visa det tydligt i gränssnittet med en `Badge`: "Exempelsvar, AI är inte kopplad". När `npm run vercel:link` körts används riktig AI automatiskt, utan kodändring.

## Utan riktig AI

Ska prototypen bara *visa* en AI-upplevelse (till exempel i ett användartest där svaren måste vara förutsägbara): skriv färdiga svar i `data/` och strömma dem med en timer. Säg det till Antroparen, så att ingen tror att det är riktig AI.

## Kostnad

AI Gateway debiterar per anrop på Vercel-teamets konto. Prototyper kostar oftast några kronor, men en öppen länk med en chatt kan missbrukas. Begränsa längden (`maxOutputTokens`) och fråga Antroparen innan en publik chatt publiceras.
