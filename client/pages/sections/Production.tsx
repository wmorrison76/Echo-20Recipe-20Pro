import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/context/AppDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash, Users, CalendarClock, ClipboardList, Warehouse, ChefHat, Printer } from "lucide-react";
import { GlobalCalendar } from "@/components/panels/GlobalCalendar";
import type { CalendarEvent } from "@/stores/beoStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
const LS_INV_LOTS = "production.inventory.lots.v1";
const LS_SESSION_USER = "production.session.user.v1";
const LS_STORAGE_AREAS = "production.storage.areas.v1";

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export type Role = { id: string; name: string };
export type Staff = { id: string; name: string; roleId?: string; pinHash?: string };
export type Outlet = { id: string; name: string; type: "Outlet"|"Banquets"|"Custom Cakes"; orderCutoff?: string; open?: string; close?: string; guide?: { item: string; defaultQty: number; unit: string }[] };
export type RawItem = { id: string; code?: string; name: string; unit: string; onHand: number; par: number; unitCost?: number; vendor?: string; brand?: string; reordered?: boolean; location?: string; category?: string; storageAreaId?: string; shelf?: string; bin?: string };
export type FinishedItem = { id: string; code?: string; name: string; unit: string; onHand: number; par: number; unitCost?: number; vendor?: string; brand?: string; reordered?: boolean; recipeId?: string; location?: string; category?: string; storageAreaId?: string; shelf?: string; bin?: string };
export type InvLot = { id:string; kind:'raw'|'fin'; itemId:string; lotCode?:string; qty:number; unit:string; receivedAt:number; expiryDate?:string; location?:string; note?:string; receiverId?:string; receiverName?:string };
export type StorageArea = { id: string; name: string; note?: string };

export type OrderLine = { id: string; item: string; qty: number; unit: string; finishedItemId?: string; recipeId?: string };
export type Order = { id: string; outletId: string; dueISO: string; notes?: string; lines: OrderLine[]; createdAt: number; changedAt?: number };
export type DeletedOrder = Order & { deletedAt: number; deletedById?: string; deletedByName?: string; deleteReason?: string };

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
  category?: 'production' | 'housekeeping' | 'delivery' | 'other';
  pullFromFinished?: { finishedItemId: string; qty: number }[];
  useRaw?: { rawItemId: string; qty: number }[];
  done?: boolean;
  invAccounted?: boolean;
};

async function sha256Hex(text: string){
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b=> b.toString(16).padStart(2,'0')).join('');
}

export default function ProductionSection(){
  const { recipes } = useAppData();

  const [roles, setRoles] = useState<Role[]>(()=> readLS(LS_ROLES, [ { id: uid(), name: "Baker" }, { id: uid(), name: "Chocolates & Confections" } ]));
  const [staff, setStaff] = useState<Staff[]>(()=> readLS(LS_STAFF, [ { id: uid(), name: "Mike", roleId: undefined } ]));
  const [outlets, setOutlets] = useState<Outlet[]>(()=> readLS(LS_OUTLETS, [ { id: uid(), name: "Banquets", type: "Banquets", orderCutoff:"14:00" }, { id: uid(), name: "Cafe", type: "Outlet", orderCutoff:"12:00" } , { id: uid(), name: "Custom Cakes", type: "Custom Cakes", orderCutoff:"10:00" } ]));
  const [orders, setOrders] = useState<Order[]>(()=> readLS(LS_ORDERS, []));
  const [ordersTrash, setOrdersTrash] = useState<DeletedOrder[]>(()=> readLS(LS_ORDERS_TRASH, []));
  const [logs, setLogs] = useState<{ id:string; ts:number; kind:string; message:string; actorId?:string; actorName?:string }[]>(()=> readLS(LS_LOGS, []));
  const [tasks, setTasks] = useState<Task[]>(()=> readLS(LS_TASKS, []));
  const [raw, setRaw] = useState<RawItem[]>(()=> readLS(LS_INV_RAW, [ { id: uid(), name: "Flour", unit: "kg", onHand: 50, par: 30, location:"Row A • Shelf 1 • Bin 1" }, { id: uid(), name: "Chocolate", unit: "kg", onHand: 20, par: 10, location:"Row B • Shelf 2 • Bin 3" } ]));
  const [fin, setFin] = useState<FinishedItem[]>(()=> readLS(LS_INV_FIN, [ { id: uid(), name: "Croissant", unit: "pcs", onHand: 80, par: 120, location:"Freezer 1 • Rack 2 • Tray A" }, { id: uid(), name: "Chocolate Bonbons", unit: "pcs", onHand: 120, par: 150, location:"Freezer 2 • Rack 1 • Tray C" } ]));
  const [lots, setLots] = useState<InvLot[]>(()=> readLS(LS_INV_LOTS, []));
  const [storageAreas, setStorageAreas] = useState<StorageArea[]>(()=> readLS(LS_STORAGE_AREAS, [ { id: uid(), name: 'Freezer 1' }, { id: uid(), name: 'Freezer 2' }, { id: uid(), name: 'Dry Storage' } ]));
  const [invTab, setInvTab] = useState<'finished'|'raw'>('finished');
  const [finQuery, setFinQuery] = useState("");
  const [rawQuery, setRawQuery] = useState("");
  const [finPage, setFinPage] = useState(1);
  const [rawPage, setRawPage] = useState(1);
  const pageSize = 100;

  function lotStats(kind: 'raw'|'fin', itemId: string){
    const its = lots.filter(l=> l.kind===kind && l.itemId===itemId);
    const latestPurchase = its.length? new Date(Math.max(...its.map(l=> l.receivedAt||0))) : undefined;
    const upcoming = its.map(l=> l.expiryDate? new Date(l.expiryDate) : null).filter(Boolean) as Date[];
    const nextExpiry = upcoming.length? new Date(Math.min(...upcoming.map(d=> d.getTime()))) : undefined;
    const daysLeft = nextExpiry? Math.ceil((nextExpiry.getTime() - Date.now())/86400000) : undefined;
    return { latestPurchase, nextExpiry, daysLeft } as const;
  }
  function expiryBg(days?: number){
    if(days===undefined) return '';
    if(days<=1) return 'bg-red-100 dark:bg-red-900/30';
    if(days<=3) return 'bg-orange-100 dark:bg-orange-900/30';
    if(days<=5) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return '';
  }
  function fmtCurrency(n:number){ try { return n.toLocaleString(undefined, { style:'currency', currency:'USD' }); } catch { return `$${(n||0).toFixed(2)}`; } }
  const [date, setDate] = useState<string>(()=> new Date().toISOString().slice(0,10));

  const [currentUserId, setCurrentUserId] = useState<string | null>(()=> readLS(LS_SESSION_USER, null));
  const currentUser = useMemo(()=> staff.find(s=> s.id===currentUserId) || null, [staff, currentUserId]);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState<Task | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [invSheetOpen, setInvSheetOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);

  function downloadCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]){
    const esc=(v:any)=>{
      if(v===null||v===undefined) return '';
      const s=String(v);
      return /[",\n]/.test(s)? '"'+s.replace(/"/g,'""')+'"' : s;
    };
    const text = [headers.join(','), ...rows.map(r=> r.map(esc).join(','))].join('\n');
    const blob = new Blob([text], { type:'text/csv;charset=utf-8;' });
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  }
  function exportCountsCSV(){
    const headers = ['date','outlet_id','location_code','item_id','count_qty','count_uom','note'];
    const areaById = Object.fromEntries(storageAreas.map(a=> [a.id, a.name]));
    const today = date;
    const outletId = outlets[0]?.id || '';
    const finRows = fin.map(it=> [today, outletId, it.storageAreaId? areaById[it.storageAreaId]: (it.location||''), it.id, it.onHand||0, it.unit||'', '']);
    const rawRows = raw.map(it=> [today, outletId, it.storageAreaId? areaById[it.storageAreaId]: (it.location||''), it.id, it.onHand||0, it.unit||'', '']);
    downloadCSV('counts.csv', headers, [...finRows, ...rawRows]);
  }
  function exportSuggestedOrdersCSV(){
    const headers = ['vendor_id','item_id','suggested_pack_qty','pack_uom','reason','deliver_by'];
    const deliverBy = date;
    const rows:(string|number)[][] = [];
    for(const it of raw){
      const short = Math.max(0, (it.par||0) - (it.onHand||0));
      if(short>0){ rows.push(['', it.id, 1, it.unit||'', 'PAR', deliverBy]); }
    }
    for(const it of fin){
      const short = Math.max(0, (it.par||0) - (it.onHand||0));
      if(short>0){ rows.push(['', it.id, 1, it.unit||'', 'PAR', deliverBy]); }
    }
    downloadCSV('suggested_orders.csv', headers, rows);
  }
  function exportProductionReqCSV(){
    const headers = ['date','prepped_id','required_output_qty','output_uom','reason','source_ref'];
    const rows:(string|number)[][] = [];
    const dTasks = tasks.filter(t=> t.dateISO===date && t.recipeId && t.qty);
    for(const t of dTasks){ rows.push([date, t.recipeId||'', t.qty||0, t.unit||'', 'PLAN', t.id]); }
    downloadCSV('production_requirements.csv', headers, rows);
  }
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number; orderId?: string }>(()=>({ open:false, x:0, y:0 }));
  const [guideOutlet, setGuideOutlet] = useState<Outlet | null>(null);

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderEditingId, setOrderEditingId] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<{ id:string; outletId:string; date:string; time:string; notes:string; lines: OrderLine[] } | null>(null);

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickDraft, setQuickDraft] = useState<{ outletId:string; date:string; time:string; lines: { id:string; item:string; qty:number; unit:string; finishedItemId?:string }[] } | null>(null);

  const [multiAssignOpen, setMultiAssignOpen] = useState(false);
  const [multiAssignOrderId, setMultiAssignOrderId] = useState<string | null>(null);
  const [multiAssign, setMultiAssign] = useState<string[]>([]);

  const [signOpen, setSignOpen] = useState(false);
  const [signStaffId, setSignStaffId] = useState<string>("");
  const [signPin, setSignPin] = useState("");
  const [signError, setSignError] = useState("");

  const [confirmDelOpen, setConfirmDelOpen] = useState(false);
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletePin, setDeletePin] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [invOpen, setInvOpen] = useState(false);
  const [invKind, setInvKind] = useState<'raw'|'fin'>('raw');
  const [invItemId, setInvItemId] = useState<string>('');
  const [invQty, setInvQty] = useState<number>(0);
  const [invUnit, setInvUnit] = useState<string>('');
  const [invLotCode, setInvLotCode] = useState<string>('');
  const [invExpiry, setInvExpiry] = useState<string>('');
  const [invLocation, setInvLocation] = useState<string>('');
  const [invNote, setInvNote] = useState<string>('');

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
  useEffect(()=> writeLS(LS_INV_LOTS, lots), [lots]);
  useEffect(()=> writeLS(LS_STORAGE_AREAS, storageAreas), [storageAreas]);
  useEffect(()=> writeLS(LS_SESSION_USER, currentUserId), [currentUserId]);
  useEffect(()=>{ setFinPage(1); }, [finQuery]);
  useEffect(()=>{ setRawPage(1); }, [rawQuery]);
  const bookedFinishedForDate = useMemo(()=>{ const m: Record<string, number> = {}; for(const t of tasks){ if(t.dateISO!==date) continue; for(const p of (t.pullFromFinished||[])){ m[p.finishedItemId] = (m[p.finishedItemId]||0) + (Number(p.qty)||0); } } return m; }, [tasks, date]);
  const bookedRawForDate = useMemo(()=>{ const m: Record<string, number> = {}; for(const t of tasks){ if(t.dateISO!==date) continue; for(const u of (t.useRaw||[])){ m[u.rawItemId] = (m[u.rawItemId]||0) + (Number(u.qty)||0); } } return m; }, [tasks, date]);

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
    setLogs(prev=> [{ id: uid(), ts: Date.now(), kind:'order', message:`Order ${id} created for ${outletsById[outletId]?.name}`, actorId: currentUser?.id, actorName: currentUser?.name }, ...prev]);
    autoPlanFromOrder(next);
  }

  function hhmmToMin(s: string){ const [h,m] = s.split(":").map(n=>parseInt(n)); return h*60 + (m||0); }
  function minToHHMM(n: number){ const h = Math.floor(n/60), m = n%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }

  function roleColor(id?: string){
    if(!id) return "";
    const i = Math.abs(id.split("").reduce((a,c)=> a + c.charCodeAt(0), 0));
    const palette = ["#38bdf8","#a78bfa","#34d399","#f59e0b","#f472b6","#22d3ee","#fb7185"];
    return palette[i % palette.length];
  }
  function categoryColor(cat?: Task['category']){
    switch(cat){
      case 'housekeeping': return '#22d3ee';
      case 'delivery': return '#34d399';
      default: return '#94a3b8';
    }
  }
  function taskBgColor(t: Task){
    return t.color || roleColor(t.roleId) || categoryColor(t.category);
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

  function localDateString(d: Date){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function localTimeHHMM(d: Date){
    const h = String(d.getHours()).padStart(2,'0');
    const m = String(d.getMinutes()).padStart(2,'0');
    return `${h}:${m}`;
  }
  function mapOrderStatusToEventStatus(s: 'normal'|'late'|'change'): CalendarEvent['status']{
    switch(s){
      case 'late': return 'pending';
      case 'change': return 'in_prep';
      default: return 'confirmed';
    }
  }

  const combinedEvents = useMemo<CalendarEvent[]>(()=>{
    const orderEvents: CalendarEvent[] = orders.map(o=>{
      const dt = new Date(o.dueISO);
      return {
        id: `order-${o.id}`,
        title: `${outletsById[o.outletId]?.name || 'Outlet'} — Order`,
        date: localDateString(dt),
        time: localTimeHHMM(dt),
        room: outletsById[o.outletId]?.name || 'Outlet',
        guestCount: o.lines.reduce((sum,l)=> sum + (Number(l.qty)||0), 0),
        status: mapOrderStatusToEventStatus(orderStatus(o)),
        priority: 'medium',
        acknowledged: true,
        clientName: outletsById[o.outletId]?.name || undefined,
      };
    });
    const taskEvents: CalendarEvent[] = tasks.map(t=> ({
      id: `task-${t.id}`,
      title: t.title,
      date: t.dateISO,
      time: `${t.start} - ${t.end}`,
      room: t.outletId? (outletsById[t.outletId]?.name || 'Outlet') : '—',
      guestCount: Number(t.qty||0),
      status: t.done? 'confirmed' : 'pending',
      priority: t.category==='production'? 'medium' : 'low',
      acknowledged: true,
      clientName: undefined,
    }));
    return [...orderEvents, ...taskEvents];
  }, [orders, tasks, outletsById]);

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
      category: seed?.category || 'production',
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

  function toggleTaskDone(id: string, checked: boolean){
    setTasks(prev=>{
      const t = prev.find(x=> x.id===id);
      if(!t) return prev;
      if(checked && !t.invAccounted){
        if(t.pullFromFinished){ setFin(cur=> cur.map(f=>{ const used = t.pullFromFinished!.find(p=> p.finishedItemId===f.id)?.qty||0; return used? { ...f, onHand: Math.max(0, (f.onHand||0) - used) } : f; })); }
        if(t.useRaw){ setRaw(cur=> cur.map(r=>{ const used = t.useRaw!.find(u=> u.rawItemId===r.id)?.qty||0; return used? { ...r, onHand: Math.max(0, (r.onHand||0) - used) } : r; })); }
        if(t.recipeId && t.qty){ setFin(cur=>{ const idx = cur.findIndex(f=> f.recipeId===t.recipeId); if(idx>=0){ const c=[...cur]; c[idx]={...c[idx], onHand:(c[idx].onHand||0)+ (t.qty||0)}; return c; } return cur; }); }
      }
      if(!checked && t.invAccounted){
        if(t.pullFromFinished){ setFin(cur=> cur.map(f=>{ const used = t.pullFromFinished!.find(p=> p.finishedItemId===f.id)?.qty||0; return used? { ...f, onHand: (f.onHand||0) + used } : f; })); }
        if(t.useRaw){ setRaw(cur=> cur.map(r=>{ const used = t.useRaw!.find(u=> u.rawItemId===r.id)?.qty||0; return used? { ...r, onHand: (r.onHand||0) + used } : r; })); }
        if(t.recipeId && t.qty){ setFin(cur=>{ const idx = cur.findIndex(f=> f.recipeId===t.recipeId); if(idx>=0){ const c=[...cur]; c[idx]={...c[idx], onHand: Math.max(0,(c[idx].onHand||0)- (t.qty||0))}; return c; } return cur; }); }
      }
      return prev.map(x=> x.id===id? { ...x, done: checked, invAccounted: checked? true : false } : x);
    });
  }

  type CommissaryOrderDTO = { outletId: string; dueISO: string; lines: { item: string; qty: number; unit: string; finishedItemId?: string; recipeId?: string }[]; notes?: string };
  (window as any).importCommissaryOrder = (dto: CommissaryOrderDTO) => {
    const next: Order = { id: uid(), outletId: dto.outletId, dueISO: dto.dueISO, lines: dto.lines.map(l=> ({ id: uid(), ...l })), notes: dto.notes||"", createdAt: Date.now() };
    setOrders(prev=> [next, ...prev]);
    autoPlanFromOrder(next);
  };

  function openReceive(kind:'raw'|'fin', id:string){
    setInvKind(kind); setInvItemId(id);
    if(kind==='raw'){ const it = raw.find(x=> x.id===id)!; setInvUnit(it.unit); setInvLocation(it.location||''); }
    else { const it = fin.find(x=> x.id===id)!; setInvUnit(it.unit); setInvLocation(it.location||''); }
    setInvQty(0); setInvLotCode(''); setInvExpiry(''); setInvNote(''); setInvOpen(true);
  }
  function saveReceive(){
    if(!invItemId || invQty<=0) { setInvOpen(false); return; }
    const lot: InvLot = { id: uid(), kind: invKind, itemId: invItemId, lotCode: invLotCode||undefined, qty: invQty, unit: invUnit||'pcs', receivedAt: Date.now(), expiryDate: invExpiry||undefined, location: invLocation||undefined, note: invNote||undefined, receiverId: currentUser?.id, receiverName: currentUser?.name };
    setLots(prev=> [lot, ...prev]);
    if(invKind==='raw'){ setRaw(prev=> prev.map(x=> x.id===invItemId? { ...x, onHand: (x.onHand||0) + invQty, unit: invUnit, location: invLocation||x.location }: x)); }
    else { setFin(prev=> prev.map(x=> x.id===invItemId? { ...x, onHand: (x.onHand||0) + invQty, unit: invUnit, location: invLocation||x.location }: x)); }
    setLogs(prev=> [{ id: uid(), ts: Date.now(), kind:'inventory', message:`Received ${invQty} ${invUnit} into ${invKind==='raw'?'raw':'finished'}: ${invKind==='raw'? (raw.find(r=> r.id===invItemId)?.name) : (fin.find(f=> f.id===invItemId)?.name)}`, actorId: currentUser?.id, actorName: currentUser?.name }, ...prev]);
    setInvOpen(false);
  }

  const prepGroups = useMemo(()=>{
    const groups: Record<string, Task[]> = {};
    for(const t of dayTasks){ const key = `${outletsById[t.outletId||'']?.name||'Outlet'} • ${rolesById[t.roleId||'']?.name||'Unassigned'}`; (groups[key] ||= []).push(t); }
    return groups;
  }, [dayTasks, rolesById, outletsById]);

  const prepPrint = () => { setPrepOpen(true); setTimeout(()=> window.print(), 50); };

  const closeMenu = () => setMenu({ open:false, x:0, y:0 });
  const onOrderContext = (e: React.MouseEvent, id: string) => { e.preventDefault(); setMenu({ open:true, x:e.clientX, y:e.clientY, orderId:id }); };

  function openQuick(){
    const today = date;
    setQuickDraft({ outletId: outlets[0]?.id || '', date: today, time: '06:00', lines: [ { id: uid(), item: '', qty: 0, unit: 'pcs' } ] });
    setQuickOpen(true);
  }
  function onQuickItemChange(idx:number, val:string){
    const m = fin.find(f=> f.name.toLowerCase()===val.toLowerCase());
    setQuickDraft(prev=> prev? { ...prev, lines: prev.lines.map((x,i)=> i===idx? { ...x, item: val, finishedItemId: m?.id, unit: x.unit || m?.unit || 'pcs' } : x) } : prev);
  }
  function saveQuick(){
    if(!quickDraft) return;
    const dueISO = new Date(`${quickDraft.date}T${quickDraft.time}:00`).toISOString();
    const lines = quickDraft.lines.filter(l=> l.item && l.qty>0).map(l=> ({ id: uid(), item: l.item, qty: l.qty, unit: l.unit, finishedItemId: l.finishedItemId }));
    if(!lines.length) { setQuickOpen(false); setQuickDraft(null); return; }
    addOrderQuick({ outletId: quickDraft.outletId, dueISO, lines });
    setQuickOpen(false); setQuickDraft(null);
  }

  function openOrderDialog(o: Order){
    const dt = new Date(o.dueISO);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset()*60000);
    const date = local.toISOString().slice(0,10);
    const time = `${String(local.getHours()).padStart(2,'0')}:${String(local.getMinutes()).padStart(2,'0')}`;
    setOrders(prev=> prev.map(x=> x.id===o.id? { ...x, changedAt: Date.now() }: x));
    setOrderEditingId(o.id);
    setOrderDraft({ id:o.id, outletId:o.outletId, date, time, notes:o.notes||'', lines: o.lines.map(l=> ({...l})) });
    setOrderDialogOpen(true);
  }
  function saveOrder(){
    if(!orderDraft) return;
    const dueISO = new Date(`${orderDraft.date}T${orderDraft.time}:00`).toISOString();
    setOrders(prev=> prev.map(x=> x.id===orderEditingId? { ...x, outletId: orderDraft.outletId, dueISO, notes: orderDraft.notes, lines: orderDraft.lines, changedAt: Date.now() } : x));
    setLogs(prev=> [{ id: uid(), ts: Date.now(), kind:'order', message:`Order ${orderDraft.id} changed`, actorId: currentUser?.id, actorName: currentUser?.name }, ...prev]);
    setOrderDialogOpen(false); setOrderDraft(null); setOrderEditingId(null);
  }

  // Drag/move/resize
  const pxPerMin = 0.8; // 48px per hour
  function startDrag(e: React.PointerEvent, t: Task, mode: 'move'|'resize'){
    const startMin = hhmmToMin(t.start), endMin = hhmmToMin(t.end);
    dragRef.current = { id: t.id, type: mode, startY: e.clientY, startMin, endMin };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    window.addEventListener('pointermove', onDrag as any, { passive:false } as any);
    window.addEventListener('pointerup', endDrag as any, { once:true } as any);
  }
  function onDrag(e: PointerEvent){ const s = dragRef.current; if(!s) return; const dy = e.clientY - s.startY; const dmin = Math.round(dy/pxPerMin/15)*15; setTasks(prev=> prev.map(x=>{ if(x.id!==s.id) return x; let start = s.startMin, end = s.endMin; if(s.type==='move'){ start+=dmin; end+=dmin; } else { end = Math.max(start+15, s.endMin + dmin); } start=Math.max(0,start); end=Math.min(24*60, end); return { ...x, start:minToHHMM(start), end:minToHHMM(end) }; })); }
  function endDrag(){ window.removeEventListener('pointermove', onDrag as any); dragRef.current=null; }
  useEffect(()=>()=>{ window.removeEventListener('pointermove', onDrag as any); },[]);

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

  // Auth helpers
  async function verifyPinForStaff(staffId: string, pin: string){
    const s = staffById[staffId];
    if(!s?.pinHash) return false;
    const hash = await sha256Hex(pin);
    return hash === s.pinHash;
  }

  function openDeleteOrderFlow(orderId: string){
    setPendingDeleteOrderId(orderId);
    setDeleteReason("");
    setDeletePin("");
    setDeleteError("");
    if(!currentUser){
      setSignOpen(true);
    } else {
      setConfirmDelOpen(true);
    }
  }

  async function performDeleteOrder(){
    if(!pendingDeleteOrderId) return;
    if(!currentUser){ setDeleteError("Please sign in."); return; }
    const ok = await verifyPinForStaff(currentUser.id, deletePin);
    if(!ok){ setDeleteError("Invalid PIN"); return; }
    const o = orders.find(x=> x.id===pendingDeleteOrderId);
    if(!o){ setConfirmDelOpen(false); setPendingDeleteOrderId(null); return; }
    setOrders(prev=> prev.filter(x=> x.id!==o.id));
    setOrdersTrash(prev=> [{ ...o, deletedAt: Date.now(), deletedById: currentUser.id, deletedByName: currentUser.name, deleteReason: deleteReason.trim() }, ...prev]);
    setLogs(prev=> [{ id: uid(), ts: Date.now(), kind:'order', message:`Order ${o.id} deleted${deleteReason? ` — ${deleteReason}`:''}`, actorId: currentUser.id, actorName: currentUser.name }, ...prev]);
    setConfirmDelOpen(false);
    setPendingDeleteOrderId(null);
  }

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4"/> Chef Production Calendar</div>
          <div className="flex items-center gap-2 text-sm">
            <div className="hidden md:flex items-center gap-2 mr-2">
              {currentUser? (
                <>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">Signed in: {currentUser.name}</span>
                  <Button size="sm" variant="outline" onClick={()=> setCurrentUserId(null)}>Sign out</Button>
                </>
              ):(
                <Button size="sm" variant="outline" onClick={()=> setSignOpen(true)}>Sign in</Button>
              )}
            </div>
            <input type="date" value={date} onChange={(e)=> setDate(e.target.value)} className="rounded-md border px-2 py-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1"/>Add task</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Add task</DropdownMenuLabel>
                <DropdownMenuItem onClick={()=> openTaskDialog({ category:'production', title:'', roleId: roles[0]?.id })}>Production…</DropdownMenuItem>
                <DropdownMenuItem onClick={()=> openTaskDialog({ category:'housekeeping', title:'Clean workstation' })}>Housekeeping…</DropdownMenuItem>
                <DropdownMenuItem onClick={()=> openTaskDialog({ category:'delivery', title:'Delivery to outlet' })}>Delivery…</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={()=> openTaskDialog({})}>Custom…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="secondary" onClick={openQuick}><ClipboardList className="w-4 h-4 mr-1"/>Quick order→plan</Button>
            <Button size="sm" variant="outline" onClick={prepPrint}><Printer className="w-4 h-4 mr-1"/>Prep sheet</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="global-cal">Global Calendar</TabsTrigger>
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
                    const bg = taskBgColor(t);
                    const lane = laneInfo.get(t.id)?.lane ?? 0;
                    const total = laneInfo.get(t.id)?.lanesTotal ?? 1;
                    const width = `calc(${100/Math.max(total,1)}% - 6px)`;
                    const leftPct = `${(100/Math.max(total,1))*lane}%`;
                    return (
                      <div key={t.id} className="absolute" style={{ top, height:h, left:leftPct, width, paddingRight:6 }}>
                        <div className="rounded-lg border shadow p-2 text-sm select-none cursor-move" style={{ background: `linear-gradient(180deg, ${bg}22, transparent)`, touchAction:'none' as any }} onPointerDown={(e)=> startDrag(e, t, 'move')} onDoubleClick={()=> openTaskDialog(t)}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium truncate">{t.title}</div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!t.done} onChange={(e)=> toggleTaskDone(t.id, e.target.checked)}/> Done</label>
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
                          <div className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize" style={{ touchAction:'none' as any }} onPointerDown={(e)=>{ e.stopPropagation(); startDrag(e, t, 'resize'); }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="global-cal">
          <div className="rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <GlobalCalendar events={combinedEvents} />
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="rounded-xl border p-3 space-y-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <div className="flex items-center justify-between">
              <div className="font-medium"><ClipboardList className="inline w-4 h-4 mr-1"/>Outlet & Banquets Orders</div>
              <div className="flex items-center gap-2">
                {!currentUser && <Button size="sm" variant="outline" onClick={()=> setSignOpen(true)}>Sign in</Button>}
                <Button size="sm" onClick={()=> addOrderQuick({})}><Plus className="w-4 h-4 mr-1"/>Add order</Button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {orders.map(o=> {
                const st = orderStatus(o);
                const style = st==='late'? { borderColor: '#ef4444', background: 'linear-gradient(180deg, #ef444422, transparent)' } : st==='change'? { borderColor: '#f59e0b', background: 'linear-gradient(180deg, #f59e0b22, transparent)' } : {};
                return (
                  <div key={o.id} className="rounded-lg border p-2" onContextMenu={(e)=> onOrderContext(e, o.id)} style={style}>
                    <div className="text-sm font-medium flex items-center justify-between">
                      <span>{outletsById[o.outletId]?.name} • {new Date(o.dueISO).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        {st==='late' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white">Late</span>}
                        {st==='change' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white">Change</span>}
                        <button className="text-xs underline" onClick={()=> openOrderDialog(o)} title="Edit order">Change</button>
                        <button className="text-xs text-red-600" onClick={()=> openDeleteOrderFlow(o.id)} title="Delete order"><Trash className="w-4 h-4"/></button>
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
                <div className="border-t mt-1">
                  <button className="block w-full text-left px-3 py-1 hover:bg-muted" onClick={()=>{ setMultiAssignOrderId(menu.orderId||null); setMultiAssignOpen(true); closeMenu(); }}>Assign to multiple…</button>
                </div>
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
                  <div className="text-sm">
                    <div>{outletsById[o.outletId]?.name} • {new Date(o.dueISO).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Deleted {Math.ceil((Date.now()-o.deletedAt)/3600000)}h ago{ o.deletedByName? ` by ${o.deletedByName}`:'' }{ o.deleteReason? ` — ${o.deleteReason}`:''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={()=>{ setOrders(prev=> [ { id:o.id, outletId:o.outletId, dueISO:o.dueISO, notes:o.notes, lines:o.lines, createdAt:o.createdAt, changedAt:o.changedAt }, ...prev ]); setOrdersTrash(prev=> prev.filter(x=> x.id!==o.id)); setLogs(prev=> [{ id: uid(), ts: Date.now(), kind:'order', message:`Order ${o.id} restored from trash`, actorId: currentUser?.id, actorName: currentUser?.name }, ...prev]); }}>
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="rounded-xl border p-3 space-y-2 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2"><Warehouse className="w-4 h-4"/>Inventory</div>
              <div className="flex items-center gap-2">
                <div className="inline-flex border rounded-lg overflow-hidden">
                  <button className={`px-3 py-1 text-sm ${invTab==='finished'?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=> setInvTab('finished')}>Finished</button>
                  <button className={`px-3 py-1 text-sm ${invTab==='raw'?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=> setInvTab('raw')}>Raw</button>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={()=> setInvSheetOpen(true)}><Printer className="w-4 h-4 mr-1"/>Shelf sheet</Button>
                  <Button size="sm" variant="outline" onClick={exportCountsCSV}>Export counts</Button>
                  <Button size="sm" variant="outline" onClick={exportSuggestedOrdersCSV}>Export orders</Button>
                  <Button size="sm" variant="outline" onClick={exportProductionReqCSV}>Export production</Button>
                  <Button size="sm" onClick={()=> setAreasOpen(true)}>Manage areas</Button>
                </div>
              </div>
            </div>

            {invTab==='finished' && (
              <>
                <div className="flex items-center gap-2 mb-2 text-sm">
                  <input className="border rounded px-2 py-1 w-full" placeholder="Search name/category/location" value={finQuery} onChange={(e)=> setFinQuery(e.target.value)} />
                  <span className="text-xs text-muted-foreground">Page {finPage}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={()=> setFinPage(p=> Math.max(1,p-1))}>Prev</Button>
                    <Button size="sm" variant="outline" onClick={()=> setFinPage(p=> p+1)}>Next</Button>
                  </div>
                </div>
                <table className="w-full text-sm block overflow-x-auto whitespace-nowrap">
                  <thead><tr className="text-left"><th>Item No</th><th>Item name</th><th>Category</th><th>Location</th><th>Vendor</th><th>Brand</th><th>Purchase date</th><th>Expiry date</th><th>On hand</th><th>Booked</th><th>Available</th><th>Reorder qty</th><th>Reordered?</th><th>Days before expiry</th><th>Unit</th><th>Unit cost</th><th>Ext. price</th><th>Area</th><th></th></tr></thead>
                  <tbody>
                    {(()=>{ const q=finQuery.trim().toLowerCase(); const filtered = q? fin.filter(it=> `${it.name} ${it.category||''} ${it.location||''} ${it.vendor||''} ${it.brand||''}`.toLowerCase().includes(q)) : fin; const pageItems = filtered.slice((finPage-1)*pageSize, finPage*pageSize); return pageItems; })().map(it=> { const { latestPurchase, nextExpiry, daysLeft } = lotStats('fin', it.id); const booked = bookedFinishedForDate[it.id]||0; const avail = (it.onHand||0)-booked; return (
                      <tr key={it.id} className={`border-t ${expiryBg(daysLeft)}`}>
                        <td><input className="w-24 border rounded px-1" value={it.code||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, code: e.target.value }:x))}/></td>
                        <td>{it.name}</td>
                        <td><input className="w-28 border rounded px-1" value={it.category||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, category: e.target.value }:x))}/></td>
                        <td><input className="w-40 border rounded px-1" value={it.location||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, location: e.target.value }:x))}/></td>
                        <td><input className="w-32 border rounded px-1" value={it.vendor||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, vendor: e.target.value }:x))}/></td>
                        <td><input className="w-32 border rounded px-1" value={it.brand||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, brand: e.target.value }:x))}/></td>
                        <td>{latestPurchase? latestPurchase.toLocaleDateString(): ''}</td>
                        <td>{nextExpiry? nextExpiry.toLocaleDateString(): ''}</td>
                        <td title={`Booked ${booked}`}>{avail}</td>
                        <td><input className="w-20 border rounded px-1" value={it.par} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, par: Number(e.target.value||0)}:x))}/></td>
                        <td><input type="checkbox" checked={!!it.reordered} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, reordered: e.target.checked }:x))}/></td>
                        <td className={daysLeft!==undefined && daysLeft<=3? 'text-red-600 font-medium':''}>{daysLeft?? ''}</td>
                        <td>{it.unit}</td>
                        <td><input className="w-24 border rounded px-1" value={it.unitCost||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, unitCost: Number(e.target.value||0)}:x))}/></td>
                        <td>
                          <select className="w-40 border rounded px-1 text-xs" value={it.storageAreaId||''} onChange={(e)=> setFin(prev=> prev.map(x=> x.id===it.id? {...x, storageAreaId: e.target.value||undefined }:x))}>
                            <option value="">—</option>
                            {storageAreas.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </td>
                        <td className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={()=> openReceive('fin', it.id)}>Receive</Button>
                          <button onClick={()=> setFin(prev=> prev.filter(x=> x.id!==it.id))}><Trash className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={()=>{
                    const name = prompt("Item name","Eclair"); if(!name) return;
                    const unit = prompt("Unit","pcs") || "pcs";
                    const location = prompt("Location (Row • Shelf • Bin)", "Freezer 1 • Rack 1 • Tray A") || '';
                    setFin(prev=> [...prev, { id: uid(), name, unit, onHand: 0, par: 0, location }]);
                  }}><Plus className="w-4 h-4 mr-1"/>Add</Button>
                </div>
              </>
            )}

            {invTab==='raw' && (
              <>
                <div className="flex items-center gap-2 mb-2 text-sm">
                  <input className="border rounded px-2 py-1 w-full" placeholder="Search name/category/location" value={rawQuery} onChange={(e)=> setRawQuery(e.target.value)} />
                  <span className="text-xs text-muted-foreground">Page {rawPage}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={()=> setRawPage(p=> Math.max(1,p-1))}>Prev</Button>
                    <Button size="sm" variant="outline" onClick={()=> setRawPage(p=> p+1)}>Next</Button>
                  </div>
                </div>
                <table className="w-full text-sm block overflow-x-auto whitespace-nowrap">
                  <thead><tr className="text-left"><th>Item No</th><th>Item name</th><th>Category</th><th>Location</th><th>Vendor</th><th>Brand</th><th>Purchase date</th><th>Expiry date</th><th>On hand</th><th>Booked</th><th>Available</th><th>Reorder qty</th><th>Reordered?</th><th>Days before expiry</th><th>Unit</th><th>Unit cost</th><th>Ext. price</th><th>Area</th><th></th></tr></thead>
                  <tbody>
                    {(()=>{ const q=rawQuery.trim().toLowerCase(); const filtered = q? raw.filter(it=> `${it.name} ${it.category||''} ${it.location||''} ${it.vendor||''} ${it.brand||''}`.toLowerCase().includes(q)) : raw; const pageItems = filtered.slice((rawPage-1)*pageSize, rawPage*pageSize); return pageItems; })().map(it=> { const { latestPurchase, nextExpiry, daysLeft } = lotStats('raw', it.id); const booked = bookedRawForDate[it.id]||0; const avail = (it.onHand||0)-booked; return (
                      <tr key={it.id} className={`border-t ${expiryBg(daysLeft)}`}>
                        <td><input className="w-24 border rounded px-1" value={it.code||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, code: e.target.value }:x))}/></td>
                        <td>{it.name}</td>
                        <td><input className="w-28 border rounded px-1" value={it.category||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, category: e.target.value }:x))}/></td>
                        <td><input className="w-40 border rounded px-1" value={it.location||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, location: e.target.value }:x))}/></td>
                        <td><input className="w-32 border rounded px-1" value={it.vendor||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, vendor: e.target.value }:x))}/></td>
                        <td><input className="w-32 border rounded px-1" value={it.brand||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, brand: e.target.value }:x))}/></td>
                        <td>{latestPurchase? latestPurchase.toLocaleDateString(): ''}</td>
                        <td>{nextExpiry? nextExpiry.toLocaleDateString(): ''}</td>
                        <td title={`Booked ${booked}`}>{avail}</td>
                        <td><input className="w-20 border rounded px-1" value={it.par} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, par: Number(e.target.value||0)}:x))}/></td>
                        <td><input type="checkbox" checked={!!it.reordered} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, reordered: e.target.checked }:x))}/></td>
                        <td className={daysLeft!==undefined && daysLeft<=3? 'text-red-600 font-medium':''}>{daysLeft?? ''}</td>
                        <td>{it.unit}</td>
                        <td><input className="w-24 border rounded px-1" value={it.unitCost||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, unitCost: Number(e.target.value||0)}:x))}/></td>
                        <td>
                          <select className="w-40 border rounded px-1 text-xs" value={it.storageAreaId||''} onChange={(e)=> setRaw(prev=> prev.map(x=> x.id===it.id? {...x, storageAreaId: e.target.value||undefined }:x))}>
                            <option value="">—</option>
                            {storageAreas.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </td>
                        <td className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={()=> openReceive('raw', it.id)}>Receive</Button>
                          <button onClick={()=> setRaw(prev=> prev.filter(x=> x.id!==it.id))}><Trash className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={()=>{
                    const name = prompt("Raw name","Sugar"); if(!name) return;
                    const unit = prompt("Unit","kg") || "kg";
                    const location = prompt("Location (Row • Shelf • Bin)", "Row A • Shelf 1 • Bin 1") || '';
                    setRaw(prev=> [...prev, { id: uid(), name, unit, onHand: 0, par: 0, location }]);
                  }}><Plus className="w-4 h-4 mr-1"/>Add</Button>
                </div>
              </>
            )}
          </div>
          <div className="mt-3 rounded-xl border p-3 bg-white/95 dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-sky-500/15">
            <div className="flex items-center justify-between">
              <div className="font-medium">Storage Areas</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={()=> setInvSheetOpen(true)}><Printer className="w-4 h-4 mr-1"/>Shelf sheet</Button>
                <Button size="sm" variant="outline" onClick={exportCountsCSV}>Export counts CSV</Button>
                <Button size="sm" variant="outline" onClick={exportSuggestedOrdersCSV}>Export suggested orders CSV</Button>
                <Button size="sm" variant="outline" onClick={exportProductionReqCSV}>Export production CSV</Button>
                <Button size="sm" onClick={()=>{ const name = prompt('New storage area name','Cold Room'); if(!name) return; setStorageAreas(prev=> [...prev, { id: uid(), name }]); }}>Add area</Button>
              </div>
            </div>
            <ul className="text-sm mt-2">
              {storageAreas.map(a=> (
                <li key={a.id} className="flex items-center justify-between border-t py-1 gap-2">
                  <input className="flex-1 border rounded px-1" value={a.name} onChange={(e)=> setStorageAreas(prev=> prev.map(x=> x.id===a.id? {...x, name:e.target.value }:x))}/>
                  <button onClick={()=> setStorageAreas(prev=> prev.filter(x=> x.id!==a.id))}><Trash className="w-4 h-4"/></button>
                </li>
              ))}
            </ul>
            <div className="font-medium mb-2">Recent Receipts</div>
            <div className="text-xs text-muted-foreground mb-2">Tracks who received, lot codes, expiry, and location.</div>
            <div className="grid md:grid-cols-2 gap-2">
              {lots.slice(0,10).map(l=> (
                <div key={l.id} className="rounded border p-2 text-sm flex items-center justify-between">
                  <div>
                    <div>{l.kind==='raw'? (raw.find(r=> r.id===l.itemId)?.name) : (fin.find(f=> f.id===l.itemId)?.name)} • {l.qty} {l.unit}</div>
                    <div className="text-xs text-muted-foreground">Lot {l.lotCode||'—'} • Exp {l.expiryDate||'—'} • {l.location||'—'} • by {l.receiverName||'—'}</div>
                  </div>
                  <div className="text-xs opacity-70">{Math.ceil((Date.now()-l.receivedAt)/3600000)}h ago</div>
                </div>
              ))}
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
                    <Button size="sm" variant="outline" onClick={async()=>{
                      const pin1 = prompt("Set 4–8 digit PIN for "+s.name, ""); if(!pin1) return;
                      if(!/^\d{4,8}$/.test(pin1)) { alert('PIN must be 4–8 digits'); return; }
                      const pin2 = prompt("Confirm PIN", ""); if(pin1 !== pin2){ alert('PINs do not match'); return; }
                      const h = await sha256Hex(pin1);
                      setStaff(prev=> prev.map(x=> x.id===s.id? { ...x, pinHash: h }: x));
                    }}>Set PIN</Button>
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
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={()=> setGuideOutlet(o)}>Guide</Button>
                    <Button size="sm" variant="secondary" onClick={()=>{
                      const cutoff = prompt("Order cutoff (HH:mm)", o.orderCutoff||"14:00") || o.orderCutoff;
                      const open = prompt("Open (HH:mm)", o.open||"06:00") || o.open;
                      const close = prompt("Close (HH:mm)", o.close||"22:00") || o.close;
                      setOutlets(prev=> prev.map(x=> x.id===o.id? { ...x, orderCutoff: cutoff, open, close }: x));
                    }}>Settings</Button>
                    <button onClick={()=> setOutlets(prev=> prev.filter(x=> x.id!==o.id))}><Trash className="w-4 h-4"/></button>
                  </div>
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
              <div className="grid grid-cols-2 gap-2">
                <label className="block">Category<select className="w-full border rounded px-2 py-1" value={taskDraft.category||'production'} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), category: e.target.value as Task['category'] })}><option value="production">Production</option><option value="housekeeping">Housekeeping</option><option value="delivery">Delivery</option><option value="other">Other</option></select></label>
                <label className="block">Color<input className="w-24 border rounded px-2 py-1" type="color" value={taskDraft.color||taskBgColor(taskDraft as Task)} onChange={(e)=> setTaskDraft({ ...(taskDraft as Task), color:e.target.value })}/></label>
              </div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=> setTaskDialogOpen(false)}>Cancel</Button><Button onClick={saveTask}>Save</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={invSheetOpen} onOpenChange={setInvSheetOpen}>
        <DialogContent className="max-w-4xl print:max-w-none print:w-[1024px]">
          <DialogHeader><DialogTitle>Shelf Sheet</DialogTitle></DialogHeader>
          <style>{`@media print{ .no-print{ display:none } }`}</style>
          <div className="space-y-4">
            {storageAreas.map(area=> (
              <div key={area.id} className="rounded border p-2">
                <div className="font-medium mb-1">{area.name}</div>
                <table className="w-full text-sm">
                  <thead><tr className="text-left"><th>Type</th><th>Category</th><th>Name</th><th>On hand</th><th>Unit</th><th>Location</th><th>Par</th><th>Count</th></tr></thead>
                  <tbody>
                    {fin.filter(f=> f.storageAreaId===area.id).map(f=> (
                      <tr key={`fin-${f.id}`} className="border-t">
                        <td>Finished</td><td>{f.category||''}</td><td>{f.name}</td><td>{f.onHand}</td><td>{f.unit}</td><td>{f.location||''}</td><td>{f.par}</td><td></td>
                      </tr>
                    ))}
                    {raw.filter(r=> r.storageAreaId===area.id).map(r=> (
                      <tr key={`raw-${r.id}`} className="border-t">
                        <td>Raw</td><td>{r.category||''}</td><td>{r.name}</td><td>{r.onHand}</td><td>{r.unit}</td><td>{r.location||''}</td><td>{r.par}</td><td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="no-print flex justify-end"><Button onClick={()=> window.print()}><Printer className="w-4 h-4 mr-1"/>Print</Button></div>
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

      <Dialog open={invOpen} onOpenChange={(v)=>{ setInvOpen(v); if(!v){ setInvItemId(''); setInvQty(0); setInvLotCode(''); setInvExpiry(''); setInvLocation(''); setInvNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Receive inventory</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="text-xs text-muted-foreground">{invKind==='raw'? (raw.find(r=> r.id===invItemId)?.name) : (fin.find(f=> f.id===invItemId)?.name)}</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">Qty<input className="w-full border rounded px-2 py-1" value={invQty} onChange={(e)=> setInvQty(Number(e.target.value||0))}/></label>
              <label className="block">Unit<input className="w-full border rounded px-2 py-1" value={invUnit} onChange={(e)=> setInvUnit(e.target.value)}/></label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">Lot<input className="w-full border rounded px-2 py-1" value={invLotCode} onChange={(e)=> setInvLotCode(e.target.value)}/></label>
              <label className="block">Expiry<input type="date" className="w-full border rounded px-2 py-1" value={invExpiry} onChange={(e)=> setInvExpiry(e.target.value)}/></label>
            </div>
            <label className="block">Location<input className="w-full border rounded px-2 py-1" value={invLocation} onChange={(e)=> setInvLocation(e.target.value)}/></label>
            <label className="block">Note<input className="w-full border rounded px-2 py-1" value={invNote} onChange={(e)=> setInvNote(e.target.value)}/></label>
            <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=> setInvOpen(false)}>Cancel</Button><Button onClick={saveReceive}>Receive</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={multiAssignOpen} onOpenChange={(v)=>{ setMultiAssignOpen(v); if(!v){ setMultiAssign([]); setMultiAssignOrderId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign to multiple staff</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="max-h-60 overflow-auto border rounded p-2">
              {staff.map(s=> (
                <label key={s.id} className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={multiAssign.includes(s.id)} onChange={(e)=> setMultiAssign(prev=> e.target.checked? [...prev, s.id] : prev.filter(x=> x!==s.id))} />
                  <span>{s.name}{s.roleId? ` • ${rolesById[s.roleId]?.name}`:''}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={()=> setMultiAssignOpen(false)}>Cancel</Button>
              <Button onClick={()=>{
                const o = orders.find(x=> x.id===multiAssignOrderId);
                if(o){ multiAssign.forEach(id=> { const st = staffById[id]; autoPlanFromOrder(o, { staffId: id, roleId: st?.roleId }); }); }
                setMultiAssignOpen(false); setMultiAssign([]); setMultiAssignOrderId(null);
              }}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quickOpen} onOpenChange={(v)=>{ setQuickOpen(v); if(!v){ setQuickDraft(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Quick order → plan</DialogTitle></DialogHeader>
          {quickDraft && (
            <div className="space-y-3 text-sm">
              <div className="grid md:grid-cols-3 gap-2">
                <label className="block">Outlet<select className="w-full border rounded px-2 py-1" value={quickDraft.outletId} onChange={(e)=> setQuickDraft({ ...(quickDraft as any), outletId: e.target.value })}>{outlets.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
                <label className="block">Date<input type="date" className="w-full border rounded px-2 py-1" value={quickDraft.date} onChange={(e)=> setQuickDraft({ ...(quickDraft as any), date: e.target.value })}/></label>
                <label className="block">Time<input type="time" className="w-full border rounded px-2 py-1" value={quickDraft.time} onChange={(e)=> setQuickDraft({ ...(quickDraft as any), time: e.target.value })}/></label>
              </div>
              <div>
                <div className="font-medium mb-1">Lines</div>
                <table className="w-full text-sm">
                  <thead><tr className="text-left"><th>Finished item</th><th>Qty</th><th>Unit</th><th></th></tr></thead>
                  <tbody>
                    {quickDraft.lines.map((l,idx)=> (
                      <tr key={l.id} className="border-t">
                        <td>
                          <input list="fin-items" className="w-full border rounded px-1" value={l.item} onChange={(e)=> onQuickItemChange(idx, e.target.value)} placeholder="Type to search finished goods"/>
                        </td>
                        <td><input className="w-24 border rounded px-1" value={l.qty} onChange={(e)=> setQuickDraft({ ...(quickDraft as any), lines: quickDraft.lines.map((x,i)=> i===idx? { ...x, qty: Number(e.target.value||0) }: x) })}/></td>
                        <td><input className="w-24 border rounded px-1" value={l.unit} onChange={(e)=> setQuickDraft({ ...(quickDraft as any), lines: quickDraft.lines.map((x,i)=> i===idx? { ...x, unit: e.target.value }: x) })}/></td>
                        <td><button onClick={()=> setQuickDraft({ ...(quickDraft as any), lines: quickDraft.lines.filter((_,i)=> i!==idx) })}><Trash className="w-4 h-4"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <datalist id="fin-items">
                  {fin.map(f=> <option key={f.id} value={f.name}></option>)}
                </datalist>
                <div className="mt-2"><Button size="sm" onClick={()=> setQuickDraft({ ...(quickDraft as any), lines: [ ...quickDraft.lines, { id: uid(), item: '', qty: 0, unit: 'pcs' } ] })}><Plus className="w-4 h-4 mr-1"/>Add line</Button></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={()=> setQuickOpen(false)}>Cancel</Button>
                <Button onClick={saveQuick}>Create & plan</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={orderDialogOpen} onOpenChange={(v)=>{ setOrderDialogOpen(v); if(!v){ setOrderEditingId(null); setOrderDraft(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Edit Order</DialogTitle></DialogHeader>
          {orderDraft && (
            <div className="space-y-3 text-sm">
              <div className="grid md:grid-cols-3 gap-2">
                <label className="block">Outlet<select className="w-full border rounded px-2 py-1" value={orderDraft.outletId} onChange={(e)=> setOrderDraft({ ...(orderDraft as any), outletId: e.target.value })}>{outlets.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
                <label className="block">Date<input type="date" className="w-full border rounded px-2 py-1" value={orderDraft.date} onChange={(e)=> setOrderDraft({ ...(orderDraft as any), date: e.target.value })}/></label>
                <label className="block">Time<input type="time" className="w-full border rounded px-2 py-1" value={orderDraft.time} onChange={(e)=> setOrderDraft({ ...(orderDraft as any), time: e.target.value })}/></label>
              </div>
              <label className="block">Notes<textarea className="w-full border rounded px-2 py-1" value={orderDraft.notes} onChange={(e)=> setOrderDraft({ ...(orderDraft as any), notes: e.target.value })}/></label>
              <div>
                <div className="font-medium mb-1">Lines</div>
                <table className="w-full text-sm">
                  <thead><tr className="text-left"><th>Item</th><th>Qty</th><th>Unit</th><th></th></tr></thead>
                  <tbody>
                    {orderDraft.lines.map((l,idx)=> (
                      <tr key={l.id} className="border-t">
                        <td><input className="w-full border rounded px-1" value={l.item} onChange={(e)=> setOrderDraft({ ...(orderDraft as any), lines: orderDraft.lines.map((x,i)=> i===idx? { ...x, item: e.target.value }: x) })}/></td>
                        <td><input className="w-24 border rounded px-1" value={l.qty} onChange={(e)=> setOrderDraft({ ...(orderDraft as any), lines: orderDraft.lines.map((x,i)=> i===idx? { ...x, qty: Number(e.target.value||0) }: x) })}/></td>
                        <td><input className="w-24 border rounded px-1" value={l.unit} onChange={(e)=> setOrderDraft({ ...(orderDraft as any), lines: orderDraft.lines.map((x,i)=> i===idx? { ...x, unit: e.target.value }: x) })}/></td>
                        <td><button onClick={()=> setOrderDraft({ ...(orderDraft as any), lines: orderDraft.lines.filter((_,i)=> i!==idx) })}><Trash className="w-4 h-4"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2"><Button size="sm" onClick={()=> setOrderDraft({ ...(orderDraft as any), lines: [ ...orderDraft.lines, { id: uid(), item: '', qty: 0, unit: 'pcs' } as any ] })}><Plus className="w-4 h-4 mr-1"/>Add line</Button></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={()=> setOrderDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveOrder}>Save changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!guideOutlet} onOpenChange={(v)=>{ if(!v) setGuideOutlet(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Order Guide — {guideOutlet?.name}</DialogTitle></DialogHeader>
          {guideOutlet && (
            <div className="space-y-3 text-sm">
              <table className="w-full text-sm">
                <thead><tr className="text-left"><th>Item</th><th>Default Qty</th><th>Unit</th><th></th></tr></thead>
                <tbody>
                  {(guideOutlet.guide||[]).map((g,idx)=> (
                    <tr key={idx} className="border-t">
                      <td><input className="w-full border rounded px-1" value={g.item} onChange={(e)=> setOutlets(prev=> prev.map(o=> o.id===guideOutlet.id? { ...o, guide: (o.guide||[]).map((x,i)=> i===idx? { ...x, item: e.target.value }: x) } : o))} /></td>
                      <td><input className="w-24 border rounded px-1" value={g.defaultQty} onChange={(e)=> setOutlets(prev=> prev.map(o=> o.id===guideOutlet.id? { ...o, guide: (o.guide||[]).map((x,i)=> i===idx? { ...x, defaultQty: Number(e.target.value||0) }: x) } : o))} /></td>
                      <td><input className="w-24 border rounded px-1" value={g.unit} onChange={(e)=> setOutlets(prev=> prev.map(o=> o.id===guideOutlet.id? { ...o, guide: (o.guide||[]).map((x,i)=> i===idx? { ...x, unit: e.target.value }: x) } : o))} /></td>
                      <td><button onClick={()=> setOutlets(prev=> prev.map(o=> o.id===guideOutlet.id? { ...o, guide: (o.guide||[]).filter((_,i)=> i!==idx) } : o))}><Trash className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button size="sm" onClick={()=> setOutlets(prev=> prev.map(o=> o.id===guideOutlet.id? { ...o, guide: [ ...(o.guide||[]), { item:'', defaultQty:0, unit:'pcs' } ] }: o))}><Plus className="w-4 h-4 mr-1"/>Add line</Button>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={()=> setGuideOutlet(null)}>Close</Button>
                <Button onClick={()=>{
                  const outlet = guideOutlet;
                  if(!outlet) return;
                  const lines = (outlet.guide||[]).filter(g=> g.item).map(g=> ({ id: uid(), item: g.item, qty: g.defaultQty, unit: g.unit }));
                  if(!lines.length) return;
                  addOrderQuick({ outletId: outlet.id, lines });
                  setGuideOutlet(null);
                }}>Create order from guide</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={signOpen} onOpenChange={(v)=>{ setSignOpen(v); if(!v && pendingDeleteOrderId && currentUser){ setConfirmDelOpen(true); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Sign in</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <label className="block">Staff<select className="w-full border rounded px-2 py-1" value={signStaffId} onChange={(e)=> setSignStaffId(e.target.value)}><option value="">Select staff</option>{staff.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label className="block">PIN<input type="password" className="w-full border rounded px-2 py-1" value={signPin} onChange={(e)=> setSignPin(e.target.value)} placeholder="4–8 digits"/></label>
            {signError && <div className="text-xs text-red-600">{signError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={()=> setSignOpen(false)}>Cancel</Button>
              <Button onClick={async()=>{
                setSignError("");
                if(!signStaffId){ setSignError('Select staff'); return; }
                const s = staffById[signStaffId];
                if(!s?.pinHash){ setSignError('PIN not set for this staff. Go to Staff tab → Set PIN.'); return; }
                const ok = await verifyPinForStaff(signStaffId, signPin);
                if(!ok){ setSignError('Invalid PIN'); return; }
                setCurrentUserId(signStaffId);
                setSignOpen(false);
                setSignPin("");
              }}>Sign in</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelOpen} onOpenChange={(v)=>{ setConfirmDelOpen(v); if(!v){ setPendingDeleteOrderId(null); setDeleteReason(""); setDeletePin(""); setDeleteError(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirm delete order</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            {pendingDeleteOrderId && (()=>{ const o = orders.find(x=> x.id===pendingDeleteOrderId)!; return (
              <div className="text-xs text-muted-foreground">{outletsById[o.outletId]?.name} • {new Date(o.dueISO).toLocaleString()}</div>
            ); })()}
            <label className="block">Reason<input className="w-full border rounded px-2 py-1" value={deleteReason} onChange={(e)=> setDeleteReason(e.target.value)} placeholder="Optional"/></label>
            <label className="block">Re-enter your PIN<input type="password" className="w-full border rounded px-2 py-1" value={deletePin} onChange={(e)=> setDeletePin(e.target.value)} placeholder="4–8 digits"/></label>
            {deleteError && <div className="text-xs text-red-600">{deleteError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={()=> setConfirmDelOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={performDeleteOrder}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
