import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DesignerElement, CanvasSettings, PageSize } from "../hooks";

interface InspectorPanelProps {
  element: DesignerElement;
  pageSize: PageSize;
  canvasSettings: CanvasSettings;
  onUpdateElement: (updates: Partial<DesignerElement>) => void;
  onUpdateCanvasSettings: (settings: Partial<CanvasSettings>) => void;
}

export function InspectorPanel({
  element,
  pageSize,
  canvasSettings,
  onUpdateElement,
  onUpdateCanvasSettings,
}: InspectorPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["position", "appearance"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Inspector
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {element.name}
          </p>
        </div>

        {/* Sections */}
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {/* Position & Size */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => toggleSection("position")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              Position & Size
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections.has("position") && "rotate-180"
                )}
              />
            </button>
            {expandedSections.has("position") && (
              <div className="space-y-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/30">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      X
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(element.x)}
                      onChange={(e) =>
                        onUpdateElement({ x: parseFloat(e.target.value) })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Y
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(element.y)}
                      onChange={(e) =>
                        onUpdateElement({ y: parseFloat(e.target.value) })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Width
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(element.width)}
                      onChange={(e) =>
                        onUpdateElement({ width: parseFloat(e.target.value) })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Height
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(element.height)}
                      onChange={(e) =>
                        onUpdateElement({ height: parseFloat(e.target.value) })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Rotation
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(element.rotation)}
                      onChange={(e) =>
                        onUpdateElement({ rotation: parseFloat(e.target.value) })
                      }
                      className="h-8 text-sm"
                      min="0"
                      max="360"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Opacity
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(element.opacity * 100)}
                      onChange={(e) =>
                        onUpdateElement({
                          opacity: parseFloat(e.target.value) / 100,
                        })
                      }
                      className="h-8 text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => toggleSection("appearance")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              Appearance
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections.has("appearance") && "rotate-180"
                )}
              />
            </button>
            {expandedSections.has("appearance") && (
              <div className="space-y-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/30">
                {element.color && (
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Color
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={element.color}
                        onChange={(e) =>
                          onUpdateElement({ color: e.target.value })
                        }
                        className="h-8 w-8 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={element.color}
                        onChange={(e) =>
                          onUpdateElement({ color: e.target.value })
                        }
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                )}

                {element.fill && (
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Fill
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={element.fill}
                        onChange={(e) =>
                          onUpdateElement({ fill: e.target.value })
                        }
                        className="h-8 w-8 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={element.fill}
                        onChange={(e) =>
                          onUpdateElement({ fill: e.target.value })
                        }
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                )}

                {element.type === "shape" && element.borderRadius !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Border Radius
                    </Label>
                    <Input
                      type="number"
                      value={element.borderRadius}
                      onChange={(e) =>
                        onUpdateElement({
                          borderRadius: parseFloat(e.target.value),
                        })
                      }
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Typography */}
          {["heading", "subheading", "body", "menu-item"].includes(element.type) && (
            <div className="border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => toggleSection("typography")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                Typography
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSections.has("typography") && "rotate-180"
                  )}
                />
              </button>
              {expandedSections.has("typography") && (
                <div className="space-y-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/30">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Font Size
                    </Label>
                    <Input
                      type="number"
                      value={element.fontSize}
                      onChange={(e) =>
                        onUpdateElement({
                          fontSize: parseFloat(e.target.value),
                        })
                      }
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Font Weight
                    </Label>
                    <Input
                      type="number"
                      value={element.fontWeight}
                      onChange={(e) =>
                        onUpdateElement({
                          fontWeight: parseFloat(e.target.value),
                        })
                      }
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Line Height
                    </Label>
                    <Input
                      type="number"
                      value={element.lineHeight}
                      onChange={(e) =>
                        onUpdateElement({
                          lineHeight: parseFloat(e.target.value),
                        })
                      }
                      className="h-8 text-sm mt-1"
                      step="0.1"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
