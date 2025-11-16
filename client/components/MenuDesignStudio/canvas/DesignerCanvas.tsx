import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { DesignerElement, CanvasSettings, PageSize } from "../hooks";
import { CanvasElement } from "./CanvasElement";

interface DesignerCanvasProps {
  elements: DesignerElement[];
  selectedElementId: string | null;
  selectedElementIds: string[];
  pageSize: PageSize;
  canvasSettings: CanvasSettings;
  onSelectElement: (id: string | null) => void;
  onSelectMultiple: (ids: string[]) => void;
  onAddToSelection: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
  onUpdateElement: (id: string, updates: Partial<DesignerElement>) => void;
  onUpdateMultiple: (ids: string[], updates: Partial<DesignerElement>) => void;
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
  selectedElementIds,
  pageSize,
  canvasSettings,
  onSelectElement,
  onSelectMultiple,
  onAddToSelection,
  onToggleSelection,
  onClearSelection,
  onUpdateElement,
  onUpdateMultiple,
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
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const [dragSelectBox, setDragSelectBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isSelectingBox, setIsSelectingBox] = useState(false);

  // Handle canvas drag
  useEffect(() => {
    if (!dragState) {
      setDragPosition(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) {
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
      const { x, y } = onUpdateDrag(e.clientX, e.clientY);
      const element = elements.find((el) => el.id === dragState.id);
      if (element) {
        onUpdateElement(dragState.id, { x, y });
        setDragPosition({ x: Math.round(x), y: Math.round(y), clientX: e.clientX, clientY: e.clientY });
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setDragPosition(null);
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

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-canvas-element="true"]')) return;

    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setIsSelectingBox(true);
    setDragSelectBox({ startX, startY, endX: startX, endY: startY });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const endX = moveEvent.clientX - rect.left;
      const endY = moveEvent.clientY - rect.top;
      setDragSelectBox({ startX, startY, endX, endY });
    };

    const handleMouseUp = () => {
      setIsSelectingBox(false);
      if (dragSelectBox) {
        const minX = Math.min(dragSelectBox.startX, dragSelectBox.endX);
        const maxX = Math.max(dragSelectBox.startX, dragSelectBox.endX);
        const minY = Math.min(dragSelectBox.startY, dragSelectBox.endY);
        const maxY = Math.max(dragSelectBox.startY, dragSelectBox.endY);

        const selected = elements.filter((el) => {
          const elLeft = el.x * canvasSettings.zoom + 24;
          const elTop = el.y * canvasSettings.zoom + 24;
          const elRight = elLeft + el.width * canvasSettings.zoom;
          const elBottom = elTop + el.height * canvasSettings.zoom;

          return elLeft < maxX && elRight > minX && elTop < maxY && elBottom > minY;
        });

        if (selected.length > 0) {
          onSelectMultiple(selected.map((el) => el.id));
        } else {
          onClearSelection();
        }
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setDragSelectBox(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={canvasRef}
      className="relative h-full w-full overflow-auto bg-gray-200 dark:bg-gray-900"
      onMouseDown={handleCanvasMouseDown}
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        minWidth: "100%",
      }}
    >
      {/* Rulers Container */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
        {/* Top Ruler */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "24px",
            background: "#f0f0f0",
            borderBottom: "1px solid #ccc",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: Math.ceil((pageSize.width * scale) / 50) }).map((_, i) => (
            <div
              key={`ruler-top-${i}`}
              style={{
                position: "absolute",
                left: `${i * 50}px`,
                width: "50px",
                height: "24px",
                borderRight: "1px solid #ddd",
                fontSize: "10px",
                color: "#666",
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: "2px",
                paddingLeft: "2px",
              }}
            >
              {i * 50}
            </div>
          ))}
        </div>

        {/* Left Ruler */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "24px",
            bottom: 0,
            background: "#f0f0f0",
            borderRight: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: Math.ceil((pageSize.height * scale) / 50) }).map((_, i) => (
            <div
              key={`ruler-left-${i}`}
              style={{
                position: "absolute",
                top: `${i * 50}px`,
                height: "50px",
                width: "24px",
                borderBottom: "1px solid #ddd",
                fontSize: "10px",
                color: "#666",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                paddingRight: "2px",
                paddingTop: "2px",
              }}
            >
              {i * 50}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Container */}
      <div
        className="relative bg-white shadow-xl"
        style={{
          width: pageSize.width * scale,
          height: pageSize.height * scale,
          transformOrigin: "center",
          overflow: "visible",
          zIndex: 2,
          position: "relative",
          marginTop: "24px",
          marginLeft: "24px",
        }}
      >
        {/* Grid Background (optional) */}
        {canvasSettings.showGrid && (
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent calc(${canvasSettings.gridSize * scale}px - 1px), #888 calc(${canvasSettings.gridSize * scale}px - 1px)),
                linear-gradient(90deg, transparent calc(${canvasSettings.gridSize * scale}px - 1px), #888 calc(${canvasSettings.gridSize * scale}px - 1px))
              `,
              backgroundSize: `${canvasSettings.gridSize * scale}px ${canvasSettings.gridSize * scale}px`,
            }}
          />
        )}

        {/* Margins Display */}
        {canvasSettings.showMargins && (
          <div
            className="absolute border border-dashed border-blue-300 pointer-events-none"
            style={{
              top: canvasSettings.margin * scale,
              left: canvasSettings.margin * scale,
              right: canvasSettings.margin * scale,
              bottom: canvasSettings.margin * scale,
            }}
          />
        )}

        {/* Bleed Display */}
        {canvasSettings.showBleed && (
          <div
            className="absolute border border-dashed border-red-300 pointer-events-none"
            style={{
              top: -canvasSettings.bleed * scale,
              left: -canvasSettings.bleed * scale,
              right: -canvasSettings.bleed * scale,
              bottom: -canvasSettings.bleed * scale,
            }}
          />
        )}

        {/* Canvas Content */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: canvasSettings.background,
            position: "relative",
            zIndex: 2,
            width: "100%",
            height: "100%",
          }}
        >
          {/* Render Elements */}
          {elements.map((element) => (
            <div
              key={element.id}
              style={{
                position: "absolute",
                left: element.x * scale,
                top: element.y * scale,
                width: element.width * scale,
                height: element.height * scale,
                transformOrigin: "top left",
              }}
            >
              <CanvasElement
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
                scale={scale}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Position Tooltip during drag */}
      {dragPosition && (
        <div
          style={{
            position: "fixed",
            left: `${dragPosition.clientX + 10}px`,
            top: `${dragPosition.clientY + 10}px`,
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            zIndex: 10000,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          X: {dragPosition.x} Y: {dragPosition.y}
        </div>
      )}
    </div>
  );
}
