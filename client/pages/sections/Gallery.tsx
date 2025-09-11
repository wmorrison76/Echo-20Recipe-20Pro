import { useEffect, useMemo, useRef, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { Star } from "lucide-react";

export default function GallerySection() {
  const { images, addImages, clearImages, linkImagesToRecipesByFilename, addTagsToImages, reorderImages, updateImage } = useAppData();
  const [status, setStatus] = useState<string | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [importTags, setImportTags] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const dragId = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return images.slice().sort((a,b)=>a.order-b.order);
    return images.filter((i) => (i.tags || []).some((t) => t.toLowerCase().includes(q)) || i.name.toLowerCase().includes(q)).sort((a,b)=>a.order-b.order);
  }, [images, filter]);

  const onFiles = async (files: File[]) => {
    setImportTags("");
    setShowTagDialog(true);
    (window as any).__pending_files = files;
  };

  const doImport = async (files: File[], tags: string[]) => {
    setStatus("Processing images...");
    const added = await addImages(files, { tags });
    setStatus(`Added ${added} file(s).`);
    linkImagesToRecipesByFilename();
  };

  const confirmImport = async () => {
    const files: File[] = (window as any).__pending_files || [];
    setShowTagDialog(false);
    const tags = importTags.split(",").map((t) => t.trim()).filter(Boolean);
    await doImport(files, tags);
    (window as any).__pending_files = undefined;
  };

  useEffect(() => {
    if (images.length > 0) return;
    const flag = localStorage.getItem("gallery.demo.loaded.v2");
    if (flag === "1") return;
    (async () => {
      try {
        const urls = [
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1400&q=80"
        ];
        const files: File[] = [];
        for (const [i,u] of urls.entries()) {
          const res = await fetch(u);
          const b = await res.blob();
          files.push(new File([b], `demo-${i}.jpg`, { type: b.type || "image/jpeg" }));
        }
        await doImport(files, ["demo","food"]);
        localStorage.setItem("gallery.demo.loaded.v2", "1");
      } catch {}
    })();
  }, [images.length]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addTagsToSelected = (tagsStr: string) => {
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    if (!tags.length || !selected.length) return;
    addTagsToImages(selected, tags);
    setSelected([]);
  };

  const openLightboxAt = (id: string) => {
    const list = filtered;
    const idx = list.findIndex((i) => i.id === id);
    if (idx >= 0) {
      setLightboxIndex(idx);
      setLightboxOpen(true);
    }
  };

  const toggleFavorite = (id: string) => {
    const item = images.find((i) => i.id === id);
    if (!item) return;
    updateImage(id, { favorite: !item.favorite });
  };

  const beginEdit = (id: string) => {
    const item = images.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditName(item.name);
    setEditTags((item.tags || []).join(", "));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditTags("");
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    const tags = editTags.split(",").map((t)=>t.trim()).filter(Boolean);
    if (!name) { setStatus("Name cannot be empty."); return; }
    const clash = images.find((i)=> i.name === name && i.id !== editingId);
    if (clash) { setStatus("Another image already has that name."); return; }
    updateImage(editingId, { name, tags });
    setStatus(null);
    cancelEdit();
  };

  const onDragStart = (id: string) => (dragId.current = id);
  const onDropOver = (overId: string) => {
    const d = dragId.current; dragId.current = null;
    if (d && d !== overId) reorderImages(d, overId);
  };

  const onEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Dropzone multiple onFiles={onFiles}>
          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <div className="text-foreground font-medium">Drag & drop images (any format)</div>
            <div className="text-muted-foreground">or click to select • You can categorize on import</div>
          </div>
        </Dropzone>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="text-sm text-muted-foreground">Images in gallery</div>
          <div className="mt-1 text-2xl font-semibold">{images.length}</div>
          <div className="flex flex-wrap gap-2">
            <input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Search or filter by tag" className="flex-1 rounded-md border bg-background px-3 py-2" />
            <Button variant="secondary" onClick={() => linkImagesToRecipesByFilename()}>Link to recipes</Button>
            <Button variant="outline" onClick={async()=>{
              const urls = [
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1400&q=80"
        ];
              const files: File[] = [];
              for (const [i,u] of urls.entries()) {
                try { const res = await fetch(u); const b = await res.blob(); files.push(new File([b], `demo-${i}.jpg`, { type: b.type||'image/jpeg' })); } catch {}
              }
              if (files.length) { setStatus('Importing demo images...'); await addImages(files, { tags: ['demo','food'] }); setStatus('Demo images loaded.'); }
            }}>Load demo images</Button>
            <Button variant="destructive" onClick={() => clearImages()}>Clear</Button>
          </div>
          {selected.length > 0 && (
            <div className="text-xs flex items-center gap-2">
              <span>{selected.length} selected</span>
              <input id="bulk-tags" placeholder="add tags (comma)" className="rounded-md border bg-background px-2 py-1" onKeyDown={(e)=>{ if(e.key==='Enter'){ addTagsToSelected((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value=''; }}} />
              <Button size="sm" onClick={()=>setSelected([])}>Clear selection</Button>
            </div>
          )}
        </div>
      </div>

      {status && <div className="rounded-md border p-3 text-sm">{status}</div>}

      {filtered.length > 0 ? (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7 gap-4 sm:gap-5 lg:gap-6">
          {filtered.map((img) => (
            <div key={img.id}
              className="mb-6 break-inside-avoid rounded-2xl overflow-hidden relative group shadow-md ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-2xl hover:ring-2 hover:ring-sky-300/50 focus-within:shadow-2xl focus-within:ring-2 active:shadow-xl"
              draggable onDragStart={()=>onDragStart(img.id)} onDragOver={(e)=>e.preventDefault()} onDrop={()=>onDropOver(img.id)} onContextMenu={(e)=>e.preventDefault()}
            >
              <button className="absolute top-2 right-2 z-10 rounded-full bg-black/40 p-1.5 text-white opacity-0 group-hover:opacity-100" onClick={()=>toggleFavorite(img.id)} aria-label="Favorite">
                <Star className={img.favorite ? 'fill-yellow-300 text-yellow-300' : ''} />
              </button>
              <input type="checkbox" className="absolute top-2 left-2 z-10 h-4 w-4" checked={selected.includes(img.id)} onChange={()=>toggleSelect(img.id)} />
              <button onClick={()=>openLightboxAt(img.id)} className="block w-full">
                {img.unsupported ? (
                  <div className="h-40 w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">Unsupported preview</div>
                ) : (
                  <img src={img.dataUrl || img.blobUrl} alt={img.name} className="w-full h-auto object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.01]" />
                )}
              </button>
              <div className="p-3 flex flex-wrap items-center gap-1 text-[11px]">
                <button className="truncate text-left underline-offset-2 hover:underline" onClick={()=>beginEdit(img.id)} title="Click to rename & categorize">{img.name}</button>
                {(img.tags||[]).map((t)=> (
                  <span key={t} className="px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">No images yet.</div>
      )}

      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag images on import</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input value={importTags} onChange={(e)=>setImportTags(e.target.value)} placeholder="e.g. steak, plating, dessert" className="w-full rounded-md border bg-background px-3 py-2" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={()=>setShowTagDialog(false)}>Cancel</Button>
              <Button onClick={confirmImport}>Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GalleryLightbox
        open={lightboxOpen}
        onClose={()=>setLightboxOpen(false)}
        images={filtered.map((i)=>({ id: i.id, src: i.dataUrl || i.blobUrl, name: i.name, favorite: i.favorite, unsupported: i.unsupported }))}
        index={lightboxIndex}
        onPrev={()=>setLightboxIndex((i)=> (i-1+filtered.length)%filtered.length)}
        onNext={()=>setLightboxIndex((i)=> (i+1)%filtered.length)}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
