"use client"

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { X } from "lucide-react"
import { Drawer as DrawerPrimitive } from "vaul"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Knappen som öppnar lagret, när det inte öppnas från state. */
  trigger?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Står kvar under rubriken medan resten scrollar, t.ex. flikar eller ett filter. */
  toolbar?: ReactNode
  /** Ersätter rubrikraden (rubriken finns kvar för skärmläsare), t.ex. ett sökfält bredvid krysset. */
  head?: ReactNode
  /** Står kvar längst ned, t.ex. lagrets huvudknapp. */
  footer?: ReactNode
  /** Alltid full höjd, även när innehållet är kort, t.ex. en sökning. */
  full?: boolean
  /** Öppnas inifrån ett annat lager, som då kliver bakåt. */
  nested?: boolean
  /** Vart fokus går när lagret stängs. Som standard tillbaka till det som hade fokus innan. */
  onCloseAutoFocus?: (event: Event) => void
  className?: string
  children: ReactNode
}

/**
 * Prototypens lager: en sheet nedifrån på telefonen och en dialog i mitten från 768 px.
 *
 * - Lika hög som innehållet, och hela vägen upp till statusraden när innehållet inte får plats.
 * - Stängs genom att dra ned den, med krysset uppe till höger eller med Esc.
 * - Rubriken scrollar med innehållet. När den har försvunnit tar en smal rad med rubrik
 *   och kryss över högst upp. Med `head` eller `toolbar` (sökfält, flikar) står toppen kvar.
 *
 * Använd den i stället för `ui/drawer`, `ui/sheet` och `ui/dialog` direkt. `AlertDialog`
 * gäller fortfarande för att bekräfta något som inte går att ångra.
 */
export function AppSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  toolbar,
  head,
  footer,
  full,
  nested,
  onCloseAutoFocus,
  className,
  children,
}: Props) {
  const wide = useMedia(WIDE)
  const standalone = useStandalone()
  const parts = wide
    ? { Title: DialogTitle, Description: DialogDescription, Close: DialogClose }
    : { Title: DrawerTitle, Description: DrawerDescription, Close: DrawerClose }
  const common = { ...parts, wide, title, description, footer, className, children }
  const body =
    head || toolbar ? (
      <FixedTop {...common} head={head} toolbar={toolbar} />
    ) : (
      <ScrollingTop {...common} />
    )

  if (wide)
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          showCloseButton={false}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            "flex max-h-[min(85dvh,52rem)] w-[30rem] max-w-[calc(100%-4rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 text-base shadow-xl sm:max-w-[calc(100%-4rem)]",
            full && "h-[min(85dvh,52rem)] w-[35rem]"
          )}
        >
          {body}
        </DialogContent>
      </Dialog>
    )

  const Root = nested ? DrawerPrimitive.NestedRoot : Drawer
  return (
    <Root
      open={open}
      onOpenChange={onOpenChange}
      // På hemskärmen (iOS) scrollar vauls scrollspärr fönstret till toppen vid varje
      // beröring, och då läses en scroll i sheeten som en dragning nedåt som stänger den.
      // Där får Radix spärra i stället. (vauls prop är omvänd: false stänger av spärren.)
      disablePreventScroll={!standalone}
    >
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn(
          // Ända upp till statusraden, med ett smalare handtag.
          "data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-max(0.5rem,env(safe-area-inset-top)))] data-[vaul-drawer-direction=bottom]:rounded-t-3xl",
          "[&>div:first-child]:mt-2 [&>div:first-child]:h-1 [&>div:first-child]:w-9",
          full &&
            "data-[vaul-drawer-direction=bottom]:h-[calc(100dvh-max(0.5rem,env(safe-area-inset-top)))]"
        )}
      >
        {body}
      </DrawerContent>
    </Root>
  )
}

type Parts = {
  Title: typeof DialogTitle | typeof DrawerTitle
  Description: typeof DialogDescription | typeof DrawerDescription
  Close: typeof DialogClose | typeof DrawerClose
  wide: boolean
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

/** Det vanliga lagret: allt scrollar, en smal rad med rubrik och kryss står kvar högst upp. */
function ScrollingTop({
  Title,
  Description,
  Close,
  wide,
  title,
  description,
  footer,
  className,
  children,
}: Parts) {
  const [scrolled, setScrolled] = useState(false)
  const titleRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <div
        onScroll={(e) => {
          // Den smala raden visar rubriken när den stora har scrollat in under den.
          const past =
            e.currentTarget.scrollTop > (titleRef.current?.offsetHeight ?? 40) - 16
          if (past !== scrolled) setScrolled(past)
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          data-scrolled={scrolled || undefined}
          className={cn(
            "sticky top-0 z-10 flex items-center gap-3 border-b border-transparent bg-transparent pr-2 transition-[background-color,border-color] duration-200 data-scrolled:border-border data-scrolled:bg-popover",
            wide ? "h-16 pt-2 pl-6" : "h-14 pl-5"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "min-w-0 flex-1 truncate font-semibold opacity-0 transition-opacity duration-200",
              scrolled && "opacity-100"
            )}
          >
            {title}
          </span>
          <CloseButton Close={Close} />
        </div>
        <div ref={titleRef} className={cn("pr-16 pb-2", wide ? "-mt-10 pl-6" : "-mt-12 pl-5")}>
          <Title className="font-heading text-2xl leading-tight font-semibold text-balance">
            {title}
          </Title>
          <Description
            className={description ? "mt-1 line-clamp-2 text-muted-foreground" : "sr-only"}
          >
            {description ?? title}
          </Description>
        </div>
        <div
          className={cn(
            "pt-2",
            wide ? "px-6 pb-6" : "px-5",
            !wide && (footer ? "pb-6" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"),
            className
          )}
        >
          {children}
        </div>
      </div>
      <Footer wide={wide}>{footer}</Footer>
    </>
  )
}

/** Ett lager vars topp är ett verktyg (sökfält, flikar): toppen står kvar och resten scrollar. */
function FixedTop({
  Title,
  Description,
  Close,
  wide,
  title,
  description,
  head,
  toolbar,
  footer,
  className,
  children,
}: Parts & { head?: ReactNode; toolbar?: ReactNode }) {
  const pad = wide ? "px-6" : "px-5"
  return (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 pr-2",
          wide ? "pt-4 pb-2 pl-6" : "py-2 pl-5"
        )}
      >
        <div className="min-w-0 flex-1">
          {head ?? (
            <Title className="truncate font-heading text-xl leading-tight font-semibold">
              {title}
            </Title>
          )}
          {head && <Title className="sr-only">{title}</Title>}
          <Description
            className={
              description && !head ? "line-clamp-2 text-sm text-muted-foreground" : "sr-only"
            }
          >
            {description ?? title}
          </Description>
        </div>
        <CloseButton Close={Close} />
      </div>
      {toolbar && <div className={cn("shrink-0 pb-3", pad)}>{toolbar}</div>}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain pt-1",
          pad,
          wide ? "pb-6" : footer ? "pb-6" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          className
        )}
      >
        {children}
      </div>
      <Footer wide={wide}>{footer}</Footer>
    </>
  )
}

function CloseButton({ Close }: { Close: Parts["Close"] }) {
  return (
    // 44 px tryckyta runt en mindre rund platta.
    <Close
      aria-label="Stäng"
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-muted">
        <X className="size-[18px]" strokeWidth={2.25} aria-hidden />
      </span>
    </Close>
  )
}

function Footer({ wide, children }: { wide: boolean; children?: ReactNode }) {
  if (!children) return null
  return (
    <div
      className={cn(
        "shrink-0 border-t pt-3",
        wide ? "px-6 pb-5" : "px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      )}
    >
      {children}
    </div>
  )
}

const WIDE = "(min-width: 768px)"

/** Servern och första målningen räknar med telefonen. */
function useMedia(query: string) {
  return useSyncExternalStore(
    (change) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", change)
      return () => mql.removeEventListener("change", change)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

/** Öppnad från hemskärmen (iOS eller installerad PWA). */
function useStandalone() {
  const media = useMedia("(display-mode: standalone)")
  const ios = useSyncExternalStore(
    () => () => {},
    () => (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false
  )
  return media || ios
}
