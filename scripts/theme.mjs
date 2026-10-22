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
import { parseHex, rgbToOklch, toGamut, contrast, css, ensureContrast, oklchToHex, deltaE } from "./lib/color.mjs";

const DEFAULT = { primary: "#4F5BD5", neutral: "tinted", radius: "0.75", font: "Figtree" };
const GLOBALS = "app/globals.css";
const FONTS = "app/fonts.ts";
const BRAND = "app/brand.ts";
// Diagramfärgernas ljushet per läge (OKLCH), se chartColors längre ned.
const CHART_STEPS = { light: [0.5, 0.56, 0.62], dark: [0.57, 0.61, 0.65] };
const CHART_BAND = { light: [0.45, 0.66], dark: [0.56, 0.66] };

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
  const chartSet = chartColors(brand, lbg, n(0.165, 1.6));
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
    ...chartSet.light,
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
    ...chartSet.dark,
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

/**
 * Fem diagramfärger: huvudfärgen först, sedan fyra som går att skilja åt både med
 * vanlig syn och för rödgrönt färgblinda. Samma regler som skillen dataviz:
 * ljusheten inom ett band per läge, kroma minst 0,10, kontrast minst 3:1 mot
 * bakgrunden och tydligt avstånd mellan serier som ligger bredvid varandra.
 * Mörkt läge får samma nyanser som ljust, så att en serie behåller sin färg.
 */

function chartUsable(c, surface) {
  return c.c >= 0.1 && contrast(c, surface) >= 3.05;
}

function chartFirst(brand, mode, surface) {
  // Huvudfärgen flyttas in i bandet. Blir den för grå där (kroman ryms inte i sRGB)
  // väljs den närmaste ljusheten i bandet där den blir tydlig nog.
  const [lo, hi] = CHART_BAND[mode];
  const at = (l) => toGamut({ ...brand, l, c: Math.max(brand.c, 0.13) });
  // Huvudfärgens egen ljushet först, om den redan ligger i bandet.
  const levels = [Math.min(Math.max(brand.l, lo), hi)];
  for (let l = lo; l <= hi + 1e-9; l += 0.01) levels.push(l);
  levels.sort((a, b) => Math.abs(a - brand.l) - Math.abs(b - brand.l));
  const first = levels.map(at).find((c) => chartUsable(c, surface)) ?? at(levels[0]);
  return first;
}

// Hur väl två färger går att skilja åt: det svagaste av färgblint och halva
// avståndet med vanlig syn (dataviz kräver minst 8 respektive 15).
function separation(a, b) {
  return Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan"), deltaE(a, b) / 1.9);
}

// Poäng för en ordning: grannarna väger tyngst (staplar och linjer), sedan att de
// tre första går att skilja åt inbördes (punktdiagram), sist alla par.
function chartScore(colors) {
  const pairs = (list) => list.flatMap((a, i) => list.slice(i + 1).map((b) => separation(a, b)));
  const adjacent = Math.min(...colors.slice(1).map((c, i) => separation(colors[i], c)));
  return Math.min(adjacent, 12) + 0.3 * Math.min(...pairs(colors.slice(0, 3))) + 0.05 * Math.min(...pairs(colors));
}

function chartColors(brand, light, dark) {
  const firstLight = chartFirst(brand, "light", light);
  const candidates = [];
  for (let h = 0; h < 360; h += 15) {
    for (const l of CHART_STEPS.light) {
      const c = toGamut({ l, c: 0.15, h });
      if (chartUsable(c, light) && separation(c, firstLight) >= 6) candidates.push(c);
    }
  }

  // Sök igenom alla ordningar av fyra kandidater. Grannavstånden räknas en gång.
  const n = candidates.length;
  const sep = candidates.map((a) => candidates.map((b) => separation(a, b)));
  const sepFirst = candidates.map((c) => separation(c, firstLight));
  let best;
  let bestScore = -Infinity;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (b === a || Math.min(sepFirst[a], sep[a][b]) < 8) continue;
      for (let c = 0; c < n; c++) {
        if (c === a || c === b || sep[b][c] < 8) continue;
        const three = Math.min(sepFirst[a], sepFirst[b], sep[a][b]);
        for (let d = 0; d < n; d++) {
          if (d === a || d === b || d === c || sep[c][d] < 8) continue;
          const adjacent = Math.min(sepFirst[a], sep[a][b], sep[b][c], sep[c][d], 12);
          const all = Math.min(three, sepFirst[c], sepFirst[d], sep[a][c], sep[a][d], sep[b][d]);
          const score = adjacent + 0.3 * three + 0.05 * all;
          if (score > bestScore) [best, bestScore] = [[a, b, c, d], score];
        }
      }
    }
  }
  const lightColors = [firstLight, ...(best ?? [0, 1, 2, 3]).map((i) => candidates[i])];

  // Mörkt läge: samma nyanser, den kombination av ljusheter som skiljer bäst.
  const firstDark = chartFirst(brand, "dark", dark);
  const options = lightColors.slice(1).map((c) =>
    CHART_STEPS.dark.map((l) => toGamut({ l, c: 0.15, h: c.h })).filter((x) => chartUsable(x, dark)),
  );
  let darkColors = [firstDark, ...options.map((o, i) => o[0] ?? lightColors[i + 1])];
  let darkScore = -Infinity;
  const walk = (i, chosen) => {
    if (i === options.length) {
      const score = chartScore([firstDark, ...chosen]);
      if (score > darkScore) [darkColors, darkScore] = [[firstDark, ...chosen], score];
      return;
    }
    for (const o of options[i]) walk(i + 1, [...chosen, o]);
  };
  walk(0, []);

  const named = (list) => Object.fromEntries(list.map((c, i) => [`chart-${i + 1}`, c]));
  return { light: named(lightColors), dark: named(darkColors) };
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
  // Diagramfärgerna: det svagaste avståndet mellan två serier bredvid varandra,
  // för rödgrönt färgblinda (krav 8) och med vanlig syn (krav 15), som i skillen dataviz.
  const worst = (mode) => {
    const list = [1, 2, 3, 4, 5].map((i) => mode[`chart-${i}`]);
    const pairs = list.slice(1).map((c, i) => [list[i], c]);
    return {
      cvd: Math.min(...pairs.map(([a, b]) => Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan")))),
      normal: Math.min(...pairs.map(([a, b]) => deltaE(a, b))),
    };
  };
  for (const [label, key, min] of [["Diagramfärger, färgblint (krav 8)", "cvd", 8], ["Diagramfärger, vanlig syn (krav 15)", "normal", 15]]) {
    const [a, b] = [worst(light)[key], worst(dark)[key]];
    const mark = (v) => `${v.toFixed(1).padStart(5)}${v >= min ? " ok " : " LÅG"}`;
    console.log(`  ${label.padEnd(42)} ${mark(a)}  ${mark(b)}`);
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
