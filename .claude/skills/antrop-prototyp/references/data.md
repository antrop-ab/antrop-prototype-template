# Exempeldata och tillstånd

## Påhittad data i `data/`

En fil per område, till exempel `data/orders.ts`, som exporterar typade listor.

- **Alltid påhittad.** Inga riktiga kunduppgifter, personnummer, ordernummer eller data från kundens system, även om Antroparen har tillgång till dem.
- **Trovärdig.** Svenska namn, orter och adresser som ser verkliga ut, rimliga belopp, varierande längd på texter. Ett långt namn och ett kort. Ett stort belopp och ett litet.
- **Relativ till idag.** Räkna datum från `new Date()` så att prototypen ser aktuell ut i ett test om tre veckor. Sidan renderas först på servern, som går i UTC på Vercel, så tider kan skilja sig mellan server och webbläsare (hydreringsfel). Visa sådant innehåll först när `useMounted()` från `hooks/use-mounted.ts` är `true`, med en `Skeleton` under tiden.
- **Täck in lägena.** Minst ett undantagsfall: försenad, avbruten, tom, fel, många poster.
- **Behövs mycket data:** fråga om du får installera `@faker-js/faker` och använd `fakerSV` med ett fast `seed`, så att samma data kommer varje gång.

## Delat tillstånd mellan sidor

När det som görs på en sida ska synas på en annan (en order som läggs syns i Mina ordrar): lägg datan i en Context i `data/` och lägg providern i `app/layout.tsx`.

```tsx
// data/orders-context.tsx
"use client"
import { createContext, useContext, useState, type ReactNode } from "react"
import { initialOrders, type Order } from "./orders"

const OrdersContext = createContext<{ orders: Order[]; addOrder: (o: Order) => void } | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState(initialOrders)
  const addOrder = (o: Order) => setOrders((all) => [o, ...all])
  return <OrdersContext value={{ orders, addOrder }}>{children}</OrdersContext>
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error("useOrders måste användas inuti OrdersProvider")
  return ctx
}
```

Tillståndet nollställs när sidan laddas om. Det är oftast bra i ett användartest: varje testperson börjar från samma läge.

**Fallgrop: en sida som skickar tillbaka om data saknas.** Säg att bekräftelsesidan skickar till start om ingen tid är vald (en "guard"). Nollställer sidan själv bokningen och navigerar vidare i samma klick, så renderas den om innan navigeringen, hittar ingen bokning och skickar till start i stället. Läs därför in det sidan behöver en gång, när den visas, och nollställ först på nästa sida:

```tsx
const [booking] = useState(() => current) // läses en gång, ändras inte när tillståndet nollställs
useEffect(() => {
  if (!booking) router.replace("/")
}, [booking, router])
```

Kör guarden i `useEffect`, aldrig direkt under rendering, och testa hela flödet i webbläsaren, också bakåtknappen.

**Ska det överleva en omladdning** (till exempel ett flöde över flera dagar i en dagboksstudie): spara i `localStorage` med en egen hook. Lägg till en dold återställning (till exempel `?reset` i adressen) så att nästa testperson börjar om.

## Spara på riktigt

Behövs riktig lagring (flera användare, data som ska finnas kvar): fråga Antroparen först. Rekommendation:

1. **Supabase via Vercel Marketplace:** `npx vercel@latest integration add supabase`. Nycklarna hamnar på Vercel och hämtas lokalt med `npm run env`. Använd Supabase-MCP:n för tabeller och frågor.
2. Skillen `marketplace` (Vercel-pluginen) visar andra alternativ (Neon, Upstash med flera).

Riktig data innebär nya krav: inloggning, behörigheter och GDPR. Påminn om att prototypen inte är produktion.
