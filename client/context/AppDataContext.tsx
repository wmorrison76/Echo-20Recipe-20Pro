import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type GalleryImage = {
  id: string;
  name: string;
  dataUrl: string; // base64 Data URL
  createdAt: number;
};

export type Recipe = {
  id: string;
  title: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
  imageNames?: string[]; // filenames to link with gallery
  imageDataUrls?: string[]; // resolved from gallery by name
  createdAt: number;
  sourceFile?: string;
  extra?: Record<string, unknown>;
};

type AppData = {
  recipes: Recipe[];
  images: GalleryImage[];
  addImages: (files: File[]) => Promise<number>; // returns count added
  addRecipesFromJsonFiles: (files: File[]) => Promise<{ added: number; errors: { file: string; error: string }[] }>; 
  clearRecipes: () => void;
  clearImages: () => void;
  searchRecipes: (q: string) => Recipe[];
  linkImagesToRecipesByFilename: () => void;
};

const CTX = createContext<AppData | null>(null);

const LS_RECIPES = "app.recipes.v1";
const LS_IMAGES = "app.images.v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("LocalStorage write failed", e);
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    setRecipes(readLS<Recipe[]>(LS_RECIPES, []));
    setImages(readLS<GalleryImage[]>(LS_IMAGES, []));
  }, []);

  useEffect(() => {
    writeLS(LS_RECIPES, recipes);
  }, [recipes]);

  useEffect(() => {
    writeLS(LS_IMAGES, images);
  }, [images]);

  const dataUrlFromFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const addImages = useCallback(async (files: File[]) => {
    let added = 0;
    const existing = new Set(images.map((i) => i.name));
    const next: GalleryImage[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      // Avoid duplicates by filename
      if (existing.has(f.name)) continue;
      try {
        const dataUrl = await dataUrlFromFile(f);
        next.push({ id: uid(), name: f.name, dataUrl, createdAt: Date.now() });
        added++;
      } catch (e) {
        console.warn("Failed to read image", f.name, e);
      }
    }
    if (next.length) setImages((prev) => [...next, ...prev]);
    return added;
  }, [images]);

  const normalizeRecipe = (raw: any): Omit<Recipe, "id" | "createdAt"> | null => {
    if (!raw || typeof raw !== "object") return null;
    const title = String(raw.title ?? raw.name ?? "").trim();
    if (!title) return null;
    const description = raw.description ?? raw.summary ?? undefined;
    const ingredients = Array.isArray(raw.ingredients)
      ? raw.ingredients.map(String)
      : Array.isArray(raw.ingredientLines)
      ? raw.ingredientLines.map(String)
      : undefined;
    const instructions = Array.isArray(raw.instructions)
      ? raw.instructions.map(String)
      : Array.isArray(raw.directions)
      ? raw.directions.map(String)
      : Array.isArray(raw.steps)
      ? raw.steps.map((s: any) => (typeof s === "string" ? s : s?.step ?? "").toString())
      : undefined;
    const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : undefined;
    const imageNames = Array.isArray(raw.images)
      ? raw.images.map((x: any) => String(x.name ?? x.fileName ?? x).trim()).filter(Boolean)
      : raw.image
      ? [String(raw.image).split("/").pop()!]
      : undefined;

    const extra: Record<string, unknown> = {};
    for (const k of Object.keys(raw)) {
      if (["title","name","description","summary","ingredients","ingredientLines","instructions","directions","steps","tags","images","image"].includes(k)) continue;
      extra[k] = (raw as any)[k];
    }

    return { title, description, ingredients, instructions, tags, imageNames, extra };
  };

  const linkImagesToRecipesByFilename = useCallback(() => {
    if (!images.length || !recipes.length) return;
    const imageMap = new Map(images.map((i) => [i.name, i.dataUrl] as const));
    setRecipes((prev) =>
      prev.map((r) => {
        const urls = (r.imageNames ?? []).map((n) => imageMap.get(n)).filter(Boolean) as string[];
        return { ...r, imageDataUrls: urls.length ? urls : r.imageDataUrls };
      }),
    );
  }, [images, recipes.length]);

  const addRecipesFromJsonFiles = useCallback(async (files: File[]) => {
    const errors: { file: string; error: string }[] = [];
    const collected: Recipe[] = [];

    for (const f of files) {
      if (!f.type.includes("json") && !f.name.toLowerCase().endsWith(".json")) {
        errors.push({ file: f.name, error: "Unsupported file type (expect JSON)" });
        continue;
      }
      try {
        const text = await f.text();
        const json = JSON.parse(text);
        const arr: any[] = Array.isArray(json) ? json : [json];
        for (const item of arr) {
          const norm = normalizeRecipe(item);
          if (norm) {
            collected.push({ id: uid(), createdAt: Date.now(), sourceFile: f.name, ...norm });
          }
        }
      } catch (e: any) {
        errors.push({ file: f.name, error: e?.message ?? "Parse error" });
      }
    }

    if (collected.length) setRecipes((prev) => [...collected, ...prev]);
    // try auto-link after import
    setTimeout(linkImagesToRecipesByFilename, 0);

    return { added: collected.length, errors };
  }, [linkImagesToRecipesByFilename]);

  const clearRecipes = useCallback(() => setRecipes([]), []);
  const clearImages = useCallback(() => setImages([]), []);

  const searchRecipes = useCallback(
    (q: string) => {
      const query = q.trim().toLowerCase();
      if (!query) return recipes;
      return recipes.filter((r) => {
        if (r.title.toLowerCase().includes(query)) return true;
        const ing = r.ingredients?.join(" \n ").toLowerCase() ?? "";
        const instr = r.instructions?.join(" \n ").toLowerCase() ?? "";
        const tags = r.tags?.join(" ").toLowerCase() ?? "";
        return ing.includes(query) || instr.includes(query) || tags.includes(query);
      });
    },
    [recipes],
  );

  const value = useMemo<AppData>(() => ({
    recipes,
    images,
    addImages,
    addRecipesFromJsonFiles,
    clearRecipes,
    clearImages,
    searchRecipes,
    linkImagesToRecipesByFilename,
  }), [recipes, images, addImages, addRecipesFromJsonFiles, searchRecipes, linkImagesToRecipesByFilename]);

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

export function useAppData() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
