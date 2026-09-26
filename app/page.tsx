import Link from "next/link"
import { ChevronRight, MessageSquareText, Palette } from "lucide-react"

import { PageShell } from "@/components/prototyp/page-shell"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

// Startsidan i en ny prototyp. Ersätt den med prototypens första vy.
const examples = [
  {
    href: "/exempel/komponenter",
    icon: Palette,
    title: "Komponenter och tema",
    description: "Se kundens färger, typsnitt och storlekar på riktiga komponenter.",
  },
  {
    href: "/exempel/chatt",
    icon: MessageSquareText,
    title: "AI-chatt",
    description: "Ett fungerande exempel med AI Elements och Vercel AI Gateway.",
  },
]

export default function Home() {
  return (
    <PageShell
      title="Din prototyp är redo"
      description="Beskriv vad du vill bygga för Claude, eller visa en Figma-skiss. Exemplen nedan kan du ta bort när du inte behöver dem."
    >
      <section aria-labelledby="exempel" className="flex flex-col gap-4">
        <h2 id="exempel" className="text-sm font-medium text-muted-foreground">
          Exempel
        </h2>
        <ItemGroup className="gap-2">
          {examples.map(({ href, icon: Icon, title, description }) => (
            <Item key={href} asChild variant="outline" className="-mx-px">
              <Link href={href} transitionTypes={["nav-forward"]}>
                <ItemMedia variant="icon" className="size-10 rounded-lg bg-primary-soft text-primary-soft-foreground">
                  <Icon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-base">{title}</ItemTitle>
                  <ItemDescription>{description}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </ItemActions>
              </Link>
            </Item>
          ))}
        </ItemGroup>
      </section>
    </PageShell>
  )
}
