import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { FlipBook } from "@/components/FlipBook";
import { Download } from "lucide-react";
import { Star, Search, UploadCloud, Pencil, Trash } from "lucide-react";

export default function GallerySection() {
  const {
    images,
    lookbooks,
    addLookBook,
    addImagesToLookBook,
    deleteLookBook,
    updateLookBook,
    addImages,
    clearImages,
    linkImagesToRecipesByFilename,
    addTagsToImages,
    reorderImages,
    updateImage,
    exportAllZip,
  } = useAppData();
  const [status, setStatus] = useState<string | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [importTags, setImportTags] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [category, setCategory] = useState<string>("");
  const [newLookBookName, setNewLookBookName] = useState("");
  const [activeLookBookId, setActiveLookBookId] = useState<string | null>(null);
  const [openLookBook, setOpenLookBook] = useState(false);
  const dragId = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const base = q
      ? images.filter((i) => (i.tags || []).some((t) => t.toLowerCase().includes(q)) || i.name.toLowerCase().includes(q))
      : images.slice();
    const cat = category.trim().toLowerCase();
    base.sort((a, b) => {
      const aMatch = cat ? (a.tags || []).some((t) => t.toLowerCase().includes(cat)) : 0;
      const bMatch = cat ? (b.tags || []).some((t) => t.toLowerCase().includes(cat)) : 0;
      if (aMatch !== bMatch) return bMatch - aMatch; // matched first
      return a.order - b.order;
    });
    return base;
  }, [images, filter, category]);

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
    const tags = importTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
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
          "https://images.unsplash.com/photo-1541976076758-347942db1970?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1546549039-3746f9b9ca2a?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1541773838162-287d1b72a8f9?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1542826438-2e552220a788?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1519626176961-1dc0d4b2a556?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1400&q=80",
        ];
        const files: File[] = [];
        for (const [i, u] of urls.entries()) {
          const res = await fetch(u);
          const b = await res.blob();
          files.push(
            new File([b], `demo-${i}.jpg`, { type: b.type || "image/jpeg" }),
          );
        }
        await doImport(files, ["demo", "food"]);
        localStorage.setItem("gallery.demo.loaded.v2", "1");
      } catch {}
    })();
  }, [images.length]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addTagsToSelected = (tagsStr: string) => {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
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
    const tags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!name) {
      setStatus("Name cannot be empty.");
      return;
    }
    const clash = images.find((i) => i.name === name && i.id !== editingId);
    if (clash) {
      setStatus("Another image already has that name.");
      return;
    }
    updateImage(editingId, { name, tags });
    setStatus(null);
    cancelEdit();
  };

  const onDragStart = (id: string) => (dragId.current = id);
  const onDropOver = (overId: string) => {
    const d = dragId.current;
    dragId.current = null;
    if (d && d !== overId) reorderImages(d, overId);
  };

  const onEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 items-start">
        <Dropzone multiple onFiles={onFiles}>
          <div className="flex flex-col items-center justify-center gap-2 text-sm py-3">
            <UploadCloud className="h-5 w-5 text-muted-foreground" />
            <div className="text-foreground font-medium">
              Drag & drop images (any format)
            </div>
            <div className="text-muted-foreground">
              or click to select • You can categorize on import
            </div>
          </div>
        </Dropzone>

        <div className="rounded-xl border p-3 space-y-2 bg-white/95 dark:bg-gradient-to-br dark:from-background dark:to-muted/40 shadow-sm ring-1 ring-black/5 dark:ring-sky-500/15">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Images in gallery</span>
              <span className="text-base font-semibold tabular-nums min-w-[5ch] text-right">{images.length}</span>
            </div>
            <Button variant="outline" size="sm" onClick={exportAllZip}>
              <Download className="w-4 h-4 mr-1" />
              Export all (ZIP)
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search or filter by tag"
                className="w-full rounded-md border bg-background pl-8 pr-2 py-1.5 text-sm"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => linkImagesToRecipesByFilename()}
            >
              Link to recipes
            </Button>
            <select
              className="rounded-md border bg-background px-2 py-1 text-xs"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <option value="masonry">Masonry</option>
              <option value="grid">Grid</option>
            </select>
            <select
              className="rounded-md border bg-background px-2 py-1 text-xs"
              value={category}
              onChange={(e)=> setCategory(e.target.value)}
            >
              <option value="">Category: All</option>
              <option value="pastry">Pastry</option>
              <option value="cake">Cakes</option>
              <option value="bread">Breads</option>
              <option value="dessert">Desserts</option>
              <option value="savory">Savory</option>
              <option value="drink">Drinks</option>
              <option value="plating">Plating</option>
            </select>
          </div>
          {selected.length > 0 && (
            <div className="text-xs flex items-center gap-2">
              <span className="text-muted-foreground">
                {selected.length} selected
              </span>
              <input
                id="bulk-tags"
                placeholder="add tags (comma)"
                className="rounded-md border bg-background px-2 py-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTagsToSelected((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <Button size="sm" onClick={() => setSelected([])}>
                Clear selection
              </Button>
            </div>
          )}
        </div>
      </div>

      {status && <div className="rounded-md border p-3 text-sm">{status}</div>}

      <div className="rounded-2xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newLookBookName}
            onChange={(e) => setNewLookBookName(e.target.value)}
            placeholder="New Look Book name"
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button
            onClick={() => {
              const name = newLookBookName.trim();
              if (!name) return;
              const id = addLookBook(name, []);
              setNewLookBookName("");
              setActiveLookBookId(id);
            }}
          >
            Create
          </Button>
          {selected.length > 0 && (
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={activeLookBookId || ""}
              onChange={(e) => setActiveLookBookId(e.target.value || null)}
            >
              <option value="">Select Look Book</option>
              {lookbooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.imageIds.length})
                </option>
              ))}
            </select>
          )}
          {selected.length > 0 && activeLookBookId && (
            <Button
              variant="secondary"
              onClick={() => {
                addImagesToLookBook(activeLookBookId, selected);
                setSelected([]);
              }}
            >
              Add selected to Look Book
            </Button>
          )}
        </div>
        {lookbooks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lookbooks.map((b) => (
              <div
                key={b.id}
                className="rounded border px-3 py-2 text-sm flex items-center justify-between gap-2 min-w-[260px] flex-auto no-callout"
              >
                <div className="flex items-center gap-2">
                  <button
                    className="font-medium underline-offset-2 hover:underline"
                    onClick={() => {
                      setActiveLookBookId(b.id);
                      setOpenLookBook(true);
                    }}
                    title="Open Look Book"
                  >
                    {b.name}
                  </button>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {b.imageIds.length} photos
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const name = prompt("Rename Look Book", b.name) || b.name;
                      updateLookBook(b.id, { name });
                    }}
                    aria-label="Rename"
                    title="Rename"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteLookBook(b.id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <div
          className={
            viewMode === "masonry"
              ? "columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7 gap-4 sm:gap-5 lg:gap-6"
              : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6"
          }
        >
          {filtered.map((img) => (
            <div
              key={img.id}
              className="mb-6 break-inside-avoid rounded-2xl overflow-hidden relative group shadow-lg ring-1 ring-black/5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 dark:ring-sky-500/25 dark:shadow-[0_0_30px_rgba(56,189,248,0.18)] transition-shadow hover:shadow-2xl hover:ring-2 hover:ring-sky-300/40 dark:hover:ring-sky-400/30"
              draggable
              onDragStart={() => onDragStart(img.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropOver(img.id)}
              onContextMenu={(e) => e.preventDefault()}
            >
              <button
                className="absolute top-2 right-2 z-10 rounded-full bg-black/40 p-1.5 text-white opacity-0 group-hover:opacity-100"
                onClick={() => toggleFavorite(img.id)}
                aria-label="Favorite"
              >
                <Star
                  className={
                    img.favorite ? "fill-yellow-300 text-yellow-300" : ""
                  }
                />
              </button>
              <input
                type="checkbox"
                className="absolute top-2 left-2 z-10 h-4 w-4"
                checked={selected.includes(img.id)}
                onChange={() => toggleSelect(img.id)}
              />
              <button
                onClick={() => openLightboxAt(img.id)}
                className="block w-full"
              >
                {img.unsupported ? (
                  <div className="h-40 w-full bg-gradient-to-b from-muted to-muted/60 flex items-center justify-center text-xs text-muted-foreground">
                    Unsupported preview
                  </div>
                ) : (
                  <img
                    src={img.dataUrl || img.blobUrl}
                    alt={img.name}
                    className="w-full h-auto object-cover transition-all duration-200 z-0"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.onerror = null;
                      el.src = "/placeholder.svg";
                      el.classList.add("opacity-70");
                    }}
                  />
                )}
              </button>
              <div className="p-3 flex flex-col gap-2 text-[11px] relative z-10">
                {editingId === img.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={onEditKeyDown}
                      placeholder="Image name"
                      className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      onKeyDown={onEditKeyDown}
                      placeholder="categories (comma separated)"
                      className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      className="truncate text-left underline-offset-2 hover:underline"
                      onClick={() => beginEdit(img.id)}
                      title="Click to rename & categorize"
                    >
                      {img.name}
                    </button>
                    {(img.tags || []).map((t) => (
                      <button
                        key={t}
                        className="px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground hover:ring-2 hover:ring-sky-300/50"
                        onClick={() => beginEdit(img.id)}
                        title="Click to edit categories"
                      >
                        {t}
                      </button>
                    ))}
                    {(!img.tags || img.tags.length === 0) && (
                      <button
                        className="px-1.5 py-0.5 rounded-full bg-muted text-foreground/80 hover:bg-muted/70"
                        onClick={() => beginEdit(img.id)}
                        title="Add categories"
                      >
                        + categorize
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No images yet.
        </div>
      )}

      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag images on import</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={importTags}
              onChange={(e) => setImportTags(e.target.value)}
              placeholder="e.g. steak, plating, dessert"
              className="w-full rounded-md border bg-background px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowTagDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={confirmImport}>Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GalleryLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={filtered.map((i) => ({
          id: i.id,
          src: i.dataUrl || i.blobUrl,
          name: i.name,
          favorite: i.favorite,
          unsupported: i.unsupported,
        }))}
        index={lightboxIndex}
        onPrev={() =>
          setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length)
        }
        onNext={() => setLightboxIndex((i) => (i + 1) % filtered.length)}
        onToggleFavorite={toggleFavorite}
      />

      <FlipBook
        open={openLookBook}
        onClose={() => setOpenLookBook(false)}
        images={(
          lookbooks.find((b) => b.id === activeLookBookId)?.imageIds || []
        ).map((id) => {
          const img = images.find((i) => i.id === id);
          return { id, src: img?.dataUrl || img?.blobUrl, name: img?.name };
        })}
      />
    </div>
  );
}
