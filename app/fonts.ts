// Prototypens typsnitt. Byt med `npm run theme -- --font "Namn"` eller redigera här.
// Alla typsnitt från Google Fonts fungerar: https://fonts.google.com
import { Figtree, Geist_Mono } from "next/font/google"

export const fontSans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

// Samma typsnitt för rubriker. Vill du ha ett eget: --heading-font "Namn".
export const fontHeading: { variable: string } | null = null

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})
