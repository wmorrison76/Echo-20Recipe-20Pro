import { useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DesignerElement } from "../hooks";

interface LayersPanelProps {
  elements: DesignerElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onRemoveElement: (id: string) => void;
  onUpdateElement: (id: string, updates: Partial<DesignerElement>) => void;
}

export function LayersPanel({
  elements,
  selectedElementId,
  onSelectElement,
  onRemoveElement,
  onUpdateElement,
}: LayersPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleLayerNameChange = (id: string, newName: string) => {
    onUpdateElement(id, { name: newName });
    setEditingLayerId(null);
  };

  const handleToggleVisibility = (id: string, element: DesignerElement) => {
    onUpdateElement(id, { opacity: element.opacity === 0 ? 1 : 0 });
  };

  const handleToggleLock = (id: string, element: DesignerElement) => {
    onUpdateElement(id, { locked: !element.locked });
  };

  // Render layers in reverse order (top layer first)
  const sortedElements = [...elements].reverse();

  return (
    <div className="flex h-full flex-col border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Layers</h3>
      </div>

      {/* Layers List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-3">
          {sortedElements.length === 0 ? (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
              No layers yet
            </div>
          ) : (
            sortedElements.map((element) => (
              <div
                key={element.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                  selectedElementId === element.id &&
                    "bg-cyan-50 text-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100"
                )}
              >
                {/* Layer Icon */}
                <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                  {element.type === "image" && "🖼️"}
                  {element.type === "text" && "T"}
                  {element.type === "heading" && "H"}
                  {element.type === "shape" && "■"}
                  {element.type === "divider" && "—"}
                  {element.type === "menu-item" && "🍽️"}
                </div>

                {/* Layer Name */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelectElement(element.id)}
                  onDoubleClick={() => {
                    setEditingLayerId(element.id);
                    setEditingName(element.name);
                  }}
                >
                  {editingLayerId === element.id ? (
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleLayerNameChange(element.id, editingName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleLayerNameChange(element.id, editingName);
                        } else if (e.key === "Escape") {
                          setEditingLayerId(null);
                        }
                      }}
                      className="h-6 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-gray-700 dark:text-gray-300">
                      {element.name}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleToggleVisibility(element.id, element)}
                    title={element.opacity === 0 ? "Show" : "Hide"}
                  >
                    {element.opacity === 0 ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleToggleLock(element.id, element)}
                    title={element.locked ? "Unlock" : "Lock"}
                  >
                    {element.locked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => onRemoveElement(element.id)}
                    title="Delete layer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
