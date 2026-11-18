"use client"

import { useState } from "react"
import { Copy, MoreHorizontal, Pencil, Share, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ActionMenu } from "@/components/prototyp/action-menu"
import { AppSheet } from "@/components/prototyp/app-sheet"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"

const bookings = [
  "Fönsterputs, Vasagatan 12",
  "Storstädning, Björkvägen 3",
  "Flyttstäd, Kungsgatan 44",
  "Hemstädning, Ekbacken 7",
  "Kontorsstäd, Hamngatan 1",
  "Trappstäd, Lindvägen 18",
  "Fönsterputs, Strandvägen 9",
  "Hemstädning, Parkgatan 21",
  "Storstädning, Åsvägen 2",
  "Hemstädning, Torggatan 5",
  "Fönsterputs, Skolgatan 30",
  "Flyttstäd, Bergsgatan 16",
]

/** Exempel på prototypens lager: en lång lista, ett kort formulär och en meny. */
export function LayerExamples() {
  const [editing, setEditing] = useState(false)
  return (
    <div className="flex flex-wrap gap-3">
      <AppSheet
        title="Veckans bokningar"
        description="12 bokningar, måndag till fredag"
        trigger={<Button variant="outline">Lång sheet</Button>}
      >
        <ItemGroup>
          {bookings.map((b, i) => (
            <Item key={b} size="sm" className="px-0">
              <ItemContent>
                <ItemTitle>{b}</ItemTitle>
                <ItemDescription>{["Mån", "Tis", "Ons", "Tors", "Fre"][i % 5]} kl. {8 + (i % 8)}:00</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </AppSheet>

      <AppSheet
        open={editing}
        onOpenChange={setEditing}
        title="Byt namn"
        footer={
          <Button
            className="w-full"
            onClick={() => {
              setEditing(false)
              toast("Namnet är ändrat")
            }}
          >
            Spara
          </Button>
        }
      >
        <Field>
          <FieldLabel htmlFor="kundnamn">Namn</FieldLabel>
          <Input id="kundnamn" defaultValue="Norrsken AB" />
        </Field>
      </AppSheet>
      <Button variant="outline" onClick={() => setEditing(true)}>
        Kort sheet
      </Button>

      <ActionMenu
        title="Norrsken AB"
        trigger={
          <Button variant="outline" size="icon" aria-label="Mer för Norrsken AB">
            <MoreHorizontal />
          </Button>
        }
        groups={[
          [
            { icon: Pencil, label: "Byt namn", onSelect: () => setEditing(true) },
            { icon: Copy, label: "Duplicera", onSelect: () => toast("Kopia skapad") },
            { icon: Share, label: "Dela", onSelect: () => toast("Länken är kopierad") },
          ],
          [{ icon: Trash2, label: "Ta bort", destructive: true, onSelect: () => toast("Borttagen") }],
        ]}
      />
    </div>
  )
}
