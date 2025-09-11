import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type FlipBookImage = { id: string; src?: string; name?: string };

export function FlipBook({ open, onClose, images }: { open: boolean; onClose: () => void; images: FlipBookImage[] }) {
  const [page, setPage] = useState(0); // page is spread index, two images per page
  const spreads = useMemo(() => {
    const out: [FlipBookImage | null, FlipBookImage | null][] = [];
    for (let i = 0; i < images.length; i += 2) {
      out.push([images[i] ?? null, images[i + 1] ?? null]);
    }
    return out;
  }, [images]);

  useEffect(() => { if (open) setPage(0); }, [open]);

  const canPrev = page > 0;
  const canNext = page < Math.max(spreads.length - 1, 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setPage((p) => (p > 0 ? p - 1 : p));
      if (e.key === "ArrowRight") setPage((p) => (p < spreads.length - 1 ? p + 1 : p));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, spreads.length, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent className="max-w-6xl w-full bg-neutral-900 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm opacity-80">Look Book</div>
          <button className="p-1 rounded hover:bg-white/10" onClick={onClose} aria-label="Close"><X className="w-5 h-5"/></button>
        </div>
        <div className="relative w-full aspect-video bg-neutral-800 rounded-lg overflow-hidden shadow-inner ring-1 ring-white/10">
          {/* Controls */}
          <button className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-40" onClick={()=> setPage((p)=> Math.max(0, p-1))} disabled={!canPrev} aria-label="Previous spread">
            <ChevronLeft className="w-6 h-6"/>
          </button>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-40" onClick={()=> setPage((p)=> Math.min(spreads.length - 1, p+1))} disabled={!canNext} aria-label="Next spread">
            <ChevronRight className="w-6 h-6"/>
          </button>

          {/* Spread */}
          <div className="w-full h-full grid grid-cols-2">
            {([0,1] as const).map((side)=>{
              const item = spreads[page]?.[side];
              return (
                <div key={side} className={`relative w-full h-full ${side===0? 'border-r border-white/10':''} bg-gradient-to-b from-neutral-900 to-neutral-800`}>
                  {item?.src ? (
                    <img src={item.src} alt={item.name||''} className="absolute inset-0 w-full h-full object-contain"/>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm opacity-60">Empty</div>
                  )}
                  {item?.name && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] opacity-70 bg-black/30 px-2 py-0.5 rounded">{item.name}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs opacity-80">
          <div>Page {page+1} / {Math.max(spreads.length, 1)}</div>
          <div>{images.length} images</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
