import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useDesignerState,
  useCanvasOperations,
  useHistory,
  useKeyboardShortcuts,
  createKeyboardShortcuts,
  useAutoSave,
  type DesignerElement,
} from "./hooks";
import { TopToolbar } from "./layout/TopToolbar";
import { DesignerCanvas } from "./canvas/DesignerCanvas";
import { LayersPanel } from "./panels/LayersPanel";
import { InspectorPanel } from "./panels/InspectorPanel";
import { StatusBar } from "./layout/StatusBar";
import { AI3SuggestionsPanel } from "./panels/AI3SuggestionsPanel";
import { CompletedDishesGallery } from "./panels/CompletedDishesGallery";
import { DishAssemblyBridge, type DishData, type AI3Suggestion } from "./integration/DishAssemblyBridge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MenuDesignStudioProps {
  initialState?: any;
  onSave?: (state: any) => void;
  onExport?: (format: "pdf" | "svg", data: any) => void;
  onBack?: () => void;
}

export function MenuDesignStudio({
  initialState,
  onSave,
  onExport,
  onBack,
}: MenuDesignStudioProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"inspector" | "ai" | "dishes">("inspector");

  const {
    state,
    addElement,
    removeElement,
    updateElement,
    selectElement,
    getSelectedElement,
    selectMultiple,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    clearSelection,
    updateMultiple,
    deleteMultiple,
    getSelectedElements,
    updateCanvasSettings,
    setDocumentName,
    setPageSize,
    setDirty,
    setElements,
    copyElements,
    cutElements,
    pasteElements,
  } = useDesignerState(initialState);

  const {
    dragState,
    resizeState,
    editingId,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize,
    startEditingText,
    endEditingText,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
    matchWidth,
    matchHeight,
  } = useCanvasOperations();

  const { push: historyPush, undo, redo, canUndo, canRedo } = useHistory();
  const { save: saveDesign } = useAutoSave(state);

  // Alignment handlers
  const handleAlignLeft = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = alignLeft(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, alignLeft, updateElement, historyPush]);

  const handleAlignCenter = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = alignCenter(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, alignCenter, updateElement, historyPush]);

  const handleAlignRight = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = alignRight(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, alignRight, updateElement, historyPush]);

  const handleAlignTop = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = alignTop(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, alignTop, updateElement, historyPush]);

  const handleAlignMiddle = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = alignMiddle(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, alignMiddle, updateElement, historyPush]);

  const handleAlignBottom = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = alignBottom(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, alignBottom, updateElement, historyPush]);

  const handleDistributeHorizontally = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 2) {
      const updates = distributeHorizontally(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
      toast({
        title: "Distributed",
        description: "Elements distributed horizontally",
      });
    }
  }, [state, getSelectedElements, distributeHorizontally, updateElement, historyPush, toast]);

  const handleDistributeVertically = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 2) {
      const updates = distributeVertically(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
      toast({
        title: "Distributed",
        description: "Elements distributed vertically",
      });
    }
  }, [state, getSelectedElements, distributeVertically, updateElement, historyPush, toast]);

  const handleMatchWidth = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = matchWidth(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, matchWidth, updateElement, historyPush]);

  const handleMatchHeight = useCallback(() => {
    const selected = getSelectedElements();
    if (selected.length > 1) {
      const updates = matchHeight(selected);
      Object.entries(updates).forEach(([id, update]) => {
        updateElement(id, update);
      });
      historyPush(state);
    }
  }, [state, getSelectedElements, matchHeight, updateElement, historyPush]);

  // Setup keyboard shortcuts
  const shortcuts = useMemo(
    () =>
      createKeyboardShortcuts([
        {
          label: "Undo",
          key: "z",
          modifiers: ["meta"],
          callback: () => {
            const previousState = undo();
            if (previousState) {
              setDirty(true);
              toast({
                title: "Undo",
                description: "Action undone",
              });
            }
          },
        },
        {
          label: "Redo",
          key: "z",
          modifiers: ["meta", "shift"],
          callback: () => {
            const nextState = redo();
            if (nextState) {
              setDirty(true);
              toast({
                title: "Redo",
                description: "Action redone",
              });
            }
          },
        },
        {
          label: "Delete",
          key: "Delete",
          modifiers: [],
          callback: () => {
            if (state.selectedElementIds.length > 0) {
              if (state.selectedElementIds.length > 1) {
                deleteMultiple(state.selectedElementIds);
              } else {
                const selected = getSelectedElement();
                if (selected) {
                  removeElement(selected.id);
                }
              }
              historyPush(state);
            }
          },
        },
        {
          label: "Duplicate",
          key: "d",
          modifiers: ["meta"],
          callback: () => {
            const selected = getSelectedElement();
            if (selected) {
              const newElement: Omit<DesignerElement, "id"> = {
                ...selected,
                x: selected.x + 20,
                y: selected.y + 20,
                name: `${selected.name} (copy)`,
              };
              addElement(newElement);
              historyPush(state);
            }
          },
        },
        {
          label: "Save",
          key: "s",
          modifiers: ["meta"],
          callback: () => {
            handleSave();
          },
        },
        {
          label: "Select All",
          key: "a",
          modifiers: ["meta"],
          callback: () => {
            selectMultiple(state.elements.map((el) => el.id));
            toast({
              title: "Select All",
              description: `${state.elements.length} elements selected`,
            });
          },
        },
        {
          label: "Align Left",
          key: "l",
          modifiers: ["alt"],
          callback: handleAlignLeft,
        },
        {
          label: "Align Center",
          key: "c",
          modifiers: ["alt"],
          callback: handleAlignCenter,
        },
        {
          label: "Align Right",
          key: "r",
          modifiers: ["alt"],
          callback: handleAlignRight,
        },
        {
          label: "Align Top",
          key: "t",
          modifiers: ["alt"],
          callback: handleAlignTop,
        },
        {
          label: "Align Middle",
          key: "m",
          modifiers: ["alt"],
          callback: handleAlignMiddle,
        },
        {
          label: "Align Bottom",
          key: "b",
          modifiers: ["alt"],
          callback: handleAlignBottom,
        },
        {
          label: "Distribute Horizontally",
          key: "h",
          modifiers: ["alt", "shift"],
          callback: handleDistributeHorizontally,
        },
        {
          label: "Distribute Vertically",
          key: "v",
          modifiers: ["alt", "shift"],
          callback: handleDistributeVertically,
        },
      ]),
    [
      undo,
      redo,
      getSelectedElement,
      removeElement,
      addElement,
      state,
      historyPush,
      toast,
      selectMultiple,
      deleteMultiple,
      handleAlignLeft,
      handleAlignCenter,
      handleAlignRight,
      handleAlignTop,
      handleAlignMiddle,
      handleAlignBottom,
      handleDistributeHorizontally,
      handleDistributeVertically,
    ]
  );

  useKeyboardShortcuts(shortcuts);

  // Track state changes in history
  useEffect(() => {
    historyPush(state);
  }, [state.elements.length]);

  const handleSave = useCallback(() => {
    const designId = `design-${Date.now()}`;
    const saved = saveDesign(designId, state.documentName);
    if (saved) {
      setDirty(false);
      toast({
        title: "Design Saved",
        description: `"${state.documentName}" has been saved`,
      });
      onSave?.(state);
    } else {
      toast({
        title: "Save Failed",
        description: "Could not save design",
        variant: "destructive",
      });
    }
  }, [state, saveDesign, setDirty, toast, onSave]);

  const handleExportPDF = useCallback(() => {
    try {
      onExport?.("pdf", state);
      toast({
        title: "Exporting",
        description: "Your menu is being exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export as PDF",
        variant: "destructive",
      });
    }
  }, [state, onExport, toast]);

  const handleExportSVG = useCallback(() => {
    try {
      onExport?.("svg", state);
      toast({
        title: "Exporting",
        description: "Your menu is being exported as SVG",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export as SVG",
        variant: "destructive",
      });
    }
  }, [state, onExport, toast]);

  const handleAddElement = useCallback(
    (type: string) => {
      const baseElement = {
        type: type as DesignerElement["type"],
        name: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        opacity: 1,
        zIndex: state.elements.length,
      };

      let element: any = baseElement;
      if (type === "text" || type === "heading" || type === "subheading" || type === "body") {
        element = {
          ...baseElement,
          text: "Sample text",
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          color: "#000000",
          align: "left" as const,
        };
      } else if (type === "menu-item") {
        element = {
          ...baseElement,
          text: "Menu Item Name",
          description: "Item description",
          price: 12.99,
          currency: "USD",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: "#000000",
        };
      } else if (type === "image") {
        element = {
          ...baseElement,
          imageUrl: "https://via.placeholder.com/200x200",
        };
      } else if (type === "shape") {
        element = {
          ...baseElement,
          shape: "rectangle" as const,
          fill: "#e0e7ff",
          borderColor: "#c7d2fe",
          borderWidth: 1,
        };
      }

      addElement(element);
      historyPush(state);
    },
    [state, addElement, historyPush]
  );

  const handleApplyTemplate = useCallback(
    (templateElements: Omit<DesignerElement, "id">[]) => {
      // Clear existing elements and add template elements
      setElements(templateElements as DesignerElement[]);
      historyPush(state);
      toast({
        title: "Template Applied",
        description: "Template elements have been added to your canvas",
      });
    },
    [setElements, state, historyPush, toast]
  );

  // AI³ Integration Handlers
  const handleApplySuggestion = useCallback(
    (suggestion: AI3Suggestion) => {
      if (suggestion.type === "color") {
        // Apply color palette
        if (suggestion.details?.colors) {
          updateCanvasSettings({ background: suggestion.details.colors[4] || "#ffffff" });
          toast({
            title: "Palette Applied",
            description: `${suggestion.title} color scheme applied`,
          });
        }
      } else if (suggestion.type === "layout") {
        toast({
          title: "Layout Suggestion",
          description: suggestion.title,
        });
      } else if (suggestion.type === "typography") {
        toast({
          title: "Typography Applied",
          description: suggestion.title,
        });
      } else if (suggestion.type === "content" || suggestion.type === "composition") {
        toast({
          title: "Analysis Complete",
          description: suggestion.title,
        });
      }
      historyPush(state);
    },
    [updateCanvasSettings, historyPush, state, toast]
  );

  const handleGenerateLayoutsFromDishes = useCallback(
    (style: string) => {
      // This would connect to Dish Assembly data
      toast({
        title: "Generate from Dishes",
        description: "Select dishes from the gallery to create a menu design",
      });
      setRightPanelTab("dishes");
    },
    [toast]
  );

  const handleGenerateMenuDesign = useCallback(
    (dishes: DishData | DishData[]) => {
      const dishArray = Array.isArray(dishes) ? dishes : [dishes];
      const elements = DishAssemblyBridge.generateMenuFromDishes(dishArray, "featured");

      // Add generated elements to canvas
      elements.forEach((element) => {
        addElement(element);
      });

      historyPush(state);
      toast({
        title: "Menu Generated",
        description: `${dishArray.length} dish${dishArray.length !== 1 ? "es" : ""} added to canvas`,
      });
      setRightPanelTab("inspector");
    },
    [addElement, historyPush, state, toast]
  );

  const handleSelectDish = useCallback(
    (dish: DishData) => {
      toast({
        title: "Dish Selected",
        description: `Ready to design with "${dish.name}"`,
      });
    },
    [toast]
  );

  const selectedElement = getSelectedElement();

  return (
    <div ref={containerRef} className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden" style={{ position: "relative", zIndex: 0 }}>
      {/* Top Toolbar with Menu Bar and Page Selector */}
      <TopToolbar
        documentName={state.documentName}
        onDocumentNameChange={setDocumentName}
        pageSize={state.pageSize}
        onPageSizeChange={setPageSize}
        backgroundColor={state.canvasSettings.background}
        onBackgroundColorChange={(color) => {
          updateCanvasSettings({ background: color });
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAddElement={handleAddElement}
        onExportPDF={handleExportPDF}
        onExportSVG={handleExportSVG}
        onSave={handleSave}
        onOpenSettings={() => {
          toast({
            title: "Settings",
            description: "Settings panel coming soon",
          });
        }}
        isDirty={state.isDirty}
        onBack={onBack}
      />

      {/* Main Content Area - Fixed sizing */}
      <div className="flex flex-1 overflow-hidden min-h-0" style={{ position: "relative", zIndex: 1 }}>
        {/* Left Sidebar - Layers Panel */}
        <div className="hidden w-56 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex lg:flex-col overflow-y-auto shadow-lg">
          <LayersPanel
            elements={state.elements}
            selectedElementId={state.selectedElementId}
            onSelectElement={selectElement}
            onRemoveElement={removeElement}
            onUpdateElement={updateElement}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 min-w-0">
          <DesignerCanvas
            elements={state.elements}
            selectedElementId={state.selectedElementId}
            selectedElementIds={state.selectedElementIds}
            pageSize={state.pageSize}
            canvasSettings={state.canvasSettings}
            onSelectElement={selectElement}
            onSelectMultiple={selectMultiple}
            onAddToSelection={addToSelection}
            onToggleSelection={toggleSelection}
            onClearSelection={clearSelection}
            onUpdateElement={updateElement}
            onUpdateMultiple={updateMultiple}
            onStartDrag={startDrag}
            onUpdateDrag={updateDrag}
            onEndDrag={endDrag}
            onStartResize={startResize}
            onUpdateResize={updateResize}
            onEndResize={endResize}
            onStartEditingText={startEditingText}
            onEndEditingText={endEditingText}
            onAlignLeft={handleAlignLeft}
            onAlignCenter={handleAlignCenter}
            onAlignRight={handleAlignRight}
            onAlignTop={handleAlignTop}
            onAlignMiddle={handleAlignMiddle}
            onAlignBottom={handleAlignBottom}
            onDistributeHorizontally={handleDistributeHorizontally}
            onDistributeVertically={handleDistributeVertically}
            onMatchWidth={handleMatchWidth}
            onMatchHeight={handleMatchHeight}
            dragState={dragState}
            resizeState={resizeState}
            editingId={editingId}
          />
        </div>

        {/* Right Sidebar - Tabbed Panel with Inspector, AI³, and Dishes */}
        <div className="hidden w-80 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 xl:flex xl:flex-col overflow-hidden shadow-lg">
          <Tabs value={rightPanelTab} onValueChange={(val) => setRightPanelTab(val as any)} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <TabsTrigger value="inspector" className="text-xs">
                Inspector
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">
                AI³
              </TabsTrigger>
              <TabsTrigger value="dishes" className="text-xs">
                Dishes
              </TabsTrigger>
            </TabsList>

            {/* Inspector Tab */}
            <TabsContent value="inspector" className="flex-1 overflow-y-auto">
              {selectedElement && (
                <InspectorPanel
                  element={selectedElement}
                  pageSize={state.pageSize}
                  canvasSettings={state.canvasSettings}
                  onUpdateElement={(updates) => {
                    updateElement(selectedElement.id, updates);
                    historyPush(state);
                  }}
                  onUpdateCanvasSettings={(settings) => {
                    updateCanvasSettings(settings);
                    historyPush(state);
                  }}
                  onApplyTemplate={handleApplyTemplate}
                />
              )}
              {!selectedElement && (
                <InspectorPanel
                  element={{
                    id: "placeholder",
                    type: "heading",
                    name: "No Element Selected",
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 0,
                    text: "",
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: "'Inter', sans-serif",
                    color: "#000000",
                    align: "left",
                  }}
                  pageSize={state.pageSize}
                  canvasSettings={state.canvasSettings}
                  onUpdateElement={() => {}}
                  onUpdateCanvasSettings={() => {}}
                  onApplyTemplate={handleApplyTemplate}
                />
              )}
            </TabsContent>

            {/* AI³ Suggestions Tab */}
            <TabsContent value="ai" className="flex-1 overflow-hidden">
              <AI3SuggestionsPanel
                elements={state.elements}
                selectedElementId={state.selectedElementId}
                onApplySuggestion={handleApplySuggestion}
                onGenerateLayouts={handleGenerateLayoutsFromDishes}
                onEnhanceContent={(elementId) => {
                  toast({
                    title: "Content Enhancement",
                    description: "AI-generated content suggestions coming soon",
                  });
                }}
              />
            </TabsContent>

            {/* Completed Dishes Tab */}
            <TabsContent value="dishes" className="flex-1 overflow-hidden">
              <CompletedDishesGallery
                dishes={[]}
                onGenerateDesign={handleGenerateMenuDesign}
                onSelectDish={handleSelectDish}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        zoom={state.canvasSettings.zoom}
        selectedElementCount={state.selectedElementIds.length}
        totalElementCount={state.elements.length}
      />
    </div>
  );
}

export default MenuDesignStudio;
