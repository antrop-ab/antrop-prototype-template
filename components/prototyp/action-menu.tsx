"use client"

import { useState, type ReactElement } from "react"
import type { LucideIcon } from "lucide-react"

import { AppSheet } from "@/components/prototyp/app-sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export type Action = {
  icon: LucideIcon
  label: string
  onSelect: () => void
  disabled?: boolean
  /** Ta bort, avboka och annat som förstör: röd text. Bekräfta med AlertDialog i onSelect. */
  destructive?: boolean
  /**
   * Körs direkt i trycket, t.ex. telefonens dela-meny, som webbläsaren bara öppnar
   * direkt från ett tryck. Allt annat väntar tills lagret har stängts, så att en ny
   * dialog inte öppnas ovanpå ett lager som är på väg bort.
   */
  now?: boolean
}

/**
 * En meny (⋯, Mer, Sortera): en dropdown vid knappen på desktop och ett lager nedifrån
 * på telefonen, med stora rader som är lätta att träffa med tummen: ikon i en rund platta
 * till vänster och texten bredvid. Grupper skiljs med en tunn linje. Ett falskt värde
 * hoppas över, så det går att skriva `kanTaBort && {…}`.
 */
export function ActionMenu({
  trigger,
  title,
  groups,
}: {
  /** Knappen som öppnar menyn, t.ex. en ikonknapp med MoreHorizontal och aria-label. */
  trigger: ReactElement
  /** Lagrets rubrik på telefonen, t.ex. namnet på det menyn gäller. */
  title: string
  groups: (Action | false | "" | null | undefined)[][]
}) {
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const shown = groups
    .map((group) => group.filter((a): a is Action => Boolean(a)))
    .filter((group) => group.length)

  if (mobile)
    return (
      <AppSheet open={open} onOpenChange={setOpen} trigger={trigger} title={title}>
        <div className="-mx-2 flex flex-col">
          {shown.map((group, i) => (
            <div key={i} className={cn("flex flex-col", i > 0 && "mt-2 border-t pt-2")}>
              {group.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  disabled={a.disabled}
                  onClick={() => {
                    if (a.now) a.onSelect()
                    setOpen(false)
                    if (!a.now) setTimeout(a.onSelect, 300)
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-4 rounded-2xl px-2 text-left font-medium transition-colors outline-none hover:bg-muted focus-visible:bg-muted active:bg-muted disabled:opacity-50",
                    a.destructive && "text-destructive"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted",
                      a.destructive && "bg-destructive/10"
                    )}
                  >
                    <a.icon className="size-5" aria-hidden />
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </AppSheet>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {shown.map((group, i) => (
          <div key={i}>
            {i > 0 && <DropdownMenuSeparator />}
            {group.map((a) => (
              <DropdownMenuItem
                key={a.label}
                disabled={a.disabled}
                variant={a.destructive ? "destructive" : "default"}
                onSelect={a.onSelect}
              >
                <a.icon aria-hidden />
                {a.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
