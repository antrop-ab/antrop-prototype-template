#!/usr/bin/env node
// Byter prototypens tema till kundens: färger, hörnradie och typsnitt.
//
//   npm run theme -- --primary "#0B5FFF"
//   npm run theme -- --primary "#E61E4D" --neutral warm --radius 1 --font "Hanken Grotesk"
//   npm run theme -- --reset          Antrops standardtema
//   npm run theme -- --show           visa nuvarande tema och kontraster
//
// Val:
//   --primary <hex>      kundens huvudfärg (knappar, fokus, valda lägen)
//   --neutral <typ>      tinted (standard: gråskalan får en aning av huvudfärgen),
//                        cool, warm eller pure
//   --radius <rem>       hörnradie, t.ex. 0.5 (skarpt), 0.75 (standard), 1 (mjukt)
//   --font <namn>        typsnitt från Google Fonts, t.ex. "Inter" eller "Hanken Grotesk"
//   --heading-font <namn> eget typsnitt för rubriker (annars samma som --font)
//   --name <namn>        prototypens namn: sidtitel och namn på hemskärmen (app/brand.ts)
//   --exact              behåll huvudfärgen exakt, även om knapptexten får för låg kontrast
//   --dry-run            skriv bara ut resultatet
//
// Skriptet skriver om blocket mellan /* theme:start */ och /* theme:end */ i
// app/globals.css, och app/fonts.ts om typsnitt anges. Det kontrollerar
// kontrasten (WCAG AA) och justerar huvudfärgen om knapptexten blir oläslig.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { parseHex, rgbToOklch, toGamut, contrast, css, ensureContrast, oklchToHex } from "./lib/color.mjs";

const DEFAULT = { primary: "#4F5BD5", neutral: "tinted", radius: "0.75", font: "Figtree" };
const GLOBALS = "app/globals.css";
const FONTS = "app/fonts.ts";
const BRAND = "app/brand.ts";

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const flag = (name) => argv.includes(`--${name}`);

const css0 = readFileSync(GLOBALS, "utf8");
const current = /\/\* theme:start (\{.*?\}) \*\//.exec(css0);
const saved = current ? JSON.parse(current[1]) : DEFAULT;

if (flag("show")) {
  console.log("Nuvarande tema:", saved);
  report(build(saved));
  process.exit(0);
}

if (!flag("reset") && !flag("apply") && !opt("primary") && !opt("radius") && !opt("font") && !opt("neutral") && !opt("heading-font") && !opt("name")) {
  console.log('Användning: npm run theme -- --primary "#0B5FFF" [--neutral tinted|cool|warm|pure] [--radius 0.75] [--font "Inter"]');
  console.log("            npm run theme -- --reset | --show");
  process.exit(0);
}

const settings = flag("reset")
  ? { ...DEFAULT }
  : {
      ...saved,
      ...(opt("primary") && { primary: opt("primary") }),
      ...(opt("neutral") && { neutral: opt("neutral") }),
      ...(opt("radius") && { radius: opt("radius") }),
      ...(opt("font") && { font: opt("font") }),
      ...(opt("heading-font") && { headingFont: opt("heading-font") }),
      ...(opt("name") && { name: opt("name") }),
    };

if (!["tinted", "cool", "warm", "pure"].includes(settings.neutral)) {
  console.error(`Okänd --neutral: ${settings.neutral}. Välj tinted, cool, warm eller pure.`);
  process.exit(1);
}
if (!/^\d+(\.\d+)?$/.test(String(settings.radius))) {
  console.error(`--radius ska vara ett tal i rem, till exempel 0.75.`);
  process.exit(1);
}

const theme = build(settings);
report(theme);

const block = `/* theme:start ${JSON.stringify(settings)} */\n${theme.css}\n/* theme:end */`;
const nextCss = css0.replace(/\/\* theme:start[\s\S]*?\/\* theme:end \*\//, block);
if (nextCss === css0 && !css0.includes("theme:start")) {
  console.error(`Hittar inte /* theme:start */ i ${GLOBALS}. Återställ filen från mallen.`);
  process.exit(1);
}

if (flag("dry-run")) {
  console.log(`\n${block}`);
  process.exit(0);
}

writeFileSync(GLOBALS, nextCss);
console.log(`\nSkrev temat till ${GLOBALS}.`);

if (opt("font") || opt("heading-font") || flag("reset")) {
  writeFonts(settings.font, settings.headingFont);
  console.log(`Skrev typsnitt till ${FONTS}: ${settings.font}${settings.headingFont ? ` (rubriker: ${settings.headingFont})` : ""}.`);
}
writeBrand(settings);
console.log("Titta på resultatet i webbläsaren, i ljust och mörkt läge.");

// ---------------------------------------------------------------------------

function build({ primary, neutral, radius }) {
  const brand = toGamut(rgbToOklch(parseHex(primary)));
  const hue = { tinted: brand.h, cool: 265, warm: 70, pure: 0 }[neutral];
  const tint = { tinted: 0.006, cool: 0.008, warm: 0.007, pure: 0 }[neutral];
  const n = (l, k = 1) => ({ l, c: tint * k, h: hue });

  const white = { l: 1, c: 0, h: 0 };
  const light = {};
  const dark = {};
  const notes = [];

  // Ljust läge
  const lbg = white;
  const lfg = n(0.2, 2.5);
  const lPrimary = pickPrimary(brand, lbg, lfg, "ljust", notes);
  Object.assign(light, {
    background: lbg,
    foreground: lfg,
    card: lbg,
    "card-foreground": lfg,
    popover: lbg,
    "popover-foreground": lfg,
    primary: lPrimary.bg,
    "primary-foreground": lPrimary.fg,
    secondary: n(0.962),
    "secondary-foreground": lfg,
    muted: n(0.967),
    "muted-foreground": ensureContrast(n(0.53, 2), n(0.967), 4.6, -1),
    accent: n(0.955),
    "accent-foreground": lfg,
    destructive: { l: 0.577, c: 0.215, h: 27.3 },
    border: n(0.915),
    input: n(0.87),
    ring: lPrimary.bg,
    brand,
    "primary-soft": toGamut({ l: 0.962, c: Math.min(brand.c, 0.04), h: brand.h }),
    "primary-soft-foreground": ensureContrast({ ...brand, l: Math.min(brand.l, 0.45) }, { l: 0.962, c: 0.04, h: brand.h }, 4.6, -1),
    ...charts(brand, 0.62),
    sidebar: n(0.984),
    "sidebar-foreground": lfg,
    "sidebar-primary": lPrimary.bg,
    "sidebar-primary-foreground": lPrimary.fg,
    "sidebar-accent": n(0.952),
    "sidebar-accent-foreground": lfg,
    "sidebar-border": n(0.915),
    "sidebar-ring": lPrimary.bg,
  });

  // Mörkt läge
  const dbg = n(0.165, 1.6);
  const dfg = n(0.965, 0.5);
  const dPrimary = pickPrimary({ ...brand, l: Math.min(Math.max(brand.l, 0.6), 0.72) }, dbg, dbg, "mörkt", notes);
  Object.assign(dark, {
    background: dbg,
    foreground: dfg,
    card: n(0.198, 1.6),
    "card-foreground": dfg,
    popover: n(0.215, 1.6),
    "popover-foreground": dfg,
    primary: dPrimary.bg,
    "primary-foreground": dPrimary.fg,
    secondary: n(0.25, 1.6),
    "secondary-foreground": dfg,
    muted: n(0.235, 1.6),
    "muted-foreground": ensureContrast(n(0.68, 1.5), n(0.235, 1.6), 4.6, 1),
    accent: n(0.26, 1.6),
    "accent-foreground": dfg,
    destructive: { l: 0.704, c: 0.191, h: 22.2 },
    border: "oklch(1 0 0 / 9%)",
    input: "oklch(1 0 0 / 14%)",
    ring: dPrimary.bg,
    brand,
    "primary-soft": toGamut({ l: 0.28, c: Math.min(brand.c, 0.06), h: brand.h }),
    "primary-soft-foreground": ensureContrast({ ...brand, l: 0.82 }, { l: 0.28, c: 0.06, h: brand.h }, 4.6, 1),
    ...charts(brand, 0.7),
    sidebar: n(0.19, 1.6),
    "sidebar-foreground": dfg,
    "sidebar-primary": dPrimary.bg,
    "sidebar-primary-foreground": dPrimary.fg,
    "sidebar-accent": n(0.25, 1.6),
    "sidebar-accent-foreground": dfg,
    "sidebar-border": "oklch(1 0 0 / 9%)",
    "sidebar-ring": dPrimary.bg,
  });

  const toCss = (vars) =>
    Object.entries(vars)
      .map(([k, v]) => `  --${k}: ${typeof v === "string" ? v : css(v)};`)
      .join("\n");

  return {
    light,
    dark,
    notes,
    brand,
    css: `:root {\n  --radius: ${radius}rem;\n${toCss(light)}\n}\n\n.dark {\n${toCss(dark)}\n}`,
  };
}

/** Väljer knapptext (vit eller mörk) och justerar färgen tills kontrasten är minst 4,5:1. */
function pickPrimary(color, bg, ink, mode, notes) {
  const white = { l: 0.99, c: 0, h: 0 };
  const inkText = { ...ink, l: Math.min(ink.l, 0.2) };
  // Vit text på mättade och mörka färger (som de flesta varumärken gör), mörk text på ljusa.
  // Räcker inte kontrasten mörkas eller ljusas färgen lite, i stället för att byta textfärg.
  const fg = color.l > 0.72 || contrast(color, inkText) > contrast(color, white) * 3 ? inkText : white;
  let next = color;
  if (contrast(next, fg) < 4.5 && flag("exact")) {
    notes.push(`${mode} läge: knapptexten når bara ${contrast(next, fg).toFixed(1)}:1 (kravet är 4,5:1). --exact behåller färgen ändå.`);
  } else if (contrast(next, fg) < 4.5) {
    next = ensureContrast(color, fg, 4.5, fg === white ? -1 : 1);
    notes.push(
      `${mode} läge: huvudfärgen justerades från ${oklchToHex(color)} till ${oklchToHex(next)} så att knapptexten når 4,5:1.`,
    );
  }
  if (contrast(next, bg) < 3) {
    notes.push(`${mode} läge: huvudfärgen har låg kontrast mot bakgrunden (${contrast(next, bg).toFixed(1)}:1). Knappar syns ändå tack vare texten, men undvik färgen för tunna linjer och ikoner.`);
  }
  return { bg: next, fg };
}

function charts(brand, l) {
  // Huvudfärgen först, sedan fyra lugna toner som skiljer sig tydligt i nyans.
  const offsets = [0, 150, 60, 210, 300];
  return Object.fromEntries(
    offsets.map((o, i) => [
      `chart-${i + 1}`,
      toGamut(i === 0 ? brand : { l, c: 0.13, h: (brand.h + o) % 360 }),
    ]),
  );
}

function report({ light, dark, notes }) {
  const rows = [
    ["Knapptext på huvudfärg", light.primary, light["primary-foreground"], dark.primary, dark["primary-foreground"], 4.5],
    ["Brödtext på bakgrund", light.background, light.foreground, dark.background, dark.foreground, 4.5],
    ["Sekundär text på bakgrund", light.background, light["muted-foreground"], dark.background, dark["muted-foreground"], 4.5],
    // Huvudfärgen som linje eller ikon mot bakgrunden: kravet för grafik är 3:1.
    ["Huvudfärg mot bakgrund", light.background, light.primary, dark.background, dark.primary, 3],
  ];
  console.log(`\n${"Kontrast (WCAG AA)".padEnd(44)} ljust      mörkt`);
  for (const [label, lb, lf, db, df, min] of rows) {
    const a = contrast(lb, lf);
    const b = contrast(db, df);
    const mark = (v) => `${v.toFixed(1).padStart(5)}${v >= min ? " ok " : " LÅG"}`;
    console.log(`  ${`${label} (krav ${String(min).replace(".", ",")}:1)`.padEnd(42)} ${mark(a)}  ${mark(b)}`);
  }
  for (const note of notes) console.log(`  Obs: ${note}`);
}

function writeFonts(font, headingFont) {
  const require = createRequire(import.meta.url);
  let data = {};
  try {
    data = require("../node_modules/next/dist/compiled/@next/font/dist/google/font-data.json");
  } catch {
    console.warn("Kunde inte läsa listan över Google Fonts (kör npm install). Skriver ändå.");
  }
  const id = (name) => name.trim().replace(/\s+/g, "_");
  for (const name of [font, headingFont].filter(Boolean)) {
    if (Object.keys(data).length && !data[name]) {
      console.error(`"${name}" finns inte i Google Fonts via next/font. Kolla stavningen på fonts.google.com.`);
      process.exit(1);
    }
  }
  const variable = (name) => (data[name]?.axes ? "" : `, weight: ["400", "500", "600", "700"]`);
  const imports = [...new Set([id(font), headingFont && id(headingFont), "Geist_Mono"].filter(Boolean))];
  const source = `// Prototypens typsnitt. Byt med \`npm run theme -- --font "Namn"\` eller redigera här.
// Alla typsnitt från Google Fonts fungerar: https://fonts.google.com
import { ${imports.join(", ")} } from "next/font/google"

export const fontSans = ${id(font)}({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"${variable(font)},
})

${
  headingFont
    ? `export const fontHeading = ${id(headingFont)}({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"${variable(headingFont)},
})`
    : `// Samma typsnitt för rubriker. Vill du ha ett eget: --heading-font "Namn".
export const fontHeading: { variable: string } | null = null`
}

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})
`;
  if (!existsSync("app")) throw new Error("Kör skriptet i prototypens rotmapp.");
  writeFileSync(FONTS, source);
}

function writeBrand({ name = "Prototyp", primary }) {
  const source = `// Prototypens namn och färger utanför CSS: sidtitel, hemskärmsikon och
// statusfältet på telefonen. Skrivs av \`npm run theme -- --name "Namn" --primary "#hex"\`.
export const brand = {
  name: ${JSON.stringify(name)},
  primary: ${JSON.stringify(primary)},
}
`;
  writeFileSync(BRAND, source);
}
