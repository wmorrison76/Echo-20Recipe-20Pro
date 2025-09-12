import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Scale,
  NotebookPen,
  ArrowLeftRight,
  CircleDollarSign,
  HelpCircle,
} from "lucide-react";

function TabLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = new URLSearchParams(loc.search).get("tab") ?? "search";
  const value = new URLSearchParams(to.split("?")[1] || "").get("tab") || "";
  const isActive = active === value;
  return (
    <Link
      to={to}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${isActive ? "bg-white text-black shadow" : "text-foreground/80 hover:text-foreground"} bg-muted`}
    >
      {label}
    </Link>
  );
}

export default function TopTabs() {
  const isAdd =
    new URLSearchParams(useLocation().search).get("tab") === "add-recipe";
  const [showHelp, setShowHelp] = React.useState(false);
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4">
        <a
          href="/?tab=search"
          className="flex items-center gap-2"
          aria-label="Home"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2F3daeec161e9e466b9f19d163a3c58f71?format=webp&width=360"
            alt="Echo Recipe Pro"
            className="h-8 md:h-9"
          />
          <span className="sr-only">Echo Recipe Pro</span>
        </a>
        <nav className="flex items-center gap-2 rounded-xl bg-muted p-1">
          <TabLink to="/?tab=search" label="Recipe Search" />
          <TabLink to="/?tab=gallery" label="Gallery" />
          <TabLink to="/?tab=add-recipe" label="Add Recipe" />
        </nav>
        <div className="flex items-center gap-1">
          <button title="Help" onClick={()=>setShowHelp(true)} className="p-1 rounded hover:bg-black/10">
            <HelpCircle className="w-4 h-4" />
          </button>
          {isAdd && (
            <div className="flex items-center gap-1 pr-1">
              <button
                title="Scale"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "scale" },
                    }),
                  )
                }
                className="p-1 rounded hover:bg-black/10"
              >
                <Scale className="w-4 h-4" />
              </button>
              <button
                title="Save Snapshot"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "saveVersion" },
                    }),
                  )
                }
                className="p-1 rounded hover:bg-black/10"
              >
                <NotebookPen className="w-4 h-4" />
              </button>
              <button
                title="Convert Units"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "convertUnits" },
                    }),
                  )
                }
                className="p-1 rounded hover:bg-black/10"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button
                title="Currency"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("recipe:action", {
                      detail: { type: "cycleCurrency" },
                    }),
                  )
                }
                className="p-1 rounded hover:bg-black/10"
              >
                <CircleDollarSign className="w-4 h-4" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Help & Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Keyboard shortcuts (hold Control key): P=Pastry, T=Technique, C=Course, A=Allergens, D=Diets, M=Meal Period, U=Cuisine, S=Service Style, Y=Difficulty, E=Equipment.</p>
            <p>Use the right sidebar to set Modifiers. The center “Modifiers” panel reflects your selections grouped by section.</p>
            <p>Importing a Book PDF shows progress by page and step. Imported recipes are tagged with the book title and the cover is fetched when available.</p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
