import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type FlipBookImage = { id: string; src?: string; name?: string };

export function FlipBook({ open, onClose, images, title }: { open: boolean; onClose: () => void; images: FlipBookImage[]; title?: string }) {
  const [page, setPage] = useState(0); // spread index
  const [flipping, setFlipping] = useState<null | "next" | "prev">(null);

  const spreads = useMemo(() => {
    const out: [FlipBookImage | null, FlipBookImage | null][] = [];
    for (let i = 0; i < images.length; i += 2) out.push([images[i] ?? null, images[i + 1] ?? null]);
    return out;
  }, [images]);

  useEffect(() => { if (open) { setPage(0); setFlipping(null); } }, [open]);

  const canPrev = page > 0;
  const canNext = page < Math.max(spreads.length - 1, 0);

  const goPrev = () => {
    if (!canPrev || flipping) return;
    setFlipping("prev");
    setTimeout(() => { setPage((p) => p - 1); setFlipping(null); }, 550);
  };
  const goNext = () => {
    if (!canNext || flipping) return;
    setFlipping("next");
    setTimeout(() => { setPage((p) => p + 1); setFlipping(null); }, 550);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canPrev, canNext, flipping]);

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent className="max-w-6xl w-full bg-neutral-900 text-white p-4">
        <DialogHeader>
          <DialogTitle className="text-sm opacity-80">Look Book{title?` — ${title}`:''}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-neutral-800 rounded-lg overflow-hidden shadow-inner ring-1 ring-white/10">
          <style>{`
            .book { perspective: 1600px; }
            .page { position: relative; transform-style: preserve-3d; }
            .leaf { position:absolute; inset:0; background:linear-gradient(to bottom,#0a0a0a,#1a1a1a); backface-visibility:hidden; }
            .leaf::after{ content:''; position:absolute; inset:0; box-shadow: inset 0 0 40px rgba(0,0,0,.35); pointer-events:none; }
            .flip-next .right { transform-origin: left center; transform: rotateY(-180deg); transition: transform .55s ease; }
            .flip-prev .left { transform-origin: right center; transform: rotateY(180deg); transition: transform .55s ease; }
            .leaf img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; backface-visibility:hidden; }
            .leaf .label{ position:absolute; bottom:.5rem; left:50%; transform:translateX(-50%); font-size:11px; opacity:.7; background:rgba(0,0,0,.3); padding:.125rem .375rem; border-radius:.25rem; }
          `}</style>

          <button className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-40" onClick={goPrev} disabled={!canPrev} aria-label="Previous spread">
            <ChevronLeft className="w-6 h-6"/>
          </button>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-40" onClick={goNext} disabled={!canNext} aria-label="Next spread">
            <ChevronRight className="w-6 h-6"/>
          </button>

          <div className="book w-full h-full">
            <div className={`page grid grid-cols-2 w-full h-full ${flipping==='next'?'flip-next':''} ${flipping==='prev'?'flip-prev':''}`}>
              {(['left','right'] as const).map((side, idx)=>{
                const item = spreads[page]?.[idx as 0|1];
                return (
                  <div key={side} className={`${side} relative border-white/10 ${side==='left'?'border-r':''}`} onClick={side==='left'?goPrev:goNext} role="button" aria-label={side==='left'?'Previous page':'Next page'}>
                    <div className="leaf">
                      {item?.src ? <img src={item.src} alt={item?.name||''}/> : <div className="absolute inset-0 flex items-center justify-center text-sm opacity-60">Empty</div>}
                      {item?.name && <div className="label">{item.name}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
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
