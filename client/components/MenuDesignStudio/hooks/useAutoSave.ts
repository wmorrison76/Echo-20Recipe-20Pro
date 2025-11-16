import { useEffect, useRef, useCallback } from "react";
import { DesignState } from "./useDesignerState";

interface UseAutoSaveOptions {
  enabled?: boolean;
  intervalMs?: number;
  onSave?: (design: DesignState) => Promise<void>;
  onError?: (error: Error) => void;
}

interface SavedDesign extends DesignState {
  id: string;
  savedAt: number;
}

// LocalStorage helper
const STORAGE_KEY = "menu-designs";
const AUTO_SAVE_KEY = "menu-designs-autosave";

export function getSavedDesigns(): SavedDesign[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read saved designs:", error);
    return [];
  }
}

export function saveDesignToStorage(design: DesignState): SavedDesign {
  try {
    const saved: SavedDesign = {
      ...design,
      id: design.createdAt.toString(),
      savedAt: Date.now(),
    };

    const designs = getSavedDesigns();
    const index = designs.findIndex((d) => d.id === saved.id);

    if (index > -1) {
      designs[index] = saved;
    } else {
      designs.push(saved);
    }

    // Keep only last 20 designs to avoid storage bloat
    if (designs.length > 20) {
      designs.sort((a, b) => b.savedAt - a.savedAt);
      designs.splice(20);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    return saved;
  } catch (error) {
    console.error("Failed to save design:", error);
    throw error;
  }
}

export function getAutoSavedDesign(): SavedDesign | null {
  try {
    const data = localStorage.getItem(AUTO_SAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to read auto-saved design:", error);
    return null;
  }
}

export function saveAutoSaveDesign(design: DesignState): void {
  try {
    const saved: SavedDesign = {
      ...design,
      id: `autosave-${Date.now()}`,
      savedAt: Date.now(),
    };

    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error("Failed to auto-save design:", error);
  }
}

export function deleteDesign(id: string): void {
  try {
    const designs = getSavedDesigns();
    const filtered = designs.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete design:", error);
  }
}

export function checkStorageQuota(): {
  usage: number;
  quota: number;
  percentUsed: number;
  usedMB: number;
  quotaMB: number;
} {
  try {
    if (!navigator.storage?.estimate) {
      return {
        usage: 0,
        quota: 0,
        percentUsed: 0,
        usedMB: 0,
        quotaMB: 0,
      };
    }

    let result = { usage: 0, quota: 0, percentUsed: 0, usedMB: 0, quotaMB: 0 };

    navigator.storage.estimate().then((estimate) => {
      result.usage = estimate.usage || 0;
      result.quota = estimate.quota || 0;
      result.percentUsed = result.usage / result.quota;
      result.usedMB = Math.round(result.usage / 1024 / 1024);
      result.quotaMB = Math.round(result.quota / 1024 / 1024);
    });

    return result;
  } catch (error) {
    console.warn("Could not check storage quota:", error);
    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
      usedMB: 0,
      quotaMB: 0,
    };
  }
}

export function useAutoSave(
  design: DesignState,
  options: UseAutoSaveOptions = {}
) {
  const {
    enabled = true,
    intervalMs = 30000, // 30 seconds
    onSave,
    onError,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>("");

  const performSave = useCallback(async () => {
    try {
      const designString = JSON.stringify(design);

      // Only save if design changed
      if (designString === lastSaveRef.current) {
        return;
      }

      lastSaveRef.current = designString;

      // Save auto-save copy
      saveAutoSaveDesign(design);

      // Call custom save handler if provided
      if (onSave) {
        await onSave(design);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      console.error("Auto-save failed:", err);
    }
  }, [design, onSave, onError]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, intervalMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, intervalMs, performSave]);

  // Save immediately on unmount if needed
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Don't force save on unmount as it could be destructive
    };
  }, []);

  const manualSave = useCallback(async () => {
    return performSave();
  }, [performSave]);

  return {
    manualSave,
    savedDesigns: getSavedDesigns(),
    autoSavedDesign: getAutoSavedDesign(),
    checkQuota: checkStorageQuota,
  };
}
