"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Appbaren högst upp på en sida: tillbaka till nivån ovanför till vänster, handlingar
 * (stäng, dela, ⋯) till höger. Den står kvar när man scrollar. När sidans stora rubrik
 * har scrollat in under den visas rubriken i liten stil i mitten, med en tunn linje under,
 * som i iOS. `PageShell` lägger in den själv; använd den direkt bara på sidor med eget skal.
 */
export function AppBar({
  title,
  watch,
  back,
  actions,
  className,
}: {
  /** Visas i liten stil när den stora rubriken har scrollat bort. */
  title: ReactNode
  /** id på sidans stora rubrik. Utan den visas den lilla rubriken hela tiden. */
  watch?: string
  /** Nivån ovanför, inte bara föregående sida, t.ex. listan man kom från. */
  back?: { href: string; label: string }
  /** Ikonknappar till höger, t.ex. stäng eller en ActionMenu. Högst två. */
  actions?: ReactNode
  className?: string
}) {
  const bar = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(!watch)

  useEffect(() => {
    const heading = watch ? document.getElementById(watch) : null
    if (!bar.current || !heading) return
    // Fast när halva rubriken har gått in under appbarens underkant.
    const bottom = Math.round(
      bar.current.getBoundingClientRect().height +
        (parseFloat(getComputedStyle(bar.current).top) || 0)
    )
    const io = new IntersectionObserver(
      ([e]) => setStuck(e.intersectionRatio < 0.5 && e.boundingClientRect.top < bottom),
      { rootMargin: `-${bottom}px 0px 0px 0px`, threshold: [0, 0.5, 1] }
    )
    io.observe(heading)
    return () => io.disconnect()
  }, [watch])

  return (
    <div
      ref={bar}
      data-stuck={stuck || undefined}
      className={cn(
        "sticky top-[env(safe-area-inset-top)] z-30 -mx-5 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-transparent bg-background px-3 transition-[border-color] duration-200 sm:-mx-8 sm:px-6",
        // Statusraden ovanför (hemskärmsappen på iPhone) får samma bakgrund när baren är fast.
        "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-background",
        "data-stuck:border-border",
        className
      )}
    >
      <div className="flex min-w-0 justify-start">
        {back && (
          <Button asChild variant="ghost" size="sm" className="max-w-full text-muted-foreground">
            <Link href={back.href} transitionTypes={["nav-back"]}>
              <ChevronLeft aria-hidden />
              <span className="truncate">{back.label}</span>
            </Link>
          </Button>
        )}
      </div>
      <p
        aria-hidden={Boolean(watch)}
        className={cn(
          "max-w-[50vw] truncate text-center font-semibold opacity-0 transition-opacity duration-200 sm:max-w-md",
          stuck && "opacity-100"
        )}
      >
        {title}
      </p>
      <div className="flex min-w-0 items-center justify-end gap-1">{actions}</div>
    </div>
  )
}
