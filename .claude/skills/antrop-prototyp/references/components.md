# Komponenter: shadcn/ui i den här mallen

## Hitta rätt

1. **Skillen `shadcn`** kan CLI:t, mönstren och temat. Den läser `components.json` och kör `npx shadcn@latest info --json` för projektets inställningar.
2. **shadcn-MCP:n**: sök (`search_items_in_registries`), titta (`view_items_in_registries`) och hämta exempel (`get_item_examples_from_registries`) i alla registries i `components.json`. `get_audit_checklist` ger en checklista att gå igenom när en vy är klar.
3. **CLI:** `npx shadcn@latest docs <komponent>` för dokumentation, `npx shadcn@latest view <komponent>` för koden.
4. **Koden** i `components/ui/<komponent>.tsx` har alltid rätt om sig själv: props, varianter och `data-slot`.

## Vad som finns

**Alla shadcn-komponenter är installerade.** Några att känna till utöver de vanliga:

| Behov | Komponent |
|---|---|
| Formulär | `Field`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldLabel`, `FieldDescription`, `FieldError` |
| Fält med ikon, knapp eller text i | `InputGroup`, `InputGroupAddon`, `InputGroupInput`, `InputGroupButton` |
| Rader i listor | `Item`, `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions` |
| Tomt läge | `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` |
| Laddar | `Skeleton`, `Spinner` |
| Knappar i grupp | `ButtonGroup` |
| Tangentbordsgenvägar | `Kbd` |
| Sökbar väljare | `Combobox` eller `Command` i en `Popover` |
| Lager | `Sheet` (sida), `Drawer` (nedifrån, mobil), `Dialog`, `AlertDialog` (bekräfta destruktivt), `Popover`, `HoverCard` |
| Aviseringar | `sonner` (`toast("Sparat")`), `Alert` för meddelanden på sidan |
| Diagram | `Chart` (Recharts) med `chart-1` till `chart-5` |
| Navigering | `Sidebar`, `NavigationMenu`, `Tabs`, `Breadcrumb`, `Pagination` |
| Meddelanden och chatt (shadcn) | `Message`, `Bubble`, `MessageScroller`, `Attachment`, `Questionnaire` |

**AI Elements** (`components/ai-elements/`): `Conversation`, `Message`, `MessageResponse` (markdown med streaming), `PromptInput`, `Reasoning`, `Sources`, `Suggestion`, `Shimmer`, `Tool`, `CodeBlock`, `Attachments`, `InlineCitation`, `Confirmation`. Fler: `npx shadcn@latest search @ai-elements`.

## Block: hela vyer på en gång

shadcn har färdiga block för vanliga vyer. Använd dem som start och anpassa:

```bash
npx shadcn@latest search @shadcn -q "dashboard"
npx shadcn@latest add dashboard-01
npx shadcn@latest add sidebar-07 login-03
```

Block lägger filer i `app/` och `components/`. Titta på vad som skapades och flytta till rätt route.

## Andra registries

`components.json` → `registries` styr vilka som finns. `@ai-elements` är redan tillagd. Lägg bara till fler om Antroparen ber om det, och kolla att komponenterna följer temat (semantiska färger) innan de används.

## Mönster som ofta behövs

**Välja ett av flera alternativ som rader eller kort** (klinik, abonnemang, leveranssätt): `RadioGroup` där varje alternativ är en `FieldLabel` runt en `Field`. Hela raden blir klickbar, och tangentbord och skärmläsare fungerar. Se `npx shadcn@latest docs radio-group` (exemplet "choice card"). Ska valet leda direkt till nästa steg: en lista med `Item asChild` runt en `Link` räcker.

**Välja bland knappar** (dag, tid, storlek, filter): `ToggleGroup type="single" variant="outline"`. Valt läge har huvudfärgen (se `app/globals.css`). En rad man sveper i på mobilen: `flex overflow-x-auto snap-x` på gruppen och `snap-start` på knapparna.

**Flöde i flera steg:** en route per steg med `PageShell`, `eyebrow={<StepProgress … />}` och huvudknappen i `bottomBar`. Valen sparas i en Context (`references/data.md`).

**Bekräftelse:** `PageShell` med `icon` (till exempel `CircleCheck` i `text-primary`), en rubrik som säger vad som hänt och det användaren behöver härnäst.

## Regler

- **Ändra helst inte i `components/ui/`.** Styr med props, `className` och temat. En ändrad fil listas som "ändrad för hand" och uppdateras inte av `npm run update`.
- **Storlekar via `size`**, aldrig egna höjder (`h-9`). Se `app/sizing.css`.
- **`asChild`** för att göra en länk av en knapp: `<Button asChild><Link href="/x">Gå vidare</Link></Button>`.
- **Ikoner** från `lucide-react`. I knappar: lägg ikonen före texten, ingen storlek behövs.
- **Ikonknappar** har alltid `aria-label`.
- **Formulär:** etikett ovanför fältet, hjälptext under, felmeddelande under med `FieldError` och `aria-invalid` på fältet.
- **Kort:** bara för objekt (ett projekt, en order), inte för att rama in sektioner.
- **Svenska standardtexter:** `npm run update` översätter komponenternas engelska skärmläsartexter och standardtexter ("Close", "Loading", "Previous") till svenska (`scripts/translate-components.mjs`). Hittar du en ny engelsk text: lägg till paret där.
- **`ItemDescription` klipper efter två rader** (`line-clamp-2`). För längre text som adresser: `className="line-clamp-none"`.

## Ny komponent som inte finns i shadcn

1. Sök i registries först (MCP eller `npx shadcn@latest search`).
2. Finns inget: bygg i `components/` (inte `components/ui/`), av shadcn-komponenter och semantiska färger. Följ samma mönster: `data-slot`, `cn()`, varianter med `cva` om det behövs.
3. Skriv i `feedback-till-mallen.md` om komponenten borde finnas i mallen.
