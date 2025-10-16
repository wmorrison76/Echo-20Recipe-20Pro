import { useEffect, useRef, useCallback } from "react";

export type KeyboardShortcutConfig = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const isKeyMatch =
          e.key.toLowerCase() === shortcut.key.toLowerCase();
        const isCtrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const isShiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const isAltMatch = shortcut.alt ? e.altKey : !e.altKey;
        const isMetaMatch = shortcut.meta ? e.metaKey : !e.metaKey;

        if (
          isKeyMatch &&
          isCtrlMatch &&
          isShiftMatch &&
          isAltMatch &&
          isMetaMatch
        ) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export function useKeyboardShortcut(
  config: KeyboardShortcutConfig,
) {
  useKeyboardShortcuts([config]);
}

export function normalizeShortcut(
  keyCombo: string,
): KeyboardShortcutConfig["key"] {
  const parts = keyCombo.toLowerCase().split("+");
  return parts[parts.length - 1];
}

export function parseShortcut(keyCombo: string): Omit<
  KeyboardShortcutConfig,
  "key" | "handler"
> {
  const parts = keyCombo.toLowerCase().split("+");
  return {
    meta: parts.includes("cmd") || parts.includes("meta"),
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
  };
}
