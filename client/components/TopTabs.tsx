import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Scale, NotebookPen, ArrowLeftRight, CircleDollarSign } from "lucide-react";

function TabLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = new URLSearchParams(loc.search).get('tab') ?? 'search';
  const value = new URLSearchParams(to.split('?')[1] || '').get('tab') || '';
  const isActive = active === value;
  return (
    <Link to={to} className={`rounded-lg px-4 py-2 text-sm font-medium ${isActive ? 'bg-white text-black shadow' : 'text-foreground/80 hover:text-foreground'} bg-muted`}>{label}</Link>
  );
}

export default function TopTabs() {
  const isAdd = new URLSearchParams(useLocation().search).get('tab') === 'add-recipe';
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4">
        <a href="/?tab=search" className="flex items-center gap-2" aria-label="Home">
          {/* Light mode logo */}
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2F7767116085cd4da782ee26179c7b4250?format=webp&width=240"
            alt="LUCCCA"
            className="h-8 hidden dark:!hidden md:h-9"
          />
          {/* Dark mode logo */}
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2Fb35d1dd3c914450b8529e8dc0ce9ecc1?format=webp&width=240"
            alt="LUCCCA"
            className="h-8 hidden dark:block md:h-9"
          />
          <span className="sr-only">LUCCCA</span>
        </a>
        <nav className="flex items-center gap-2 rounded-xl bg-muted p-1">
          <TabLink to="/?tab=search" label="Recipe Search" />
          <TabLink to="/?tab=input" label="Recipe Input" />
          <TabLink to="/?tab=gallery" label="Gallery" />
          <TabLink to="/?tab=add-recipe" label="Add Recipe" />
        </nav>
        <div className="flex items-center gap-1">
          {isAdd && (
            <div className="flex items-center gap-1 pr-1">
              <button title="Scale" onClick={()=>window.dispatchEvent(new CustomEvent('recipe:action',{detail:{type:'scale'}}))} className="p-1 rounded hover:bg-black/10"><Scale className="w-4 h-4"/></button>
              <button title="Save Snapshot" onClick={()=>window.dispatchEvent(new CustomEvent('recipe:action',{detail:{type:'saveVersion'}}))} className="p-1 rounded hover:bg-black/10"><NotebookPen className="w-4 h-4"/></button>
              <button title="Convert Units" onClick={()=>window.dispatchEvent(new CustomEvent('recipe:action',{detail:{type:'convertUnits'}}))} className="p-1 rounded hover:bg-black/10"><ArrowLeftRight className="w-4 h-4"/></button>
              <button title="Currency" onClick={()=>window.dispatchEvent(new CustomEvent('recipe:action',{detail:{type:'cycleCurrency'}}))} className="p-1 rounded hover:bg-black/10"><CircleDollarSign className="w-4 h-4"/></button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
