import { useMemo, useState } from "react";
import type { GalleryImage } from "@/context/AppDataContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  Bandage,
  Blend,
  ChevronDown,
  Clone,
  Crop,
  Droplet,
  Eraser,
  Hand,
  History,
  Lasso,
  Maximize2,
  Minus,
  Move,
  PaintBucket,
  Pencil,
  PenTool,
  Pipette,
  Plus,
  Pointer,
  RectangleHorizontal,
  Ruler,
  Scissors,
  Shapes,
  Sparkles,
  Stamp,
  Text,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type GalleryOverlayProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  image: GalleryImage | null;
  adjustments: {
    exposure: number;
    contrast: number;
    warmth: number;
    saturation: number;
    focus: number;
  };
  activeTool: string;
  onSelectTool: (tool: string) => void;
  layers: { key: string; name: string; meta: string; locked?: boolean }[];
  visibleLayers: Record<string, boolean>;
  onToggleLayer: (key: string) => void;
  onResetAdjustments: () => void;
  onQuickAction: (action: { key: string; label: string }) => void;
  activeQuickAction: string | null;
};

type ToolSpec = {
  key: string;
  label: string;
  icon: LucideIcon;
};

const TOOL_GRID: ToolSpec[] = [
  { key: "marquee", label: "Marquee", icon: RectangleHorizontal },
  { key: "lasso", label: "Lasso", icon: Lasso },
  { key: "crop", label: "Crop", icon: Crop },
  { key: "heal", label: "Heal brush", icon: Bandage },
  { key: "clone", label: "Clone stamp", icon: Stamp },
  { key: "erase", label: "Eraser", icon: Eraser },
  { key: "blur", label: "Blur", icon: Droplet },
  { key: "path", label: "Path select", icon: Pointer },
  { key: "pen", label: "Pen", icon: PenTool },
  { key: "annotate", label: "Annotation", icon: Pencil },
  { key: "hand", label: "Hand", icon: Hand },
  { key: "color", label: "Color pick", icon: Pipette },
  { key: "move", label: "Move", icon: Move },
  { key: "magic", label: "Magic wand", icon: Wand2 },
  { key: "slice", label: "Slice", icon: Scissors },
  { key: "pencil", label: "Pencil", icon: Pencil },
  { key: "history", label: "History brush", icon: History },
  { key: "paint", label: "Paint bucket", icon: PaintBucket },
  { key: "dodge", label: "Dodge", icon: Sparkles },
  { key: "type", label: "Type", icon: Text },
  { key: "shape", label: "Custom shape", icon: Shapes },
  { key: "eyedropper", label: "Eye dropper", icon: Pipette },
  { key: "zoom", label: "Zoom", icon: ZoomIn },
];

const OVERLAY_QUICK_ACTIONS = [
  { key: "blend", label: "Blend layers" },
  { key: "sharpen", label: "Sharpen focus" },
  { key: "retouch", label: "Retouch skin" },
  { key: "highlight", label: "Lift highlights" },
];

const QUICK_PRESETS = [
  { key: "remove-bg", label: "Remove background" },
  { key: "auto-color", label: "Auto color" },
  { key: "hyper-real", label: "Hyper realistic" },
  { key: "bw", label: "Black & white" },
];

export function GalleryOverlay({
  open,
  onClose,
  onSave,
  image,
  adjustments,
  activeTool,
  onSelectTool,
  layers,
  visibleLayers,
  onToggleLayer,
  onResetAdjustments,
  onQuickAction,
  activeQuickAction,
}: GalleryOverlayProps) {
  const [zoom, setZoom] = useState(100);
  const [gridSize, setGridSize] = useState(32);
  const [showRulers, setShowRulers] = useState(true);

  const layerMeta = useMemo(
    () =>
      layers.map((layer, index) => ({
        ...layer,
        order: index,
      })),
    [layers],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-black/70 via-slate-900/65 to-slate-950/80 backdrop-blur-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(51,133,255,0.25),_transparent_60%)] opacity-50" />

      <div className="relative z-[210] mx-auto flex h-[92vh] w-[92vw] flex-col overflow-hidden rounded-[36px] border border-slate-700/60 bg-slate-950/95 shadow-[0_40px_160px_rgba(15,23,42,0.55)]">
        <header className="flex items-center justify-between border-b border-slate-700/60 bg-slate-900/80 px-8 py-4 text-xs uppercase tracking-[0.35em] text-slate-200">
          <div className="flex items-center gap-4">
            <span>Studio overlay</span>
            <span className="rounded-full border border-slate-500/50 bg-black/30 px-3 py-1 text-[11px] text-slate-300">
              {image?.name ?? "No image"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="rounded-full bg-sky-500 px-5 text-black hover:bg-sky-400"
              onClick={onSave}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full px-4"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </header>

        <div className="flex flex-1 gap-4 overflow-hidden px-6 py-6">
          <aside className="flex w-[120px] flex-col gap-3 rounded-3xl border border-slate-700/60 bg-black/35 p-4">
            <div className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Tools</div>
            <div className="grid grid-cols-2 gap-2">
              {TOOL_GRID.map((tool) => (
                <button
                  key={tool.key}
                  onClick={() => onSelectTool(tool.key)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border text-slate-200 transition",
                    activeTool === tool.key
                      ? "border-sky-400 bg-sky-500/20 text-sky-100"
                      : "border-slate-700/60 bg-black/30 hover:border-sky-400/40 hover:bg-sky-500/10",
                  )}
                  aria-label={tool.label}
                >
                  <tool.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </aside>

          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-700/60 bg-black/30 px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-full border border-slate-600/60 bg-black/40 p-2 text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
                  onClick={() => setGridSize((size) => Math.max(8, size - 4))}
                  aria-label="Decrease grid size"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="rounded-full border border-slate-600/60 bg-black/30 px-3 py-1 text-[10px]">
                  Grid {gridSize}px
                </span>
                <button
                  className="rounded-full border border-slate-600/60 bg-black/40 p-2 text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
                  onClick={() => setGridSize((size) => Math.min(96, size + 4))}
                  aria-label="Increase grid size"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-slate-600/60 bg-black/40 p-2 text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
                  onClick={() => setZoom((value) => Math.max(25, value - 10))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="rounded-full border border-slate-600/60 bg-black/30 px-3 py-1 text-[10px]">
                  {zoom}%
                </span>
                <button
                  className="rounded-full border border-slate-600/60 bg-black/40 p-2 text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
                  onClick={() => setZoom((value) => Math.min(400, value + 10))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  className="rounded-full border border-slate-600/60 bg-black/40 p-2 text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
                  onClick={() => setZoom(100)}
                  aria-label="Reset view"
                >
                  <Move className="h-4 w-4" />
                </button>
                <button
                  className="rounded-full border border-slate-600/60 bg-black/40 p-2 text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
                  onClick={() => setZoom(150)}
                  aria-label="Fit to screen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    "rounded-full border border-slate-600/60 bg-black/40 p-2 text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200",
                    showRulers && "border-sky-400/60 text-sky-100",
                  )}
                  onClick={() => setShowRulers((prev) => !prev)}
                  aria-label="Toggle rulers"
                >
                  <Ruler className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-auto">
              {showRulers && (
                <>
                  <div className="pointer-events-none sticky top-0 z-20 h-8 w-full bg-[repeating-linear-gradient(to_right,rgba(148,163,184,0.45),rgba(148,163,184,0.45)_1px,transparent_1px,transparent_24px)] opacity-70" />
                  <div className="pointer-events-none absolute bottom-0 top-0 left-0 z-10 w-8 bg-[repeating-linear-gradient(to_bottom,rgba(148,163,184,0.45),rgba(148,163,184,0.45)_1px,transparent_1px,transparent_24px)] opacity-70" />
                </>
              )}
              <div className="relative h-full w-full">
                <div className="absolute inset-0 flex items-center justify-center p-10">
                  <div
                    className="relative flex h-full w-full min-h-[520px] min-w-[520px] items-center justify-center rounded-[32px]"
                    style={{
                      backgroundImage:
                        "linear-gradient(0deg, transparent calc(100% - 1px), rgba(148,163,184,0.25) calc(100% - 1px)), linear-gradient(90deg, transparent calc(100% - 1px), rgba(148,163,184,0.25) calc(100% - 1px))",
                      backgroundSize: `${gridSize}px ${gridSize}px`,
                    }}
                  >
                    {image ? (
                      <img
                        src={image.dataUrl || image.blobUrl}
                        alt={image.name}
                        className="max-h-[70vh] max-w-[70vw] rounded-3xl border border-white/10 shadow-[0_45px_80px_rgba(14,165,233,0.35)]"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
                      />
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-600/60 bg-black/40 px-12 py-16 text-center text-xs uppercase tracking-[0.35em] text-slate-400">
                        No image selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-between border-t border-slate-700/60 bg-black/30 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-slate-300">
              <span>Metadata · AI warm-up ready</span>
              <span className="rounded-full border border-slate-600/60 bg-black/30 px-3 py-1 text-[10px]">
                Exposure {adjustments.exposure} · Contrast {adjustments.contrast}
              </span>
            </footer>
          </main>

          <aside className="flex w-[260px] flex-col gap-3 rounded-3xl border border-slate-700/60 bg-black/35 p-4">
            <OverlayPanel title="Color adjustments" defaultOpen>
              <div className="grid gap-3 text-[11px] uppercase tracking-[0.3em] text-slate-300">
                <span>Exposure {adjustments.exposure}</span>
                <span>Contrast {adjustments.contrast}</span>
                <span>Warmth {adjustments.warmth}</span>
                <span>Saturation {adjustments.saturation}</span>
                <span>Focus {adjustments.focus}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 rounded-full px-4"
                onClick={onResetAdjustments}
              >
                Reset adjustments
              </Button>
            </OverlayPanel>

            <OverlayPanel title="Layers">
              <div className="space-y-2">
                {layerMeta.map((layer) => (
                  <div
                    key={layer.key}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-slate-700/60 bg-black/30 px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-slate-200"
                  >
                    <span>{layer.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-full border border-slate-600/60 bg-black/40 px-2 text-[10px] transition hover:border-sky-400/40"
                        onClick={() => onToggleLayer(layer.key)}
                      >
                        {visibleLayers[layer.key] ?? true ? "Hide" : "Show"}
                      </button>
                      {layer.locked ? <span className="text-[10px] text-slate-400">Locked</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </OverlayPanel>

            <OverlayPanel title="Quick actions">
              <div className="grid gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-300">
                {TOOL_GRID.slice(0, 4).map((tool) => (
                  <button
                    key={tool.key}
                    onClick={() => onQuickAction({ key: tool.key, label: tool.label })}
                    className={cn(
                      "rounded-2xl border border-slate-700/60 bg-black/30 px-3 py-2 text-left transition",
                      activeQuickAction === tool.key && "border-sky-400 bg-sky-500/15 text-sky-100",
                    )}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </OverlayPanel>

            <OverlayPanel title="Presets">
              <div className="grid gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-300">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => onQuickAction(preset)}
                    className={cn(
                      "rounded-2xl border border-slate-700/60 bg-black/30 px-3 py-2 text-left transition",
                      activeQuickAction === preset.key && "border-sky-400 bg-sky-500/15 text-sky-100",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </OverlayPanel>
          </aside>
        </div>
      </div>
    </div>
  );
}

type OverlayPanelProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function OverlayPanel({ title, defaultOpen = false, children }: OverlayPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-black/30 p-3">
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
