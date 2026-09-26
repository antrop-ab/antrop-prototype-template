import { Bell, Download, MoreHorizontal, Plus, Search, Settings, Trash2 } from "lucide-react"

import { PageShell } from "@/components/prototyp/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// Visar temat och storlekarna på riktiga komponenter. Bra att visa kunden när
// temat är bytt (npm run theme), och att kolla i både ljust och mörkt läge.
const swatches = [
  ["primary", "bg-primary text-primary-foreground"],
  ["primary-soft", "bg-primary-soft text-primary-soft-foreground"],
  ["secondary", "bg-secondary text-secondary-foreground"],
  ["muted", "bg-muted text-muted-foreground"],
  ["accent", "bg-accent text-accent-foreground"],
  ["destructive", "bg-destructive text-white"],
] as const

const invoices = [
  { id: "F-1042", customer: "Norrsken AB", status: "Betald", amount: "12 400 kr" },
  { id: "F-1043", customer: "Fjällgården", status: "Förfallen", amount: "3 150 kr" },
  { id: "F-1044", customer: "Studio Kvist", status: "Skickad", amount: "8 900 kr" },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function ComponentsExample() {
  return (
    <PageShell
      title="Komponenter och tema"
      description="Alla kontroller är minst 44 punkter höga som standard. Byt färger med npm run theme. Mörkt läge följer datorns inställning (tryck D för att testa)."
      back={{ href: "/", label: "Start" }}
      width="wide"
    >
      <div className="flex flex-col gap-14">
        <Section title="Färger">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map(([name, classes]) => (
              <div key={name} className={`flex h-24 items-end rounded-xl p-3 text-sm font-medium ${classes}`}>
                {name}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Knappar">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Plus />
              Skapa projekt
            </Button>
            <Button variant="secondary">Förhandsgranska</Button>
            <Button variant="outline">
              <Download />
              Exportera
            </Button>
            <Button variant="ghost">Avbryt</Button>
            <Button variant="destructive">
              <Trash2 />
              Ta bort
            </Button>
            <Button variant="link">Läs mer</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Stor (52)</Button>
            <Button>Standard (44)</Button>
            <Button size="sm">Liten (36)</Button>
            <Button size="icon" variant="outline" aria-label="Inställningar">
              <Settings />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Aviseringar">
              <Bell />
            </Button>
          </div>
        </Section>

        <Section title="Formulär">
          <div className="grid gap-10 lg:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="namn">Namn</FieldLabel>
                <Input id="namn" placeholder="Förnamn Efternamn" autoComplete="name" />
              </Field>
              <Field>
                <FieldLabel htmlFor="epost">E-post</FieldLabel>
                <Input id="epost" type="email" placeholder="namn@exempel.se" autoComplete="email" />
                <FieldDescription>Vi skickar bara kvitton hit.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="roll">Roll</FieldLabel>
                <Select>
                  <SelectTrigger id="roll" className="w-full">
                    <SelectValue placeholder="Välj roll" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design">Designer</SelectItem>
                    <SelectItem value="utveckling">Utvecklare</SelectItem>
                    <SelectItem value="ledning">Projektledare</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="meddelande">Meddelande</FieldLabel>
                <Textarea id="meddelande" placeholder="Skriv något" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sok">Sök</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput id="sok" placeholder="Sök projekt" />
                </InputGroup>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="villkor" defaultChecked />
                <FieldLabel htmlFor="villkor">Jag godkänner villkoren</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch id="notiser" defaultChecked />
                <FieldLabel htmlFor="notiser">Skicka notiser</FieldLabel>
              </Field>
              <RadioGroup defaultValue="manad" aria-label="Betalningsperiod">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="manad" id="manad" />
                  <Label htmlFor="manad">Varje månad</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="ar" id="ar" />
                  <Label htmlFor="ar">Varje år (spara 20 %)</Label>
                </div>
              </RadioGroup>
              <ToggleGroup type="single" defaultValue="lista" variant="outline" aria-label="Visning">
                <ToggleGroupItem value="lista">Lista</ToggleGroupItem>
                <ToggleGroupItem value="tavla">Tavla</ToggleGroupItem>
                <ToggleGroupItem value="kalender">Kalender</ToggleGroupItem>
              </ToggleGroup>
            </FieldGroup>
          </div>
        </Section>

        <Section title="Innehåll">
          <Tabs defaultValue="oversikt">
            <TabsList>
              <TabsTrigger value="oversikt">Översikt</TabsTrigger>
              <TabsTrigger value="fakturor">Fakturor</TabsTrigger>
              <TabsTrigger value="installningar">Inställningar</TabsTrigger>
            </TabsList>
            <TabsContent value="oversikt" className="pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Intäkter", "184 200 kr", "+12 % mot förra månaden"],
                  ["Nya kunder", "24", "+4 sedan i fredags"],
                  ["Öppna ärenden", "7", "2 kräver svar i dag"],
                ].map(([label, value, hint]) => (
                  <Card key={label}>
                    <CardHeader>
                      <CardDescription>{label}</CardDescription>
                      <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{hint}</CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="fakturor" className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faktura</TableHead>
                    <TableHead>Kund</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Belopp</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Åtgärder</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.id}</TableCell>
                      <TableCell>{inv.customer}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "Förfallen" ? "destructive" : "secondary"}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{inv.amount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Åtgärder för ${inv.id}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Visa faktura</DropdownMenuItem>
                            <DropdownMenuItem>Skicka påminnelse</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">Makulera</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="installningar" className="pt-4 text-muted-foreground">
              Inställningar visas här.
            </TabsContent>
          </Tabs>
          <Alert>
            <Bell />
            <AlertTitle>Två fakturor förfaller i veckan</AlertTitle>
            <AlertDescription>Skicka en påminnelse nu, så slipper kunden en avgift.</AlertDescription>
          </Alert>
        </Section>

        <Section title="Lager och rörelse">
          <div className="flex flex-wrap gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Öppna sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Detaljer</SheetTitle>
                  <SheetDescription>Sheets passar för detaljer och redigering på desktop.</SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <Button>Spara</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Öppna drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-md">
                  <DrawerHeader>
                    <DrawerTitle>Välj datum</DrawerTitle>
                    <DrawerDescription>På mobil känns en drawer som en app. Dra nedåt för att stänga.</DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <Button>Klar</Button>
                    <DrawerClose asChild>
                      <Button variant="ghost">Avbryt</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Öppna dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ta bort projektet?</DialogTitle>
                  <DialogDescription>Projektet och alla filer försvinner. Det går inte att ångra.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Avbryt</Button>
                  </DialogClose>
                  <Button variant="destructive">Ta bort</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Section>

        <Separator />

        <Section title="Tät yta (data-density=&quot;compact&quot;)">
          <div data-density="compact" className="flex flex-wrap items-center gap-3">
            <Button size="sm">Liten</Button>
            <Button>Standard</Button>
            <Input className="w-56" placeholder="Filtrera" aria-label="Filtrera" />
          </div>
          <p className="text-sm text-muted-foreground">
            För verktyg på desktop där mycket ska rymmas. Använd bara när användaren sitter vid en dator med mus.
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
