/**
 * Global Object URL Wrapper
 * =========================
 * Intercepts all URL.createObjectURL calls to use the LRU cache
 * This ensures the entire app (including third-party libraries) respects blob resource limits
 */

import { objectURLCache } from "./object-url-cache";

let originalCreateObjectURL: typeof URL.createObjectURL;
let isWrapped = false;

/**
 * Install global wrapper for URL.createObjectURL
 * This must be called early in app initialization
 *
 * CRITICAL: Must save original BEFORE wrapping to avoid infinite recursion
 */
export function installGlobalObjectURLWrapper(): void {
  if (isWrapped) return;

  try {
    // IMPORTANT: Save the original BEFORE any wrapping
    originalCreateObjectURL = URL.createObjectURL;

    // Tell the cache to use the original (not the wrapped version)
    objectURLCache.setOriginalCreateObjectURL(originalCreateObjectURL);

    // Replace URL.createObjectURL with our cached version
    URL.createObjectURL = function (blob: Blob): string {
      // Generate a unique ID for this blob
      // In practice, most code calls createObjectURL with immediate usage
      // so we use timestamp + random to create a pseudo-unique ID
      const id = `blob-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      try {
        // Use the LRU cache instead of creating unlimited URLs
        // The cache uses the ORIGINAL createObjectURL internally, not this wrapper
        return objectURLCache.set(id, blob);
      } catch (error) {
        console.error("[ObjectURLWrapper] Failed to cache blob URL:", error);
        // Fallback to original if cache fails
        return originalCreateObjectURL(blob);
      }
    };

    isWrapped = true;
    console.log("[ObjectURLWrapper] Global URL.createObjectURL wrapper installed");
  } catch (error) {
    console.error("[ObjectURLWrapper] Failed to install wrapper:", error);
    // If wrapping fails, just continue - app will work but won't have blob limits
  }
}

/**
 * Restore original URL.createObjectURL (for testing)
 */
export function uninstallGlobalObjectURLWrapper(): void {
  if (isWrapped && originalCreateObjectURL) {
    URL.createObjectURL = originalCreateObjectURL;
    isWrapped = false;
    console.log("[ObjectURLWrapper] Global wrapper uninstalled");
  }
}

/**
 * Get wrapper status
 */
export function isGlobalObjectURLWrapperInstalled(): boolean {
  return isWrapped;
}
