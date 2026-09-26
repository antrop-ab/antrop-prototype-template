# Texter i gränssnittet

Prototypens texter ska låta som kunden, inte som en AI. Utgå från *Tone of Voice* i `PRODUCT.md`. Saknas den: svenska, du-form, vänligt och rakt, enligt nedan.

## Grundregler

- **Skriv för det användaren vill göra**, inte hur systemet fungerar. "Välj en tid", inte "Tidsbokningsmodul".
- **Kort.** Rubrik på högst sex ord. Knapptext ett till tre ord. Hjälptext en mening.
- **Du-form och aktiv röst.** "Vi skickar ett kvitto till dig", inte "Ett kvitto kommer att skickas".
- **Viktigast först.** Det användaren behöver veta står i början av meningen.
- **Stor bokstav bara först** i rubriker och knappar ("Skapa konto", inte "Skapa Konto").
- **Inga tankstreck** som skiljetecken i löptext. Skriv två meningar eller använd kolon.
- **Siffror med siffror:** "3 dagar kvar". Mellanslag som tusentalsavgränsare: 12 400 kr.

## Knappar och länkar

- **Verb som säger vad som händer:** "Spara", "Skicka ansökan", "Boka tid". Inte "OK", "Fortsätt" eller "Klicka här" när något bättre finns.
- Samma handling heter samma sak hela vägen. Knappen "Boka" leder till bekräftelsen "Bokningen är klar".
- Destruktiva handlingar säger vad som försvinner: "Ta bort projektet", med `AlertDialog` som bekräftar.

## Fel

Säg vad som hände, varför om det hjälper, och vad användaren kan göra. Aldrig skuld.

| Istället för | Skriv |
|---|---|
| Ogiltig inmatning | Skriv personnumret med 12 siffror, till exempel 19850101-1234 |
| Ett fel uppstod | Vi kunde inte spara ändringen. Försök igen om en stund |
| Obligatoriskt fält | Fyll i din e-postadress |

Felet står vid fältet (`FieldError`), inte bara överst.

## Tomma lägen

Förklara varför det är tomt och vad användaren kan göra: "Inga ärenden än. När du skapar ett ärende hamnar det här." plus en knapp "Skapa ärende".

## Bekräftelser

Bekräfta med det användaren behöver härnäst: "Bokningen är klar. Vi har skickat en bekräftelse till anna@exempel.se." Inte bara "Klart!".

## Format på svenska (sv-SE)

Använd `lib/format.ts`:

| Vad | Exempel | Funktion |
|---|---|---|
| Datum | 14 oktober 2026, 14 okt, tisdag 14 oktober | `formatDate(d)`, `formatDate(d, "short")`, `formatDate(d, "weekday")` |
| Relativ tid | i morgon, för 3 timmar sedan | `formatRelative(d)` |
| Tid | 9.30, 14.30 (tidtabell: 09.30) | `formatTime(d)`, `formatTime(d, "clock")` |
| Pris | 1 249 kr | `formatPrice(1249)` |
| Tal | 12 400 | `formatNumber(12400)` |

Datum och veckodagar skrivs med liten bokstav på svenska. Inleder de en rad eller rubrik: `capitalize(formatDate(d, "weekday"))` ger "Tisdag 13 oktober".

## AI-ton: undvik

Svensk text som Claude skrivit låter ofta översatt. Undvik: *säkerställa*, *möjliggöra*, *i detta sammanhang*, *inte minst*, *smidigt*, *sömlöst*, *upptäck*, *utforska*, *din resa*, uppräkningar i tre led överallt, och utropstecken. Kör skillen `avoid-ai-swedish` (plugin `antrop-toolbox`) på längre texter innan du visar dem.

## Andra språk

Är kunden eller målgruppen engelskspråkig: skriv på engelska med samma principer (sentence case, verb på knappar, konkret). Byt `lang` i `app/layout.tsx`.
