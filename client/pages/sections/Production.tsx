import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/context/AppDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash, Users, CalendarClock, ClipboardList, Warehouse, ChefHat, Printer } from "lucide-react";

function readLS<T>(key: string, fallback: T): T { try{ const raw = localStorage.getItem(key); return raw? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function writeLS<T>(key: string, val: T){ try{ localStorage.setItem(key, JSON.stringify(val)); } catch {} }
const LS_ROLES = "production.roles.v1";
const LS_STAFF = "production.staff.v1";
const LS_OUTLETS = "production.outlets.v1";
const LS_ORDERS = "production.orders.v1";
const LS_ORDERS_TRASH = "production.orders.trash.v1";
const LS_LOGS = "production.logs.v1";
const LS_TASKS = "production.tasks.v1";
const LS_INV_RAW = "production.inventory.raw.v1";
const LS_INV_FIN = "production.inventory.finished.v1";

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export type Role = { id: string; name: string };
export type Staff = { id: string; name: string; roleId?: string };
export type Outlet = { id: string; name: string; type: "Outlet"|"Banquets"|"Custom Cakes"; orderCutoff?: string; open?: string; close?: string; guide?: { item: string; defaultQty: number; unit: string }[] };
export type RawItem = { id: string; name: string; unit: string; onHand: number; par: number; location?: string };
export type FinishedItem = { id: string; name: string; unit: string; onHand: number; par: number; recipeId?: string; location?: string };

export type OrderLine = { id: string; item: string; qty: number; unit: string; finishedItemId?: string; recipeId?: string };
export type Order = { id: string; outletId: string; dueISO: string; notes?: string; lines: OrderLine[]; createdAt: number; changedAt?: number };
export type DeletedOrder = Order & { deletedAt: number };

export type Task = {
  id: string;
  dateISO: string;
  start: string;
  end: string;
  outletId?: string;
  orderId?: string;
  title: string;
  roleId?: string;
  staffId?: string;
  recipeId?: string;
  qty?: number;
  unit?: string;
  color?: string;
  pullFromFinished?: { finishedItemId: string; qty: number }[];
  useRaw?: { rawItemId: string; qty: number }[];
  done?: boolean;
};

export default function ProductionSection(){
  const { recipes } = useAppData();

  const [roles, setRoles] = useState<Role[]>(()=> readLS(LS_ROLES, [ { id: uid(), name: "Baker" }, { id: uid(), name: "Chocolates & Confections" } ]));
  const [staff, setStaff] = useState<Staff[]>(()=> readLS(LS_STAFF, [ { id: uid(), name: "Mike", roleId: undefined } ]));
  const [outlets, setOutlets] = useState<Outlet[]>(()=> readLS(LS_OUTLETS, [ { id: uid(), name: "Banquets", type: "Banquets", orderCutoff:"14:00" }, { id: uid(), name: "Cafe", type: "Outlet", orderCutoff:"12:00" } , { id: uid(), name: "Custom Cakes", type: "Custom Cakes", orderCutoff:"10:00" } ]));
  const [orders, setOrders] = useState<Order[]>(()=> readLS(LS_ORDERS, []));
  const [ordersTrash, setOrdersTrash] = useState<DeletedOrder[]>(()=> readLS(LS_ORDERS_TRASH, []));
  const [logs, setLogs] = useState<{ id:string; ts:number; kind:string; message:string }[]>(()=> readLS(LS_LOGS, []));
  const [tasks, setTasks] = useState<Task[]>(()=> readLS(LS_TASKS, []));
  const [raw, setRaw] = useState<RawItem[]>(()=> readLS(LS_INV_RAW, [ { id: uid(), name: "Flour", unit: "kg", onHand: 50, par: 30, location:"Row A • Shelf 1 • Bin 1" }, { id: uid(), name: "Chocolate", unit: "kg", onHand: 20, par: 10, location:"Row B • Shelf 2 • Bin 3" } ]));
  const [fin, setFin] = useState<FinishedItem[]>(()=> readLS(LS_INV_FIN, [ { id: uid(), name: "Croissant", unit: "pcs", onHand: 80, par: 120, location:"Freezer 1 • Rack 2 • Tray A" }, { id: uid(), name: "Chocolate Bonbons", unit: "pcs", onHand: 120, par: 150, location:"Freezer 2 • Rack 1 • Tray C" } ]));
  const [date, setDate] = useState<string>(()=> new Date().toISOString().slice(0,10));

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState<Task | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number; orderId?: string }>(()=>({ open:false, x:0, y:0 }));
  const [guideOutlet, setGuideOutlet] = useState<Outlet | null>(null);

  const calRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; type: 'move'|'resize'; startY: number; startMin: number; endMin: number } | null>(null);

  useEffect(()=> writeLS(LS_ROLES, roles), [roles]);
  useEffect(()=> writeLS(LS_STAFF, staff), [staff]);
  useEffect(()=> writeLS(LS_OUTLETS, outlets), [outlets]);
  useEffect(()=> writeLS(LS_ORDERS, orders), [orders]);
  useEffect(()=> writeLS(LS_ORDERS_TRASH, ordersTrash), [ordersTrash]);
  useEffect(()=> writeLS(LS_LOGS, logs), [logs]);
  useEffect(()=> writeLS(LS_TASKS, tasks), [tasks]);
  useEffect(()=> writeLS(LS_INV_RAW, raw), [raw]);
  useEffect(()=> writeLS(LS_INV_FIN, fin), [fin]);

  useEffect(()=>{
    const now = Date.now();
    setOrdersTrash(prev=> prev.filter(x=> now - x.deletedAt < 7*24*3600*1000));
    setLogs(prev=> prev.filter(l=> now - l.ts < 30*24*3600*1000));
  }, []);

  const dayTasks = useMemo(()=> tasks.filter(t=> t.dateISO===date).sort((a,b)=> a.start.localeCompare(b.start)), [tasks, date]);

  const rolesById = useMemo(()=> Object.fromEntries(roles.map(r=>[r.id,r])), [roles]);
  const staffById = useMemo(()=> Object.fromEntries(staff.map(s=>[s.id,s])), [staff]);
  const outletsById = useMemo(()=> Object.fromEntries(outlets.map(o=>[o.id,o])), [outlets]);

  function addRole(){ const name = prompt("New duty/role name", "Bread Baker"); if(!name) return; setRoles(prev=> [...prev, { id: uid(), name }]); }
  function addStaff(){ const name = prompt("Staff name", "Mike"); if(!name) return; const rid = roles[0]?.id; setStaff(prev=> [...prev, { id: uid(), name, roleId: rid }]); }
  function addOutlet(){ const name = prompt("Outlet name", "Outlet A"); if(!name) return; const type = (prompt("Type: Outlet / Banquets / Custom Cakes", "Outlet") as Outlet["type"]) || "Outlet"; const cutoff = prompt("Order cutoff (HH:mm)", "14:00") || "14:00"; setOutlets(prev=> [...prev, { id: uid(), name, type, orderCutoff: cutoff }]); }

  function addOrderQuick(o: Partial<Order>){
    const id = uid();
    const outletId = o.outletId || outlets[0]?.id!;
    const dueISO = o.dueISO || new Date().toISOString();
    const lines: OrderLine[] = o.lines && o.lines.length? o.lines : [ { id: uid(), item: "Croissant", qty: 50, unit: "pcs", finishedItemId: fin[0]?.id } ];
    const next: Order = { id, outletId, dueISO, lines, notes: o.notes||"", createdAt: Date.now() };
    setOrders(prev=> [next, ...prev]);
    setLogs(prev=> [{ id: uid(), ts: Date.now(), kind:'order', message:`Order ${id} created for ${outletsById[outletId]?.name}` }, ...prev]);
    autoPlanFromOrder(next);
  }

  function hhmmToMin(s: string){ const [h,m] = s.split(":").map(n=>parseInt(n)); return h*60 + (m||0); }
  function minToHHMM(n: number){ const h = Math.floor(n/60), m = n%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }

  function roleColor(id?: string){
    if(!id) return "#94a3b8";
    const i = Math.abs(id.split("").reduce((a,c)=> a + c.charCodeAt(0), 0));
    const palette = ["#38bdf8","#a78bfa","#34d399","#f59e0b","#f472b6","#22d3ee","#fb7185"];
    return palette[i % palette.length];
  }
  function orderStatus(o: Order){
    const due = new Date(o.dueISO);
    const cutoff = outletsById[o.outletId]?.orderCutoff || "12:00";
    const cutoffMin = hhmmToMin(cutoff);
    const madeAtMin = hhmmToMin(`${new Date(o.createdAt).getHours().toString().padStart(2,'0')}:${new Date(o.createdAt).getMinutes().toString().padStart(2,'0')}`);
    const sameDay = due.toISOString().slice(0,10) === new Date(o.createdAt).toISOString().slice(0,10);
    if(o.changedAt && Date.now() - o.changedAt < 24*3600*1000) return "change" as const;
    if(sameDay && madeAtMin > cutoffMin) return "late" as const;
    return "normal" as const;
  }

  function openTaskDialog(seed?: Partial<Task>){
    const draft: Task = {
      id: seed?.id || uid(), title: seed?.title || "",
      dateISO: seed?.dateISO || date,
      start: seed?.start || "06:00",
      end: seed?.end || "08:00",
      outletId: seed?.outletId || outlets[0]?.id,
      roleId: seed?.roleId,
      staffId: seed?.staffId,
      qty: seed?.qty,
      unit: seed?.unit,
      orderId: seed?.orderId,
      color: seed?.color,
      done: seed?.done,
    };
    setEditingId(seed?.id || null);
    setTaskDraft(draft); setTaskDialogOpen(true);
  }
  function saveTask(){ if(!taskDraft) return; setTasks(prev=> editingId? prev.map(x=> x.id===editingId? taskDraft: x) : [...prev, taskDraft]); setTaskDialogOpen(false); setTaskDraft(null); setEditingId(null); }

  function autoPlanFromOrder(order: Order, opts?: { roleId?: string; staffId?: string }){
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
            title: `Pull ${use} ${line.unit} ${it.name} from freezer`, roleId: opts?.roleId || roles.find(r=>/baker/i.test(r.name))?.id, qty: use, unit: line.unit,
            pullFromFinished: [{ finishedItemId: it.id, qty: use }], color: orderStatus(order)==='late'? '#ef4444' : orderStatus(order)==='change'? '#f59e0b' : roleColor(opts?.roleId),
          });
        }
      }
      const remaining = Math.max(0, line.qty - allocated);
      if(remaining>0){
        const rid = opts?.roleId || roles.find(r=>/chocolate|confection|baker/i.test(r.name))?.id;
        newTasks.push({
          id: uid(), dateISO: day, start: "06:30", end: "10:30", outletId: order.outletId, orderId: order.id, title: `Produce ${remaining} ${line.unit} ${line.item}`,
          roleId: rid, staffId: opts?.staffId, recipeId: line.recipeId, qty: remaining, unit: line.unit, color: orderStatus(order)==='late'? '#ef4444' : orderStatus(order)==='change'? '#f59e0b' : roleColor(rid),
        });
      }
    }
    if(newTasks.length) setTasks(prev=> [...prev, ...newTasks]);
    const finUpdated = fin.map(fx=> finMap.get(fx.id) || fx);
    setFin(finUpdated);
  }

  function deleteTask(id: string){ setTasks(prev=> prev.filter(t=> t.id!==id)); }

  type CommissaryOrderDTO = { outletId: string; dueISO: string; lines: { item: string; qty: number; unit: string; finishedItemId?: string; recipeId?: string }[]; notes?: string };
  (window as any).importCommissaryOrder = (dto: CommissaryOrderDTO) => {
    const next: Order = { id: uid(), outletId: dto.outletId, dueISO: dto.dueISO, lines: dto.lines.map(l=> ({ id: uid(), ...l })), notes: dto.notes||"", createdAt: Date.now() };
    setOrders(prev=> [next, ...prev]);
    autoPlanFromOrder(next);
  };

  const prepGroups = useMemo(()=>{
    const groups: Record<string, Task[]> = {};
    for(const t of dayTasks){ const key = `${outletsById[t.outletId||'']?.name||'Outlet'} • ${rolesById[t.roleId||'']?.name||'Unassigned'}`; (groups[key] ||= []).push(t); }
    return groups;
  }, [dayTasks, rolesById, outletsById]);

  const prepPrint = () => { setPrepOpen(true); setTimeout(()=> window.print(), 50); };

  const closeMenu = () => setMenu({ open:false, x:0, y:0 });
  const onOrderContext = (e: React.MouseEvent, id: string) => { e.preventDefault(); setMenu({ open:true, x:e.clientX, y:e.clientY, orderId:id }); };

  // Drag/move/resize
  const pxPerMin = 0.8; // 48px per hour
  function startDrag(e: React.MouseEvent, t: Task, mode: 'move'|'resize'){
    const startMin = hhmmToMin(t.start), endMin = hhmmToMin(t.end);
    dragRef.current = { id: t.id, type: mode, startY: e.clientY, startMin, endMin };
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag, { once:true });
  }
  function onDrag(e: MouseEvent){ const s = dragRef.current; if(!s) return; const dy = e.clientY - s.startY; const dmin = Math.round(dy/pxPerMin/15)*15; setTasks(prev=> prev.map(x=>{ if(x.id!==s.id) return x; let start = s.startMin, end = s.endMin; if(s.type==='move'){ start+=dmin; end+=dmin; } else { end = Math.max(start+15, s.endMin + dmin); } start=Math.max(0,start); end=Math.min(24*60, end); return { ...x, start:minToHHMM(start), end:minToHHMM(end) }; })); }
  function endDrag(){ window.removeEventListener('mousemove', onDrag); dragRef.current=null; }
  useEffect(()=>()=>{ window.removeEventListener('mousemove', onDrag); },[]);

  // Overlap lanes
  const laneInfo = useMemo(()=>{
    const arr = dayTasks.map(t=> ({ t, s: hhmmToMin(t.start), e: hhmmToMin(t.end) }));
    arr.sort((a,b)=> a.s - b.s || a.e - b.e);
    const lanesEnd: number[] = [];
    const res = new Map<string, { lane:number; lanesTotal:number }>();
    for(const {t,s,e} of arr){
      let lane = lanesEnd.findIndex(end=> end <= s);
      if(lane===-1){ lane = lanesEnd.length; lanesEnd.push(e); } else { lanesEnd[lane]=e; }
      res.set(t.id, { lane, lanesTotal: lanesEnd.length });
    }
    return res;
  }, [dayTasks]);

  // Trash badge color
  const trashCount = ordersTrash.length;
  const trashColor = trashCount===0? '#94a3b8' : '#ef4444';

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4"/> Chef Production Calendar</div>
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={date} onChange={(e)=> setDate(e.target.value)} className="rounded-md border px-2 py-1" />
            <Button size="sm" onClick={()=> openTaskDialog()}><Plus className="w-4 h-4 mr-1"/>Add task</Button>
            <Button size="sm" variant="secondary" onClick={()=> addOrderQuick({})}><ClipboardList className="w-4 h-4 mr-1"/>Quick order→plan</Button>
            <Button size="sm" variant="outline" onClick={prepPrint}><Printer className="w-4 h-4 mr-1"/>Prep sheet</Button>
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
          <TabsTrigger value="trash">Trash <span style={{ marginLeft:6, background:trashColor, color:'#fff', borderRadius:12, padding:'0 6px' }}>{trashCount}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div ref={calRef} className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
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
                    const top = hhmmToMin(t.start)*pxPerMin;
                    const h = Math.max(36, (hhmmToMin(t.end)-hhmmToMin(t.start))*pxPerMin);
                    const bg = t.color || roleColor(t.roleId);
                    const lane = laneInfo.get(t.id)?.lane ?? 0;
                    const total = laneInfo.get(t.id)?.lanesTotal ?? 1;
                    const width = `calc(${100/Math.max(total,1)}% - 6px)`;
                    const leftPct = `${(100/Math.max(total,1))*lane}%`;
                    return (
                      <div key={t.id} className="absolute" style={{ top, height:h, left:leftPct, width, paddingRight:6 }}>
                        <div className="rounded-lg border shadow p-2 text-sm select-none cursor-move" style={{ background: `linear-gradient(180deg, ${bg}22, transparent)` }} onMouseDown={(e)=> startDrag(e, t, 'move')} onDoubleClick={()=> openTaskDialog(t)}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium truncate">{t.title}</div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!t.done} onChange={(e)=> setTasks(prev=> prev.map(x=> x.id===t.id? {...x, done: e.target.checked }: x))}/> Done</label>
                              <button className="text-xs text-red-600" onClick={()=>deleteTask(t.id)} title="Delete"><Trash className="w-4 h-4"/></button>
                            </div>
                          </div>
                          <div className="text-xs opacity-80 flex flex-wrap gap-2">
                            <span>{t.start}–{t.end}</span>
                            {t.outletId && <span>{outletsById[t.outletId]?.name}</span>}
                            {t.roleId && <span>{rolesById[t.roleId]?.name}</span>}
                            {t.staffId && <span>{staffById[t.staffId]?.name}</span>}
                            {t.qty && t.unit && <span>{t.qty} {t.unit}</span>}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize" onMouseDown={(e)=>{ e.stopPropagation(); startDrag(e, t, 'resize'); }} />
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
              {orders.map(o=> {
                const st = orderStatus(o);
                const style = st==='late'? { borderColor: '#ef4444' } : st==='change'? { borderColor: '#f59e0b' } : {};
                return (
                  <div key={o.id} className="rounded-lg border p-2" onContextMenu={(e)=> onOrderContext(e, o.id)} style={style}>
                    <div className="text-sm font-medium flex items-center justify-between">
                      <span>{outletsById[o.outletId]?.name} • {new Date(o.dueISO).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <button className="text-xs underline" onClick={()=> setOrders(prev=> prev.map(x=> x.id===o.id? {...x, changedAt: Date.now() }: x))} title="Mark change">Change</button>
                        <button className="text-xs text-red-600" onClick={()=>{ if(confirm('Delete order? It will go to Trash for 7 days.')){ setOrders(prev=> prev.filter(x=>x.id!==o.id)); setOrdersTrash(prev=> [{ ...o, deletedAt: Date.now() }, ...prev]); setLogs(prev=> [{ id: uid(), ts: Date.now(), kind:'order', message:`Order ${o.id} deleted` }, ...prev]); } }}><Trash className="w-4 h-4"/></button>
                      </div>
                    </div>
                    <ul className="text-sm list-disc pl-5">
                      {o.lines.map(l=> <li key={l.id}>{l.qty} {l.unit} {l.item}</li>)}
                    </ul>
                    <div className="text-xs opacity-70">Right‑click to assign to a duty or staff and auto‑add to schedule.</div>
                  </div>
                );
              })}
            </div>
            {menu.open && (
              <div className="fixed z-50 rounded-md border bg-white shadow dark:bg-zinc-900 text-sm" style={{ top: menu.y, left: menu.x }} onMouseLeave={closeMenu}>
                <div className="px-3 py-1 font-medium border-b">Assign</div>
                <div className="px-3 py-1">To duty:</div>
                {roles.map(r=> (
                  <button key={r.id} className="block w-full text-left px-3 py-1 hover:bg-muted" onClick={()=>{ const o = orders.find(x=>x.id===menu.orderId)!; autoPlanFromOrder(o, { roleId: r.id }); closeMenu(); }}>
                    {r.name}
                  </button>
                ))}
                <div className="px-3 py-1 border-t">To staff:</div>
                {staff.map(s=> (
                  <button key={s.id} className="block w-full text-left px-3 py-1 hover:bg-muted" onClick={()=>{ const o = orders.find(x=>x.id===menu.orderId)!; autoPlanFromOrder(o, { staffId: s.id, roleId: s.roleId }); closeMenu(); }}>
                    {s.name} {s.roleId? `• ${rolesById[s.roleId]?.name}`:''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trash">
          <div className="rounded-xl border p-3 space-y-2 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <div className="text-sm text-muted-foreground">Orders in Trash (auto‑empties after 7 days)</div>
            <div className="grid md:grid-cols-2 gap-3">
              {ordersTrash.map(o=> (
                <div key={o.id} className="rounded border p-2 flex items-center justify-between">
                  <div>{outletsById[o.outletId]?.name} • {new Date(o.dueISO).toLocaleString()}</div>
                  <div className="flex items-center gap-2"><Button size="sm" variant="secondary" onClick={()=>{ setOrders(prev=> [ { id:o.id, outletId:o.outletId, dueISO:o.dueISO, notes:o.notes, lines:o.lines, createdAt:o.createdAt, changedAt:o.changedAt }, ...prev ]); setOrdersTrash(prev=> prev.filter(x=> x.id!==o.id)); }}>
                    Restore</Button><span className="text-xs text-muted-foreground">{Math.ceil((Date.now()-o.deletedAt)/3600000)}h ago</span></div>
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
                <thead><tr className="text-left"><th>Name</th><th>On hand</th><th>Par</th><th>Unit</th><th>Location</th><th></th></tr></thead>
                <tbody>
                  {fin.map(it=> (
                    <tr key={it.id} className="border-t">
                      <td>{it.name}</td>
                      <td><input className="w-20 border rounded px-1" value={it.onHand} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, onHand: Number(e.target.value||0)}:x))}/></td>
                      <td><input className="w-20 border rounded px-1" value={it.par} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, par: Number(e.target.value||0)}:x))}/></td>
                      <td>{it.unit}</td>
                      <td><input className="w-56 border rounded px-1" value={it.location||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, location: e.target.value }:x))}/></td>
                      <td><button onClick={()=> setFin(prev=> prev.filter(x=> x.id!==it.id))}><Trash className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={()=>{
                  const name = prompt("Item name","Eclair"); if(!name) return;
                  const unit = prompt("Unit","pcs") || "pcs";
                  const location = prompt("Location (Row • Shelf • Bin)", "Freezer 1 • Rack 1 • Tray A") || '';
                  setFin(prev=> [...prev, { id: uid(), name, unit, onHand: 0, par: 0, location }]);
                }}><Plus className="w-4 h-4 mr-1"/>Add</Button>
                <Button size="sm" variant="outline" onClick={()=>{ const lines = fin.map(f=> `${f.name}\t${f.onHand}\t${f.par}\t${f.unit}\t${f.location||''}`).join('\n'); const blob = new Blob([`Name\tOn hand\tPar\tUnit\tLocation\n${lines}`], { type:'text/tab-separated-values' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='finished-goods-order-sheet.tsv'; a.click(); }}><Printer className="w-4 h-4 mr-1"/>Order sheet</Button>
              </div>
            </div>
            <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
              <div className="font-medium mb-2 flex items-center gap-2"><Warehouse className="w-4 h-4"/>Raw Products</div>
              <table className="w-full text-sm">
                <thead><tr className="text-left"><th>Name</th><th>On hand</th><th>Par</th><th>Unit</th><th>Location</th><th></th></tr></thead>
                <tbody>
                  {raw.map(it=> (
                    <tr key={it.id} className="border-t">
                      <td>{it.name}</td>
                      <td><input className="w-20 border rounded px-1" value={it.onHand} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, onHand: Number(e.target.value||0)}:x))}/></td>
                      <td><input className="w-20 border rounded px-1" value={it.par} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, par: Number(e.target.value||0)}:x))}/></td>
                      <td>{it.unit}</td>
                      <td><input className="w-56 border rounded px-1" value={it.location||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, location: e.target.value }:x))}/></td>
                      <td><button onClick={()=> setRaw(prev=> prev.filter(x=> x.id!==it.id))}><Trash className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={()=>{
                  const name = prompt("Raw name","Sugar"); if(!name) return;
                  const unit = prompt("Unit","kg") || "kg";
                  const location = prompt("Location (Row • Shelf • Bin)", "Row A • Shelf 1 • Bin 1") || '';
                  setRaw(prev=> [...prev, { id: uid(), name, unit, onHand: 0, par: 0, location }]);
                }}><Plus className="w-4 h-4 mr-1"/>Add</Button>
                <Button size="sm" variant="outline" onClick={()=>{ const lines = raw.map(f=> `${f.name}\t${f.onHand}\t${f.par}\t${f.unit}\t${f.location||''}`).join('\n'); const blob = new Blob([`Name\tOn hand\tPar\tUnit\tLocation\n${lines}`], { type:'text/tab-separated-values' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='raw-products-order-sheet.tsv'; a.click(); }}><Printer className="w-4 h-4 mr-1"/>Order sheet</Button>
              </div>
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
                  <li key={s.id} className="flex items-center justify-between border-t py-1 gap-2">
                    <span className="min-w-[120px]">{s.name}</span>
                    <select className="border rounded px-1 text-xs" value={s.roleId||""} onChange={(e)=> setStaff(prev=> prev.map(x=> x.id===s.id? {...x, roleId: e.target.value||undefined }: x))}>
                      <option value="">Unassigned</option>
                      {roles.map(r=> <option value={r.id} key={r.id}>{r.name}</option>)}
                    </select>
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
                <li key={o.id} className="flex items-center justify-between border-t py-1 gap-2">
                  <span className="flex-1">{o.name} • {o.type}</span>
                  <span className="text-xs text-muted-foreground">Cutoff {o.orderCutoff||'—'} | Hours {o.open||'—'}–{o.close||'—'}</span>
                  <Button size="sm" variant="secondary" onClick={()=>{
                    const cutoff = prompt("Order cutoff (HH:mm)", o.orderCutoff||"14:00") || o.orderCutoff;
                    const open = prompt("Open (HH:mm)", o.open||"06:00") || o.open;
                    const close = prompt("Close (HH:mm)", o.close||"22:00") || o.close;
                    setOutlets(prev=> prev.map(x=> x.id===o.id? { ...x, orderCutoff: cutoff, open, close }: x));
                  }}>Settings</Button>
                  <button onClick={()=> setOutlets(prev=> prev.filter(x=> x.id!==o.id))}><Trash className="w-4 h-4"/></button>
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-2" onClick={addOutlet}><Plus className="w-4 h-4 mr-1"/>Add outlet</Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={taskDialogOpen} onOpenChange={(o)=>{ setTaskDialogOpen(o); if(!o) { setTaskDraft(null); setEditingId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
          {taskDraft && (
            <div className="space-y-2 text-sm">
              <label className="block">Title<input className="w-full border rounded px-2 py-1" value={taskDraft.title} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), title:e.target.value })}/></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">Start<input className="w-full border rounded px-2 py-1" value={taskDraft.start} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), start:e.target.value })} placeholder="HH:mm"/></label>
                <label className="block">End<input className="w-full border rounded px-2 py-1" value={taskDraft.end} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), end:e.target.value })} placeholder="HH:mm"/></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">Outlet<select className="w-full border rounded px-2 py-1" value={taskDraft.outletId||""} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), outletId:e.target.value })}>{outlets.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
                <label className="block">Duty<select className="w-full border rounded px-2 py-1" value={taskDraft.roleId||""} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), roleId:e.target.value||undefined, color: roleColor(e.target.value) })}><option value="">Unassigned</option>{roles.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">Staff<select className="w-full border rounded px-2 py-1" value={taskDraft.staffId||""} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), staffId:e.target.value||undefined })}><option value="">Unassigned</option>{staff.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                <label className="block">Qty/Unit<div className="flex gap-2"><input className="border rounded px-2 py-1 w-24" value={taskDraft.qty||''} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), qty: Number(e.target.value||0) })}/><input className="border rounded px-2 py-1 w-24" value={taskDraft.unit||''} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), unit: e.target.value })}/></div></label>
              </div>
              <label className="block">Color<input className="w-24 border rounded px-2 py-1" type="color" value={taskDraft.color||roleColor(taskDraft.roleId)} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), color:e.target.value })}/></label>
              <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=> setTaskDialogOpen(false)}>Cancel</Button><Button onClick={saveTask}>Save</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={prepOpen} onOpenChange={setPrepOpen}>
        <DialogContent className="max-w-3xl print:max-w-none print:w-[960px]">
          <DialogHeader><DialogTitle>Prep Sheet — {date}</DialogTitle></DialogHeader>
          <style>{`@media print{ .no-print{ display:none } }`}</style>
          <div className="space-y-3">
            {Object.entries(prepGroups).map(([key, items])=> (
              <div key={key} className="rounded border p-2">
                <div className="font-medium mb-1">{key}</div>
                <table className="w-full text-sm"><thead><tr className="text-left"><th>Time</th><th>Task</th><th>Assigned</th><th>Qty</th></tr></thead><tbody>
                  {items.map(t=> <tr key={t.id} className="border-t"><td>{t.start}–{t.end}</td><td>{t.title}</td><td>{t.staffId? staffById[t.staffId]?.name : rolesById[t.roleId||'']?.name || ''}</td><td>{t.qty? `${t.qty} ${t.unit||''}`:''}</td></tr>)}
                </tbody></table>
              </div>
            ))}
          </div>
          <div className="no-print flex justify-end"><Button onClick={()=> window.print()}><Printer className="w-4 h-4 mr-1"/>Print</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
