import React, { useCallback, useMemo } from "react";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  File,
  Edit,
  Eye,
  Plus,
  Type,
  Palette,
  Download,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface TopToolbarProps {
  documentName: string;
  onDocumentNameChange: (name: string) => void;
  pagePreset: string;
  onPagePresetChange: (preset: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  gridEnabled: boolean;
  onGridToggle: () => void;
  snapEnabled: boolean;
  onSnapToggle: () => void;
  onShowGuides?: () => void;
  onFileNew?: () => void;
  onFileOpen?: () => void;
  onFileSave?: () => void;
  onFileExport?: (format: "pdf" | "svg" | "json" | "png") => void;
  onInsertText?: (type: "heading" | "subheading" | "body") => void;
  onInsertImage?: () => void;
  onInsertShape?: (shape: "rectangle" | "ellipse") => void;
  onHelp?: () => void;
  onBack?: () => void;
}

const PAGE_PRESETS = [
  { id: "letter", label: "US Letter (8.5\" × 11\")" },
  { id: "legal", label: "Legal (8.5\" × 14\")" },
  { id: "tabloid", label: "Tabloid (11\" × 17\")" },
  { id: "a4", label: "A4 (210 × 297mm)" },
  { id: "a3", label: "A3 (297 × 420mm)" },
  { id: "half-letter", label: "Half Letter (5.5\" × 8.5\")" },
  { id: "table-tent", label: "Table Tent (3.5\" × 5.5\")" },
];

export const TopToolbar = React.memo(({
  documentName,
  onDocumentNameChange,
  pagePreset,
  onPagePresetChange,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridEnabled,
  onGridToggle,
  snapEnabled,
  onSnapToggle,
  onShowGuides,
  onFileNew,
  onFileOpen,
  onFileSave,
  onFileExport,
  onInsertText,
  onInsertImage,
  onInsertShape,
  onHelp,
  onBack,
}: TopToolbarProps) => {
  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(4, zoom + 0.1));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(0.25, zoom - 0.1));
  }, [zoom, onZoomChange]);

  const handleZoomFit = useCallback(() => {
    onZoomChange(1);
  }, [onZoomChange]);

  const zoomPercent = useMemo(() => Math.round(zoom * 100), [zoom]);

  return (
    <div className="flex flex-col bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-elevation-1">
      {/* Top Bar: Back + Title + Main Menus */}
      <div className="flex h-16 items-center gap-md px-lg border-b border-gray-100 dark:border-gray-900">
        {/* Back Button */}
        {onBack && (
          <>
            <button
              onClick={onBack}
              className="flex items-center gap-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors rounded-sm hover:bg-gray-100 dark:hover:bg-gray-900 p-xs"
              aria-label="Return to menu design studio"
              title="Return (no shortcut)"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden md:inline">Return</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
          </>
        )}

        {/* Document Name (Editable) */}
        <Input
          type="text"
          value={documentName}
          onChange={(e) => onDocumentNameChange(e.target.value)}
          placeholder="Untitled Design"
          className="flex-1 h-10 text-sm font-semibold bg-transparent border-0 focus:ring-1 focus:ring-cyan-600 dark:focus:ring-cyan-400"
          maxLength={100}
        />

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />

        {/* Main Menus */}
        <div className="flex items-center gap-xs">
          {/* FILE Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-md font-medium text-sm"
              >
                <File className="w-4 h-4 mr-xs" />
                FILE
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onFileNew}>
                <span>New Design</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFileOpen}>
                <span>Open</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFileSave}>
                <span>Save</span>
                <span className="ml-auto text-xs text-gray-500">Cmd+S</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onFileExport?.("pdf")}>
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFileExport?.("svg")}>
                <span>Export as SVG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFileExport?.("json")}>
                <span>Export as JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFileExport?.("png")}>
                <span>Export as PNG</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* EDIT Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-md font-medium text-sm"
              >
                <Edit className="w-4 h-4 mr-xs" />
                EDIT
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onUndo} disabled={!canUndo}>
                <span>Undo</span>
                <span className="ml-auto text-xs text-gray-500">Cmd+Z</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRedo} disabled={!canRedo}>
                <span>Redo</span>
                <span className="ml-auto text-xs text-gray-500">Cmd+Shift+Z</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Duplicate</span>
                <span className="ml-auto text-xs text-gray-500">Cmd+D</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Delete</span>
                <span className="ml-auto text-xs text-gray-500">Delete</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Select All</span>
                <span className="ml-auto text-xs text-gray-500">Cmd+A</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Deselect</span>
                <span className="ml-auto text-xs text-gray-500">Esc</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* VIEW Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-md font-medium text-sm"
              >
                <Eye className="w-4 h-4 mr-xs" />
                VIEW
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem
                checked={gridEnabled}
                onCheckedChange={onGridToggle}
              >
                <span>Show Grid</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={snapEnabled}
                onCheckedChange={onSnapToggle}
              >
                <span>Snap to Grid</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem onClick={onShowGuides}>
                <span>Show Guides</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleZoomIn}>
                <span>Zoom In</span>
                <span className="ml-auto text-xs text-gray-500">Cmd++</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleZoomOut}>
                <span>Zoom Out</span>
                <span className="ml-auto text-xs text-gray-500">Cmd+-</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleZoomFit}>
                <span>Zoom to Fit</span>
                <span className="ml-auto text-xs text-gray-500">Cmd+0</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* INSERT Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-md font-medium text-sm"
              >
                <Plus className="w-4 h-4 mr-xs" />
                INSERT
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Text</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onInsertText?.("heading")}>
                <Type className="w-4 h-4 mr-md" />
                <span>Heading</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertText?.("subheading")}>
                <Type className="w-4 h-4 mr-md" />
                <span>Subheading</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertText?.("body")}>
                <Type className="w-4 h-4 mr-md" />
                <span>Body Text</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Media</DropdownMenuLabel>
              <DropdownMenuItem onClick={onInsertImage}>
                <span>Image</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Shapes</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onInsertShape?.("rectangle")}>
                <span>Rectangle</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertShape?.("ellipse")}>
                <span>Circle</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* FORMAT Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-md font-medium text-sm"
              >
                <Palette className="w-4 h-4 mr-xs" />
                FORMAT
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Alignment</DropdownMenuLabel>
              <DropdownMenuItem>
                <span>Align Left</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Align Center</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Align Right</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Colors & Styles</DropdownMenuLabel>
              <DropdownMenuItem>
                <span>Text Properties</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Fill & Stroke</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* EXPORT Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-md font-medium text-sm"
              >
                <Download className="w-4 h-4 mr-xs" />
                EXPORT
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onFileExport?.("pdf")}>
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFileExport?.("svg")}>
                <span>Export as SVG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFileExport?.("png")}>
                <span>Export as PNG</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Undo/Redo Buttons */}
        <div className="flex items-center gap-xs ml-lg rounded-md border border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-10 w-10 p-0"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-10 w-10 p-0"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Help */}
        {onHelp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelp}
            className="h-10 w-10 p-0 ml-lg"
            title="Help (Cmd+?)"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Controls Bar */}
      <div className="flex h-14 items-center gap-md px-lg bg-gray-50 dark:bg-gray-900/50">
        {/* Page Preset */}
        <Select value={pagePreset} onValueChange={onPagePresetChange}>
          <SelectTrigger className="w-56 h-9">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-sm rounded-md border border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-9 w-9 p-0"
            title="Zoom Out (Cmd+-)"
          >
            −
          </Button>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-12 text-center">
            {zoomPercent}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-9 w-9 p-0"
            title="Zoom In (Cmd++)"
          >
            +
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Info Text */}
        <div className="text-xs text-gray-500 dark:text-gray-500">
          💡 Tip: Use View menu for more options
        </div>
      </div>
    </div>
  );
});

TopToolbar.displayName = "TopToolbar";
