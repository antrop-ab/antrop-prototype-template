import type { Metadata, Viewport } from "next"

import "./globals.css"
import { brand } from "@/app/brand"
import { fontHeading, fontMono, fontSans } from "@/app/fonts"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: brand.name,
  description: "Klickbar prototyp byggd med Antrops prototypmall.",
  // Prototyper ska inte hamna i sökmotorer.
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "default" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={cn(fontSans.variable, fontMono.variable, fontHeading?.variable)}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
