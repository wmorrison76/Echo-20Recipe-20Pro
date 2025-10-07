import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode, SVGProps } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import "../../luccca-lookbook.css";
import { useAppData } from "@/context/AppDataContext";
import type { GalleryImage } from "@/context/AppDataContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { LookBookShowcase } from "@/components/LookBookShowcase";
import { GalleryOverlay } from "@/components/gallery/GalleryOverlay";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Clock,
  Download,
  Droplet,
  Eraser,
  Folder,
  Image as ImageIcon,
  LassoSelect,
  Layers,
  LayoutGrid,
  Link2,
  ListFilter,
  Move,
  Paintbrush,
  PenTool,
  Pipette,
  Plus,
  Scissors,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stamp,
  Star,
  Eye,
  EyeOff,
  Lock,
  Tag,
  Trash2,
  UploadCloud,
  Wand2,
} from "lucide-react";

const gridTemplates: Record<"s" | "m" | "l", string> = {
  s: "grid-cols-[repeat(auto-fill,minmax(150px,1fr))]",
  m: "grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  l: "grid-cols-[repeat(auto-fill,minmax(260px,1fr))]",
};

const RECENT_DAYS = 30;

const DEFAULT_ADJUSTMENT: AdjustmentState = {
  exposure: 0,
  contrast: 0,
  warmth: 0,
  saturation: 0,
  focus: 0,
};

const ADJUSTMENT_CONTROLS: {
  key: keyof AdjustmentState;
  label: string;
  min: number;
  max: number;
  step?: number;
}[] = [
  { key: "exposure", label: "Exposure", min: -60, max: 60 },
  { key: "contrast", label: "Contrast", min: -50, max: 60 },
  { key: "saturation", label: "Saturation", min: -60, max: 60 },
  { key: "warmth", label: "Warmth", min: -90, max: 90, step: 1 },
  { key: "focus", label: "Focus", min: -40, max: 40 },
];

type AdjustmentState = {
  exposure: number;
  contrast: number;
  warmth: number;
  saturation: number;
  focus: number;
};

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
  onDelete: () => void;
};

type TagCluster = {
  tag: string;
  count: number;
  freshnessLabel: string;
};

type ToolConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
};

type QuickActionConfig = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type LayerInfo = {
  key: string;
  name: string;
  meta: string;
  locked?: boolean;
};

const CREATIVE_TOOLS: ToolConfig[] = [
  { key: "select", label: "Select", icon: Move },
  { key: "lasso", label: "Lasso", icon: LassoSelect },
  { key: "brush", label: "Brush", icon: Paintbrush },
  { key: "pen", label: "Pen", icon: PenTool },
  { key: "smudge", label: "Smudge", icon: Droplet },
  { key: "stamp", label: "Stamp", icon: Stamp },
  { key: "picker", label: "Color pick", icon: Pipette },
  { key: "erase", label: "Erase", icon: Eraser },
  { key: "cut", label: "Cut", icon: Scissors },
  { key: "magic", label: "Magic", icon: Wand2 },
];

const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    key: "remove-bg",
    label: "Remove background",
    description: "Isolate subject automatically",
    icon: Sparkles,
  },
  {
    key: "resize",
    label: "Resize & crop",
    description: "Canvas, ratio and framing",
    icon: Move,
  },
  {
    key: "color",
    label: "Color grade",
    description: "Balance warmth and tone",
    icon: Droplet,
  },
  {
    key: "layers",
    label: "Merge layers",
    description: "Combine selected elements",
    icon: Layers,
  },
  {
    key: "heal",
    label: "Repair details",
    description: "Smudge & clone stamping",
    icon: Stamp,
  },
  {
    key: "composite",
    label: "Add overlay",
    description: "Blend another photo",
    icon: Folder,
  },
];

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
  onDelete,
}: GalleryCardProps) {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border text-left transition duration-300",
        active
          ? "ring-2 ring-sky-400 shadow-[0_35px_70px_rgba(14,165,233,0.35)]"
          : "ring-1 ring-transparent shadow-[0_22px_60px_rgba(15,23,42,0.22)]",
        selected && !active && "ring-2 ring-sky-300",
        unsupported ? "bg-slate-900/45" : "bg-slate-900/30",
      )}
      data-echo-key={`card:gallery:item:${id}`}
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
              "w-full object-cover transition duration-500 group-hover:scale-[1.05]",
              thumbSize === "s"
                ? "aspect-square"
                : thumbSize === "l"
                  ? "aspect-[5/4]"
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
        {favorite && (
          <div className="pointer-events-none absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> Fav
          </div>
        )}
        {selected && (
          <span className="pointer-events-none absolute left-3 top-3 z-20 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-white/50 bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
        )}
        <div className="absolute right-3 top-3 z-20 flex gap-2 opacity-0 transition group-hover:opacity-100">
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onDelete();
              }
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-red-600/80 focus:outline-none focus:ring-2 focus:ring-red-400/70"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div className="text-sm font-semibold leading-tight text-slate-100 line-clamp-2">{name}</div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.25em] text-sky-100/90">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-sky-400/50 bg-sky-500/15 px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-black/40 px-2 py-0.5">+{tags.length - 3}</span>
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
  const [thumbSize, setThumbSize] = useState<"s" | "m" | "l">("s");
  const lucccaMode = true;
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
  const [sidebarDropActive, setSidebarDropActive] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentState>>({});
  const [activeTool, setActiveTool] = useState<string>(CREATIVE_TOOLS[0].key);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  const [inspectorDropActive, setInspectorDropActive] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

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

  const tagClusters = useMemo<TagCluster[]>(() => {
    if (!images.length) return [];
    const stats = new Map<string, { count: number; lastSeen: number }>();
    const fallbackTag = "Untagged";

    images.forEach((img) => {
      const createdAt = typeof img.createdAt === "number" ? img.createdAt : 0;
      const tags = img.tags && img.tags.length > 0 ? img.tags : [fallbackTag];
      tags.forEach((raw) => {
        const tag = raw.trim() || fallbackTag;
        const current = stats.get(tag) ?? { count: 0, lastSeen: 0 };
        stats.set(tag, {
          count: current.count + 1,
          lastSeen: Math.max(current.lastSeen, createdAt),
        });
      });
    });

    const now = Date.now();

    return Array.from(stats.entries())
      .sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        return b[1].lastSeen - a[1].lastSeen;
      })
      .slice(0, 6)
      .map(([tag, meta]) => {
        const days = meta.lastSeen ? Math.floor((now - meta.lastSeen) / (1000 * 60 * 60 * 24)) : null;
        let freshnessLabel = "Archive";
        if (days === null) {
          freshnessLabel = "Untimed";
        } else if (days <= 2) {
          freshnessLabel = "Fresh";
        } else if (days <= 7) {
          freshnessLabel = "This week";
        } else if (days <= 30) {
          freshnessLabel = "Recent";
        }
        return {
          tag,
          count: meta.count,
          freshnessLabel,
        };
      });
  }, [images]);

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

  const layerList = useMemo<LayerInfo[]>(() => {
    if (!activeImage) return [];
    const tags = activeImage.tags || [];
    const overlays = tags.slice(0, 2).map((tag, index) => ({
      key: `tag-${index}`,
      name: `${tag} overlay`,
      meta: "Tag layer",
    }));
    return [
      { key: "base", name: activeImage.name, meta: "Raster", locked: true },
      ...overlays,
      { key: "color-grade", name: "Color grade", meta: "Adjustment" },
      { key: "retouch", name: "Retouch", meta: "Stamp blend" },
    ];
  }, [activeImage]);

  const activeToolLabel = useMemo(
    () => CREATIVE_TOOLS.find((tool) => tool.key === activeTool)?.label ?? "Select",
    [activeTool],
  );

  useEffect(() => {
    setVisibleLayers((prev) => {
      const next: Record<string, boolean> = {};
      layerList.forEach((layer) => {
        next[layer.key] = prev[layer.key] ?? true;
      });
      return next;
    });
  }, [layerList]);

  const toggleLayerVisibility = (layerKey: string) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layerKey]: !(prev[layerKey] ?? true),
    }));
  };

  const handleQuickAction = (action: QuickActionConfig) => {
    setActiveQuickAction(action.key);
    setStatus(`${action.label} staged. Fine tune with creative tools.`);
  };

  const activeAdjustment = useMemo<AdjustmentState>(() => {
    if (!activeId) return { ...DEFAULT_ADJUSTMENT };
    const stored = adjustments[activeId] ?? DEFAULT_ADJUSTMENT;
    return {
      exposure: stored.exposure ?? 0,
      contrast: stored.contrast ?? 0,
      warmth: stored.warmth ?? 0,
      saturation: stored.saturation ?? 0,
      focus: stored.focus ?? 0,
    };
  }, [activeId, adjustments]);

  const inspectorImageStyle = useMemo(() => {
    const { exposure, contrast, warmth, saturation, focus } = activeAdjustment;
    const filterParts = [
      `brightness(${(1 + exposure / 80).toFixed(3)})`,
      `contrast(${(1 + contrast / 80 + Math.max(focus, 0) / 140).toFixed(3)})`,
      `saturate(${(1 + saturation / 80).toFixed(3)})`,
      `hue-rotate(${warmth}deg)`,
    ];
    if (focus < 0) {
      filterParts.push(`blur(${(Math.abs(focus) / 14).toFixed(2)}px)`);
    }
    const boxShadow = focus > 10
      ? `0 28px 60px rgba(14,165,233,${Math.min(0.45, 0.2 + focus / 120).toFixed(2)})`
      : "0 26px 60px rgba(15,23,42,0.3)";
    return {
      filter: filterParts.join(" "),
      boxShadow,
    } as const;
  }, [activeAdjustment]);

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

  const toggleFavorite = (id: string) => {
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

  const updateAdjustment = (key: keyof AdjustmentState, value: number) => {
    if (!activeId) return;
    setAdjustments((prev) => {
      const existing = prev[activeId] ?? DEFAULT_ADJUSTMENT;
      const next = { ...existing, [key]: value };
      return { ...prev, [activeId]: next };
    });
  };

  const resetAdjustments = () => {
    if (!activeId) return;
    setAdjustments((prev) => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
  };

  const handleBulkFavorite = (favorite: boolean) => {
    if (!selectedIds.length) return;
    selectedIds.forEach((id) => {
      const current = images.find((img) => img.id === id);
      if (current && current.favorite !== favorite) {
        updateImage(id, { favorite });
      }
    });
    setStatus(
      favorite
        ? `Marked ${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"} as favorite.`
        : `Removed favorite from ${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"}.`,
    );
    if (!favorite) {
      setSelectedIds([]);
    }
  };

  const handleSidebarDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length) {
      handleFiles(files);
    }
  };

  const shellClass = lucccaMode
    ? "luccca-theme border-slate-800/70 bg-slate-950/92 text-slate-100 shadow-[0_90px_200px_rgba(14,165,233,0.4)]"
    : "border-slate-200/70 bg-white/96 text-slate-900 shadow-[0_90px_200px_rgba(15,23,42,0.12)]";

  const navSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/75"
    : "border-slate-200 bg-white";
  const mainSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/70"
    : "border-slate-200/70 bg-white/95";
  const detailSurface = lucccaMode
    ? "border-slate-700/60 bg-slate-900/75"
    : "border-slate-200/70 bg-white";
  const subtleSurface = lucccaMode
    ? "border-slate-700/50 bg-slate-900/60 text-slate-200"
    : "border-slate-200/60 bg-white/85 text-slate-700";

  return (
    <div
      className={cn(
        "relative mx-auto max-w-[1640px] space-y-4 rounded-[48px] border px-4 py-5 sm:px-8 lg:px-10 lg:py-7",
        shellClass,
      )}
      data-echo-key="page:recipes:gallery"
    >
      <div className="grid gap-5 lg:min-h-[calc(100vh-170px)] lg:grid-cols-[230px_minmax(0,1fr)_320px] xl:min-h-[calc(100vh-190px)]">
        <aside className={cn("flex h-full flex-col overflow-hidden rounded-[32px] border", navSurface)}>
          <div className="flex flex-1 flex-col gap-4 px-5 pb-4 pt-5">
            <div>
              <h2 className="text-base font-semibold uppercase tracking-[0.3em] text-slate-100">Library</h2>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Curate & explore</p>
            </div>

            <div className="grid gap-2 text-sm">
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

            <AutoCategoryList
              clusters={tagClusters}
              onSelect={(tag) => {
                setFilter(tag);
                setLibraryFilter("all");
                setActiveLookBookId(null);
              }}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300">
                <span>Look Books</span>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
                  onClick={() => {
                    restoreDemo();
                    setStatus("Demo gallery restored.");
                  }}
                  title="Restore demo set"
                >
                  <RefreshGlyph />
                </button>
              </div>
              <div className="space-y-1.5">
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
                          className="rounded-full p-1 text-xs opacity-60 transition hover:opacity-100"
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
                          className="rounded-full p-1 text-xs opacity-60 transition hover:text-red-400 hover:opacity-100"
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
                  <div className="rounded-2xl border border-dashed border-white/20 px-3 py-3 text-xs opacity-70">
                    No look books yet.
                  </div>
                )}
              </div>
              <FlipbookPreview
                onOpen={() => {
                  if (activeLookBook) {
                    setOpenLookBook(true);
                  } else if (lookbooks.length > 0) {
                    setActiveLookBookId(lookbooks[0].id);
                    setLibraryFilter("lookbook");
                    setOpenLookBook(true);
                  } else {
                    setStatus("Create a look book to preview flip motion.");
                  }
                }}
              />
              <div className="space-y-2 rounded-2xl border border-white/12 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300">
                  New look book
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={lookbookNameDraft}
                    placeholder="Name"
                    className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs"
                    onChange={(event) => setLookbookNameDraft(event.target.value)}
                  />
                  <Button
                    size="sm"
                    className="rounded-full px-3"
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
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Use selected images to seed instantly.
                </div>
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-dashed px-3 py-3 text-[11px] uppercase tracking-[0.3em] transition",
                sidebarDropActive
                  ? "border-sky-400/80 bg-sky-500/10 text-sky-200"
                  : "border-white/20 bg-white/5 text-slate-200",
              )}
              onDragEnter={(event) => {
                event.preventDefault();
                setSidebarDropActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setSidebarDropActive(false);
              }}
              onDrop={(event) => {
                handleSidebarDrop(event);
                setSidebarDropActive(false);
              }}
            >
              Drop to auto-tag with AI themes.
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4 text-[11px] uppercase tracking-[0.3em] text-slate-400">
            {selectedIds.length > 0
              ? `${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"} selected`
              : "Select images to manage metadata."}
          </div>
        </aside>

        <Dropzone
          multiple
          onFiles={handleFiles}
          className={cn(
            "relative overflow-hidden rounded-[32px] border",
            mainSurface,
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(125,211,252,0.14),_transparent_70%)]" />
          <div className="relative flex h-full flex-col">
            {selectedIds.length > 0 && (
              <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 px-3">
                <GalleryBulkActions
                  count={selectedIds.length}
                  bulkTagDraft={bulkTagDraft}
                  onBulkTagChange={setBulkTagDraft}
                  onApplyTags={handleBulkTagSubmit}
                  onClear={() => setSelectedIds([])}
                  onFavorite={() => handleBulkFavorite(true)}
                  onUnfavorite={() => handleBulkFavorite(false)}
                />
              </div>
            )}

            <div className="pointer-events-none absolute bottom-6 left-6 z-30 hidden max-w-[320px] md:block">
              <GalleryDropHint />
            </div>

            <div className="relative flex-1 overflow-hidden pt-8 lg:pt-16">
              <GalleryGrid
                images={filtered}
                thumbSize={thumbSize}
                activeId={activeId}
                selectedIds={selectedIds}
                onSelect={handleSelectCard}
                onOpenLightbox={handleOpenLightbox}
                onDelete={handleDeleteImage}
                gridTemplates={gridTemplates}
                onRestoreDemo={restoreDemo}
              />
            </div>
          </div>
        </Dropzone>

        <aside className={cn("flex h-full flex-col gap-5 overflow-hidden rounded-[32px] border p-6", detailSurface)}>
          <div
            className={cn(
              "rounded-3xl border border-dashed px-4 py-3 text-[11px] uppercase tracking-[0.35em] transition",
              inspectorDropActive
                ? "border-sky-400/80 bg-sky-500/15 text-sky-100"
                : "border-white/15 bg-black/25 text-slate-300",
            )}
            onDragEnter={(event) => {
              event.preventDefault();
              setInspectorDropActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setInspectorDropActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
                file.type.startsWith("image/"),
              );
              if (files.length) handleFiles(files);
              setInspectorDropActive(false);
            }}
          >
            Drop photos to edit instantly
          </div>

          <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] opacity-70">
            <span>Photo studio</span>
            <ListFilter className="h-4 w-4" />
          </div>

          {activeImage ? (
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                {activeImage.unsupported ? (
                  <div className="flex aspect-[4/3] items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-300">
                    No preview available
                  </div>
                ) : (
                  <img
                    src={activeImage.dataUrl || activeImage.blobUrl}
                    alt={activeImage.name}
                    className="w-full object-cover"
                    style={inspectorImageStyle}
                  />
                )}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-100">{activeImage.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-slate-300">
                      {(activeImage.tags || []).slice(0, 3).join(" · ") || "Untagged"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={activeImage.favorite ? "default" : "ghost"}
                    className={cn(
                      "rounded-full px-4",
                      activeImage.favorite ? "bg-amber-400 text-black" : "text-slate-200",
                    )}
                    onClick={() => toggleFavorite(activeImage.id)}
                  >
                    <Star className="mr-1.5 h-4 w-4" />
                    {activeImage.favorite ? "Favorited" : "Favorite"}
                  </Button>
                </div>
              </div>

              <ControlSection title="Adjustments" defaultOpen>
                <div className="space-y-3">
                  {ADJUSTMENT_CONTROLS.map((control) => (
                    <div key={control.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-300">
                        <span>{control.label}</span>
                        <span>{activeAdjustment[control.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step ?? 1}
                        value={activeAdjustment[control.key]}
                        onChange={(event) => updateAdjustment(control.key, Number(event.target.value))}
                        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <Button variant="ghost" size="sm" className="rounded-full px-3" onClick={resetAdjustments}>
                    Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-3"
                    onClick={() => handleOpenLightbox(activeImage.id)}
                  >
                    View live
                  </Button>
                </div>
              </ControlSection>

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => setOverlayOpen(true)}
                >
                  Launch studio overlay
                </Button>
              </div>

              <ControlSection title="Creative tools">
                <div className="grid grid-cols-2 gap-2">
                  {CREATIVE_TOOLS.map((tool) => (
                    <ToolButton
                      key={tool.key}
                      label={tool.label}
                      icon={tool.icon}
                      active={activeTool === tool.key}
                      onClick={() => setActiveTool(tool.key)}
                    />
                  ))}
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.3em] text-slate-300">
                  Active · {activeToolLabel}
                </div>
              </ControlSection>

              <ControlSection title="Quick actions">
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <QuickActionCard
                      key={action.key}
                      label={action.label}
                      description={action.description}
                      icon={action.icon}
                      active={activeQuickAction === action.key}
                      onClick={() => handleQuickAction(action)}
                    />
                  ))}
                </div>
              </ControlSection>

              <ControlSection title="Layers">
                <div className="mb-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full px-3"
                    onClick={() => setStatus("New empty layer staged for compositing.")}
                  >
                    + Layer
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {layerList.map((layer) => (
                    <LayerListItem
                      key={layer.key}
                      layer={layer}
                      visible={visibleLayers[layer.key] ?? true}
                      onToggle={() => toggleLayerVisibility(layer.key)}
                    />
                  ))}
                </div>
              </ControlSection>

              <ControlSection title="Metadata">
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.35em] text-slate-300">Filename</label>
                    <input
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.35em] text-slate-300">Tags</label>
                    <textarea
                      value={tagDraft}
                      onChange={(event) => setTagDraft(event.target.value)}
                      className="h-20 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                      placeholder="comma separated"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-300">
                  <Button size="sm" className="rounded-full px-4" onClick={handleSaveMetadata}>
                    Save metadata
                  </Button>
                  <button
                    className="text-[11px] uppercase tracking-[0.35em] text-slate-400 transition hover:text-slate-200"
                    onClick={() => {
                      if (!activeImage) return;
                      setNameDraft(activeImage.name);
                      setTagDraft((activeImage.tags || []).join(", "));
                      setStatus("Metadata fields reverted.");
                    }}
                  >
                    Reset fields
                  </button>
                </div>
              </ControlSection>

              <ControlSection title="Look books">
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
              </ControlSection>

              <ControlSection title="Import by URL">
                <textarea
                  value={urlText}
                  onChange={(event) => setUrlText(event.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="mt-1 h-24 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs focus:border-sky-400 focus:outline-none"
                />
                <Button
                  size="sm"
                  disabled={urlLoading}
                  className="mt-3 rounded-full px-4"
                  onClick={handleAddImagesFromUrls}
                >
                  {urlLoading ? "Fetching…" : "Add images"}
                </Button>
              </ControlSection>

              <div className="space-y-1 text-xs text-slate-300">
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
              <div className="text-base font-semibold">Select an image to begin editing.</div>
            </div>
          )}
        </aside>
      </div>

      {status && (
        <div className={cn("rounded-[24px] border px-4 py-3 text-sm", subtleSurface)}>{status}</div>
      )}

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
        onToggleFavorite={toggleFavorite}
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

      <GalleryOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        image={activeImage}
        adjustments={activeAdjustment}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        layers={layerList}
        visibleLayers={visibleLayers}
        onToggleLayer={toggleLayerVisibility}
        onResetAdjustments={resetAdjustments}
        onQuickAction={handleQuickAction}
        activeQuickAction={activeQuickAction}
        onSave={() => setStatus("Overlay changes saved.")}
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
        "flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-1.5 text-left text-xs transition",
        active
          ? "border-sky-400/60 bg-sky-500/15 text-sky-100 shadow-[0_18px_40px_rgba(14,165,233,0.32)]"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-sky-300/40 hover:bg-sky-500/10",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-black/35 p-1 text-slate-100">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
        <span>{count}</span>
        {action}
      </div>
    </div>
  );
}

type GalleryToolbarProps = {
  filter: string;
  onFilterChange: (value: string) => void;
  sort: SortMode;
  onSortChange: (mode: SortMode) => void;
  thumbSize: "s" | "m" | "l";
  onThumbSizeChange: (size: "s" | "m" | "l") => void;
  onUpload: () => void;
  onExport: () => void;
  onLink: () => void;
};

function GalleryToolbar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  thumbSize,
  onThumbSizeChange,
  onUpload,
  onExport,
  onLink,
}: GalleryToolbarProps) {
  return (
    <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-full bg-black/45 px-5 py-3.5 backdrop-blur-lg">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <input
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Search by name or tag"
            className="w-full rounded-full border border-transparent bg-black/25 pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortMode)}
              className="bg-transparent text-xs focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="favorites">Favorites</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            <select
              value={thumbSize}
              onChange={(event) => onThumbSizeChange(event.target.value as "s" | "m" | "l")}
              className="bg-transparent text-xs focus:outline-none"
            >
              <option value="s">Small</option>
              <option value="m">Medium</option>
              <option value="l">Large</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={onUpload} className="rounded-full px-4">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload
        </Button>
        <Button variant="outline" onClick={onExport} className="rounded-full px-4">
          <Download className="mr-2 h-4 w-4" /> Export ZIP
        </Button>
        <Button
          variant="secondary"
          onClick={onLink}
          className="rounded-full px-4"
        >
          <Link2 className="mr-2 h-4 w-4" /> Link recipes
        </Button>
      </div>
    </div>
  );
}

type GalleryBulkActionsProps = {
  count: number;
  bulkTagDraft: string;
  onBulkTagChange: (value: string) => void;
  onApplyTags: () => void;
  onClear: () => void;
  onFavorite: () => void;
  onUnfavorite: () => void;
};

function GalleryBulkActions({
  count,
  bulkTagDraft,
  onBulkTagChange,
  onApplyTags,
  onClear,
  onFavorite,
  onUnfavorite,
}: GalleryBulkActionsProps) {
  return (
    <div className="pointer-events-auto flex max-w-2xl flex-wrap items-center gap-3 rounded-full border border-white/12 bg-black/65 px-5 py-3 text-xs shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-lg">
      <span className="font-semibold uppercase tracking-[0.3em] text-slate-200">{count} selected</span>
      <input
        value={bulkTagDraft}
        onChange={(event) => onBulkTagChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onApplyTags();
          }
        }}
        placeholder="Add tags (comma separated)"
        className="flex-1 rounded-full border border-transparent bg-black/30 px-3 py-1 text-xs text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
      />
      <Button size="sm" className="rounded-full px-4" onClick={onApplyTags}>
        Apply tags
      </Button>
      <Button size="sm" variant="ghost" className="rounded-full px-4" onClick={onFavorite}>
        Mark favorite
      </Button>
      <Button size="sm" variant="ghost" className="rounded-full px-4" onClick={onUnfavorite}>
        Clear favorite
      </Button>
      <Button size="sm" variant="ghost" className="rounded-full px-4" onClick={onClear}>
        Clear selection
      </Button>
    </div>
  );
}

function GalleryDropHint() {
  return (
    <div className="pointer-events-none rounded-2xl border border-dashed border-white/15 bg-black/35 px-4 py-3 text-[11px] uppercase tracking-[0.3em] text-slate-200">
      Drop anywhere in this live stage to import · RAW · HEIC · JPG · PNG
    </div>
  );
}

type GalleryGridProps = {
  images: GalleryImage[];
  thumbSize: "s" | "m" | "l";
  activeId: string | null;
  selectedIds: string[];
  onSelect: (event: MouseEvent<HTMLButtonElement>, id: string) => void;
  onOpenLightbox: (id: string) => void;
  onDelete: (id: string) => void;
  gridTemplates: Record<"s" | "m" | "l", string>;
  onRestoreDemo: () => void;
};

function GalleryGrid({
  images,
  thumbSize,
  activeId,
  selectedIds,
  onSelect,
  onOpenLightbox,
  onDelete,
  gridTemplates,
  onRestoreDemo,
}: GalleryGridProps) {
  if (!images.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-sm text-slate-200">
        <div className="text-base font-semibold">No images match the current filters.</div>
        <Button className="rounded-full px-4" onClick={() => onRestoreDemo()}>
          Restore demo gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 pb-10">
      <div
        className={cn(
          "grid gap-5",
          gridTemplates[thumbSize],
        )}
        data-echo-key="section:gallery:grid"
      >
        {images.map((image) => (
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
            onClick={(event) => onSelect(event, image.id)}
            onDoubleClick={() => onOpenLightbox(image.id)}
            onDelete={() => onDelete(image.id)}
          />
        ))}
      </div>
    </div>
  );
}

type ToolButtonProps = {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
};

function ToolButton({ label, icon: Icon, active, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs uppercase tracking-[0.3em] transition",
        active
          ? "border-sky-500/60 bg-sky-500/15 text-sky-100 shadow-[0_16px_36px_rgba(14,165,233,0.35)]"
          : "border-white/12 bg-black/30 text-slate-200 hover:border-sky-400/40 hover:bg-sky-500/10",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

type QuickActionCardProps = {
  label: string;
  description: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
};

function QuickActionCard({ label, description, icon: Icon, active, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-2xl border px-3 py-2 text-left transition",
        active
          ? "border-sky-500/60 bg-sky-500/15 text-sky-100 shadow-[0_16px_36px_rgba(14,165,233,0.35)]"
          : "border-white/12 bg-black/25 text-slate-200 hover:border-sky-400/40 hover:bg-sky-500/10",
      )}
    >
      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{description}</span>
    </button>
  );
}

type LayerListItemProps = {
  layer: LayerInfo;
  visible: boolean;
  onToggle: () => void;
};

function LayerListItem({ layer, visible, onToggle }: LayerListItemProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
      <button
        onClick={onToggle}
        className="rounded-full border border-white/20 bg-black/40 p-1 text-white transition hover:border-sky-400/50 hover:text-sky-200"
        aria-label={visible ? "Hide layer" : "Show layer"}
      >
        {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <div className="flex flex-1 flex-col gap-0.5">
        <span>{layer.name}</span>
        <span className="text-[9px] text-slate-400">{layer.meta}</span>
      </div>
      {layer.locked ? (
        <Lock className="h-3.5 w-3.5 text-slate-400" />
      ) : (
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-slate-300">FX</span>
      )}
    </div>
  );
}

type ControlSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function ControlSection({ title, defaultOpen = false, children }: ControlSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-3xl border border-white/12 bg-black/30 p-4">
      <button
        className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-200"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>
      {open && <div className="mt-3 space-y-3 text-slate-100">{children}</div>}
    </div>
  );
}

type AutoCategoryListProps = {
  clusters: TagCluster[];
  onSelect: (tag: string) => void;
};

function AutoCategoryList({ clusters, onSelect }: AutoCategoryListProps) {
  if (!clusters.length) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300">
        AI catalogued themes
      </div>
      <div className="grid gap-1.5">
        {clusters.map((cluster) => (
          <button
            key={cluster.tag}
            onClick={() => onSelect(cluster.tag)}
            className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/5 px-3 py-1.5 text-left text-[11px] uppercase tracking-[0.3em] text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-500/10"
          >
            <span className="flex flex-col gap-0.5 text-left">
              <span className="text-slate-100">{cluster.tag}</span>
              <span className="text-[9px] text-slate-400">{cluster.freshnessLabel}</span>
            </span>
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-semibold tracking-[0.35em] text-slate-200">
              {cluster.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

type FlipbookPreviewProps = {
  onOpen: () => void;
};

function FlipbookPreview({ onOpen }: FlipbookPreviewProps) {
  const [turning, setTurning] = useState(false);

  return (
    <button
      className="group relative h-28 w-full overflow-hidden rounded-2xl border border-white/20 bg-black/35 text-left text-xs uppercase tracking-[0.3em] text-slate-200"
      style={{ perspective: "1200px" }}
      onClick={() => {
        setTurning(true);
        setTimeout(() => setTurning(false), 900);
        onOpen();
      }}
      onMouseEnter={() => setTurning(true)}
      onMouseLeave={() => setTurning(false)}
      aria-label="Open flip book"
    >
      <div className="absolute inset-0 flex flex-col justify-center gap-1 p-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em]">Flip book</span>
        <span className="text-[10px] text-slate-300">Pages animated with every turn</span>
      </div>
      <div
        className="absolute inset-y-4 left-6 w-32 rounded-xl bg-gradient-to-br from-sky-400/60 via-sky-500/40 to-sky-300/30 shadow-[0_18px_40px_rgba(56,189,248,0.35)]"
        style={{
          transformStyle: "preserve-3d",
          transform: turning ? "rotateY(-25deg)" : "rotateY(0deg)",
          transformOrigin: "left center",
          transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <div
        className="absolute inset-y-6 left-10 w-28 rounded-xl border border-white/25 bg-white/10 shadow-[0_12px_30px_rgba(15,23,42,0.3)]"
        style={{
          transformStyle: "preserve-3d",
          transform: turning ? "rotateY(-12deg) translateX(12px)" : "rotateY(0deg)",
          transformOrigin: "left center",
          transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </button>
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
