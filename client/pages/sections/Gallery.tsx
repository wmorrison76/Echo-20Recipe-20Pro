import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode, SVGProps } from "react";
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
import {
  Clock,
  Download,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Trash2,
  UploadCloud,
} from "lucide-react";

const gridTemplates: Record<"s" | "m" | "l", string> = {
  s: "grid-cols-[repeat(auto-fill,minmax(110px,1fr))]",
  m: "grid-cols-[repeat(auto-fill,minmax(160px,1fr))]",
  l: "grid-cols-[repeat(auto-fill,minmax(220px,1fr))]",
};

const RECENT_DAYS = 30;

type SortMode = "newest" | "oldest" | "favorites" | "name";
type LibraryFilter = "all" | "favorites" | "recent" | "lookbook";

type GalleryCardProps = {
  id: string;
  name: string;
  src?: string;
  tags: string[];
  favorite?: boolean;
  unsupported?: boolean;
  active: boolean;
  selected: boolean;
  thumbSize: "s" | "m" | "l";
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onDoubleClick: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
};

function GalleryCard({
  id,
  name,
  src,
  tags,
  favorite,
  unsupported,
  active,
  selected,
  thumbSize,
  onClick,
  onDoubleClick,
  onToggleFavorite,
  onDelete,
}: GalleryCardProps) {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition",
        active
          ? "ring-2 ring-sky-400 shadow-[0_25px_60px_rgba(14,165,233,0.25)]"
          : "ring-1 ring-transparent shadow-[0_18px_40px_rgba(15,23,42,0.18)]",
        selected && !active && "ring-2 ring-sky-300",
        unsupported ? "bg-slate-900/40" : "bg-slate-900/20",
      )}
      data-echo-key="card:gallery:item"
    >
      <div className="relative">
        {unsupported ? (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-800 text-xs uppercase tracking-[0.3em] text-slate-300">
            No preview
          </div>
        ) : (
          <img
            src={src}
            alt={name}
            loading="lazy"
            className={cn(
              "w-full object-cover transition duration-300 group-hover:scale-[1.03]",
              thumbSize === "s"
                ? "aspect-square"
                : thumbSize === "l"
                  ? "aspect-[3/2]"
                  : "aspect-[4/3]",
            )}
            onError={(event) => {
              const el = event.currentTarget;
              el.onerror = null;
              el.src = "/placeholder.svg";
              el.classList.add("opacity-70");
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/45 opacity-0 transition group-hover:opacity-100" />
        <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
          {selected && (
            <span className="rounded-full border border-white/40 bg-sky-500/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
              Selected
            </span>
          )}
          {active && !selected && (
            <span className="rounded-full bg-sky-500/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
              Active
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            aria-label="Toggle favorite"
          >
            <Star className={cn("h-4 w-4", favorite ? "fill-yellow-300 text-yellow-300" : "text-white")}
            />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600/80"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-sm font-semibold leading-tight text-slate-100">
          {name}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-sky-400/60 bg-sky-400/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.25em] text-sky-200"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] uppercase tracking-[0.25em] text-slate-200">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default function GallerySection() {
  const {
    images,
    lookbooks,
    addLookBook,
    addImagesToLookBook,
    removeImagesFromLookBook,
    deleteLookBook,
    updateLookBook,
    addImages,
    linkImagesToRecipesByFilename,
    addTagsToImages,
    updateImage,
    exportAllZip,
    restoreDemo,
    deleteImage,
  } = useAppData();

  const [status, setStatus] = useState<string | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [importTags, setImportTags] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [thumbSize, setThumbSize] = useState<"s" | "m" | "l">("m");
  const [lucccaMode, setLucccaMode] = useState(true);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [activeLookBookId, setActiveLookBookId] = useState<string | null>(null);
  const [openLookBook, setOpenLookBook] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [bulkTagDraft, setBulkTagDraft] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [urlText, setUrlText] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [lookbookNameDraft, setLookbookNameDraft] = useState("");

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const favoriteCount = useMemo(
    () => images.filter((img) => img.favorite).length,
    [images],
  );

  const recentThreshold = useMemo(
    () => Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000,
    [],
  );

  const recentCount = useMemo(
    () =>
      images.filter((img) =>
        typeof img.createdAt === "number" && img.createdAt > 0
          ? img.createdAt >= recentThreshold
          : false,
      ).length,
    [images, recentThreshold],
  );

  const activeLookBook = useMemo(
    () => lookbooks.find((book) => book.id === activeLookBookId) ?? null,
    [lookbooks, activeLookBookId],
  );

  const filtered = useMemo(() => {
    let base = images.slice();

    if (libraryFilter === "favorites") {
      base = base.filter((img) => img.favorite);
    } else if (libraryFilter === "recent") {
      base = base.filter((img) =>
        typeof img.createdAt === "number" && img.createdAt >= recentThreshold,
      );
    } else if (libraryFilter === "lookbook" && activeLookBook) {
      const set = new Set(activeLookBook.imageIds);
      base = base.filter((img) => set.has(img.id));
    }

    if (filter.trim()) {
      const query = filter.trim().toLowerCase();
      base = base.filter((img) => {
        const tagMatch = (img.tags || []).some((tag) => tag.toLowerCase().includes(query));
        return img.name.toLowerCase().includes(query) || tagMatch;
      });
    }

    const sorted = base.slice();
    sorted.sort((a, b) => {
      const aDate = typeof a.createdAt === "number" ? a.createdAt : 0;
      const bDate = typeof b.createdAt === "number" ? b.createdAt : 0;
      switch (sort) {
        case "favorites":
          if (Boolean(b.favorite) !== Boolean(a.favorite)) {
            return Number(b.favorite) - Number(a.favorite);
          }
          return bDate - aDate;
        case "oldest":
          return aDate - bDate;
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return bDate - aDate;
      }
    });

    return sorted;
  }, [
    images,
    libraryFilter,
    activeLookBook,
    filter,
    sort,
    recentThreshold,
  ]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filtered.some((img) => img.id === id)));
  }, [filtered]);

  useEffect(() => {
    if (!filtered.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !filtered.some((img) => img.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  const activeImage = useMemo(
    () => images.find((img) => img.id === activeId) ?? null,
    [images, activeId],
  );

  useEffect(() => {
    if (activeImage) {
      setNameDraft(activeImage.name);
      setTagDraft((activeImage.tags || []).join(", "));
    } else {
      setNameDraft("");
      setTagDraft("");
    }
  }, [activeImage?.id]);

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    setImportTags("");
    setShowTagDialog(true);
    (window as any).__pending_files = files;
  };

  const handleConfirmImport = async () => {
    const files: File[] = (window as any).__pending_files || [];
    if (!files.length) {
      setShowTagDialog(false);
      return;
    }
    const tags = importTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setShowTagDialog(false);
    setStatus("Processing images...");
    const added = await addImages(files, { tags });
    setStatus(`Added ${added} file${added === 1 ? "" : "s"}.`);
    (window as any).__pending_files = undefined;
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleSelectCard = (event: MouseEvent<HTMLButtonElement>, id: string) => {
    const multi = event.metaKey || event.ctrlKey;
    setActiveId(id);
    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleOpenLightbox = (id: string) => {
    const index = filtered.findIndex((img) => img.id === id);
    if (index >= 0) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const current = images.find((img) => img.id === id);
    if (!current) return;
    updateImage(id, { favorite: !current.favorite });
  };

  const handleDeleteImage = (id: string) => {
    if (!confirm("Delete this image?")) return;
    deleteImage(id);
    setStatus("Image deleted.");
  };

  const handleBulkTagSubmit = () => {
    const tags = bulkTagDraft
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!tags.length || !selectedIds.length) return;
    addTagsToImages(selectedIds, tags);
    setBulkTagDraft("");
    setStatus(`Tagged ${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"}.`);
    setSelectedIds([]);
  };

  const handleSaveMetadata = () => {
    if (!activeImage) return;
    const name = nameDraft.trim();
    if (!name) {
      setStatus("Name cannot be empty.");
      return;
    }
    const tags = tagDraft
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    updateImage(activeImage.id, { name, tags });
    setStatus("Image metadata updated.");
  };

  const handleToggleLookbookMembership = (lookbookId: string, enabled: boolean) => {
    if (!activeImage) return;
    if (enabled) {
      addImagesToLookBook(lookbookId, [activeImage.id]);
    } else {
      removeImagesFromLookBook(lookbookId, [activeImage.id]);
    }
  };

  const handleAddImagesFromUrls = async () => {
    const urls = urlText
      .split(/\s+/)
      .map((value) => value.trim())
      .filter((value) => /^https?:\/\//i.test(value));
    if (!urls.length) {
      setStatus("Enter valid http(s) image URLs.");
      return;
    }
    setUrlLoading(true);
    try {
      const files: File[] = [];
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const filename =
            url.split("?")[0].split("#")[0].split("/").pop() || `image-${Date.now()}.jpg`;
          files.push(
            new File([blob], filename.replace(/[^A-Za-z0-9_.-]/g, "_"), {
              type: blob.type || "image/jpeg",
            }),
          );
        } catch (error: any) {
          setStatus(`Failed to fetch ${url}: ${error?.message ?? "error"}`);
        }
      }
      if (files.length) {
        const added = await addImages(files, { tags: [] });
        setStatus(`Added ${added} image${added === 1 ? "" : "s"} from URLs.`);
        setUrlText("");
      }
    } finally {
      setUrlLoading(false);
    }
  };

  const shellClass = lucccaMode
    ? "luccca-theme border-slate-800/70 bg-slate-950/92 text-slate-100 shadow-[0_60px_160px_rgba(14,165,233,0.4)]"
    : "border-slate-200/70 bg-white/96 text-slate-900 shadow-[0_65px_160px_rgba(15,23,42,0.12)]";

  const navSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/75"
    : "border-slate-200 bg-white";
  const mainSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/65"
    : "border-slate-200/70 bg-white/95";
  const detailSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/70"
    : "border-slate-200/70 bg-white";
  const subtleSurface = lucccaMode
    ? "border-slate-700/50 bg-slate-900/60 text-slate-200"
    : "border-slate-200/60 bg-white/85 text-slate-700";

  return (
    <div
      className={cn(
        "relative mx-auto max-w-[1500px] space-y-6 rounded-[48px] border px-4 py-6 sm:px-8 lg:px-10 lg:py-10",
        shellClass,
      )}
      data-echo-key="page:recipes:gallery"
    >
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className={cn("flex flex-col gap-6 rounded-[32px] border p-6", navSurface)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Library</h2>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
                <input
                  type="checkbox"
                  checked={lucccaMode}
                  onChange={(event) => setLucccaMode(event.target.checked)}
                />
                LUCCCA
              </label>
            </div>
            <div className="grid gap-3 text-sm">
              <LibraryItem
                icon={<ImageIcon className="h-4 w-4" />}
                label="All photos"
                count={images.length}
                active={libraryFilter === "all" && !activeLookBookId}
                onClick={() => {
                  setLibraryFilter("all");
                  setActiveLookBookId(null);
                }}
              />
              <LibraryItem
                icon={<Star className="h-4 w-4" />}
                label="Favorites"
                count={favoriteCount}
                active={libraryFilter === "favorites"}
                onClick={() => {
                  setLibraryFilter("favorites");
                  setActiveLookBookId(null);
                }}
              />
              <LibraryItem
                icon={<Clock className="h-4 w-4" />}
                label={`Last ${RECENT_DAYS} days`}
                count={recentCount}
                active={libraryFilter === "recent"}
                onClick={() => {
                  setLibraryFilter("recent");
                  setActiveLookBookId(null);
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] opacity-70">
              <span>Look Books</span>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  restoreDemo();
                  setStatus("Demo gallery restored.");
                }}
                title="Restore demo set"
              >
                <RefreshGlyph />
              </button>
            </div>
            <div className="space-y-2">
              {lookbooks.map((book) => (
                <LibraryItem
                  key={book.id}
                  icon={<Folder className="h-4 w-4" />}
                  label={book.name}
                  count={book.imageIds.length}
                  active={libraryFilter === "lookbook" && activeLookBookId === book.id}
                  onClick={() => {
                    setLibraryFilter("lookbook");
                    setActiveLookBookId(book.id);
                  }}
                  action={
                    <div className="flex items-center gap-1">
                      <button
                        className="rounded-full p-1 text-xs opacity-70 transition hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          const name = prompt("Rename Look Book", book.name)?.trim();
                          if (name) updateLookBook(book.id, { name });
                        }}
                        title="Rename"
                      >
                        ✎
                      </button>
                      <button
                        className="rounded-full p-1 text-xs opacity-70 transition hover:text-red-400 hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (confirm("Delete this look book?")) deleteLookBook(book.id);
                        }}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  }
                />
              ))}
              {lookbooks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/20 px-3 py-4 text-xs opacity-70">
                  No look books yet.
                </div>
              )}
            </div>
            <div className="space-y-2 rounded-2xl border border-white/20 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">
                New look book
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={lookbookNameDraft}
                  placeholder="Name"
                  className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm"
                  onChange={(event) => setLookbookNameDraft(event.target.value)}
                />
                <Button
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => {
                    const name = lookbookNameDraft.trim();
                    if (!name) return;
                    const id = addLookBook(name, selectedIds);
                    setLookbookNameDraft("");
                    setSelectedIds([]);
                    setActiveLookBookId(id);
                    setLibraryFilter("lookbook");
                    setOpenLookBook(true);
                    setStatus(`Look book "${name}" created.`);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-[11px] opacity-70">
                Use current selection to seed the collection automatically.
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3 text-xs opacity-70">
            <p>
              {selectedIds.length > 0
                ? `${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"} selected`
                : "Select images to manage tags and look books."}
            </p>
            {activeLookBook && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-full px-4"
                onClick={() => setOpenLookBook(true)}
              >
                Open “{activeLookBook.name}” showcase
              </Button>
            )}
          </div>
        </aside>

        <Dropzone
          multiple
          onFiles={handleFiles}
          className={cn("flex flex-col gap-5 rounded-[32px] border p-6", mainSurface)}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search by name or tag"
                className="w-full rounded-full border border-transparent bg-black/10 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortMode)}
                  className="bg-transparent text-xs focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="favorites">Favorites</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                <select
                  value={thumbSize}
                  onChange={(event) => setThumbSize(event.target.value as "s" | "m" | "l")}
                  className="bg-transparent text-xs focus:outline-none"
                >
                  <option value="s">Small</option>
                  <option value="m">Medium</option>
                  <option value="l">Large</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (files.length) handleFiles(files);
                  if (uploadInputRef.current) uploadInputRef.current.value = "";
                }}
              />
              <Button onClick={handleUploadClick} className="rounded-full px-4">
                <UploadCloud className="mr-2 h-4 w-4" /> Upload
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("Exporting ZIP...");
                  void exportAllZip().then(() => setStatus("Export complete."));
                }}
                className="rounded-full px-4"
              >
                <Download className="mr-2 h-4 w-4" /> Export ZIP
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  linkImagesToRecipesByFilename();
                  setStatus("Linked images to recipes by filename.");
                }}
                className="rounded-full px-4"
              >
                <Link2 className="mr-2 h-4 w-4" /> Link recipes
              </Button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-xs", subtleSurface)}>
              <span>{selectedIds.length} selected</span>
              <input
                value={bulkTagDraft}
                onChange={(event) => setBulkTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleBulkTagSubmit();
                  }
                }}
                placeholder="Add tags (comma separated)"
                className="flex-1 rounded-full border border-transparent bg-black/10 px-3 py-1 text-xs focus:border-sky-400 focus:outline-none"
              />
              <Button size="sm" className="rounded-full px-4" onClick={handleBulkTagSubmit}>
                Apply tags
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
            </div>
          )}

          <div className={cn("rounded-[28px] border bg-black/10 p-6", subtleSurface)}>
            <div className="flex flex-col items-center justify-center gap-3 text-center text-sm text-slate-200">
              <UploadCloud className="h-10 w-10 opacity-70" />
              <div className="text-base font-semibold">Drag files anywhere in this panel</div>
              <p className="max-w-xl text-xs uppercase tracking-[0.3em] opacity-70">
                Supported RAW · HEIC · JPG · PNG
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-[28px] border bg-black/10 p-4">
            {filtered.length > 0 ? (
              <div
                className={cn(
                  "grid gap-4",
                  gridTemplates[thumbSize],
                )}
                data-echo-key="section:gallery:grid"
              >
                {filtered.map((image) => (
                  <GalleryCard
                    key={image.id}
                    id={image.id}
                    name={image.name}
                    src={image.dataUrl || image.blobUrl}
                    tags={image.tags || []}
                    favorite={image.favorite}
                    unsupported={image.unsupported}
                    active={activeId === image.id}
                    selected={selectedIds.includes(image.id)}
                    thumbSize={thumbSize}
                    onClick={(event) => handleSelectCard(event, image.id)}
                    onDoubleClick={() => handleOpenLightbox(image.id)}
                    onToggleFavorite={() => handleToggleFavorite(image.id)}
                    onDelete={() => handleDeleteImage(image.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-sm text-slate-200">
                <div className="text-base font-semibold">No images match the current filters.</div>
                <Button className="rounded-full px-4" onClick={() => restoreDemo()}>
                  Restore demo gallery
                </Button>
              </div>
            )}
          </div>
        </Dropzone>

        <aside className={cn("flex flex-col gap-5 rounded-[32px] border p-6", detailSurface)}>
          <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] opacity-70">
            <span>Inspector</span>
            <ListFilter className="h-4 w-4" />
          </div>

          {activeImage ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                {activeImage.unsupported ? (
                  <div className="flex aspect-[4/3] items-center justify-center bg-slate-900/60 text-xs uppercase tracking-[0.3em] text-slate-300">
                    No preview available
                  </div>
                ) : (
                  <img
                    src={activeImage.dataUrl || activeImage.blobUrl}
                    alt={activeImage.name}
                    className="w-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] opacity-60">Filename</label>
                <input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] opacity-60">Tags</label>
                <textarea
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  className="h-20 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  placeholder="comma separated"
                />
                <Button size="sm" className="rounded-full px-4" onClick={handleSaveMetadata}>
                  Save metadata
                </Button>
              </div>

              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.3em] opacity-60">Look book membership</div>
                <div className="space-y-2">
                  {lookbooks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/20 px-3 py-3 text-xs opacity-70">
                      Create a look book on the left to organise hero dishes.
                    </div>
                  )}
                  {lookbooks.map((book) => {
                    const hasImage = book.imageIds.includes(activeImage.id);
                    return (
                      <label
                        key={book.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5" /> {book.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={hasImage}
                          onChange={(event) =>
                            handleToggleLookbookMembership(book.id, event.target.checked)
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.3em] opacity-60">Add from URLs</div>
                <textarea
                  value={urlText}
                  onChange={(event) => setUrlText(event.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
                />
                <Button
                  size="sm"
                  disabled={urlLoading}
                  className="rounded-full px-4"
                  onClick={handleAddImagesFromUrls}
                >
                  {urlLoading ? "Fetching…" : "Add images"}
                </Button>
              </div>

              <div className="space-y-1 text-xs opacity-60">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  {(activeImage.tags || []).join(" · ") || "No tags yet"}
                </div>
                <div>{new Date(Number(activeImage.createdAt || Date.now())).toLocaleString()}</div>
                <div>{activeImage.type || "Unknown file type"}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-sm text-slate-200">
              <div className="text-base font-semibold">Select an image to edit details.</div>
            </div>
          )}
        </aside>
      </div>

      {status && (
        <div className={cn("rounded-[24px] border px-4 py-3 text-sm", subtleSurface)}>{status}</div>
      )}

      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag images on import</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={importTags}
              onChange={(event) => setImportTags(event.target.value)}
              placeholder="e.g. plating, dessert"
              className="w-full rounded-md border bg-background px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowTagDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmImport}>Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GalleryLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={filtered.map((image) => ({
          id: image.id,
          src: image.dataUrl || image.blobUrl,
          name: image.name,
          favorite: image.favorite,
          unsupported: image.unsupported,
        }))}
        index={lightboxIndex}
        onPrev={() => setLightboxIndex((index) => (index - 1 + filtered.length) % filtered.length)}
        onNext={() => setLightboxIndex((index) => (index + 1) % filtered.length)}
        onToggleFavorite={handleToggleFavorite}
        className={lucccaMode ? "luccca-theme lightbox-overlay" : ""}
      />

      <LookBookShowcase
        open={openLookBook}
        onClose={() => setOpenLookBook(false)}
        title={activeLookBook?.name}
        images={(activeLookBook?.imageIds || []).map((id) => {
          const img = images.find((item) => item.id === id);
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

type LibraryItemProps = {
  icon: ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  action?: ReactNode;
};

function LibraryItem({ icon, label, count, active, onClick, action }: LibraryItemProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition",
        active
          ? "border-sky-400/60 bg-sky-500/10 text-sky-100 shadow-[0_18px_40px_rgba(14,165,233,0.25)]"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-sky-300/40 hover:bg-sky-500/10",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-black/40 p-1">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
        <span>{count}</span>
        {action}
      </div>
    </div>
  );
}

type RefreshGlyphProps = SVGProps<SVGSVGElement>;

function RefreshGlyph(props: RefreshGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" {...props}>
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3v6h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
