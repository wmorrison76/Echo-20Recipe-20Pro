import { useEffect, useCallback } from "react";

interface KeyboardShortcuts {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onSave?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  target?: Window | HTMLElement;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcuts,
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    enabled = true,
    target = typeof window !== "undefined" ? window : undefined,
    preventDefault: shouldPreventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const isMeta = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // Cmd/Ctrl+Z: Undo
      if (isMeta && !isShift && e.key.toLowerCase() === "z") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onUndo?.();
        return;
      }

      // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: Redo
      if (
        ((isMeta && isShift && e.key.toLowerCase() === "z") ||
          (isMeta && e.key.toLowerCase() === "y")) &&
        !isAlt
      ) {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onRedo?.();
        return;
      }

      // Delete or Backspace: Delete selected
      if (
        e.key === "Delete" ||
        (e.key === "Backspace" &&
          !(e.target as HTMLElement)?.closest("input, textarea"))
      ) {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onDelete?.();
        return;
      }

      // Cmd/Ctrl+D: Duplicate
      if (isMeta && !isShift && e.key.toLowerCase() === "d") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onDuplicate?.();
        return;
      }

      // Cmd/Ctrl+A: Select all
      if (isMeta && !isShift && e.key.toLowerCase() === "a") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onSelectAll?.();
        return;
      }

      // Escape: Deselect
      if (e.key === "Escape") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onDeselect?.();
        return;
      }

      // Cmd/Ctrl+S: Save
      if (isMeta && !isShift && e.key.toLowerCase() === "s") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onSave?.();
        return;
      }

      // Cmd/Ctrl++ or Cmd/Ctrl+Shift+=: Zoom in
      if (
        isMeta &&
        (e.key === "+" ||
          (isShift && e.key === "=") ||
          (e.code === "Equal" && isShift))
      ) {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onZoomIn?.();
        return;
      }

      // Cmd/Ctrl+-: Zoom out
      if (isMeta && (e.key === "-" || e.code === "Minus")) {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onZoomOut?.();
        return;
      }

      // Cmd/Ctrl+0: Fit to screen
      if (isMeta && (e.key === "0" || e.code === "Digit0")) {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onFitToScreen?.();
        return;
      }

      // Cmd/Ctrl+G: Group
      if (isMeta && !isShift && e.key.toLowerCase() === "g") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onGroup?.();
        return;
      }

      // Cmd/Ctrl+Shift+G: Ungroup
      if (isMeta && isShift && e.key.toLowerCase() === "g") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onUngroup?.();
        return;
      }

      // Cmd/Ctrl+C: Copy
      if (isMeta && e.key.toLowerCase() === "c") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onCopy?.();
        return;
      }

      // Cmd/Ctrl+V: Paste
      if (isMeta && !isShift && e.key.toLowerCase() === "v") {
        shouldPreventDefault && e.preventDefault();
        shortcuts.onPaste?.();
        return;
      }
    },
    [
      enabled,
      shouldPreventDefault,
      shortcuts.onUndo,
      shortcuts.onRedo,
      shortcuts.onDelete,
      shortcuts.onDuplicate,
      shortcuts.onSelectAll,
      shortcuts.onDeselect,
      shortcuts.onSave,
      shortcuts.onZoomIn,
      shortcuts.onZoomOut,
      shortcuts.onFitToScreen,
      shortcuts.onGroup,
      shortcuts.onUngroup,
      shortcuts.onCopy,
      shortcuts.onPaste,
    ]
  );

  useEffect(() => {
    if (!target) return;

    const element = target instanceof Window ? window : target;
    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [target, handleKeyDown]);

  // Return helper to check if shortcut would be triggered
  const isShortcutKey = useCallback(
    (e: KeyboardEvent, shortcut: keyof KeyboardShortcuts) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      switch (shortcut) {
        case "onUndo":
          return isMeta && !isShift && e.key.toLowerCase() === "z";
        case "onRedo":
          return (isMeta && isShift && e.key.toLowerCase() === "z") ||
            (isMeta && e.key.toLowerCase() === "y");
        case "onDelete":
          return e.key === "Delete" || e.key === "Backspace";
        case "onDuplicate":
          return isMeta && !isShift && e.key.toLowerCase() === "d";
        case "onSelectAll":
          return isMeta && !isShift && e.key.toLowerCase() === "a";
        case "onDeselect":
          return e.key === "Escape";
        case "onSave":
          return isMeta && !isShift && e.key.toLowerCase() === "s";
        case "onZoomIn":
          return isMeta && (e.key === "+" || (isShift && e.key === "="));
        case "onZoomOut":
          return isMeta && (e.key === "-" || e.code === "Minus");
        case "onFitToScreen":
          return isMeta && (e.key === "0" || e.code === "Digit0");
        case "onGroup":
          return isMeta && !isShift && e.key.toLowerCase() === "g";
        case "onUngroup":
          return isMeta && isShift && e.key.toLowerCase() === "g";
        case "onCopy":
          return isMeta && e.key.toLowerCase() === "c";
        case "onPaste":
          return isMeta && !isShift && e.key.toLowerCase() === "v";
        default:
          return false;
      }
    },
    []
  );

  return {
    isShortcutKey,
  };
}
