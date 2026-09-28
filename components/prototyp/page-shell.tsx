import Link from "next/link"
import { ViewTransition, type ReactNode } from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Width = "narrow" | "default" | "wide" | "full"

const widths: Record<Width, string> = {
  narrow: "max-w-xl", // formulär och flöden
  default: "max-w-3xl", // läsning och enkla vyer
  wide: "max-w-6xl", // översikter och listor
  full: "max-w-none", // verktyg och dashboards
}

type Props = {
  /** Sidans rubrik. Blir sidans enda h1. */
  title: string
  /** Kort ingress under rubriken. */
  description?: ReactNode
  /** Knappar till höger om rubriken, t.ex. en sekundär handling på desktop. */
  actions?: ReactNode
  /** Ikon ovanför rubriken, t.ex. en bock på en bekräftelsesida. */
  icon?: ReactNode
  /** Rad ovanför rubriken, t.ex. <StepProgress> i ett flöde med flera steg. */
  eyebrow?: ReactNode
  /**
   * Huvudhandlingen i ett flöde. Fast längst ned på mobilen, där tummen når,
   * och under innehållet på större skärmar.
   */
  bottomBar?: ReactNode
  /** Visar en tillbaka-länk ovanför rubriken. */
  back?: { href: string; label: string }
  width?: Width
  className?: string
  children: ReactNode
}

/**
 * Standardskal för en sida: luftig rubrik, valfri tillbaka-länk och innehåll
 * direkt på ytan. Bygg sidor med det här i stället för att börja från noll.
 */
export function PageShell({
  title,
  description,
  actions,
  icon,
  eyebrow,
  bottomBar,
  back,
  width = "default",
  className,
  children,
}: Props) {
  return (
    // Glider åt det håll man navigerar (nav-forward / nav-back på <Link>), se app/motion.css.
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      <main
        className={cn(
          "mx-auto w-full px-5 pt-10 pb-24 sm:px-8 sm:pt-16",
          widths[width],
          className
        )}
      >
        {back && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-6 -ml-3 text-muted-foreground"
          >
            <Link href={back.href} transitionTypes={["nav-back"]}>
              <ArrowLeft />
              {back.label}
            </Link>
          </Button>
        )}
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-2xl min-w-0 flex-1 flex-col gap-3">
            {eyebrow && <div className="mb-2">{eyebrow}</div>}
            {icon && <div className="mb-3">{icon}</div>}
            <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
        </header>
        {children}
        {bottomBar && (
          <>
            {/* Plats så att innehållet inte hamnar bakom knappytan på mobilen. */}
            <div aria-hidden className="h-24 sm:hidden" />
            <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <div className="mx-auto flex max-w-xl flex-col gap-2 sm:max-w-none sm:flex-row sm:items-center">
                {bottomBar}
              </div>
            </div>
          </>
        )}
      </main>
    </ViewTransition>
  )
}
