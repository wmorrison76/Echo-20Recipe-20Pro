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
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary" />
          <span className="font-semibold tracking-tight">Recipe Studio</span>
        </div>
        <nav className="flex items-center gap-2 rounded-xl bg-muted p-1">
          <TabLink to="/?tab=search" label="Recipe Search" />
          <TabLink to="/?tab=input" label="Recipe Input" />
          <TabLink to="/?tab=gallery" label="Gallery" />
          <TabLink to="/?tab=add-recipe" label="Add Recipe" />
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
