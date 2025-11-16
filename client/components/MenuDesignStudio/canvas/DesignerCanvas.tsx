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
      className="relative h-full w-full overflow-auto bg-gray-200 dark:bg-gray-900"
      onClick={() => onSelectElement(null)}
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
              key={`top-${i}`}
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
              key={`left-${i}`}
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
    </div>
  );
}
