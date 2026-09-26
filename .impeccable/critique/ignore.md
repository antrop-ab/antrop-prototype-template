# Fynd att ignorera

Kända fynd som kommer från mallens val och inte ska åtgärdas. Hoppa över dem i `critique` och `audit`. Lägg till nya när du hittar dem.

- Typsnitt, färger, radie och skuggor från temat (`npm run theme`). De är valda för kunden (se `DESIGN.md`).
- `overused-font` på Figtree: mallens medvetet valda standardtypsnitt för produktgränssnitt, tills kundens typsnitt är satt.
- Höjder och textstorlekar på kontroller som skiljer sig från shadcn:s standard: de kommer från `app/sizing.css` och är avsiktliga (44 px).
