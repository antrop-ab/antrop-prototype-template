import { Progress } from "@/components/ui/progress"

type Props = {
  /** Nuvarande steg, räknat från 1. */
  current: number
  total: number
  /** Stegets namn, t.ex. "Välj tid". */
  label?: string
}

/**
 * "Steg 2 av 5 · Välj tid" med en tunn förloppsindikator. Lägg den i PageShells
 * `eyebrow` i flöden med flera steg (bokning, ansökan, anmälan).
 */
export function StepProgress({ current, total, label }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Steg {current} av {total}
        {label && (
          <>
            <span aria-hidden> · </span>
            <span className="font-medium text-foreground">{label}</span>
          </>
        )}
      </p>
      <Progress value={(current / total) * 100} aria-label={`Steg ${current} av ${total}`} className="h-1" />
    </div>
  )
}
