import React, { useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import { DesignerElement } from "../hooks/useDesignerState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InspectorPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedElement: DesignerElement | null;
  onUpdateElement: (id: string, changes: Partial<DesignerElement>) => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
}

export const InspectorPanel = React.memo(({
  isOpen,
  onToggle,
  selectedElement,
  onUpdateElement,
  onDeleteSelected,
  onDuplicateSelected,
}: InspectorPanelProps) => {
  const handlePositionChange = (key: "x" | "y", value: number) => {
    if (!selectedElement) return;
    onUpdateElement(selectedElement.id, { [key]: value });
  };

  const handleSizeChange = (key: "width" | "height", value: number) => {
    if (!selectedElement) return;
    onUpdateElement(selectedElement.id, { [key]: Math.max(10, value) });
  };

  const handleColorChange = (color: string) => {
    if (!selectedElement) return;
    onUpdateElement(selectedElement.id, { color });
  };

  const handleFillChange = (fill: string) => {
    if (!selectedElement) return;
    onUpdateElement(selectedElement.id, { fill });
  };

  const handleFontChange = (key: string, value: any) => {
    if (!selectedElement) return;
    onUpdateElement(selectedElement.id, { [key]: value });
  };

  const isBrowserOpen = useMemo(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
    []
  );

  return (
    <div
      className={`
        fixed top-32 right-0 w-80 h-[calc(100vh-132px)]
        bg-white dark:bg-gray-900
        border-l border-gray-200 dark:border-gray-800
        shadow-elevation-3 rounded-l-lg
        overflow-y-auto
        transition-all duration-200 ease-out
        ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}
        z-40
      `}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-lg py-md flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Inspector</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      {selectedElement ? (
        <Tabs defaultValue="properties" className="w-full h-full">
          <TabsList className="w-full rounded-none border-b border-gray-200 dark:border-gray-800">
            <TabsTrigger value="properties" className="flex-1">
              Properties
            </TabsTrigger>
            {["heading", "subheading", "body", "menu-item"].includes(selectedElement.type) && (
              <TabsTrigger value="text" className="flex-1">
                Text
              </TabsTrigger>
            )}
            {selectedElement.type === "image" && (
              <TabsTrigger value="image" className="flex-1">
                Image
              </TabsTrigger>
            )}
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="p-lg space-y-lg">
            {/* Element Name */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Name
              </Label>
              <Input
                value={selectedElement.name}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { name: e.target.value })
                }
                placeholder="Element name"
                className="mt-xs"
              />
            </div>

            {/* Position & Size */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-lg">
              <h4 className="text-xs uppercase tracking-wider font-semibold mb-md">
                Position & Size
              </h4>
              <div className="space-y-md">
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) =>
                        handlePositionChange("x", parseFloat(e.target.value))
                      }
                      className="mt-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) =>
                        handlePositionChange("y", parseFloat(e.target.value))
                      }
                      className="mt-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) =>
                        handleSizeChange("width", parseFloat(e.target.value))
                      }
                      className="mt-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) =>
                        handleSizeChange("height", parseFloat(e.target.value))
                      }
                      className="mt-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Rotation</Label>
                  <div className="flex items-center gap-md mt-xs">
                    <Slider
                      value={[selectedElement.rotation]}
                      onValueChange={(val) =>
                        onUpdateElement(selectedElement.id, { rotation: val[0] })
                      }
                      min={0}
                      max={360}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {selectedElement.rotation}°
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Opacity</Label>
                  <div className="flex items-center gap-md mt-xs">
                    <Slider
                      value={[selectedElement.opacity]}
                      onValueChange={(val) =>
                        onUpdateElement(selectedElement.id, { opacity: val[0] })
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {selectedElement.opacity}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors & Style */}
            {selectedElement.type !== "image" && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-lg">
                <h4 className="text-xs uppercase tracking-wider font-semibold mb-md">
                  Colors & Style
                </h4>
                <div className="space-y-md">
                  {["heading", "subheading", "body", "menu-item", "divider"].includes(
                    selectedElement.type
                  ) && (
                    <div>
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex items-center gap-md mt-xs">
                        <input
                          type="color"
                          value={selectedElement.color || "#000000"}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="h-10 w-16 rounded border border-gray-300 dark:border-gray-700"
                        />
                        <Input
                          type="text"
                          value={selectedElement.color || "#000000"}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {["shape", "divider"].includes(selectedElement.type) && (
                    <>
                      <div>
                        <Label className="text-xs">Fill Color</Label>
                        <div className="flex items-center gap-md mt-xs">
                          <input
                            type="color"
                            value={selectedElement.fill || "#cccccc"}
                            onChange={(e) => handleFillChange(e.target.value)}
                            className="h-10 w-16 rounded border border-gray-300 dark:border-gray-700"
                          />
                          <Input
                            type="text"
                            value={selectedElement.fill || "#cccccc"}
                            onChange={(e) => handleFillChange(e.target.value)}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Border Color</Label>
                        <div className="flex items-center gap-md mt-xs">
                          <input
                            type="color"
                            value={selectedElement.borderColor || "#000000"}
                            onChange={(e) =>
                              onUpdateElement(selectedElement.id, {
                                borderColor: e.target.value,
                              })
                            }
                            className="h-10 w-16 rounded border border-gray-300 dark:border-gray-700"
                          />
                          <Input
                            type="number"
                            value={selectedElement.borderWidth || 0}
                            onChange={(e) =>
                              onUpdateElement(selectedElement.id, {
                                borderWidth: parseFloat(e.target.value),
                              })
                            }
                            className="flex-1 text-xs"
                            placeholder="Width"
                          />
                        </div>
                      </div>

                      {selectedElement.type === "shape" && (
                        <div>
                          <Label className="text-xs">Border Radius</Label>
                          <Input
                            type="number"
                            value={selectedElement.borderRadius || 0}
                            onChange={(e) =>
                              onUpdateElement(selectedElement.id, {
                                borderRadius: parseFloat(e.target.value),
                              })
                            }
                            className="mt-xs"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-lg">
              <div className="flex gap-md">
                {onDuplicateSelected && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDuplicateSelected}
                    className="flex-1"
                  >
                    Duplicate
                  </Button>
                )}
                {onDeleteSelected && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteSelected}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Text Tab */}
          {["heading", "subheading", "body", "menu-item"].includes(
            selectedElement.type
          ) && (
            <TabsContent value="text" className="p-lg space-y-lg">
              <div>
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={selectedElement.fontFamily || '"Inter", sans-serif'}
                  onValueChange={(val) => handleFontChange("fontFamily", val)}
                >
                  <SelectTrigger className="mt-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='"Inter", sans-serif'>Inter</SelectItem>
                    <SelectItem value='"Georgia", serif'>Georgia</SelectItem>
                    <SelectItem value='"Courier New", monospace'>
                      Courier New
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={selectedElement.fontSize || 14}
                    onChange={(e) =>
                      handleFontChange("fontSize", parseFloat(e.target.value))
                    }
                    className="mt-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Weight</Label>
                  <Select
                    value={String(selectedElement.fontWeight || 400)}
                    onValueChange={(val) =>
                      handleFontChange("fontWeight", parseInt(val))
                    }
                  >
                    <SelectTrigger className="mt-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semibold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <Label className="text-xs">Line Height</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={selectedElement.lineHeight || 1.4}
                    onChange={(e) =>
                      handleFontChange("lineHeight", parseFloat(e.target.value))
                    }
                    className="mt-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Letter Spacing</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={selectedElement.letterSpacing || 0}
                    onChange={(e) =>
                      handleFontChange("letterSpacing", parseFloat(e.target.value))
                    }
                    className="mt-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Alignment</Label>
                <Select
                  value={selectedElement.align || "left"}
                  onValueChange={(val) =>
                    handleFontChange("align", val as "left" | "center" | "right")
                  }
                >
                  <SelectTrigger className="mt-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          )}

          {/* Image Tab */}
          {selectedElement.type === "image" && (
            <TabsContent value="image" className="p-lg space-y-lg">
              <div>
                <Label className="text-xs">Object Fit</Label>
                <Select
                  value={selectedElement.objectFit || "cover"}
                  onValueChange={(val) =>
                    handleFontChange("objectFit", val as "cover" | "contain")
                  }
                >
                  <SelectTrigger className="mt-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                Replace Image
              </Button>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="flex items-center justify-center h-full text-center p-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select an element to inspect
          </p>
        </div>
      )}
    </div>
  );
});

InspectorPanel.displayName = "InspectorPanel";
