// Svenska format för datum, tid, pris och tal. Byt LOCALE för andra språk.
const LOCALE = "sv-SE"

type DateInput = Date | string | number

const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d))

/** 14 oktober 2026 ("long"), 14 okt ("short") eller tisdag 14 oktober ("weekday"). */
export function formatDate(d: DateInput, style: "long" | "short" | "weekday" = "long") {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: style === "short" ? "short" : "long",
    ...(style === "long" && { year: "numeric" }),
    ...(style === "weekday" && { weekday: "long" }),
  })
    .format(toDate(d))
    .replace(".", "")
}

/** 9.30 och 14.30, som i löptext. Tidtabeller och digitala klockor: formatTime(d, "clock") ger 09.30. */
export function formatTime(d: DateInput, style: "text" | "clock" = "text") {
  return new Intl.DateTimeFormat(LOCALE, { hour: style === "clock" ? "2-digit" : "numeric", minute: "2-digit" })
    .format(toDate(d))
    .replace(":", ".")
}

/** i morgon, om 3 dagar, för 2 timmar sedan */
export function formatRelative(d: DateInput, now: Date = new Date()) {
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" })
  const diff = (toDate(d).getTime() - now.getTime()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unit)
  }
  return "nyss"
}

/** 1 249 kr (hela kronor), eller 1 249,50 kr med decimals: 2. */
export function formatPrice(amount: number, { currency = "SEK", decimals = 0 } = {}) {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/** 12 400 */
export function formatNumber(n: number, decimals = 0) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: decimals }).format(n)
}

/** Stor första bokstav, för text som inleder en rad eller rubrik: capitalize(formatDate(d, "weekday")). */
export function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1)
}
