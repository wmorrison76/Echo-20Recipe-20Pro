import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { DesignerElement } from "../hooks";

interface CanvasElementProps {
  element: DesignerElement;
  isSelected: boolean;
  isEditing: boolean;
  isDragging: boolean;
  isResizing: boolean;
  onSelect: () => void;
  onUpdateElement: (updates: Partial<DesignerElement>) => void;
  onStartDrag: (clientX: number, clientY: number) => void;
  onStartResize: (handle: string, clientX: number, clientY: number) => void;
  onStartEditingText: () => void;
  onEndEditingText: () => void;
  scale?: number;
}

const RESIZE_HANDLES = ["nw", "ne", "sw", "se", "n", "s", "e", "w"] as const;

export function CanvasElement({
  element,
  isSelected,
  isEditing,
  isDragging,
  isResizing,
  onSelect,
  onUpdateElement,
  onStartDrag,
  onStartResize,
  onStartEditingText,
  onEndEditingText,
}: CanvasElementProps) {
  const [localText, setLocalText] = useState(element.text || "");
  const elementRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus text input when editing
  useEffect(() => {
    if (isEditing && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    onStartDrag(e.clientX, e.clientY);
  };

  const handleResizeStart = (
    handle: (typeof RESIZE_HANDLES)[number],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onStartResize(handle, e.clientX, e.clientY);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (["heading", "subheading", "body", "menu-item"].includes(element.type)) {
      onStartEditingText();
    }
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setLocalText(e.target.value);
  };

  const handleTextBlur = () => {
    onUpdateElement({ text: localText });
    onEndEditingText();
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setLocalText(element.text || "");
      onEndEditingText();
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleTextBlur();
    }
  };

  const renderContent = () => {
    switch (element.type) {
      case "heading":
      case "subheading":
      case "body":
        return isEditing ? (
          <textarea
            ref={textInputRef as React.Ref<HTMLTextAreaElement>}
            value={localText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            className="w-full h-full bg-transparent border border-cyan-500 p-1 text-inherit font-inherit resize-none"
          />
        ) : (
          <div className="truncate">{element.text}</div>
        );

      case "menu-item":
        return (
          <div className="flex flex-col gap-1">
            {isEditing ? (
              <input
                ref={textInputRef as React.Ref<HTMLInputElement>}
                value={localText}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                onKeyDown={handleTextKeyDown}
                className="w-full bg-transparent border border-cyan-500 px-1 text-inherit font-inherit"
              />
            ) : (
              <div className="font-semibold">{element.text}</div>
            )}
            <div className="text-sm opacity-75">{element.description}</div>
            {element.price && (
              <div className="text-sm font-semibold">${element.price.toFixed(2)}</div>
            )}
          </div>
        );

      case "image":
        return element.imageUrl ? (
          <img
            src={element.imageUrl}
            alt={element.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
            Image
          </div>
        );

      case "shape":
        return null;

      case "divider":
        return null;

      default:
        return null;
    }
  };

  const baseStyles: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    zIndex: isSelected ? 1000 : isEditing ? 999 : element.zIndex,
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
    fontFamily: element.fontFamily,
    fontSize: (element.fontSize || 16) * (scale || 1),
    fontWeight: element.fontWeight,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    color: element.color,
    textAlign: element.align,
  };

  if (element.type === "shape") {
    return (
      <div
        ref={elementRef}
        className={cn(
          "absolute cursor-move transition-shadow",
          isSelected && "ring-2 ring-cyan-500 ring-offset-1"
        )}
        style={{
          ...baseStyles,
          backgroundColor: element.fill,
          borderColor: element.borderColor,
          borderWidth: element.borderWidth,
          borderRadius: element.borderRadius,
          cursor: isSelected ? "move" : "pointer",
        }}
        onClick={onSelect}
        onMouseDown={handleMouseDown}
      >
        {isSelected && (
          <>
            {RESIZE_HANDLES.map((handle) => (
              <div
                key={handle}
                className={cn(
                  "absolute w-2 h-2 bg-cyan-500 border border-white cursor-pointer",
                  handle.includes("n") && "top-[-4px]",
                  handle.includes("s") && "bottom-[-4px]",
                  handle.includes("e") && "right-[-4px]",
                  handle.includes("w") && "left-[-4px]"
                )}
                onMouseDown={(e) => handleResizeStart(handle, e)}
                style={{
                  ...(handle.includes("n") && !handle.includes("s") && { top: -4 }),
                  ...(handle.includes("s") && { bottom: -4 }),
                  ...(handle.includes("e") && { right: -4 }),
                  ...(handle.includes("w") && { left: -4 }),
                  ...(handle.includes("e") && handle.includes("w") && { left: "50%", marginLeft: -4 }),
                  ...(!handle.includes("e") && !handle.includes("w") && { left: "50%", marginLeft: -4 }),
                }}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  if (element.type === "divider") {
    return (
      <div
        ref={elementRef}
        className={cn(
          "absolute transition-shadow",
          isSelected && "ring-2 ring-cyan-500"
        )}
        style={{
          ...baseStyles,
          backgroundColor: element.color,
          height: element.thickness || 2,
          cursor: isSelected ? "move" : "pointer",
        }}
        onClick={onSelect}
        onMouseDown={handleMouseDown}
      />
    );
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        "absolute transition-shadow break-words",
        isSelected && "ring-2 ring-cyan-500 ring-offset-1",
        isEditing && "ring-2 ring-cyan-400"
      )}
      style={baseStyles}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}

      {isSelected && !isEditing && (
        <>
          {/* Selection border and handles */}
          <div className="absolute inset-0 border border-dashed border-cyan-400 pointer-events-none" />

          {/* Resize handles */}
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle}
              className={cn(
                "absolute w-2 h-2 bg-cyan-500 border border-white cursor-pointer transition-opacity hover:opacity-100",
                handle.includes("n") && "top-[-5px]",
                handle.includes("s") && "bottom-[-5px]",
                handle.includes("e") && "right-[-5px]",
                handle.includes("w") && "left-[-5px]"
              )}
              style={{
                ...(handle.includes("n") && !handle.includes("s") && { top: -5 }),
                ...(handle.includes("s") && { bottom: -5 }),
                ...(handle.includes("e") && { right: -5 }),
                ...(handle.includes("w") && { left: -5 }),
                ...(!handle.includes("e") && !handle.includes("w") && { left: "50%", marginLeft: -4 }),
                ...(handle.includes("e") && handle.includes("w") && { display: "none" }),
              }}
              onMouseDown={(e) => handleResizeStart(handle, e)}
            />
          ))}
        </>
      )}
    </div>
  );
}
