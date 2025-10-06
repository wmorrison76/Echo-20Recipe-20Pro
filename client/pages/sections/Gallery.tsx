import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import "../../luccca-lookbook.css";
import { useAppData } from "@/context/AppDataContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { LookBookShowcase } from "@/components/LookBookShowcase";
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
    restoreDemo,
    addDemoImages,
    deleteImage,
  } = useAppData();
  const [status, setStatus] = useState<string | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [importTags, setImportTags] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("grid");
  const [thumbSize, setThumbSize] = useState<"s" | "m" | "l">("m");
  const [sort, setSort] = useState<"newest" | "popular" | "rated">("newest");
  const [category, setCategory] = useState<string>("");
  const [newLookBookName, setNewLookBookName] = useState("");
  const [activeLookBookId, setActiveLookBookId] = useState<string | null>(null);
  const [lucccaMode, setLucccaMode] = useState(false);
  const [openLookBook, setOpenLookBook] = useState(false);
  const dragId = useRef<string | null>(null);

  const toolbarSurface = lucccaMode
    ? "border-slate-700/80 bg-slate-900/70 text-slate-100 shadow-[0_26px_70px_rgba(14,165,233,0.28)]"
    : "border-white/80 bg-white/95 text-slate-900 shadow-[0_26px_70px_rgba(15,23,42,0.14)]";
  const cardSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/60 text-slate-100 shadow-[0_18px_48px_rgba(14,165,233,0.24)]"
    : "border-white/70 bg-white/90 text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.12)]";
  const subtleSurface = lucccaMode
    ? "border-slate-700/50 bg-slate-900/55 text-slate-100"
    : "border-white/60 bg-white/85 text-slate-900";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [urlText, setUrlText] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let base = q
      ? images.filter(
          (i) =>
            (i.tags || []).some((t) => t.toLowerCase().includes(q)) ||
            i.name.toLowerCase().includes(q),
        )
      : images.slice();
    const cat = category.trim().toLowerCase();
    base.sort((a, b) => {
      const aMatch = cat
        ? Number((a.tags || []).some((t) => t.toLowerCase().includes(cat)))
        : 0;
      const bMatch = cat
        ? Number((b.tags || []).some((t) => t.toLowerCase().includes(cat)))
        : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return a.order - b.order;
    });
    if (sort === "newest")
      base = base.slice().sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "rated")
      base = base
        .slice()
        .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    return base;
  }, [images, filter, category, sort]);

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

  // Removed remote Unsplash seeding to avoid network dependency and ensure predictable demo content.
  // The AppDataProvider now seeds lightweight demo images that persist better.

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
    <div
      className={cn(
        "mx-auto max-w-[1380px] space-y-6 px-4 py-8 sm:px-6 lg:px-12",
        lucccaMode ? "luccca-theme" : "text-slate-900",
      )}
      data-echo-key="page:recipes:gallery"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Dropzone
          multiple
          onFiles={onFiles}
          className="group relative min-h-[240px] overflow-hidden rounded-[32px] border-none bg-transparent p-0"
        >
          <div
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-4 rounded-[32px] border px-10 py-12 text-center backdrop-blur-xl transition-all duration-300",
              toolbarSurface,
              lucccaMode
                ? "hover:shadow-[0_30px_80px_rgba(14,165,233,0.32)]"
                : "hover:shadow-[0_30px_80px_rgba(15,23,42,0.18)]",
            )}
          >
            <UploadCloud className="h-10 w-10 opacity-80" />
            <div className="space-y-1">
              <div className="text-lg font-semibold tracking-tight">
                Drag & drop images
              </div>
              <p className="text-sm font-medium opacity-70">
                or click to choose files · categorize on import
              </p>
            </div>
            <div className="rounded-full border border-white/40 px-4 py-1 text-[12px] font-medium uppercase tracking-[0.28em] opacity-70">
              Supports RAW · HEIC · JPG · PNG
            </div>
          </div>
        </Dropzone>

        <div className={cn("rounded-[28px] border p-6 space-y-3 backdrop-blur-xl", toolbarSurface)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <span>Images in gallery</span>
              <span className="min-w-[5ch] text-right text-lg font-semibold tabular-nums">
                {images.length}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void exportAllZip();
              }}
              className="gap-2 rounded-full px-4"
            >
              <Download className="h-4 w-4" />
              Export ZIP
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className="relative flex-1 min-w-[240px]"
              data-echo-key="filter:gallery:tags"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search or filter by tag"
                className="w-full rounded-full border border-transparent bg-white/80 pl-9 pr-3 py-2 text-sm shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) {
                  onFiles(files);
                }
                (e.target as HTMLInputElement).value = "";
              }}
              ref={(el) => ((window as any).__gallery_upload_input = el)}
            />
            <Button
              onClick={() => (window as any).__gallery_upload_input?.click()}
              variant="default"
              data-echo-key="cta:gallery:upload"
              className="rounded-full px-4"
            >
              Upload images
            </Button>
            <Button
              variant="secondary"
              onClick={() => linkImagesToRecipesByFilename()}
              className="rounded-full px-4"
            >
              Link to recipes
            </Button>
            <select
              className="rounded-full border border-transparent bg-white/80 px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              title="Sort"
              data-echo-key="filter:gallery:sort"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="rated">Rated</option>
            </select>
            <select
              className="rounded-full border border-transparent bg-white/80 px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              title="Layout"
            >
              <option value="masonry">Masonry</option>
              <option value="grid">Grid</option>
            </select>
            <select
              className="rounded-full border border-transparent bg-white/80 px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none"
              value={thumbSize}
              onChange={(e) => setThumbSize(e.target.value as any)}
              title="Thumbnail size"
            >
              <option value="s">Small</option>
              <option value="m">Medium</option>
              <option value="l">Large</option>
            </select>
            <label className="ml-1 mr-2 flex items-center gap-2 rounded-full border border-transparent bg-white/60 px-3 py-2 text-xs shadow-inner">
              <input
                type="checkbox"
                checked={lucccaMode}
                onChange={(e) => setLucccaMode(e.target.checked)}
              />
              LUCCCA
            </label>
            <select
              className="rounded-full border border-transparent bg-white/80 px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/60 px-3 py-2 text-xs shadow-inner">
              <span className="opacity-70">{selected.length} selected</span>
              <input
                id="bulk-tags"
                placeholder="add tags (comma)"
                className="flex-1 rounded-full border border-transparent bg-white/90 px-3 py-1 text-xs shadow-inner focus:border-sky-300 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTagsToSelected((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <Button size="sm" onClick={() => setSelected([])} className="rounded-full px-3">
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={cn("rounded-[28px] border p-6 space-y-3 backdrop-blur-xl", cardSurface)}>
        <div className="text-sm font-semibold tracking-tight">Add from URL(s)</div>
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder="Paste image URLs — one per line"
            className={cn(
              "flex-1 min-h-[90px] rounded-2xl border px-4 py-3 text-sm font-mono shadow-inner",
              lucccaMode ? "bg-slate-900/70" : "bg-white/80",
            )}
          />
          <Button
            disabled={urlLoading || !urlText.trim()}
            onClick={async () => {
              try {
                setUrlLoading(true);
                const urls = urlText
                  .split(/\r?\n|,|\s+/)
                  .map((s) => s.trim())
                  .filter((u) => /^https?:\/\//i.test(u));
                if (!urls.length) {
                  setStatus("Enter valid http(s) image URLs");
                  return;
                }
                const files: File[] = [];
                for (const u of urls) {
                  try {
                    const res = await fetch(u);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const blob = await res.blob();
                    const name = (
                      u.split("?")[0].split("#")[0].split("/").pop() ||
                      `image-${Date.now()}.jpg`
                    ).replace(/[^A-Za-z0-9_.-]/g, "_");
                    files.push(
                      new File([blob], name, {
                        type: blob.type || "image/jpeg",
                      }),
                    );
                  } catch (e: any) {
                    setStatus(`Failed to fetch ${u}: ${e?.message || "error"}`);
                  }
                }
                if (files.length) {
                  const added = await addImages(files, { tags: [] });
                  setStatus(`Added ${added} image(s) from URL.`);
                  linkImagesToRecipesByFilename();
                  setUrlText("");
                }
              } finally {
                setUrlLoading(false);
              }
            }}
            className="rounded-full px-6"
          >
            {urlLoading ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>

      {status && (
        <div className={cn("rounded-[20px] border px-4 py-3 text-sm", subtleSurface)}>
          {status}
        </div>
      )}

      <div className={cn("rounded-[28px] border p-6 backdrop-blur-xl", cardSurface)}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={newLookBookName}
            onChange={(e) => setNewLookBookName(e.target.value)}
            placeholder="New Look Book name"
            className={cn(
              "rounded-full border px-4 py-2 text-sm shadow-inner",
              lucccaMode ? "bg-slate-900/70" : "bg-white/85",
            )}
          />
          <Button
            onClick={() => {
              const name = newLookBookName.trim();
              if (!name) return;
              const id = addLookBook(name, selected.length ? selected : []);
              if (selected.length) setSelected([]);
              setNewLookBookName("");
              setActiveLookBookId(id);
              setOpenLookBook(true);
            }}
            className="rounded-full px-5"
          >
            Create
          </Button>
          {selected.length > 0 && (
            <select
              className={cn(
                "rounded-full border px-3 py-2 text-sm shadow-inner",
                lucccaMode ? "bg-slate-900/70" : "bg-white/85",
              )}
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
              className="rounded-full px-5"
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
                className={cn(
                  "flex min-w-[260px] flex-auto items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm no-callout backdrop-blur-lg",
                  subtleSurface,
                )}
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
                    className="h-9 w-9 rounded-full"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteLookBook(b.id)}
                    aria-label="Delete"
                    title="Delete"
                    className="h-9 w-9 rounded-full"
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
              ? "masonry columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7 gap-4 sm:gap-5 lg:gap-6"
              : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:columns-6 gap-4 sm:gap-5 lg:gap-6"
          }
          data-echo-key="section:gallery:grid"
        >
          {filtered.map((img) => (
            <div
              key={img.id}
              className={`mb-6 break-inside-avoid rounded-2xl overflow-hidden relative group shadow-lg ring-1 ring-black/5 bg-white dark:bg-slate-900 dark:ring-sky-500/25 dark:shadow-[0_0_30px_rgba(56,189,248,0.18)] transition-all hover:shadow-[0_10px_40px_rgba(56,189,248,0.25)] hover:ring-2 hover:ring-sky-300/50 dark:hover:ring-sky-400/40 ${viewMode === "masonry" ? "card" : ""}`}
              draggable
              onDragStart={() => onDragStart(img.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropOver(img.id)}
              onContextMenu={(e) => e.preventDefault()}
              data-echo-key="card:gallery:item"
            >
              <button
                className="absolute top-2 right-2 z-10 rounded-full bg-black/40 p-1.5 text-white opacity-0 group-hover:opacity-100"
                onClick={() => toggleFavorite(img.id)}
                aria-label="Favorite"
                data-echo-key="cta:gallery:fav"
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
                data-echo-key="cta:gallery:open"
              >
                {img.unsupported ? (
                  <div className="h-40 w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Unsupported preview
                  </div>
                ) : (
                  <img
                    src={img.dataUrl || img.blobUrl}
                    alt={img.name}
                    loading="lazy"
                    className={`w-full ${viewMode === "grid" ? (thumbSize === "s" ? "h-32" : thumbSize === "l" ? "h-56" : "h-44") : "h-auto"} object-cover transition-all duration-200 z-0`}
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.onerror = null;
                      el.src = "/placeholder.svg";
                      el.classList.add("opacity-70");
                    }}
                  />
                )}
              </button>
              <button
                className="absolute bottom-2 right-2 z-20 rounded-full bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this image?")) deleteImage(img.id);
                }}
                aria-label="Delete image"
                title="Delete image"
              >
                <Trash />
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
          <div className="mb-2">No images yet.</div>
          <Button onClick={() => restoreDemo()}>Restore demo images</Button>
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
        className={lucccaMode ? "luccca-theme lightbox-overlay" : ""}
      />

      <LookBookShowcase
        open={openLookBook}
        onClose={() => setOpenLookBook(false)}
        title={lookbooks.find((b) => b.id === activeLookBookId)?.name}
        images={(
          lookbooks.find((b) => b.id === activeLookBookId)?.imageIds || []
        ).map((id) => {
          const img = images.find((i) => i.id === id);
          const tags = img?.tags || [];
          return {
            id,
            src: img?.dataUrl || img?.blobUrl,
            name: img?.name,
            tags,
            description:
              tags.length > 0
                ? `Highlights ${tags.slice(0, 3).join(" · ")}${tags.length > 3 ? " +" : ""}`
                : undefined,
          };
        })}
        className={lucccaMode ? "luccca-theme" : ""}
      />
    </div>
  );
}
