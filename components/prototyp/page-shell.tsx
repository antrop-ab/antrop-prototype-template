import { ViewTransition, type ReactNode } from "react"

import { AppBar } from "@/components/prototyp/app-bar"
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
  /** Tillbaka till nivån ovanför, till vänster i appbaren. */
  back?: { href: string; label: string }
  /** Ikonknappar till höger i appbaren, t.ex. stäng eller en ActionMenu. Högst två. */
  barActions?: ReactNode
  width?: Width
  className?: string
  children: ReactNode
}

/**
 * Standardskal för en sida: appbar högst upp (tillbaka, handlingar, och rubriken i liten
 * stil när man har scrollat), luftig rubrik och innehåll direkt på ytan. Bygg sidor med
 * det här i stället för att börja från noll.
 */
export function PageShell({
  title,
  description,
  actions,
  icon,
  eyebrow,
  bottomBar,
  back,
  barActions,
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
          "mx-auto w-full px-5 pb-24 sm:px-8",
          widths[width],
          className
        )}
      >
        <AppBar title={title} watch="sidrubrik" back={back} actions={barActions} />
        <header className="mt-2 mb-10 flex sm:mt-8 flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-2xl min-w-0 flex-1 flex-col gap-3">
            {eyebrow && <div className="mb-2">{eyebrow}</div>}
            {icon && <div className="mb-3">{icon}</div>}
            <h1 id="sidrubrik" className="text-3xl font-semibold sm:text-4xl">{title}</h1>
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
            {/* Helt ogenomskinlig: Safari på iPhone färgar sitt verktygsfält efter den
                fasta ytan längst ned, och en halvgenomskinlig yta ger fel färg. */}
            <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-20 border-t bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0">
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
