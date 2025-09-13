import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/context/AppDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash, Users, CalendarClock, ClipboardList, Warehouse, ChefHat } from "lucide-react";

// Lightweight local storage helpers (module-scoped for this section)
function readLS<T>(key: string, fallback: T): T { try{ const raw = localStorage.getItem(key); return raw? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function writeLS<T>(key: string, val: T){ try{ localStorage.setItem(key, JSON.stringify(val)); } catch {} }
const LS_ROLES = "production.roles.v1";
const LS_STAFF = "production.staff.v1";
const LS_OUTLETS = "production.outlets.v1";
const LS_ORDERS = "production.orders.v1";
const LS_TASKS = "production.tasks.v1";
const LS_INV_RAW = "production.inventory.raw.v1";
const LS_INV_FIN = "production.inventory.finished.v1";

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export type Role = { id: string; name: string };
export type Staff = { id: string; name: string; roleId?: string };
export type Outlet = { id: string; name: string; type: "Outlet"|"Banquets"|"Custom Cakes" };
export type RawItem = { id: string; name: string; unit: string; onHand: number; par: number };
export type FinishedItem = { id: string; name: string; unit: string; onHand: number; par: number; recipeId?: string };

export type OrderLine = { id: string; item: string; qty: number; unit: string; finishedItemId?: string; recipeId?: string };
export type Order = { id: string; outletId: string; dueISO: string; notes?: string; lines: OrderLine[]; createdAt: number };

export type Task = {
  id: string;
  dateISO: string; // day bucket YYYY-MM-DD
  start: string; // HH:mm
  end: string;   // HH:mm
  outletId?: string;
  orderId?: string;
  title: string;
  roleId?: string;
  staffId?: string;
  recipeId?: string;
  qty?: number;
  unit?: string;
  pullFromFinished?: { finishedItemId: string; qty: number }[];
  useRaw?: { rawItemId: string; qty: number }[];
};

export default function ProductionSection(){
  const { recipes } = useAppData();

  const [roles, setRoles] = useState<Role[]>(()=> readLS(LS_ROLES, [ { id: uid(), name: "Baker" }, { id: uid(), name: "Chocolates & Confections" } ]));
  const [staff, setStaff] = useState<Staff[]>(()=> readLS(LS_STAFF, []));
  const [outlets, setOutlets] = useState<Outlet[]>(()=> readLS(LS_OUTLETS, [ { id: uid(), name: "Banquets", type: "Banquets" }, { id: uid(), name: "Cafe", type: "Outlet" } , { id: uid(), name: "Custom Cakes", type: "Custom Cakes" } ]));
  const [orders, setOrders] = useState<Order[]>(()=> readLS(LS_ORDERS, []));
  const [tasks, setTasks] = useState<Task[]>(()=> readLS(LS_TASKS, []));
  const [raw, setRaw] = useState<RawItem[]>(()=> readLS(LS_INV_RAW, [ { id: uid(), name: "Flour", unit: "kg", onHand: 50, par: 30 }, { id: uid(), name: "Chocolate", unit: "kg", onHand: 20, par: 10 } ]));
  const [fin, setFin] = useState<FinishedItem[]>(()=> readLS(LS_INV_FIN, [ { id: uid(), name: "Croissant", unit: "pcs", onHand: 80, par: 120 }, { id: uid(), name: "Chocolate Bonbons", unit: "pcs", onHand: 120, par: 150 } ]));
  const [date, setDate] = useState<string>(()=> new Date().toISOString().slice(0,10));

  useEffect(()=> writeLS(LS_ROLES, roles), [roles]);
  useEffect(()=> writeLS(LS_STAFF, staff), [staff]);
  useEffect(()=> writeLS(LS_OUTLETS, outlets), [outlets]);
  useEffect(()=> writeLS(LS_ORDERS, orders), [orders]);
  useEffect(()=> writeLS(LS_TASKS, tasks), [tasks]);
  useEffect(()=> writeLS(LS_INV_RAW, raw), [raw]);
  useEffect(()=> writeLS(LS_INV_FIN, fin), [fin]);

  const dayTasks = useMemo(()=> tasks.filter(t=> t.dateISO===date).sort((a,b)=> a.start.localeCompare(b.start)), [tasks, date]);

  const rolesById = useMemo(()=> Object.fromEntries(roles.map(r=>[r.id,r])), [roles]);
  const staffById = useMemo(()=> Object.fromEntries(staff.map(s=>[s.id,s])), [staff]);
  const outletsById = useMemo(()=> Object.fromEntries(outlets.map(o=>[o.id,o])), [outlets]);

  function addRole(){ const name = prompt("New duty/role name", "Bread Baker"); if(!name) return; setRoles(prev=> [...prev, { id: uid(), name }]); }
  function addStaff(){ const name = prompt("Staff name"); if(!name) return; const roleId = prompt("Role for this staff (exact name)") || undefined; const rid = roles.find(r=>r.name.toLowerCase()===String(roleId||'').toLowerCase())?.id; setStaff(prev=> [...prev, { id: uid(), name, roleId: rid }]); }
  function addOutlet(){ const name = prompt("Outlet name", "Outlet A"); if(!name) return; const type = (prompt("Type: Outlet / Banquets / Custom Cakes", "Outlet") as Outlet["type"]) || "Outlet"; setOutlets(prev=> [...prev, { id: uid(), name, type }]); }

  function addOrderQuick(o: Partial<Order>){
    const id = uid();
    const outletId = o.outletId || outlets[0]?.id;
    const dueISO = o.dueISO || new Date().toISOString();
    const lines: OrderLine[] = o.lines && o.lines.length? o.lines : [ { id: uid(), item: "Croissant", qty: 50, unit: "pcs", finishedItemId: fin[0]?.id } ];
    const next: Order = { id, outletId: outletId!, dueISO, lines, notes: o.notes||"", createdAt: Date.now() };
    setOrders(prev=> [next, ...prev]);
    // Immediately plan tasks/pull based on inventory
    autoPlanFromOrder(next);
  }

  function autoPlanFromOrder(order: Order){
    const day = order.dueISO.slice(0,10);
    const newTasks: Task[] = [];
    const finMap = new Map(fin.map(x=>[x.id, {...x}]));

    for(const line of order.lines){
      let allocated = 0;
      if(line.finishedItemId && finMap.has(line.finishedItemId)){
        const it = finMap.get(line.finishedItemId)!;
        const use = Math.min(it.onHand, line.qty);
        if(use>0){
          allocated = use;
          it.onHand -= use;
          newTasks.push({
            id: uid(), dateISO: day, start: "06:00", end: "06:15", outletId: order.outletId, orderId: order.id,
            title: `Pull ${use} ${line.unit} ${it.name} from freezer`, roleId: roles.find(r=>/baker/i.test(r.name))?.id, qty: use, unit: line.unit,
            pullFromFinished: [{ finishedItemId: it.id, qty: use }],
          });
        }
      }
      const remaining = Math.max(0, line.qty - allocated);
      if(remaining>0){
        const title = line.item;
        newTasks.push({
          id: uid(), dateISO: day, start: "06:30", end: "10:30", outletId: order.outletId, orderId: order.id, title: `Produce ${remaining} ${line.unit} ${title}`,
          roleId: roles.find(r=>/chocolate|confection|baker/i.test(r.name))?.id,
          recipeId: line.recipeId,
          qty: remaining, unit: line.unit,
        });
      }
    }
    if(newTasks.length) setTasks(prev=> [...prev, ...newTasks]);
    const finUpdated = fin.map(fx=> finMap.get(fx.id) || fx);
    setFin(finUpdated);
  }

  function addManualTask(){
    const title = prompt("Task title", "Mix croissant dough"); if(!title) return;
    const start = prompt("Start time (HH:mm)", "05:00") || "05:00";
    const end = prompt("End time (HH:mm)", "08:00") || "08:00";
    const roleName = prompt("Assign duty (role)", roles[0]?.name || "");
    const roleId = roles.find(r=> r.name.toLowerCase() === String(roleName||"").toLowerCase())?.id;
    const outletId = outlets[0]?.id;
    setTasks(prev=> [...prev, { id: uid(), title, dateISO: date, start, end, roleId, outletId }]);
  }

  function deleteTask(id: string){ setTasks(prev=> prev.filter(t=> t.id!==id)); }

  // External integration endpoints for future Commissary/Custom Cake systems:
  // call importCommissaryOrder(dto) with an order payload to insert and auto-plan.
  type CommissaryOrderDTO = { outletId: string; dueISO: string; lines: { item: string; qty: number; unit: string; finishedItemId?: string; recipeId?: string }[]; notes?: string };
  (window as any).importCommissaryOrder = (dto: CommissaryOrderDTO) => {
    const next: Order = { id: uid(), outletId: dto.outletId, dueISO: dto.dueISO, lines: dto.lines.map(l=> ({ id: uid(), ...l })), notes: dto.notes||"", createdAt: Date.now() };
    setOrders(prev=> [next, ...prev]);
    autoPlanFromOrder(next);
  };

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4"/> Chef Production Calendar</div>
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={date} onChange={(e)=> setDate(e.target.value)} className="rounded-md border px-2 py-1" />
            <Button size="sm" onClick={addManualTask}><Plus className="w-4 h-4 mr-1"/>Add task</Button>
            <Button size="sm" variant="secondary" onClick={()=> addOrderQuick({})}><ClipboardList className="w-4 h-4 mr-1"/>Quick order→plan</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="staff">Staff & Duties</TabsTrigger>
          <TabsTrigger value="outlets">Outlets</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div className="flex flex-col text-xs text-muted-foreground">
                {Array.from({length:24}).map((_,i)=> (
                  <div key={i} className="h-12 border-b last:border-b-0">{String(i).padStart(2,'0')}:00</div>
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({length:24}).map((_,i)=> (
                    <div key={i} className="h-12 border-b last:border-b-0" />
                  ))}
                </div>
                <div className="relative">
                  {dayTasks.map(t=>{
                    const top = parseInt(t.start.slice(0,2))*48 + (parseInt(t.start.slice(3))*0.8);
                    const endm = parseInt(t.end.slice(0,2))*60 + parseInt(t.end.slice(3));
                    const startm = parseInt(t.start.slice(0,2))*60 + parseInt(t.start.slice(3));
                    const h = Math.max(36, (endm-startm)*0.8);
                    return (
                      <div key={t.id} className="absolute left-0 right-0 md:left-20 md:right-16" style={{ top, height: h }}>
                        <div className="rounded-lg border bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-900 shadow p-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{t.title}</div>
                            <button className="text-xs text-red-600" onClick={()=>deleteTask(t.id)} title="Delete"><Trash className="w-4 h-4"/></button>
                          </div>
                          <div className="text-xs opacity-80 flex flex-wrap gap-2">
                            <span>{t.start}–{t.end}</span>
                            {t.outletId && <span>{outletsById[t.outletId]?.name}</span>}
                            {t.roleId && <span>{rolesById[t.roleId]?.name}</span>}
                            {t.staffId && <span>{staffById[t.staffId]?.name}</span>}
                            {t.qty && t.unit && <span>{t.qty} {t.unit}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="rounded-xl border p-3 space-y-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <div className="flex items-center justify-between">
              <div className="font-medium"><ClipboardList className="inline w-4 h-4 mr-1"/>Outlet & Banquets Orders</div>
              <Button size="sm" onClick={()=> addOrderQuick({})}><Plus className="w-4 h-4 mr-1"/>Add order</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {orders.map(o=> (
                <div key={o.id} className="rounded-lg border p-2">
                  <div className="text-sm font-medium flex items-center justify-between">
                    <span>{outletsById[o.outletId]?.name} • {new Date(o.dueISO).toLocaleString()}</span>
                    <button className="text-xs text-red-600" onClick={()=> setOrders(prev=> prev.filter(x=>x.id!==o.id))}><Trash className="w-4 h-4"/></button>
                  </div>
                  <ul className="text-sm list-disc pl-5">
                    {o.lines.map(l=> <li key={l.id}>{l.qty} {l.unit} {l.item}</li>)}
                  </ul>
                  <div className="text-xs opacity-70">Planned into schedule automatically.</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
              <div className="font-medium mb-2 flex items-center gap-2"><Warehouse className="w-4 h-4"/>Finished Goods</div>
              <table className="w-full text-sm">
                <thead><tr className="text-left"><th>Name</th><th>On hand</th><th>Par</th><th>Unit</th><th></th></tr></thead>
                <tbody>
                  {fin.map(it=> (
                    <tr key={it.id} className="border-t">
                      <td>{it.name}</td>
                      <td><input className="w-20 border rounded px-1" value={it.onHand} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, onHand: Number(e.target.value||0)}:x))}/></td>
                      <td><input className="w-20 border rounded px-1" value={it.par} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, par: Number(e.target.value||0)}:x))}/></td>
                      <td>{it.unit}</td>
                      <td><button onClick={()=> setFin(prev=> prev.filter(x=> x.id!==it.id))}><Trash className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button size="sm" className="mt-2" onClick={()=>{
                const name = prompt("Item name","Eclair"); if(!name) return;
                const unit = prompt("Unit","pcs") || "pcs";
                setFin(prev=> [...prev, { id: uid(), name, unit, onHand: 0, par: 0 }]);
              }}><Plus className="w-4 h-4 mr-1"/>Add</Button>
            </div>
            <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
              <div className="font-medium mb-2 flex items-center gap-2"><Warehouse className="w-4 h-4"/>Raw Products</div>
              <table className="w-full text-sm">
                <thead><tr className="text-left"><th>Name</th><th>On hand</th><th>Par</th><th>Unit</th><th></th></tr></thead>
                <tbody>
                  {raw.map(it=> (
                    <tr key={it.id} className="border-t">
                      <td>{it.name}</td>
                      <td><input className="w-20 border rounded px-1" value={it.onHand} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, onHand: Number(e.target.value||0)}:x))}/></td>
                      <td><input className="w-20 border rounded px-1" value={it.par} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, par: Number(e.target.value||0)}:x))}/></td>
                      <td>{it.unit}</td>
                      <td><button onClick={()=> setRaw(prev=> prev.filter(x=> x.id!==it.id))}><Trash className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button size="sm" className="mt-2" onClick={()=>{
                const name = prompt("Raw name","Sugar"); if(!name) return;
                const unit = prompt("Unit","kg") || "kg";
                setRaw(prev=> [...prev, { id: uid(), name, unit, onHand: 0, par: 0 }]);
              }}><Plus className="w-4 h-4 mr-1"/>Add</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
              <div className="font-medium mb-2 flex items-center gap-2"><ChefHat className="w-4 h-4"/>Duties/Roles</div>
              <ul className="text-sm">
                {roles.map(r=> (
                  <li key={r.id} className="flex items-center justify-between border-t py-1">
                    <span>{r.name}</span>
                    <button onClick={()=> setRoles(prev=> prev.filter(x=> x.id!==r.id))}><Trash className="w-4 h-4"/></button>
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-2" onClick={addRole}><Plus className="w-4 h-4 mr-1"/>Add role</Button>
            </div>
            <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
              <div className="font-medium mb-2 flex items-center gap-2"><Users className="w-4 h-4"/>Staff</div>
              <ul className="text-sm">
                {staff.map(s=> (
                  <li key={s.id} className="flex items-center justify-between border-t py-1">
                    <span>{s.name} {s.roleId? `• ${rolesById[s.roleId]?.name}`:''}</span>
                    <button onClick={()=> setStaff(prev=> prev.filter(x=> x.id!==s.id))}><Trash className="w-4 h-4"/></button>
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-2" onClick={addStaff}><Plus className="w-4 h-4 mr-1"/>Add staff</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outlets">
          <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <div className="font-medium mb-2">Outlets & Banquets</div>
            <ul className="text-sm">
              {outlets.map(o=> (
                <li key={o.id} className="flex items-center justify-between border-t py-1">
                  <span>{o.name} • {o.type}</span>
                  <button onClick={()=> setOutlets(prev=> prev.filter(x=> x.id!==o.id))}><Trash className="w-4 h-4"/></button>
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-2" onClick={addOutlet}><Plus className="w-4 h-4 mr-1"/>Add outlet</Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={false} onOpenChange={()=>{}}>
        <DialogContent><DialogHeader><DialogTitle/></DialogHeader></DialogContent>
      </Dialog>
    </div>
  );
}
