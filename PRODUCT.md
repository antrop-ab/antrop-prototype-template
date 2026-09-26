# Product

> Fylls i per prototyp. Claude fyller i de tomma fälten tillsammans med Antroparen första gången en vy byggs. Fälten som redan är ifyllda gäller alla prototyper från mallen. Läses av Claude och av designskillen impeccable.

## Customer

_Fylls i per prototyp._ Kundens namn, bransch och varumärke. Länk till webbplats, grafisk profil eller Figma-bibliotek.

## Platform

web (responsiv, mobil först)

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), AI SDK med AI Elements och Vercel AI Gateway. Publiceras på Vercel.

## Users

_Fylls i per prototyp._ Vem använder tjänsten, i vilken situation och med vilken enhet? (Till exempel: kund som ska anmäla en skada, i mobilen, stressad och på språng.)

## Product Purpose

_Fylls i per prototyp._ Vilken fråga ska prototypen besvara? Vad ska användaren kunna göra? Används den i användartester, som underlag för ett beslut eller för att visa en riktning?

## Positioning

_Fylls i per prototyp._ Hur ska upplevelsen kännas jämfört med kundens nuvarande tjänst och konkurrenterna?

## Tone of Voice

_Fylls i per prototyp._ Kundens tonläge: du eller ni, formellt eller personligt, ord kunden använder och ord kunden undviker. Utan annan information: svenska, du-form, vänligt och rakt (se `.claude/skills/antrop-prototyp/references/ux-writing.md`).

## Operating Context

Klickbar prototyp för att testa och visa idéer, inte produktion. Exempeldata är påhittad. Ingen riktig backend om inget annat sägs.

## Capabilities and Constraints

- shadcn/ui och kundens tema via `npm run theme`. Grundreglerna i `DESIGN.md`.
- Ingen riktig kund- eller persondata.
- Mobil först, ska fungera på desktop. Ljust och mörkt läge.

## Evidence on Hand

_Fylls i per prototyp._ Figma-länkar, research, insikter, ärenden eller skärmdumpar av nuvarande lösning.

## Product Principles

- En tydlig nästa handling per vy.
- Visa bara det som behövs nu. Detaljer i lager.
- Tydlighet före uttryck.

## Accessibility & Inclusion

WCAG 2.2 AA. Klickytor minst 44×44 px. Kontrast minst 4,5:1 för text (temaskriptet kontrollerar). Färg aldrig ensam bärare av information. Fungerar med tangentbord och skärmläsare. Respekterar minskad rörelse.
