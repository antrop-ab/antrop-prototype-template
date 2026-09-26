---
name: promo-video
description: Gör en promovideo eller showcase-video av prototypen, med musik och ljudeffekter, som MP4. Använd när Antroparen vill ha en video att visa kunden, lägga i en presentation eller dela internt, eller säger "gör en video", "promovideo", "showcase", "demo-video", "film av prototypen", "trailer", "video med musik". Bygger på prototypens egna skärmdumpar och kundens tema. Renderas lokalt med Playwright och ffmpeg, ingen tjänst eller nyckel behövs.
---

# Promovideo av prototypen

Mallen har en videomotor i `scripts/video/`: en video är en HTML-sida med en GSAP-tidslinje. Renderaren stegar tidslinjen bildruta för bildruta med Playwright, syntetiserar musik och ljudeffekter från tidslinjens ljudmarkeringar och kodar till MP4 med ffmpeg. Ljudet ligger därför alltid i synk med bilden, och samma video blir likadan varje gång.

Färdig komposition: **`video/promo/index.html`**, en showcase i SaaS-stil (intro, telefoner i 3D som klickar genom flödet, mörkt läge, desktop, funktioner, slutbild). Den fylls från `STORY` överst i filen.

## Arbetsgång

1. **Förutsättningar.** `ffmpeg` (`ffmpeg -version`). Saknas det: `brew install ffmpeg`, annars `npm install -D ffmpeg-static`. `gsap` och `playwright` finns redan i mallen.
2. **Skärmdumpar.** Starta `npm run dev` och ta bilder av flödet i båda lägena:
   ```bash
   npm run screenshots -- / "Boka tid" "Välj klinik" "Namn=Anna Andersson" "Fortsätt" --desktop --both
   ```
   Filerna heter `screenshots/mobil-ljust-01-start.png`, `mobil-morkt-01-start.png` och så vidare. Titta på dem och ta om det som inte ser bra ut (laddlägen, fel skärm).
3. **Fyll i `STORY`** i `video/promo/index.html`: namn, tagline, `primary` (samma som `npm run theme`, se `app/brand.ts`), mörk och ljus bakgrund i kundens ton, typsnitt (samma som `app/fonts.ts`), skärmarna i ordning med korta bildtexter, `darkMode`, en desktop-bild och tre till fem funktioner. Skriv texterna på kundens språk och i kundens ton, korta som rubriker.
4. **Granska stillbilder** innan hela videon renderas. De tar några sekunder var:
   ```bash
   npm run video -- video/promo --still 2.5
   ```
   Titta på en bild per scen (bilderna hamnar i `video/promo/out/`). Kolla att ingen text krockar, att telefonerna visar rätt skärm och att inget viktigt hamnar under något annat.
5. **Utkast:** `npm run video -- video/promo --draft` (30 bilder/s, några minuter). Gör ett kontaktark för att se helheten:
   ```bash
   ffmpeg -i video/promo/out/utkast.mp4 -vf "fps=1/3,scale=384:-1,tile=6x4" -frames:v 1 video/promo/out/kontakt.png
   ```
6. **Slutversion:** `npm run video -- video/promo` (60 bilder/s, cirka en tiondel av realtid per sekund video). Skicka filen till Antroparen.

Förhandsvisa i webbläsaren med spela-knapp och tidsreglage (utan ljud): `npm run video -- video/promo --serve`.

## Egen video

Behöver videon en annan berättelse (en pitch, ett problem före lösningen, en jämförelse): kopiera `video/promo/` till `video/<namn>/` och skriv om tidslinjen. Regler:

- **`createVideo({ duration, music, fonts })`** ger `tl` (en pausad GSAP-tidslinje), `cue(typ, tid)` för ljud och `type(element, text, start)` för text som skrivs med tangentljud. Allt ska ligga på `tl`, inga egna `setTimeout` eller CSS-animationer, annars blir renderingen inte deterministisk.
- **Ljudeffekter** (`cue`): `whoosh` (övergång, `{ dur }`), `impact` (stort nedslag), `pop` (något dyker upp, `{ freq }`), `click` (tryck), `tick` (bock), `chime` (lyckat), `shimmer` (AI, magi), `riser` (uppbyggnad), `type` (tangent). Lägg en effekt på varje synlig händelse, men inte fler än att det låter lugnt.
- **Musik** (`music`): `bpm`, `sections` med `energy` 0–3 (0 pad, 1 + arpeggio, 2 + trummor och bas, 3 allt), `drops` (tider med uppbyggnad och nedslag) och `end` (slutackord). Lägg scenbyten på hela takter (`60 / bpm * 4` sekunder), så klipper bilden i takt med musiken.
- **Rörelse:** `expo.out` för det som kommer in, `power3.in` för det som går ut, 0,6–1,2 s. Rubriker ord för ord med mask (se `.split` i kompositionen). Aldrig tonade gradienter i `background` (GSAP blandar dem fel): tona ett eget lager med `opacity`.
- **Stilen:** kundens typsnitt och färger, som i prototypen. Samma formspråk som prototypen: luft, få element, en sak i taget.
- Bilder och typsnitt hänvisas relativt (`../../screenshots/...`). Renderaren serverar projektet över http, så även lokala typsnittsfiler fungerar.

## Kontrollera ljudet

Du kan inte lyssna, så mät i stället:

```bash
ffmpeg -i video/promo/out/soundtrack.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:"
ffmpeg -i video/promo/out/soundtrack.wav -lavfi showwavespic=s=1800x240 video/promo/out/vag.png
```

Sikta på cirka −14 LUFS och topp under −1 dBFS. Vågformen ska bygga upp mot droppen och inte ha enstaka toppar som dominerar. Be Antroparen lyssna och säga till om något.

## Konfidentialitet

Videon visar prototypens innehåll. Samma regler som vid publicering: påhittad data, och fråga innan en video med kundens namn delas utanför projektet.
