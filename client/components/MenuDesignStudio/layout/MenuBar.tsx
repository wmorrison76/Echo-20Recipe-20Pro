import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { FileDialog } from "./FileDialog";
import type { DesignerState } from "../hooks";

interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportPDF: () => void;
  onExportSVG: () => void;
  onPrint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onFindReplace?: () => void;
  onVersionHistory?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onCreateComponent?: () => void;
  onShowGrid: (show: boolean) => void;
  onShowRulers: (show: boolean) => void;
  onShowGuides: (show: boolean) => void;
  onZoomFit: () => void;
  onZoom100: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: () => void;
  onAddDivider: () => void;
  onToggleSnapToGrid?: (enabled: boolean) => void;
  onToggleSnapToElements?: (enabled: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  snapToGridEnabled?: boolean;
  snapToElementsEnabled?: boolean;
}

export function MenuBar({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExportPDF,
  onExportSVG,
  onPrint,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  onFindReplace,
  onVersionHistory,
  onGroup,
  onUngroup,
  onCreateComponent,
  onShowGrid,
  onShowRulers,
  onShowGuides,
  onZoomFit,
  onZoom100,
  onAddText,
  onAddImage,
  onAddShape,
  onAddDivider,
  onToggleSnapToGrid,
  onToggleSnapToElements,
  canUndo,
  canRedo,
  showGrid,
  showRulers,
  showGuides,
  snapToGridEnabled = true,
  snapToElementsEnabled = true,
}: MenuBarProps) {
  return (
    <div className="flex items-center gap-0 border-r border-gray-200 dark:border-gray-800">
      {/* File Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-none px-3 h-full text-sm font-medium"
          >
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Document</DropdownMenuLabel>
          <DropdownMenuItem onClick={onNew}>
            <span>New Design</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+N</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpen}>
            <span>Open</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+O</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Save & Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={onSave}>
            <span>Save</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+S</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSaveAs}>
            <span>Save As</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+Shift+S</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={onExportPDF}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportSVG}>
            Export as SVG
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onPrint}>
            <span>Print</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+P</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-none px-3 h-full text-sm font-medium"
          >
            Edit
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
          <DropdownMenuItem onClick={onCut}>
            <span>Cut</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+X</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopy}>
            <span>Copy</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+C</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPaste}>
            <span>Paste</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+V</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSelectAll}>
            <span>Select All</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+A</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <span>Delete</span>
            <span className="ml-auto text-xs text-gray-500">Delete</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Grouping & Components</DropdownMenuLabel>
          <DropdownMenuItem onClick={onGroup || (() => {})}>
            <span>Group</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+G</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUngroup || (() => {})}>
            <span>Ungroup</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+Shift+G</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCreateComponent || (() => {})}>
            <span>Create Component</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+K</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onFindReplace || (() => {})}>
            <span>Find & Replace</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+H</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onVersionHistory || (() => {})}>
            <span>Version History</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+Shift+H</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-none px-3 h-full text-sm font-medium"
          >
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Zoom</DropdownMenuLabel>
          <DropdownMenuItem onClick={onZoomFit}>
            <span>Fit to Screen</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+1</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onZoom100}>
            <span>100%</span>
            <span className="ml-auto text-xs text-gray-500">Cmd+0</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Display</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onShowRulers(!showRulers)}
            className="flex items-center justify-between"
          >
            <span>Show Rulers</span>
            {showRulers && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onShowGrid(!showGrid)}
            className="flex items-center justify-between"
          >
            <span>Show Grid</span>
            {showGrid && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onShowGuides(!showGuides)}
            className="flex items-center justify-between"
          >
            <span>Show Guides</span>
            {showGuides && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Snapping</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onToggleSnapToGrid?.(!snapToGridEnabled)}
            className="flex items-center justify-between"
          >
            <span>Snap to Grid</span>
            {snapToGridEnabled && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onToggleSnapToElements?.(!snapToElementsEnabled)}
            className="flex items-center justify-between"
          >
            <span>Snap to Elements</span>
            {snapToElementsEnabled && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Insert Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-none px-3 h-full text-sm font-medium"
          >
            Insert
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Objects</DropdownMenuLabel>
          <DropdownMenuItem onClick={onAddText}>
            Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddImage}>
            Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddShape}>
            Shape
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddDivider}>
            Divider
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Format Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-none px-3 h-full text-sm font-medium"
          >
            Format
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Style</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            Fill Color (Open Inspector)
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            Stroke (Open Inspector)
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            Effects (Open Inspector)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Text</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            Font (Open Inspector)
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            Size (Open Inspector)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Help Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-none px-3 h-full text-sm font-medium"
          >
            Help
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem disabled>
            Documentation
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <KeyboardShortcutsDialog>
              <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm">
                Keyboard Shortcuts
              </button>
            </KeyboardShortcutsDialog>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            Send Feedback
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
