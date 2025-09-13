import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bell,
  Clock, Users, DollarSign, AlertCircle, CheckCircle, Eye, Edit3,
  Search, FileText, MapPin, Grid3X3, List, Activity, Zap,
  ChefHat, ClipboardList, BarChart3, Settings, Filter, Target,
  RefreshCw, Printer
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';
import type { BEODocument } from '../../types/beo';
import { BEOEditor } from './BEOEditor';
import { EchoIntegrationPanel } from './EchoIntegrationPanel';
import { useBEOStore, type CalendarEvent } from '../../stores/beoStore';

interface GlobalCalendarProps {
  onBEOSelect?: (beoId: string) => void;
  onCreateBEO?: (eventId: string) => void;
  viewMode?: 'calendar' | 'list' | 'timeline' | 'chef' | 'production' | 'analytics';
}

const EventStatusBadge: React.FC<{ status: CalendarEvent['status'] }> = ({ status }) => {
  const statusConfig = {
    lead: { variant: 'outline' as const, label: 'Lead', color: 'text-muted-foreground' },
    proposal: { variant: 'secondary' as const, label: 'Proposal', color: 'text-blue-600' },
    pending: { variant: 'default' as const, label: 'Pending', color: 'text-yellow-600' },
    confirmed: { variant: 'default' as const, label: 'Confirmed', color: 'text-green-600' },
    in_prep: { variant: 'destructive' as const, label: 'In Prep', color: 'text-orange-600' },
    execution: { variant: 'destructive' as const, label: 'Execution', color: 'text-red-600' },
    closed: { variant: 'outline' as const, label: 'Closed', color: 'text-muted-foreground' },
  } as const;
  const config = (statusConfig as any)[status];
  return <Badge variant={config?.variant||'outline'} className={config?.color||''}>{config?.label||status}</Badge>;
};

const PriorityIndicator: React.FC<{ priority: CalendarEvent['priority'] }> = ({ priority }) => {
  const colors: Record<string,string> = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    urgent: 'text-red-500 animate-pulse',
  };
  return <div className={cn('w-3 h-3 rounded-full', colors[priority]||'text-slate-400')} />;
};

const EventDetailsModal: React.FC<{
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEditBEO: (event: CalendarEvent) => void;
  onCreateBEO: (eventId: string) => void;
  onAcknowledgeEvent: (eventId: string) => void;
}> = ({ event, isOpen, onClose, onEditBEO, onCreateBEO, onAcknowledgeEvent }) => {
  if (!isOpen || !event) return null;
  const { beos, loadBEO } = useBEOStore();
  const [step, setStep] = React.useState<number>(15);
  const beo = event.beoId ? (beos as any)[event.beoId] : undefined;
  React.useEffect(() => {
    if (event.beoId && !beo) {
      loadBEO(event.beoId).catch(() => {});
    }
  }, [event.beoId, beo, loadBEO]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl border-2 bg-white dark:bg-slate-900 relative" onClick={(e)=> e.stopPropagation()}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                {!event.acknowledged && (
                  <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1"/>Needs Attention</Badge>
                )}
              </div>
              <EventStatusBadge status={event.status} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details">✕</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Date & Time</div>
                  <div className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">{event.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div className="text-sm text-muted-foreground">{event.room}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Guest Count</div>
                  <div className="text-sm text-muted-foreground">{event.guestCount} guests</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PriorityIndicator priority={event.priority} />
                <div>
                  <div className="text-sm font-medium">Priority</div>
                  <div className="text-sm text-muted-foreground capitalize">{event.priority}</div>
                </div>
              </div>
              {event.revenue && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Revenue</div>
                    <div className="text-sm text-muted-foreground">${event.revenue.toLocaleString()}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Event Type</div>
                  <div className="text-sm text-muted-foreground capitalize">{event.type}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            {!event.acknowledged && (
              <Button onClick={()=>{ onAcknowledgeEvent(event.id); onClose(); }} className="flex-1"><CheckCircle className="h-4 w-4 mr-2"/>Acknowledge Event</Button>
            )}
            {event.beoId ? (
              <Button onClick={()=>{ onEditBEO(event); onClose(); }} variant="outline" className="flex-1"><Edit3 className="h-4 w-4 mr-2"/>Edit BEO</Button>
            ) : (
              <Button onClick={()=>{ onCreateBEO(event.id); onClose(); }} variant="outline" className="flex-1"><FileText className="h-4 w-4 mr-2"/>Create BEO</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
};

const UpcomingEventsSection: React.FC<{ events: CalendarEvent[]; onEventSelect: (e:CalendarEvent)=>void; onCreateBEO: (id:string)=>void; onAcknowledgeEvent: (id:string)=>void; }> = ({ events, onEventSelect, onCreateBEO, onAcknowledgeEvent }) => {
  const upcomingEvents = events.filter(e=> new Date(e.date) >= new Date()).sort((a,b)=> new Date(a.date).getTime()-new Date(b.date).getTime()).slice(0,3);
  if(!upcomingEvents.length) return null;
  return (
    <Card className="border shadow-sm bg-white dark:bg-slate-900"><CardContent className="p-3">
      <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4"/><span className="text-sm font-medium">Next 3 Events</span><Badge variant="outline" className="text-xs">{upcomingEvents.length}</Badge></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {upcomingEvents.map(event=> (
          <div key={event.id} onClick={()=> onEventSelect(event)} className={cn('p-2 rounded border cursor-pointer text-xs transition-all', !event.acknowledged && 'ring-1 ring-red-200')}>
            <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-1"><PriorityIndicator priority={event.priority}/><span className="font-medium truncate">{event.title}</span></div>{!event.acknowledged && <AlertCircle className="h-3 w-3 text-red-500"/>}</div>
            <div className="space-y-1"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{new Date(event.date).toLocaleDateString()} • {event.time}</span><EventStatusBadge status={event.status}/></div></div>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
};

const CalendarGrid: React.FC<{ events: CalendarEvent[]; currentDate: Date; onEventClick: (e:CalendarEvent)=>void; colorFilter: 'all'|'status'|'priority'; }> = ({ events, currentDate, onEventClick, colorFilter }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const getDaysInMonth = (d:Date)=> new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const getFirstDayOfMonth = (d:Date)=> new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({length:daysInMonth},(_,i)=> i+1);
  const emptyDays = Array.from({length:firstDay},()=> null);
  const totalCells = firstDay + daysInMonth; const trailing = (7 - (totalCells % 7)) % 7; const trailingDays = Array.from({length: trailing},()=> null);
  const getEventsForDate = (day:number)=>{ const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; return events.filter(e=> e.date===dateStr); };
  const coversForDay = (evs:CalendarEvent[])=> evs.reduce((s,e)=> s + (e.guestCount||0),0);
  const busynessForCovers = (c:number)=> c===0? 'none' : c<50? 'light' : c<150? 'busy' : 'very';
  const busynessColorClass: Record<string,string> = { none:'bg-white dark:bg-slate-900', light:'bg-green-50 dark:bg-green-950/20', busy:'bg-amber-50 dark:bg-amber-950/20', very:'bg-red-50 dark:bg-red-950/20' };
  const getEventColor = (e:CalendarEvent)=> colorFilter==='priority' ? ({ urgent:'bg-red-100 text-red-800 border-red-300', high:'bg-orange-100 text-orange-800 border-orange-300', medium:'bg-yellow-100 text-yellow-800 border-yellow-300', low:'bg-green-100 text-green-800 border-green-300' } as any)[e.priority] : ({ confirmed:'bg-green-100 text-green-800 border-green-300', pending:'bg-yellow-100 text-yellow-800 border-yellow-300', in_prep:'bg-orange-100 text-orange-800 border-orange-300', execution:'bg-red-100 text-red-800 border-red-300', lead:'bg-gray-100 text-gray-800 border-gray-300', proposal:'bg-blue-100 text-blue-800 border-blue-300' } as any)[e.status] || 'bg-gray-100 text-gray-800 border-gray-300';
  return (
    <div className="bg-white dark:bg-background h-full flex flex-col border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-slate-100 dark:bg-slate-800">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=> (<div key={d} className="p-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 border-r last:border-r-0">{d.substring(0,3)}</div>))}</div>
      <div className="grid grid-cols-7 flex-1 min-h-0">
        {emptyDays.map((_,i)=> (<div key={`empty-${i}`} className="border-r border-b bg-slate-50 dark:bg-slate-900 last:border-r-0"/>))}
        {days.map(day=>{ const dayEvents = getEventsForDate(day); const dayCovers = coversForDay(dayEvents); const busy = busynessForCovers(dayCovers); const isToday = day===new Date().getDate() && currentDate.getMonth()===new Date().getMonth() && currentDate.getFullYear()===new Date().getFullYear(); const isSelected = day===selectedDate.getDate() && currentDate.getMonth()===selectedDate.getMonth() && currentDate.getFullYear()===selectedDate.getFullYear(); return (
          <div key={day} className={cn('border-r border-b last:border-r-0 p-3 cursor-pointer relative min-h-[120px] flex flex-col', busynessColorClass[busy], isSelected && 'ring-2 ring-blue-300', isToday && 'border-blue-300')} onClick={()=> setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}>
            <div className="flex items-center justify-between mb-2"><div className={cn('flex items-center justify-center w-8 h-8 text-sm font-semibold rounded-full', isToday? 'bg-blue-600 text-white' : 'bg-white/60 dark:bg-slate-900/60')}>{day}</div><div className={cn('w-2.5 h-2.5 rounded-full', busy==='none'&&'bg-slate-300', busy==='light'&&'bg-green-500', busy==='busy'&&'bg-amber-500', busy==='very'&&'bg-red-500')} title={`${dayCovers} covers`} /></div>
            <div className="space-y-1 flex-1 min-h-0 overflow-hidden">{dayEvents.slice(0,3).map(ev=> (
              <div key={ev.id} onClick={(e)=>{ e.stopPropagation(); onEventClick(ev); }} className={cn('text-xs px-2 py-1 rounded border cursor-pointer truncate relative hover:shadow-sm', getEventColor(ev), !ev.acknowledged && 'ring-1 ring-red-500')} title={`${ev.title} - ${ev.time} - ${ev.room}`}>
                <div className="flex items-center gap-1">{!ev.acknowledged && <div className="w-1.5 h-1.5 bg-red-500 rounded-full"/>}<span className="truncate font-medium">{ev.title}</span></div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{ev.time.split(' ')[0]} • {ev.guestCount}p</div>
              </div>
            ))}
            {dayEvents.length>3 && <div className="text-xs text-slate-600 px-2 py-1 bg-slate-100 rounded text-center border border-dashed">+{dayEvents.length-3} more</div>}
            </div>
            {dayEvents.length>3 && <div className="absolute top-2 right-2 w-5 h-4 bg-slate-600 text-white text-xs flex items-center justify-center rounded font-bold">{dayEvents.length}</div>}
          </div>
        );})}
        {trailingDays.map((_,i)=> (<div key={`trailing-${i}`} className="border-r border-b last:border-r-0 bg-slate-50 dark:bg-slate-900"/>))}
      </div>
    </div>
  );
};

const WeekView: React.FC<{ events: CalendarEvent[]; currentDate: Date; onEventClick: (e:CalendarEvent)=>void; }> = ({ events, currentDate, onEventClick }) => {
  const start = new Date(currentDate); start.setDate(currentDate.getDate()-start.getDay());
  const days = Array.from({length:7},(_,i)=>{ const d=new Date(start); d.setDate(start.getDate()+i); return d; });
  const eventsForDate = (d:Date)=>{ const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; return events.filter(e=> e.date===s).sort((a,b)=> a.time.localeCompare(b.time)); };
  return (<div className="grid grid-cols-7 h-full">{days.map((d,i)=> (<div key={i} className="border-r last:border-r-0 p-2"><div className="text-xs font-semibold mb-2">{d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div><div className="space-y-2">{eventsForDate(d).length===0 && (<div className="text-xs text-muted-foreground">No events</div>)}{eventsForDate(d).map(ev=> (<div key={ev.id} className="rounded border px-2 py-1 text-xs hover:bg-slate-50 cursor-pointer" onClick={()=> onEventClick(ev)}><div className="font-medium truncate">{ev.title}</div><div className="text-[11px] text-muted-foreground truncate">{ev.time} • {ev.room} • {ev.guestCount}p</div></div>))}</div></div>))}</div>);
};

const TodayView: React.FC<{ events: CalendarEvent[]; date: Date; onEditBEO: (e:CalendarEvent)=>void; }> = ({ events, date, onEditBEO }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const todayStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const toMinutes = (t:string)=>{ const m=t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/); if(!m) return 0; let h=parseInt(m[1],10)%12; const min=parseInt(m[2]||'0',10); if(m[3]==='pm') h+=12; return h*60+min; };
  const parseRange = (r:string):[number,number]=>{ const [a,b]=r.split('-').map(s=>s.trim()); const s=toMinutes(a.replace(/\./g,'')); let e=toMinutes(b.replace(/\./g,'')); if(e<=s) e+=24*60; return [s,e]; };
  const minutesToLabel = (m:number)=>{ const v=m%(24*60); let h=Math.floor(v/60); const min=v%60; const am=h<12; if(h===0) h=12; else if(h>12) h-=12; return `${h}:${String(min).padStart(2,'0')} ${am?'AM':'PM'}`; };
  const generateSlots=(s:number,e:number,st:number)=>{ const out:number[]=[]; const step=Math.max(1,Math.min(60,st)); for(let t=s;t<=e;t+=step) out.push(t); return out; };
  const todays = events.filter(e=> e.date===todayStr).sort((a,b)=> toMinutes(a.time.split('-')[0].trim().toLowerCase()) - toMinutes(b.time.split('-')[0].trim().toLowerCase()));
  if(!todays.length) return (<div className="p-6 text-center text-muted-foreground">No events today</div>);
  return (<div className="p-4 space-y-3">{todays.map(e=>{ const [start,end]=parseRange(e.time); const isOpen=expandedId===e.id; const toggle=()=> setExpandedId(isOpen? null : e.id); return (<div key={e.id} className={cn('rounded-lg border', !e.acknowledged && 'ring-2 ring-red-200')}><div className="grid grid-cols-5 gap-2 items-center p-3 cursor-pointer hover:bg-accent" onClick={toggle}><div className="font-mono text-sm">{e.beoId? `#${e.beoId.replace(/.*-(\d+)/,'$1')}`:'—'}</div><div className="text-sm">{e.guestCount} guests</div><div className="font-medium truncate">{e.clientName||e.title}</div><div className="text-sm text-muted-foreground">{e.time}</div><div className="text-right"><Badge variant="outline" className="text-xs">{e.room}</Badge></div></div>{isOpen && (<div className="px-4 pb-4"><div className="flex items-center justify-between py-2"><div className="text-sm text-muted-foreground">{new Date(e.date).toLocaleDateString()} • {e.room}</div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={()=> window.print()}><Printer className="h-3 w-3 mr-2"/>Print breakdown</Button></div></div><div className="border rounded-md overflow-hidden"><div className="grid grid-cols-12 bg-muted/50 text-xs font-medium px-3 py-2"><div className="col-span-3">Time</div><div className="col-span-9">Details</div></div><div className="max-h-72 overflow-auto">{generateSlots(start,end,15).map((m,idx)=> (<div key={m} className={cn('grid grid-cols-12 px-3 py-2 text-xs', idx%2===0?'bg-background':'bg-muted/20')}><div className="col-span-3 font-mono">{minutesToLabel(m)}</div><div className="col-span-9"><span className="text-muted-foreground">No scheduled activity</span></div></div>))}</div></div></div>)}</div>); };

export const GlobalCalendar: React.FC<GlobalCalendarProps> = ({ onBEOSelect, onCreateBEO, viewMode='calendar' }) => {
  const { events, isLoading, loadEvents, acknowledgeEvent, createBEO, isIntegrationEnabled, syncStatus, pendingConflicts } = useBEOStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showBEOEditor, setShowBEOEditor] = useState(false);
  const routerLocation = useLocation();
  useEffect(()=>{ const params=new URLSearchParams(routerLocation.search||''); const evId=params.get('event'); if(evId && events.length){ const ev=events.find(e=> e.id===evId); if(ev){ setSelectedEvent(ev); setShowEventDetails(true); } } }, [events, routerLocation.search]);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [calendarView, setCalendarView] = useState<'month'|'week'|'today'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<'all'|'status'|'priority'>('status');
  const [showEchoIntegration, setShowEchoIntegration] = useState(false);
  useEffect(()=>{ loadEvents(); }, []);
  const handleEventSelect = (e:CalendarEvent)=>{ setSelectedEvent(e); setShowEventDetails(true); };
  const handleEditBEO = (e:CalendarEvent)=>{ setSelectedEvent(e); setShowBEOEditor(true); if(e.beoId) onBEOSelect?.(e.beoId); };
  const handleCreateBEO = async (id:string)=>{ await createBEO(id); setShowBEOEditor(true); onCreateBEO?.(id); };
  const handleAcknowledgeEvent = async (id:string)=>{ await acknowledgeEvent(id, 'Chef'); };
  const navigateMonth=(dir:'prev'|'next')=> setCurrentDate(p=>{ const n=new Date(p); n.setMonth(p.getMonth()+(dir==='prev'?-1:1)); return n; });
  const unacknowledgedEvents = events.filter(e=> !e.acknowledged);
  if(isLoading){ return (<div className="flex items-center justify-center p-8"><div className="text-center space-y-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div><p className="text-muted-foreground">Loading calendar...</p></div></div>); }
  if(showBEOEditor){ return (<div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"><div className="container mx-auto p-4 h-full overflow-auto"><BEOEditor eventId={selectedEvent?.id} beoId={selectedEvent?.beoId} mode={selectedEvent?.beoId? 'edit':'create'} onClose={()=>{ setShowBEOEditor(false); setSelectedEvent(null); }} onSave={()=>{ setShowBEOEditor(false); setSelectedEvent(null); loadEvents(); }} /></div></div>); }
  const filteredEvents = events.filter(e=> e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.room.toLowerCase().includes(searchTerm.toLowerCase()) || (e.clientName && e.clientName.toLowerCase().includes(searchTerm.toLowerCase())));
  const isSameMonth=(d:string, ref:Date)=>{ const dt=new Date(d); return dt.getMonth()===ref.getMonth() && dt.getFullYear()===ref.getFullYear(); };
  const monthEvents = events.filter(e=> isSameMonth(e.date, currentDate));
  const monthCovers = monthEvents.reduce((s,e)=> s + (e.guestCount||0), 0);
  const dayLabel = currentDate.toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric', year:'numeric' });
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-3">
      {unacknowledgedEvents.length>0 && (
        <Alert className="border-black/20 bg-red-50 dark:border-red-900 dark:bg-red-950 py-2"><AlertCircle className="h-4 w-4 text-red-600"/><AlertDescription className="text-red-800 text-sm">{unacknowledgedEvents.length} BEO(s) need acknowledgment</AlertDescription></Alert>
      )}
      <UpcomingEventsSection events={filteredEvents} onEventSelect={handleEventSelect} onCreateBEO={handleCreateBEO} onAcknowledgeEvent={handleAcknowledgeEvent}/>
      <div className="flex-1 min-h-0"><Card className="h-full flex flex-col border shadow-md bg-white dark:bg-slate-900"><CardHeader className="pb-4 bg-slate-50 dark:bg-slate-800 border-b"><div className="flex items-center justify-between"><div className="flex items-center gap-6"><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={()=> navigateMonth('prev')}><ChevronLeft className="h-4 w-4"/></Button><h2 className="text-2xl font-bold">{currentDate.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h2><Button variant="outline" size="sm" onClick={()=> navigateMonth('next')}><ChevronRight className="h-4 w-4"/></Button></div><Button variant="default" size="sm" onClick={()=> setCurrentDate(new Date())}><Clock className="h-4 w-4 mr-2"/>Today</Button></div><div className="flex items-center gap-3 flex-wrap"><div className="flex items-center gap-2 mr-2"><Button variant="outline" size="sm" onClick={()=> loadEvents()}><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button></div><div className="flex border rounded-lg shadow-sm bg-background"><Button variant={calendarView==='month'? 'default':'ghost'} size="sm" onClick={()=> setCalendarView('month')} className="rounded-r-none border-r"><Grid3X3 className="h-4 w-4 mr-1"/>Month</Button><Button variant={calendarView==='week'? 'default':'ghost'} size="sm" onClick={()=> setCalendarView('week')} className="rounded-none border-r"><Activity className="h-4 w-4 mr-1"/>Week</Button><Button variant={calendarView==='today'? 'default':'ghost'} size="sm" onClick={()=> setCalendarView('today')} className="rounded-l-none"><List className="h-4 w-4 mr-1"/>Today</Button></div><div className="flex items-center gap-2"><Badge variant="outline" className="text-xs font-medium"><CalendarIcon className="h-3 w-3 mr-1"/>{monthEvents.length} events</Badge><Badge variant="outline" className="text-xs font-medium"><Users className="h-3 w-3 mr-1"/>{monthCovers} covers</Badge></div></div></div><CardContent className="p-0 flex-1 min-h-0 overflow-auto">{calendarView==='month' && (<CalendarGrid events={filteredEvents} currentDate={currentDate} onEventClick={handleEventSelect} colorFilter={colorFilter}/>)}{calendarView==='today' && (<div className="flex flex-col h-full"><div className="p-3 border-b bg-muted/30 flex items-center justify-between"><div className="flex items-center gap-2"><div className="text-lg font-semibold">{dayLabel}</div></div><Button variant="default" size="sm" onClick={()=> setCurrentDate(new Date())}>Today</Button></div><TodayView events={filteredEvents} date={currentDate} onEditBEO={handleEditBEO}/></div>)}{calendarView==='week' && (<div className="p-0 h-full"><WeekView events={filteredEvents} currentDate={currentDate} onEventClick={handleEventSelect}/></div>)}</CardContent></Card></div>
      <EventDetailsModal event={selectedEvent} isOpen={showEventDetails} onClose={()=>{ setShowEventDetails(false); setSelectedEvent(null); }} onEditBEO={handleEditBEO} onCreateBEO={handleCreateBEO} onAcknowledgeEvent={handleAcknowledgeEvent}/>
      <EchoIntegrationPanel isVisible={false} onClose={()=>{}} />
    </div>
  );
};

export default GlobalCalendar;