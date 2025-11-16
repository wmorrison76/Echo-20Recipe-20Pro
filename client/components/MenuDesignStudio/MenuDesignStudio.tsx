import { useEffect, useCallback, useMemo, useRef } from "react";
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

  const {
    state,
    addElement,
    removeElement,
    updateElement,
    selectElement,
    getSelectedElement,
    updateCanvasSettings,
    setDocumentName,
    setPageSize,
    setDirty,
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
  } = useCanvasOperations();

  const { push: historyPush, undo, redo, canUndo, canRedo } = useHistory();
  const { save: saveDesign } = useAutoSave(state);

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
            const selected = getSelectedElement();
            if (selected) {
              removeElement(selected.id);
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
      ]),
    [undo, redo, getSelectedElement, removeElement, addElement, state, historyPush, toast]
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

  const selectedElement = getSelectedElement();

  return (
    <div ref={containerRef} className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Top Toolbar with Menu Bar and Page Selector */}
      <TopToolbar
        documentName={state.documentName}
        onDocumentNameChange={setDocumentName}
        pageSize={state.pageSize}
        onPageSizeChange={setPageSize}
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
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar - Layers Panel */}
        <div className="hidden w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex lg:flex-col overflow-y-auto">
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
            pageSize={state.pageSize}
            canvasSettings={state.canvasSettings}
            onSelectElement={selectElement}
            onUpdateElement={updateElement}
            onStartDrag={startDrag}
            onUpdateDrag={updateDrag}
            onEndDrag={endDrag}
            onStartResize={startResize}
            onUpdateResize={updateResize}
            onEndResize={endResize}
            onStartEditingText={startEditingText}
            onEndEditingText={endEditingText}
            dragState={dragState}
            resizeState={resizeState}
            editingId={editingId}
          />
        </div>

        {/* Right Sidebar - Inspector Panel */}
        <div className="hidden w-80 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 xl:flex xl:flex-col overflow-y-auto">
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
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        zoom={state.canvasSettings.zoom}
        selectedElementCount={selectedElement ? 1 : 0}
        totalElementCount={state.elements.length}
      />
    </div>
  );
}

export default MenuDesignStudio;
