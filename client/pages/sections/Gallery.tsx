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
    : "border-slate-200/70 bg-white/80 text-slate-900 shadow-[0_36px_90px_rgba(15,23,42,0.12)]";
  const cardSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/60 text-slate-100 shadow-[0_24px_70px_rgba(14,165,233,0.24)]"
    : "border-slate-200/60 bg-white/85 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.1)]";
  const subtleSurface = lucccaMode
    ? "border-slate-700/50 bg-slate-900/55 text-slate-100"
    : "border-slate-200/50 bg-white/80 text-slate-800";
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
        "relative mx-auto max-w-[1380px] space-y-6 overflow-hidden rounded-[40px] border px-4 py-10 sm:px-8 lg:px-14",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_60%)] before:opacity-70",
        lucccaMode
          ? "luccca-theme border-slate-800/70 bg-slate-950/85 text-slate-100 shadow-[0_50px_140px_rgba(14,165,233,0.28)]"
          : "border-slate-200/80 bg-gradient-to-br from-white via-slate-50/95 to-slate-100 text-slate-900 shadow-[0_55px_150px_rgba(15,23,42,0.16)]",
      )}
      data-echo-key="page:recipes:gallery"
    >
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
              className={cn(
                "w-full rounded-full border border-transparent pl-9 pr-3 py-2 text-sm shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200",
                lucccaMode
                  ? "bg-slate-900/70 text-slate-100 placeholder:text-slate-400"
                  : "bg-white/80",
              )}
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
            className={cn(
              "rounded-full border border-transparent px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none",
              lucccaMode ? "bg-slate-900/70 text-slate-100" : "bg-white/80",
            )}
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
            className={cn(
              "rounded-full border border-transparent px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none",
              lucccaMode ? "bg-slate-900/70 text-slate-100" : "bg-white/80",
            )}
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            title="Layout"
          >
            <option value="masonry">Masonry</option>
            <option value="grid">Grid</option>
          </select>
          <select
            className={cn(
              "rounded-full border border-transparent px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none",
              lucccaMode ? "bg-slate-900/70 text-slate-100" : "bg-white/80",
            )}
            value={thumbSize}
            onChange={(e) => setThumbSize(e.target.value as any)}
            title="Thumbnail size"
          >
            <option value="s">Small</option>
            <option value="m">Medium</option>
            <option value="l">Large</option>
          </select>
          <label
            className={cn(
              "ml-1 mr-2 flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-xs shadow-inner",
              lucccaMode ? "bg-slate-900/70 text-slate-100" : "bg-white/60 text-slate-700",
            )}
          >
            <input
              type="checkbox"
              checked={lucccaMode}
              onChange={(e) => setLucccaMode(e.target.checked)}
            />
            LUCCCA
          </label>
          <select
            className={cn(
              "rounded-full border border-transparent px-3 py-2 text-xs shadow-inner focus:border-sky-300 focus:outline-none",
              lucccaMode ? "bg-slate-900/70 text-slate-100" : "bg-white/80",
            )}
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
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs shadow-inner",
              lucccaMode
                ? "border-white/10 bg-slate-900/70 text-slate-100"
                : "border-white/40 bg-white/60 text-slate-700",
            )}
          >
            <span className="opacity-70">{selected.length} selected</span>
            <input
              id="bulk-tags"
              placeholder="add tags (comma)"
              className={cn(
                "flex-1 rounded-full border border-transparent px-3 py-1 text-xs shadow-inner focus:border-sky-300 focus:outline-none",
                lucccaMode ? "bg-slate-900/60 text-slate-100" : "bg-white/90",
              )}
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
          className={cn(
            viewMode === "masonry"
              ? "columns-2 gap-6 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7"
              : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
            "pb-2",
          )}
          data-echo-key="section:gallery:grid"
        >
          {filtered.map((img) => {
            const isSelected = selected.includes(img.id);
            const displayTags = (img.tags || []).slice(0, 3);
            const overflowCount = Math.max((img.tags || []).length - displayTags.length, 0);

            return (
              <div
                key={img.id}
                className={cn(
                  "group relative mb-6 break-inside-avoid overflow-hidden rounded-[24px] backdrop-blur-xl transition-all duration-500",
                  lucccaMode
                    ? "ring-1 ring-slate-700/60 bg-slate-950/60 shadow-[0_24px_60px_rgba(14,165,233,0.24)]"
                    : "ring-1 ring-white/70 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
                  isSelected &&
                    (lucccaMode
                      ? "ring-2 ring-sky-400 shadow-[0_32px_80px_rgba(14,165,233,0.32)]"
                      : "ring-2 ring-sky-400 shadow-[0_32px_80px_rgba(56,189,248,0.22)]"),
                )}
                draggable
                onDragStart={() => onDragStart(img.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropOver(img.id)}
                data-echo-key="card:gallery:item"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/20" />
                </div>

                <button
                  className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition duration-200 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(img.id);
                  }}
                  aria-label="Toggle favorite"
                  data-echo-key="cta:gallery:fav"
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      img.favorite ? "fill-yellow-300 text-yellow-300" : "text-white",
                    )}
                  />
                </button>

                <label className="absolute left-3 top-3 z-30 cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isSelected}
                    onChange={() => toggleSelect(img.id)}
                  />
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-all",
                      isSelected
                        ? "border-sky-400 bg-sky-500 text-white shadow-[0_15px_30px_rgba(14,165,233,0.35)]"
                        : "border-white/70 bg-white/70 text-transparent backdrop-blur peer-focus-visible:ring-2 peer-focus-visible:ring-sky-300",
                    )}
                  >
                    ✓
                  </span>
                </label>

                <button
                  onClick={() => openLightboxAt(img.id)}
                  className="block w-full overflow-hidden"
                  data-echo-key="cta:gallery:open"
                >
                  {img.unsupported ? (
                    <div className="flex h-48 w-full items-center justify-center bg-slate-200 text-xs uppercase tracking-[0.3em] text-slate-500">
                      Unsupported preview
                    </div>
                  ) : (
                    <img
                      src={img.dataUrl || img.blobUrl}
                      alt={img.name}
                      loading="lazy"
                      className={cn(
                        "w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]",
                        viewMode === "grid"
                          ? thumbSize === "s"
                            ? "aspect-[4/3]"
                            : thumbSize === "l"
                              ? "aspect-[3/2]"
                              : "aspect-[5/4]"
                          : "h-auto",
                      )}
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
                  className="absolute bottom-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition duration-200 group-hover:opacity-100 hover:bg-black/60"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this image?")) deleteImage(img.id);
                  }}
                  aria-label="Delete image"
                  title="Delete image"
                >
                  <Trash className="h-4 w-4" />
                </button>

                {editingId === img.id ? (
                  <div
                    className={cn(
                      "absolute inset-x-0 bottom-0 z-40 space-y-2 border-t px-4 py-4 backdrop-blur-xl",
                      lucccaMode
                        ? "border-white/10 bg-slate-950/90"
                        : "border-slate-200/60 bg-white/95",
                    )}
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={onEditKeyDown}
                      placeholder="Image name"
                      className={cn(
                        "w-full rounded-full border px-3 py-2 text-sm shadow-inner",
                        lucccaMode ? "bg-slate-900/70" : "bg-white/85",
                      )}
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      onKeyDown={onEditKeyDown}
                      placeholder="categories (comma separated)"
                      className={cn(
                        "w-full rounded-full border px-3 py-2 text-sm shadow-inner",
                        lucccaMode ? "bg-slate-900/70" : "bg-white/85",
                      )}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="rounded-full px-4">
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={cancelEdit}
                        className="rounded-full px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 text-white">
                    <button
                      className="truncate text-left text-sm font-medium underline-offset-4 hover:underline"
                      onClick={() => beginEdit(img.id)}
                      title="Rename & categorize"
                    >
                      {img.name}
                    </button>
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {displayTags.length > 0 ? (
                        <>
                          {displayTags.map((t) => (
                            <button
                              key={t}
                              className="pointer-events-auto rounded-full bg-white/30 px-2 py-0.5 text-white/90 backdrop-blur"
                              onClick={() => beginEdit(img.id)}
                              title="Edit categories"
                            >
                              {t}
                            </button>
                          ))}
                          {overflowCount > 0 && (
                            <button
                              className="pointer-events-auto rounded-full bg-white/20 px-2 py-0.5 text-white/80 backdrop-blur"
                              onClick={() => beginEdit(img.id)}
                              title="Edit categories"
                            >
                              +{overflowCount}
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          className="pointer-events-auto rounded-full bg-white/20 px-2 py-0.5 text-white/80 backdrop-blur"
                          onClick={() => beginEdit(img.id)}
                          title="Add categories"
                        >
                          + categorize
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn("rounded-[28px] border p-8 text-center text-sm", cardSurface)}>
          <div className="mb-2 opacity-80">No images yet.</div>
          <Button onClick={() => restoreDemo()} className="rounded-full px-5">
            Restore demo images
          </Button>
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
        onNext={() => setLightboxIndex((i) => (i + 1) % filtered length)}
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
                ? `Highlights ${tags slice(0, 3).join(" · ")}${tags.length > 3 ? " +" : ""}`
                : undefined,
          };
        })}
        className={lucccaMode ? "luccca-theme" : ""}
      />
    </div>
  );
}