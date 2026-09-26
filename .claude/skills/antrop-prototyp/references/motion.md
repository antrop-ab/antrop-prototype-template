# Rörelse

Bra rörelse märks inte som animation. Den gör att gränssnittet känns snabbt, fysiskt och begripligt. Grunden finns redan i `app/motion.css`. Den här filen säger när och hur du lägger till mer.

För omdöme: skillen **`emil-design-eng`** (Emil Kowalski, som gjort Sonner och Vaul). För granskning: **`review-animations`**. För att hitta ställen som borde röra sig: **`find-animation-opportunities`**. För mobilkänsla: **`mobile-native`**. För vybyten: **`vercel-react-view-transitions`**.

## Det som redan fungerar

| Vad | Hur |
|---|---|
| Knappar trycks ner (scale 0,97) | Automatiskt via `data-slot` |
| Fokusringar tonar in | Automatiskt |
| Switchens tumme glider | Automatiskt |
| Sheet glider in hela vägen med iOS-kurvan, ut snabbare | Automatiskt |
| Drawer (Vaul) med dra-för-att-stänga | `Drawer`-komponenten |
| Dialoger skalas upp från 96 % | Automatiskt |
| Menyer och popovers öppnas från sitt ankare | Automatiskt |
| Toasts (Sonner) | `toast("Sparat")` |
| Sidor glider åt navigeringshållet | `<Link transitionTypes={["nav-forward"]}>` och `["nav-back"]` i `PageShell`-sidor |
| Minskad rörelse | `prefers-reduced-motion` stänger av förflyttning, behåller toningar |

## Kurvor och tider

Finns som CSS-variabler i `app/motion.css`. Kurvorna finns också som Tailwind-klasser (`ease-out`, `ease-drawer`, `ease-spring`), tiderna används som `duration-(--duration-fast)`:

| Token | Värde | Till |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Det mesta som dyker upp |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Något som flyttas på skärmen |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets, drawers, stora lager |
| `--ease-spring` | liten överstudsning | Sparsamt: en bock som bekräftar, en badge som dyker upp |
| `--duration-fast` | 150 ms | Hover, tryck, små tillstånd |
| `--duration-base` | 220 ms | Menyer, popovers, växla innehåll |
| `--duration-slow` | 400 ms | Lager, vybyten |

## Regler

- **Rörelse ska förklara något:** var något kom ifrån, vart det tog vägen, att något hände. Annars: ingen rörelse.
- **Ut snabbare än in.** Användaren väntar inte på att något ska försvinna.
- **Bara `transform` och `opacity`.** Aldrig `height`, `width`, `top`, `left` eller `margin` (hackar).
- **Skala aldrig från 0.** Börja från 0,95–0,97 och opacitet 0.
- **Ofta använt = nästan omedelbart.** Kommandomenyer och tangentbordsgenvägar animeras knappt.
- **Hover-effekter bara på enheter med mus:** `@media (hover: hover)` eller Tailwinds `hover:` (som redan gör det i v4).
- **Ingen rörelse vid första laddningen** av en sida, utom en diskret toning.

## Egen rörelse med Motion

`motion` är installerat. Använd för det CSS inte klarar: listor som sorteras om, element som flyttas mellan platser, siffror som räknas upp, gester.

```tsx
"use client"
import { AnimatePresence, motion } from "motion/react"

<AnimatePresence initial={false}>
  {items.map((item) => (
    <motion.li
      key={item.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
    />
  ))}
</AnimatePresence>
```

- `layout` på element som byter plats (sortering, filter). Mjukt och gratis.
- `useReducedMotion()` för att stänga av förflyttning när användaren bett om det.
- Fjädrar (`type: "spring", bounce: 0.15`) för gester och drag, kurvor för allt annat.

## Vybyten

- **Riktning:** `transitionTypes={["nav-forward"]}` när användaren går djupare, `["nav-back"]` tillbaka. Utan typ: inget glid.
- **Delat element** (en bild i en lista som blir hero på detaljsidan): `<ViewTransition name={`bild-${id}`}>` runt båda. Se skillen `vercel-react-view-transitions`.
- **Fast header** under ett glid: `style={{ viewTransitionName: "header" }}` så att den står still.
- Vybyten fungerar i Chrome, Edge och nyare Safari. I andra webbläsare byts sidan utan animation, vilket är okej.

## Mobil

- Lager nedifrån på mobil: `Drawer`, inte `Dialog`. Använd `useIsMobile()` från `hooks/use-mobile.ts` för att välja.
- `mobile-native`-skillen fixar det som får en webbapp att kännas som en webbsida på telefonen (tap-blink, 100vh, zoom i fält, notch).
