import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { DesignerElement, CanvasSettings, PageSize } from "../hooks";
import { CanvasElement } from "./CanvasElement";

interface DesignerCanvasProps {
  elements: DesignerElement[];
  selectedElementId: string | null;
  pageSize: PageSize;
  canvasSettings: CanvasSettings;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignerElement>) => void;
  onStartDrag: (element: DesignerElement, clientX: number, clientY: number) => void;
  onUpdateDrag: (clientX: number, clientY: number) => { x: number; y: number };
  onEndDrag: () => void;
  onStartResize: (element: DesignerElement, handle: string, clientX: number, clientY: number) => void;
  onUpdateResize: (clientX: number, clientY: number, startClientX: number, startClientY: number) => any;
  onEndResize: () => void;
  onStartEditingText: (id: string) => void;
  onEndEditingText: () => void;
  dragState: any;
  resizeState: any;
  editingId: string | null;
}

export function DesignerCanvas({
  elements,
  selectedElementId,
  pageSize,
  canvasSettings,
  onSelectElement,
  onUpdateElement,
  onStartDrag,
  onUpdateDrag,
  onEndDrag,
  onStartResize,
  onUpdateResize,
  onEndResize,
  onStartEditingText,
  onEndEditingText,
  dragState,
  resizeState,
  editingId,
}: DesignerCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Handle canvas drag
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) {
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
      const { x, y } = onUpdateDrag(e.clientX, e.clientY);
      const element = elements.find((el) => el.id === dragState.id);
      if (element) {
        onUpdateElement(dragState.id, { x, y });
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      onEndDrag();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, elements, onUpdateDrag, onUpdateElement, onEndDrag]);

  const scale = canvasSettings.zoom;
  const paddingX = 40;
  const paddingY = 40;

  return (
    <div
      ref={canvasRef}
      className="relative flex h-full w-full items-center justify-center overflow-auto bg-gray-200 p-8 dark:bg-gray-900"
      onClick={() => onSelectElement(null)}
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        overflow: "auto",
      }}
    >
      {/* Canvas Container */}
      <div
        className="relative bg-white shadow-xl flex-shrink-0"
        style={{
          width: pageSize.width,
          height: pageSize.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          overflow: "hidden",
          zIndex: 1,
          position: "relative",
          minWidth: pageSize.width,
          minHeight: pageSize.height,
        }}
      >
        {/* Grid Background (optional) */}
        {canvasSettings.showGrid && (
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent calc(${canvasSettings.gridSize}px - 1px), #888 calc(${canvasSettings.gridSize}px - 1px)),
                linear-gradient(90deg, transparent calc(${canvasSettings.gridSize}px - 1px), #888 calc(${canvasSettings.gridSize}px - 1px))
              `,
              backgroundSize: `${canvasSettings.gridSize}px ${canvasSettings.gridSize}px`,
            }}
          />
        )}

        {/* Margins Display */}
        {canvasSettings.showMargins && (
          <div
            className="absolute border border-dashed border-blue-300 pointer-events-none"
            style={{
              top: canvasSettings.margin,
              left: canvasSettings.margin,
              right: canvasSettings.margin,
              bottom: canvasSettings.margin,
            }}
          />
        )}

        {/* Bleed Display */}
        {canvasSettings.showBleed && (
          <div
            className="absolute border border-dashed border-red-300 pointer-events-none"
            style={{
              top: -canvasSettings.bleed,
              left: -canvasSettings.bleed,
              right: -canvasSettings.bleed,
              bottom: -canvasSettings.bleed,
            }}
          />
        )}

        {/* Canvas Content */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            backgroundColor: canvasSettings.background,
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Render Elements */}
          {elements.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
              isEditing={editingId === element.id}
              isDragging={dragState?.id === element.id}
              isResizing={resizeState?.id === element.id}
              onSelect={() => onSelectElement(element.id)}
              onUpdateElement={(updates) => onUpdateElement(element.id, updates)}
              onStartDrag={(clientX, clientY) => onStartDrag(element, clientX, clientY)}
              onStartResize={(handle, clientX, clientY) =>
                onStartResize(element, handle, clientX, clientY)
              }
              onStartEditingText={() => onStartEditingText(element.id)}
              onEndEditingText={onEndEditingText}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
