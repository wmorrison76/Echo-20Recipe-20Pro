import RecipeInputPage from "./RecipeInputPage";

type Row = { qty: string; unit: string; item: string; prep: string; yieldPct: string; cost: string };

const ALLERGENS = ["Corn","Dairy","Eggs","Fish","Gluten","Mustard","Nuts","Peanuts","Sesame","Shellfish","Soy","Sulphite"];
const NATIONALITY = ["Chinese","French","Greek","Indian","Italian","Japanese","Korean","Mexican","Middle Eastern","Spanish","Thai","Vietnamese"];

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarTrigger } from "@/components/ui/sidebar";
import { Home, BookOpen, ChefHat, Settings, HelpCircle, Bell, Github, Link } from "lucide-react";

export default function AddRecipeSection() {
  return <RecipeInputPage />;
        {/* Main */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid md:grid-cols-[1fr_340px] gap-4">
              <div className="space-y-3">
                <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="RECIPE NAME" className="h-12 text-lg" />
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">COOK TIME:</span><Input value={cookTime} onChange={(e)=>setCookTime(e.target.value)} placeholder="2:30" className="h-8 w-24"/></div>
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">COOK TEMP:</span><Input value={cookTemp} onChange={(e)=>setCookTemp(e.target.value)} placeholder="350F" className="h-8 w-24"/></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">FULL RECIPE:</span><span className="font-medium">${costTotal.toFixed(2)}</span></div>
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">YIELD:</span><Input value={yieldQty} onChange={(e)=>setYieldQty(e.target.value)} className="h-8 w-16"/><span className="text-muted-foreground">QTS</span></div>
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">RECIPE ACCESS:</span><span className="text-muted-foreground">NONE</span></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">PORTION:</span><Input value={portion} onChange={(e)=>setPortion(e.target.value)} className="h-8 w-16"/></div>
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">UNIT:</span><Input value={portionUnit} onChange={(e)=>setPortionUnit(e.target.value)} className="h-8 w-16"/></div>
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">PORTION COST:</span><span className="font-medium">${(costTotal/Math.max(parseFloat(portion)||1,1)).toFixed(2)}</span><span className="text-muted-foreground">Ψ:</span><span className="text-muted-foreground">{yieldQty} QTS</span></div>
                </div>
                <Card className="p-3 bg-blue-50/50 dark:bg-blue-950/30">
                  <div className="text-xs font-medium text-sky-700 dark:text-sky-300">MODIFIERS</div>
                  <div className="text-xs text-muted-foreground">No modifiers selected</div>
                </Card>
              </div>
              <div className="space-y-3">
                <Card className="p-3 border-destructive/30 bg-destructive/5">
                  <div className="text-xs font-semibold text-destructive">ALLERGENS</div>
                  <div className="text-xs text-muted-foreground">{allergens.length ? `${allergens.length} selected` : "No allergens selected"}</div>
                </Card>
                <Card className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Recipe Image</Card>
              </div>
            </div>
          </Card>

          {/* Grid */}
          <Card className="p-3">
            <div className="grid grid-cols-[60px_80px_1fr_1fr_90px_120px] gap-2 px-1 text-[12px] text-muted-foreground">
              <div>QTY</div><div>UNIT</div><div>ITEM</div><div>PREP</div><div>YIELD %</div><div>COST</div>
            </div>
            <div className="mt-2 max-h-[520px] overflow-auto ingredient-grid pr-1">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-[60px_80px_1fr_1fr_90px_120px] gap-2 px-1 py-1">
                  <Input value={r.qty} onChange={(e)=>updateRow(setRows, rows, i, { qty: e.target.value })} className="h-9"/>
                  <Input value={r.unit} onChange={(e)=>updateRow(setRows, rows, i, { unit: e.target.value })} className="h-9"/>
                  <Input value={r.item} onChange={(e)=>updateRow(setRows, rows, i, { item: e.target.value })} className="h-9"/>
                  <Input value={r.prep} onChange={(e)=>updateRow(setRows, rows, i, { prep: e.target.value })} className="h-9"/>
                  <Input value={r.yieldPct} onChange={(e)=>updateRow(setRows, rows, i, { yieldPct: e.target.value })} className="h-9"/>
                  <Input value={r.cost} onChange={(e)=>updateRow(setRows, rows, i, { cost: e.target.value })} className="h-9"/>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <Card className="p-4 space-y-3">
            <div className="text-sm font-medium">Recipe URL</div>
            <div className="flex gap-2">
              <Input placeholder="Enter Recipe Url" />
              <Button>Go</Button>
            </div>

            <div className="text-sm font-medium mt-2">Recipe Image</div>
            <Input type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files?.[0]||null)} />

            <fieldset className="mt-3 rounded-lg border p-3 bg-destructive/5">
              <legend className="px-1 text-sm font-semibold text-destructive">Allergens ({allergens.length})</legend>
              <div className="max-h-40 overflow-auto pr-2 space-y-2">
                {ALLERGENS.map((a)=> (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={allergens.includes(a)} onCheckedChange={()=>toggle(allergens, setAllergens, a)} />
                    <span>{a}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 rounded-lg border p-3 bg-blue-50/50 dark:bg-blue-950/20">
              <legend className="px-1 text-sm font-semibold text-sky-700 dark:text-sky-300">Nationality ({nationality.length})</legend>
              <div className="max-h-40 overflow-auto pr-2 grid grid-cols-2 gap-2 text-sm">
                {NATIONALITY.map((n)=> (
                  <label key={n} className="flex items-center gap-2">
                    <Checkbox checked={nationality.includes(n)} onCheckedChange={()=>toggle(nationality, setNationality, n)} />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Status</div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>
}
