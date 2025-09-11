import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
// Mammoth is loaded on-demand to keep bundle small and avoid init errors in some environments

export type GalleryImage = {
  id: string;
  name: string;
  dataUrl?: string; // base64 Data URL
  blobUrl?: string; // for unsupported formats
  createdAt: number;
  tags: string[];
  favorite?: boolean;
  order: number;
  type?: string;
  unsupported?: boolean;
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

export type LookBook = {
  id: string;
  name: string;
  imageIds: string[];
  createdAt: number;
};

type AppData = {
  recipes: Recipe[];
  images: GalleryImage[];
  lookbooks: LookBook[];
  addImages: (files: File[], opts?: { tags?: string[] }) => Promise<number>;
  addRecipesFromJsonFiles: (files: File[]) => Promise<{ added: number; errors: { file: string; error: string }[]; titles: string[] }>;
  addRecipesFromDocxFiles: (files: File[]) => Promise<{ added: number; errors: { file: string; error: string }[]; titles: string[] }>;
  addRecipesFromHtmlFiles: (files: File[]) => Promise<{ added: number; errors: { file: string; error: string }[]; titles: string[] }>;
  addRecipesFromPdfFiles: (files: File[]) => Promise<{ added: number; errors: { file: string; error: string }[]; titles: string[] }>;
  addRecipesFromExcelFiles: (files: File[]) => Promise<{ added: number; errors: { file: string; error: string }[]; titles: string[] }>;
  addRecipesFromImageOcr: (files: File[]) => Promise<{ added: number; errors: { file: string; error: string }[]; titles: string[] }>;
  addFromZipArchive: (file: File) => Promise<{ addedRecipes: number; addedImages: number; errors: { entry: string; error: string }[]; titles: string[] }>;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  attachImageToRecipeFromGallery: (recipeId: string, imageName: string) => void;
  clearRecipes: () => void;
  clearImages: () => void;
  searchRecipes: (q: string) => Recipe[];
  linkImagesToRecipesByFilename: () => void;
  updateImage: (id: string, patch: Partial<GalleryImage>) => void;
  addTagsToImages: (ids: string[], tags: string[]) => void;
  reorderImages: (dragId: string, overId: string) => void;
  addLookBook: (name: string, imageIds?: string[]) => string;
  updateLookBook: (id: string, patch: Partial<LookBook>) => void;
  deleteLookBook: (id: string) => void;
  addImagesToLookBook: (id: string, imageIds: string[]) => void;
  removeImagesFromLookBook: (id: string, imageIds: string[]) => void;
};

const CTX = createContext<AppData | null>(null);

const LS_RECIPES = "app.recipes.v1";
const LS_IMAGES = "app.images.v1";
const LS_LOOKBOOKS = "app.lookbooks.v1";

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
  const [lookbooks, setLookbooks] = useState<LookBook[]>([]);

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

  const dataUrlFromBlob = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const addImages = useCallback(async (files: File[], opts?: { tags?: string[] }) => {
    let added = 0;
    const existing = new Set(images.map((i) => i.name));
    const maxOrder = images.length ? Math.max(...images.map((i) => (typeof (i as any).order === "number" ? (i as any).order : -1))) : -1;
    let order = maxOrder + 1;
    const next: GalleryImage[] = [];
    for (const f of files) {
      if (existing.has(f.name)) continue;
      try {
        const isDisplayable = f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);
        if (isDisplayable) {
          const dataUrl = await dataUrlFromFile(f);
          next.push({ id: uid(), name: f.name, dataUrl, createdAt: Date.now(), tags: opts?.tags ?? [], favorite: false, order: order++, type: f.type });
          added++;
        } else {
          const blob = new Blob([await f.arrayBuffer()], { type: f.type || "application/octet-stream" });
          const blobUrl = URL.createObjectURL(blob);
          next.push({ id: uid(), name: f.name, blobUrl, createdAt: Date.now(), tags: opts?.tags ?? [], favorite: false, order: order++, type: f.type, unsupported: true });
          added++;
        }
      } catch (e) {
        console.warn("Failed to read file", f.name, e);
      }
    }
    if (next.length) setImages((prev) => [...next, ...prev]);
    return added;
  }, [images]);

  const updateImage = useCallback((id: string, patch: Partial<GalleryImage>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch, tags: patch.tags ?? img.tags } : img)));
  }, []);

  const addTagsToImages = useCallback((ids: string[], tags: string[]) => {
    const set = new Set(tags.map((t) => t.trim()).filter(Boolean));
    setImages((prev) => prev.map((img) => (ids.includes(img.id) ? { ...img, tags: Array.from(new Set([...(img.tags ?? []), ...set])) } : img)));
  }, []);

  const reorderImages = useCallback((dragId: string, overId: string) => {
    setImages((prev) => {
      const idxA = prev.findIndex((i) => i.id === dragId);
      const idxB = prev.findIndex((i) => i.id === overId);
      if (idxA === -1 || idxB === -1) return prev;
      const copy = prev.slice();
      const [moved] = copy.splice(idxA, 1);
      copy.splice(idxB, 0, moved);
      return copy.map((i, idx) => ({ ...i, order: idx }));
    });
  }, []);

  const normalizeRecipe = (raw: any): Omit<Recipe, "id" | "createdAt"> | null => {
    if (!raw || typeof raw !== "object") return null;

    // Some sources nest the recipe under keys like { recipe: {...} } or { data: {...attributes} }
    const r = raw.recipe ? raw.recipe : (raw.data && raw.data.attributes ? raw.data.attributes : raw);

    // Title
    const title = String(r.title ?? r.name ?? r.label ?? r.slug ?? "").trim();
    if (!title) return null;

    const description = r.description ?? r.summary ?? r.subtitle ?? undefined;

    // Ingredients accept several shapes: array of strings, array of objects, newline string
    const extractLines = (val: any): string[] | undefined => {
      if (!val) return undefined;
      if (Array.isArray(val)) {
        if (val.every((x) => typeof x === 'string')) return (val as string[]).map(String);
        return val.map((x: any) => String(x?.text ?? x?.name ?? x?.line ?? x?.value ?? x)).filter(Boolean);
      }
      if (typeof val === 'string') return val.split(/\r?\n|\u2028|\u2029/).map((s) => s.trim()).filter(Boolean);
      return undefined;
    };

    const ingredients = extractLines(r.ingredients ?? r.ingredientLines ?? r.ingredientsText ?? r.ings);
    const instructions = extractLines(r.instructions ?? r.directions ?? r.steps ?? r.method ?? r.instructionsText);

    const tags = Array.isArray(r.tags) ? r.tags.map(String) : (typeof r.tags === 'string' ? r.tags.split(',').map((t:string)=>t.trim()).filter(Boolean) : undefined);

    // Images: support {images:[{secure_url|url|src|publicId}]}, or single 'image'
    const imagesSrc: string[] = Array.isArray(r.images)
      ? r.images.map((x: any) => String(x?.name ?? x?.fileName ?? x?.secure_url ?? x?.url ?? x?.src ?? x).trim()).filter(Boolean)
      : r.image
      ? [String(r.image)]
      : [];
    const imageNames = imagesSrc.length ? imagesSrc.map((u) => (u.includes('/') ? u.split('/').pop()! : u)) : undefined;

    const extra: Record<string, unknown> = {};
    for (const k of Object.keys(r)) {
      if (["title","name","label","slug","description","summary","subtitle","ingredients","ingredientLines","ingredientsText","ings","instructions","directions","steps","method","instructionsText","tags","images","image"].includes(k)) continue;
      extra[k] = (r as any)[k];
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
    const titles: string[] = [];

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

    return { added: collected.length, errors, titles };
  }, [linkImagesToRecipesByFilename]);

  const convertDocxArrayBufferToHtml = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const mammoth = await import("mammoth/mammoth.browser");
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    return value as string;
  };

  const htmlToRecipes = (html: string, source: string): Recipe[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodes = Array.from(doc.body.children);

    const titleTags = new Set(["H1", "H2"]);
    const sections: { title: string; elements: Element[] }[] = [];
    let current: { title: string; elements: Element[] } | null = null;

    for (const el of nodes) {
      if (titleTags.has(el.tagName)) {
        const title = (el.textContent || "").trim();
        if (title) {
          if (current) sections.push(current);
          current = { title, elements: [] };
          continue;
        }
      }
      if (current) current.elements.push(el);
    }
    if (current) sections.push(current);

    if (!sections.length) {
      const title = (doc.querySelector("h1,h2,h3")?.textContent || "Untitled").trim() || "Untitled";
      sections.push({ title, elements: Array.from(doc.body.children) });
    }

    const extractListAfter = (startIdx: number, arr: Element[]) => {
      const out: string[] = [];
      for (let i = startIdx + 1; i < arr.length; i++) {
        const el = arr[i];
        const tag = el.tagName;
        if (["H1", "H2", "H3"].includes(tag)) break;
        if (tag === "UL" || tag === "OL") {
          out.push(...Array.from(el.querySelectorAll("li")).map((li) => (li.textContent || "").trim()).filter(Boolean));
        } else if (tag === "P") {
          const t = (el.textContent || "").trim();
          if (t) out.push(t);
        }
      }
      return out;
    };

    const results: Recipe[] = [];
    for (const sec of sections) {
      const els = sec.elements;
      const lowerTexts = els.map((e) => (e.textContent || "").toLowerCase());
      const findIdx = (label: string[]) => lowerTexts.findIndex((t) => label.some((l) => t.startsWith(l)));
      const ingIdx = findIdx(["ingredients", "ingredient", "what you need"]);
      const instIdx = findIdx(["instructions", "directions", "method", "steps"]);
      const ingredients = ingIdx >= 0 ? extractListAfter(ingIdx, els) : [];
      const instructions = instIdx >= 0 ? extractListAfter(instIdx, els) : [];
      results.push({ id: uid(), createdAt: Date.now(), title: sec.title, ingredients: ingredients.length?ingredients:undefined, instructions: instructions.length?instructions:undefined, sourceFile: source });
    }
    return results;
  };

  const addRecipesFromHtmlFiles = useCallback(async (files: File[]) => {
    const errors: { file: string; error: string }[] = [];
    const collected: Recipe[] = [];
    const titles: string[] = [];
    for (const f of files) {
      if (!/\.(html?|htm)$/i.test(f.name)) { errors.push({ file: f.name, error: 'Unsupported HTML type' }); continue; }
      try {
        const html = await f.text();
        const recs = htmlToRecipes(html, f.name);
        collected.push(...recs);
        titles.push(...recs.map((r)=>r.title));
      } catch (e:any) { errors.push({ file: f.name, error: e?.message ?? 'Failed to read HTML' }); }
    }
    if (collected.length) setRecipes((prev)=>[...collected, ...prev]);
    return { added: collected.length, errors, titles };
  }, []);

  const addRecipesFromDocxFiles = useCallback(async (files: File[]) => {
    const errors: { file: string; error: string }[] = [];
    const collected: Recipe[] = [];
    const titles: string[] = [];

    for (const f of files) {
      if (!f.name.toLowerCase().endsWith(".docx")) {
        errors.push({ file: f.name, error: "Unsupported Word format (use .docx)" });
        continue;
      }
      try {
        const ab = await f.arrayBuffer();
        const html = await convertDocxArrayBufferToHtml(ab);
        const recs = htmlToRecipes(html, f.name);
        collected.push(...recs);
        titles.push(...recs.map((r) => r.title));
      } catch (e: any) {
        errors.push({ file: f.name, error: e?.message ?? "Failed to read .docx" });
      }
    }

    if (collected.length) setRecipes((prev) => [...collected, ...prev]);
    setTimeout(linkImagesToRecipesByFilename, 0);
    return { added: collected.length, errors, titles };
  }, [linkImagesToRecipesByFilename]);

  const addRecipesFromPdfFiles = useCallback(async (files: File[]) => {
    const errors: { file: string; error: string }[] = [];
    const collected: Recipe[] = [];
    const titles: string[] = [];
    for (const f of files) {
      if (!f.name.toLowerCase().endsWith('.pdf')) { errors.push({ file: f.name, error: 'Unsupported PDF type' }); continue; }
      try {
        const ab = await f.arrayBuffer();
        let text = '';
        try {
          const pdfjs: any = await import('https://esm.sh/pdfjs-dist@4.7.76/build/pdf.mjs');
          const workerSrc = 'https://esm.sh/pdfjs-dist@4.7.76/build/pdf.worker.mjs';
          if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
          const doc = await pdfjs.getDocument({ data: ab }).promise;
          for (let p=1; p<=doc.numPages; p++) {
            const page = await doc.getPage(p);
            const tc = await page.getTextContent();
            text += tc.items.map((i:any)=> i.str).join('\n') + '\n';
          }
        } catch (e:any) {
          try { text = new TextDecoder().decode(ab); } catch {}
        }
        const lines = text.split(/\r?\n/).map((s)=>s.trim()).filter(Boolean);
        const lower = lines.map((l)=>l.toLowerCase());
        const find = (labels:string[])=> lower.findIndex((l)=> labels.includes(l));
        const ingIdx = find(['ingredients','ingredient']);
        const instIdx = find(['instructions','directions','method','steps']);
        const title = lines[0] || f.name.replace(/\.pdf$/i,'');
        const getRange = (start:number, end:number)=> lines.slice(start+1, end>start? end: undefined).filter(Boolean);
        const ingredients = ingIdx>=0 ? getRange(ingIdx, instIdx>=0? instIdx: lines.length) : undefined;
        const instructions = instIdx>=0 ? getRange(instIdx, lines.length) : undefined;
        collected.push({ id: uid(), createdAt: Date.now(), title, ingredients, instructions, sourceFile: f.name });
        titles.push(title);
      } catch (e:any) {
        errors.push({ file: f.name, error: e?.message ?? 'Failed to read PDF' });
      }
    }
    if (collected.length) setRecipes((prev)=>[...collected, ...prev]);
    return { added: collected.length, errors, titles };
  }, []);

  const addRecipesFromExcelFiles = useCallback(async (files: File[]) => {
    const errors: { file: string; error: string }[] = [];
    const collected: Recipe[] = [];
    const titles: string[] = [];
    for (const f of files) {
      if (!/\.(xlsx|xls|csv)$/i.test(f.name)) { errors.push({ file: f.name, error: 'Unsupported spreadsheet type' }); continue; }
      try {
        if (/\.csv$/i.test(f.name)) {
          const text = await f.text();
          const rows = text.split(/\r?\n/).map((l)=> l.split(/,|\t/));
          const header = rows.shift()||[]; const idx = (k:string)=> header.findIndex(h=> h.trim().toLowerCase()===k);
          const it = idx('title'); const ii = idx('ingredients'); const io = idx('instructions');
          for (const r of rows) {
            const title = (r[it]||'').trim(); if (!title) continue;
            const ingredients = (r[ii]||'').split(/\n|;|\|/).map((s)=>s.trim()).filter(Boolean);
            const instructions = (r[io]||'').split(/\n|\.|;\s/).map((s)=>s.trim()).filter(Boolean);
            collected.push({ id: uid(), createdAt: Date.now(), title, ingredients: ingredients.length?ingredients:undefined, instructions: instructions.length?instructions:undefined, sourceFile: f.name });
            titles.push(title);
          }
        } else {
          const ab = await f.arrayBuffer();
          const XLSX: any = await import('https://esm.sh/xlsx@0.18.5');
          const wb = XLSX.read(ab, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
          for (const row of json) {
            const title = String(row.title ?? row.Name ?? row.Recipe ?? '').trim(); if (!title) continue;
            const ing = String(row.ingredients ?? row.Ingredients ?? '').split(/\n|;|\|/).map((s)=>s.trim()).filter(Boolean);
            const ins = String(row.instructions ?? row.Directions ?? row.Method ?? '').split(/\n|\.|;\s/).map((s)=>s.trim()).filter(Boolean);
            collected.push({ id: uid(), createdAt: Date.now(), title, ingredients: ing.length?ing:undefined, instructions: ins.length?ins:undefined, sourceFile: f.name });
            titles.push(title);
          }
        }
      } catch (e:any) {
        errors.push({ file: f.name, error: e?.message ?? 'Failed to read spreadsheet' });
      }
    }
    if (collected.length) setRecipes((prev)=>[...collected, ...prev]);
    return { added: collected.length, errors, titles };
  }, []);

  const addRecipesFromImageOcr = useCallback(async (files: File[]) => {
    const errors: { file: string; error: string }[] = [];
    const collected: Recipe[] = [];
    const titles: string[] = [];
    for (const f of files) {
      try {
        const Tesseract: any = await import('https://esm.sh/tesseract.js@5.1.1');
        const { data } = await Tesseract.recognize(await f.arrayBuffer(), 'eng');
        const raw = String(data?.text || '').trim();
        if (!raw) { errors.push({ file: f.name, error: 'No text detected' }); continue; }
        const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
        const title = lines[0] || f.name.replace(/\.(png|jpe?g|webp|heic)$/i,'');
        const lower = lines.map(l=>l.toLowerCase());
        const find = (labels:string[])=> lower.findIndex((l)=> labels.includes(l));
        const ingIdx = find(['ingredients','ingredient']);
        const instIdx = find(['instructions','directions','method','steps']);
        const getRange = (start:number, end:number)=> lines.slice(start+1, end>start? end: undefined).filter(Boolean);
        const ingredients = ingIdx>=0 ? getRange(ingIdx, instIdx>=0? instIdx: lines.length) : undefined;
        const instructions = instIdx>=0 ? getRange(instIdx, lines.length) : undefined;
        collected.push({ id: uid(), createdAt: Date.now(), title, ingredients, instructions, sourceFile: f.name });
        titles.push(title);
      } catch (e:any) {
        errors.push({ file: f.name, error: e?.message ?? 'OCR failed' });
      }
    }
    if (collected.length) setRecipes((prev)=>[...collected, ...prev]);
    return { added: collected.length, errors, titles };
  }, []);

  const addFromZipArchive = useCallback(async (file: File) => {
    const errors: { entry: string; error: string }[] = [];
    const nextRecipes: Recipe[] = [];
    const nextImages: GalleryImage[] = [];
    const titles: string[] = [];

    try {
      const zip = await JSZip.loadAsync(file);
      const existingImageNames = new Set(images.map((i) => i.name));

      const entries = Object.values(zip.files);
      for (const entry of entries) {
        if (entry.dir) continue;
        const base = entry.name.split("/").pop() || entry.name;
        const lower = base.toLowerCase();

        try {
          if (lower.endsWith(".json")) {
            const str = await entry.async("string");
            const json = JSON.parse(str);
            const arr: any[] = Array.isArray(json) ? json : [json];
            for (const item of arr) {
              const norm = normalizeRecipe(item);
              if (norm) { nextRecipes.push({ id: uid(), createdAt: Date.now(), sourceFile: base, ...norm }); titles.push(norm.title); }
            }
          } else if (lower.endsWith(".docx")) {
            const ab = await entry.async("arraybuffer");
            const html = await convertDocxArrayBufferToHtml(ab);
            const recs = htmlToRecipes(html, base);
            nextRecipes.push(...recs);
            titles.push(...recs.map((r) => r.title));
          } else if (/(\.png|\.jpg|\.jpeg|\.webp|\.gif)$/i.test(lower)) {
            if (existingImageNames.has(base)) continue;
            const blob = await entry.async("blob");
            // try to preserve mime if possible
            const mime =
              lower.endsWith(".png") ? "image/png" :
              lower.endsWith(".webp") ? "image/webp" :
              lower.endsWith(".gif") ? "image/gif" : "image/jpeg";
            const typedBlob = blob.type ? blob : new Blob([blob], { type: mime });
            const dataUrl = await dataUrlFromBlob(typedBlob);
            nextImages.push({ id: uid(), name: base, dataUrl, createdAt: Date.now(), tags: [], favorite: false, order: images.length + nextImages.length, type: typedBlob.type });
          }
        } catch (e: any) {
          errors.push({ entry: entry.name, error: e?.message ?? "Failed to read entry" });
        }
      }
    } catch (e: any) {
      errors.push({ entry: file.name, error: e?.message ?? "Invalid ZIP" });
    }

    if (nextImages.length) setImages((prev) => [...nextImages, ...prev]);
    if (nextRecipes.length) setRecipes((prev) => [...nextRecipes, ...prev]);
    setTimeout(linkImagesToRecipesByFilename, 0);

    return { addedRecipes: nextRecipes.length, addedImages: nextImages.length, errors, titles };
  }, [images, linkImagesToRecipesByFilename]);

  const updateRecipe = useCallback((id: string, patch: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, extra: { ...(r.extra ?? {}), ...(patch as any).extra } } : r)));
  }, []);

  const getRecipeById = useCallback((id: string) => recipes.find((r) => r.id === id), [recipes]);

  const attachImageToRecipeFromGallery = useCallback((recipeId: string, imageName: string) => {
    const img = images.find((i) => i.name === imageName);
    if (!img) return;
    setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, imageNames: Array.from(new Set([...(r.imageNames ?? []), imageName])), imageDataUrls: Array.from(new Set([...(r.imageDataUrls ?? []), img.dataUrl])) } : r)));
  }, [images]);

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
    addRecipesFromDocxFiles,
    addRecipesFromHtmlFiles,
    addRecipesFromPdfFiles,
    addRecipesFromExcelFiles,
    addRecipesFromImageOcr,
    addFromZipArchive,
    updateRecipe,
    getRecipeById,
    attachImageToRecipeFromGallery,
    clearRecipes,
    clearImages,
    searchRecipes,
    linkImagesToRecipesByFilename,
    updateImage,
    addTagsToImages,
    reorderImages,
  }), [recipes, images, addImages, addRecipesFromJsonFiles, addRecipesFromDocxFiles, addFromZipArchive, updateRecipe, getRecipeById, attachImageToRecipeFromGallery, searchRecipes, linkImagesToRecipesByFilename, updateImage, addTagsToImages, reorderImages]);

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

export function useAppData() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
