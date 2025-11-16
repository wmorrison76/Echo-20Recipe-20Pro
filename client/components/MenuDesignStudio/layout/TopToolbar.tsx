import { useState } from "react";
import {
  ChevronDown,
  Save,
  Undo2,
  Redo2,
  Plus,
  Download,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TopToolbarProps {
  documentName: string;
  onDocumentNameChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddElement: (type: string) => void;
  onExportPDF: () => void;
  onExportSVG: () => void;
  onSave: () => void;
  onOpenSettings: () => void;
  isDirty: boolean;
  className?: string;
}

export function TopToolbar({
  documentName,
  onDocumentNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddElement,
  onExportPDF,
  onExportSVG,
  onSave,
  onOpenSettings,
  isDirty,
  className,
}: TopToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(documentName);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNameBlur = () => {
    if (editingName.trim()) {
      onDocumentNameChange(editingName.trim());
    } else {
      setEditingName(documentName);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameBlur();
    } else if (e.key === "Escape") {
      setEditingName(documentName);
      setIsEditingName(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {/* Left Section - Document Name & Basic Controls */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            Menu Studio
          </div>
        </div>

        {/* Document Name Editor */}
        {isEditingName ? (
          <Input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="h-8 w-48 text-sm font-medium"
            placeholder="Untitled Menu"
          />
        ) : (
          <button
            onClick={() => {
              setEditingName(documentName);
              setIsEditingName(true);
            }}
            className={cn(
              "text-sm font-medium truncate px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              isDirty && "text-gray-700 dark:text-gray-300",
              !isDirty && "text-gray-600 dark:text-gray-400"
            )}
            title="Click to edit document name"
          >
            {documentName}
            {isDirty && <span className="ml-1 text-cyan-500">•</span>}
          </button>
        )}
      </div>

      {/* Center Section - Edit Controls (Hidden on Mobile) */}
      <div className="hidden md:flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
          className="h-9 w-9 p-0"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
          className="h-9 w-9 p-0"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Add Element Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1"
              title="Add element"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Add</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Text</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAddElement("heading")}>
              Heading
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddElement("subheading")}>
              Subheading
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddElement("body")}>
              Body Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddElement("menu-item")}>
              Menu Item
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Objects</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAddElement("image")}>
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddElement("shape")}>
              Shape
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddElement("divider")}>
              Divider
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Section - Export & Actions */}
      <div className="flex items-center gap-2">
        {/* Desktop Export Menu */}
        <div className="hidden sm:flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            title="Save (Cmd+S)"
            className="h-9 w-9 p-0"
          >
            <Save className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1"
                title="Export menu"
              >
                <Download className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportPDF}>
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportSVG}>
                <span>Export as SVG</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            title="Settings"
            className="h-9 w-9 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden h-9 w-9 p-0"
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 right-0 left-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sm:hidden">
          <div className="flex flex-col gap-1 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onUndo();
                setMobileMenuOpen(false);
              }}
              disabled={!canUndo}
              className="justify-start gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onRedo();
                setMobileMenuOpen(false);
              }}
              disabled={!canRedo}
              className="justify-start gap-2"
            >
              <Redo2 className="h-4 w-4" />
              Redo
            </Button>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSave();
                setMobileMenuOpen(false);
              }}
              className="justify-start gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onExportPDF();
                setMobileMenuOpen(false);
              }}
              className="justify-start gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
