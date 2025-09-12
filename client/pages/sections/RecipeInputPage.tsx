import React, { useEffect, useMemo, useRef, useState } from "react";
import RightSidebar from "./RightSidebar";
import { useAppData } from "@/context/AppDataContext";
import ImageEditorModal from "./ImageEditorModal";
import NutritionLabel from "./NutritionLabel";
import { defaultSelection, TaxonomySelection } from "@/lib/taxonomy";
import {
  Save,
  Image as ImageIcon,
  Settings,
  PlusCircle,
  MinusCircle,
  Menu,
  Plus,
  Minus,
  Bold,
  Italic,
  Underline,
  Sun,
  Moon,
  Scale,
  NotebookPen,
  ArrowLeftRight,
  CircleDollarSign,
  Share2,
  FileDown,
  Printer,
} from "lucide-react";

const RecipeInputPage = () => {
  const [recipeName, setRecipeName] = useState("");
  const [ingredients, setIngredients] = useState([
    { qty: "", unit: "", item: "", prep: "", yield: "", cost: "" },
  ]);
  const historyRef = useRef<any[]>([]);
  const futureRef = useRef<any[]>([]);
  const [directions, setDirections] = useState("1. ");
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const { addRecipe, updateRecipe, addImages } = useAppData();
  const recipeIdRef = useRef<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Sync with global theme from ThemeToggle
  useEffect(() => {
    const apply = () =>
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    apply();
    const onTheme = (e: any) =>
      setIsDarkMode(String(e?.detail?.theme || "") === "dark");
    window.addEventListener("theme:change", onTheme as any);
    const obs = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onChef = (e: any) => setChefNotes(String(e?.detail || ''));
    window.addEventListener('recipe:chef-notes', onChef as any);
    return () => {
      window.removeEventListener("theme:change", onTheme as any);
      window.removeEventListener('recipe:chef-notes', onChef as any);
      obs.disconnect();
    };
  }, []);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedFontSize, setSelectedFontSize] = useState("14px");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const allergenManualRef = React.useRef(false);
  const handleAllergensChange = (a: string[]) => {
    allergenManualRef.current = true;
    setSelectedAllergens(a);
  };
  const [selectedNationality, setSelectedNationality] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedRecipeType, setSelectedRecipeType] = useState<string[]>([]);
  const [selectedPrepMethod, setSelectedPrepMethod] = useState<string[]>([]);
  const [selectedCookingEquipment, setSelectedCookingEquipment] = useState<
    string[]
  >([]);
  const [selectedRecipeAccess, setSelectedRecipeAccess] = useState<string[]>(
    [],
  );
  const [chefNotes, setChefNotes] = useState<string>(() => { try { return localStorage.getItem('recipe:chef-notes') || ''; } catch { return ''; } });
  const stepImageInputRef = useRef<HTMLInputElement | null>(null);
  const STEP_IMG_MAX_W = 720;
  const [image, setImage] = useState<string | null>(null);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState("USD");
  const [currentUnits, setCurrentUnits] = useState<"Imperial" | "Metric">(
    "Imperial",
  );
  const [yieldQty, setYieldQty] = useState<number>(6);
  const [yieldUnit, setYieldUnit] = useState<string>("QTS");
  const yieldManualRef = useRef(false);
  const [portionCount, setPortionCount] = useState<number>(6);
  const [portionUnit, setPortionUnit] = useState<string>("OZ");
  const [nutrition, setNutrition] = useState<any | null>(null);
  const [taxonomy, setTaxonomy] = useState<TaxonomySelection>({ ...defaultSelection });
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);
  const [nutritionPerServing, setNutritionPerServing] = useState(true);
  const dirRef = React.useRef<HTMLDivElement | null>(null);
  const [cookTime, setCookTime] = useState<string>("");
  const [cookTemp, setCookTemp] = useState<string>("");
  const [prepTime, setPrepTime] = useState<string>("");

  const getCurrencySymbol = (c: string) =>
    c === "EUR" ? "€" : c === "GBP" ? "£" : c === "JPY" ? "¥" : "$";
  const calculateTotalCost = () =>
    ingredients.reduce(
      (s, r) => s + (parseFloat(String(r.cost).replace(/[$€£¥,\s]/g, "")) || 0),
      0,
    );
  const calculatePortionCost = () => {
    const t = calculateTotalCost();
    const n = portionCount > 0 ? portionCount : 1;
    return t / n;
  };

  const detectAllergensFromIngredients = (rows: { item: string }[]) => {
    const text = rows
      .map((r) => r.item)
      .join(" ")
      .toLowerCase();
    const s = new Set<string>();
    if (/(milk|cream|butter|cheese|half-?and-?half|yogurt|whey|ricotta|mozzarella|parmesan|parmigiano|pecorino|cheddar|gouda|feta)/.test(text)) s.add("Dairy");
    if (/flour|wheat|barley|rye|bread|pasta|cracker/.test(text))
      s.add("Gluten");
    if (/egg\b|eggs\b|egg yolk|egg white/.test(text)) s.add("Eggs");
    if (/peanut/.test(text)) s.add("Peanuts");
    if (/almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia/.test(text))
      s.add("Nuts");
    if (/sesame/.test(text)) s.add("Sesame");
    if (/soy\b|soybean|soy sauce|tofu|edamame/.test(text)) s.add("Soy");
    if (/clam|shrimp|crab|lobster|scallop|oyster/.test(text)) s.add("Shellfish");
    if (/cod|salmon|tuna|anchov|trout|halibut|haddock|sardine/.test(text)) s.add("Fish");
    if (/onion|shallot|leek|scallion|chive/.test(text)) s.add("Onion/Allium");
    if (/garlic/.test(text)) s.add("Garlic");
    return Array.from(s);
  };
  useEffect(() => {
    if (!allergenManualRef.current)
      setSelectedAllergens(detectAllergensFromIngredients(ingredients as any));
    // ensure default yield percentage when missing; avoid update loop
    if (ingredients.some((r: any) => !r.yield)) {
      setIngredients((prev) => prev.map((r) => (r.yield ? r : { ...r, yield: String(100) })));
    }
  }, [ingredients]);

  const inputClass = `border p-3 rounded-lg text-sm transition-all focus:shadow-md focus:ring-2 ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300 focus:ring-cyan-400/30 shadow-none" : "bg-white border-gray-300 text-black focus:ring-blue-400/30 focus:border-blue-500 shadow-lg"}`;

  // Parse numbers supporting mixed fractions and unicode fractions like "1 1/2", "3/4", "½", "1½"
  const parseQuantity = (s: string): number => {
    if (!s) return NaN as any;
    const map: Record<string, string> = {
      "¼": "1/4",
      "½": "1/2",
      "¾": "3/4",
      "⅐": "1/7",
      "⅑": "1/9",
      "⅒": "1/10",
      "⅓": "1/3",
      "⅔": "2/3",
      "⅕": "1/5",
      "⅖": "2/5",
      "⅗": "3/5",
      "⅘": "4/5",
      "⅙": "1/6",
      "⅚": "5/6",
      "⅛": "1/8",
      "⅜": "3/8",
      "⅝": "5/8",
      "⅞": "7/8",
    };
    let t = String(s).trim();
    // Expand unicode vulgar fractions
    t = t.replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (ch) => map[ch] || ch);
    // Allow forms like "1½" -> "1 1/2"
    t = t.replace(/(\d)\s*(\d\/\d)/, "$1 $2");
    // Mixed fraction
    const m = t.match(/^(-?\d+)(?:\s+(\d+\/\d+))?$/);
    if (m) {
      const base = Number(m[1]);
      if (m[2]) {
        const [n, d] = m[2].split("/").map(Number);
        return base + (d ? n / d : 0);
      }
      return base;
    }
    if (/^\d+\/\d+$/.test(t)) {
      const [n, d] = t.split("/").map(Number);
      return d ? n / d : NaN;
    }
    const num = Number(t.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(num) ? num : (NaN as any);
  };

  // Normalize US volumes to best unit (e.g., 3072 1/4 tsp -> 4 gal)
  const normalizeImperialVolume = (
    qty: number,
    unit: string,
  ): { qty: number; unit: string } => {
    const U = unit.toUpperCase();
    const tspPer: Record<string, number> = {
      TSP: 1,
      TEASPOON: 1,
      TEASPOONS: 1,
      TBSP: 3,
      TABLESPOON: 3,
      TABLESPOONS: 3,
      FLOZ: 6,
      "FL OZ": 6,
      OZFL: 6,
      CUP: 48,
      CUPS: 48,
      PINT: 96,
      PT: 96,
      QUART: 192,
      QT: 192,
      QTS: 192,
      QUARTS: 192,
      GALLON: 768,
      GAL: 768,
      GALLONS: 768,
    };
    const toKey = (u: string) =>
      u.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
    const k = toKey(U);
    const per = tspPer[k];
    if (!per || !Number.isFinite(qty)) return { qty, unit: U };
    let totalTsp = qty * per;
    const order: [string, number][] = [
      ["GALLON", 768],
      ["QUART", 192],
      ["PINT", 96],
      ["CUP", 48],
      ["FLOZ", 6],
      ["TBSP", 3],
      ["TSP", 1],
    ];
    for (const [name, mul] of order) {
      if (totalTsp >= mul) {
        const q = totalTsp / mul;
        return {
          qty: Number(q.toFixed(2)),
          unit: name === "FLOZ" ? "FL OZ" : name,
        };
      }
    }
    return { qty, unit: U };
  };

  // Normalize imperial weights OZ -> LBS when appropriate
  const normalizeImperialWeight = (
    qty: number,
    unit: string,
  ): { qty: number; unit: string } => {
    const U = unit.toUpperCase();
    if (U === "OZ" || U === "OUNCE" || U === "OUNCES") {
      if (qty >= 16) return { qty: Number((qty / 16).toFixed(2)), unit: "LBS" };
      return { qty, unit: "OZ" };
    }
    return { qty, unit: U };
  };

  const estimateYieldPercent = (item: string, prep: string): number | null => {
    const txt = `${item} ${prep}`.toLowerCase();
    if (/salt|spice|pepper|baking soda|baking powder/.test(txt)) return 100;
    if (/peeled|shell|husk|hull|seeded|cored/.test(txt)) return 85;
    if (/trimmed|butchered|deboned|cleaned/.test(txt)) return 90;
    if (/fried|roast|grill|bake/.test(txt)) return 88;
    if (/boil|poach|simmer|stew|steam/.test(txt)) return 95;
    return null;
  };

  React.useEffect(() => {
    const el = dirRef.current;
    if (!el) return;
    if (document.activeElement !== el && el.textContent !== directions)
      el.textContent = directions;
  }, [directions]);

  // Autosave + simple versions
  const serialize = () => ({
    recipeName,
    ingredients,
    directions,
    isDarkMode,
    yieldQty,
    yieldUnit,
    portionCount,
    portionUnit,
    cookTime,
    cookTemp,
    prepTime,
    selectedAllergens,
    selectedNationality,
    selectedCourses,
    selectedRecipeType,
    selectedPrepMethod,
    selectedCookingEquipment,
    selectedRecipeAccess,
    taxonomy,
    image,
  });
  const restore = (s: any) => {
    if (!s) return;
    setRecipeName(s.recipeName || "");
    const baseRows = s.ingredients || [
      { qty: "", unit: "", item: "", prep: "", yield: "", cost: "" },
    ];
    // Auto-parse any row whose item starts with qty/unit (e.g., "24 oz marinara")
    const fixedRows = baseRows.map((r: any) => {
      if (r.qty && r.unit) return r;
      const txt = String(r.item || "");
      if (!txt) return r;
      if (!/^(\s*[0-9¼½¾⅓⅔⅛⅜⅝⅞]|\s*\/\d+|.*,)/i.test(txt)) return r;
      const p = parseIngredientInline(txt.replace(/^\s*\/(\d+)/, "1/$1"));
      if (!p) return r;
      return {
        ...r,
        qty: p.qty ?? r.qty,
        unit: ((p.unit ?? r.unit) || "").toUpperCase(),
        item: p.item ?? r.item,
        prep: p.prep ?? r.prep,
      };
    });
    setIngredients(fixedRows);
    setDirections(s.directions || "1. ");
    setIsDarkMode(!!s.isDarkMode);
    setYieldQty(s.yieldQty || 0);
    setYieldUnit(s.yieldUnit || "QTS");
    setPortionCount(s.portionCount || 1);
    setPortionUnit(s.portionUnit || "OZ");
    setCookTime(s.cookTime || "");
    setCookTemp(s.cookTemp || "");
    setPrepTime(s.prepTime || "");
    setSelectedAllergens(s.selectedAllergens || []);
    setSelectedNationality(s.selectedNationality || []);
    setSelectedCourses(s.selectedCourses || []);
    setSelectedRecipeType(s.selectedRecipeType || []);
    setSelectedPrepMethod(s.selectedPrepMethod || []);
    setSelectedCookingEquipment(s.selectedCookingEquipment || []);
    setSelectedRecipeAccess(s.selectedRecipeAccess || []);
    if (s.taxonomy) setTaxonomy({ ...defaultSelection, ...s.taxonomy });
    setImage(s.image || null);
  };
  const pushHistory = (snap: any) => {
    historyRef.current.push(snap);
    if (historyRef.current.length > 50) historyRef.current.shift();
    localStorage.setItem("recipe:versions", JSON.stringify(historyRef.current));
  };
  useEffect(() => {
    const saved = localStorage.getItem("recipe:draft");
    if (saved)
      try {
        restore(JSON.parse(saved));
      } catch {}
    const versions = localStorage.getItem("recipe:versions");
    if (versions)
      try {
        historyRef.current = JSON.parse(versions) || [];
      } catch {}
    // URL share restore
    if (location.hash.startsWith("#r="))
      try {
        const data = JSON.parse(
          atob(decodeURIComponent(location.hash.slice(3))),
        );
        restore(data);
      } catch {}
  }, []);
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.image) setImage(e.detail.image);
      setShowImagePopup(true);
    };
    window.addEventListener("openImageEditor", handler as any);
    return () => window.removeEventListener("openImageEditor", handler as any);
  }, []);
  useEffect(() => {
    const onAction = (ev: any) => {
      const t = ev?.detail?.type;
      if (!t) return;
      if (t === "convertUnits") convertUnits();
      if (t === "cycleCurrency") cycleCurrency();
      if (t === "scale") scaleRecipe();
      if (t === "saveVersion") pushHistory({ ...serialize(), ts: Date.now() });
      if (t === "finalizeImport") {
        try {
          const title = (recipeName || '').trim() || 'Untitled Recipe';
          const ingLines = ingredients.map((r) => [r.qty, r.unit, r.item, r.prep].filter(Boolean).join(' ').trim()).filter(Boolean);
          const insLines = String(directions||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
          const cover = image && image.startsWith('data:') ? [image] : undefined;
          if (!recipeIdRef.current) {
            recipeIdRef.current = addRecipe({ title, ingredients: ingLines, instructions: insLines, imageDataUrls: cover, tags: [], extra: { source: 'manual', taxonomy, published: true } });
          } else {
            updateRecipe(recipeIdRef.current, { title, ingredients: ingLines, instructions: insLines, imageDataUrls: cover, extra: { taxonomy, published: true } });
          }
        } finally {
          try { localStorage.removeItem('recipe:draft'); } catch {}
          try { localStorage.removeItem('recipe:add:description'); } catch {}
          try { localStorage.removeItem('recipe:chef-notes'); } catch {}
          recipeIdRef.current = null;
          setRecipeName('');
          setIngredients([{ qty:'', unit:'', item:'', prep:'', yield:'', cost:'' }]);
          setDirections('1. ');
          setImage(null);
          setSelectedAllergens([]);
          setSelectedNationality([]);
          setSelectedCourses([]);
          setSelectedRecipeType([]);
          setSelectedPrepMethod([]);
          setSelectedCookingEquipment([]);
          setSelectedRecipeAccess([]);
          setTaxonomy({ ...defaultSelection });
          setYieldQty(6); setYieldUnit('QTS');
          setPortionCount(6); setPortionUnit('OZ');
          setCookTime(''); setCookTemp(''); setPrepTime('');
          setNutrition(null); setNutritionError(null);
          setChefNotes('');
        }
      }
    };
    window.addEventListener("recipe:action", onAction as any);
    return () => window.removeEventListener("recipe:action", onAction as any);
  }, [ingredients, portionCount, currentUnits, currentCurrency]);
  useEffect(() => {
    const id = setTimeout(() => {
      const s = serialize();
      localStorage.setItem("recipe:draft", JSON.stringify(s));
      const title = (recipeName || "").trim();
      const ingLines = ingredients
        .map((r) =>
          [r.qty, r.unit, r.item, r.prep].filter(Boolean).join(" ").trim(),
        )
        .filter(Boolean);
      const insLines = (directions || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (title) {
        if (!recipeIdRef.current) {
          recipeIdRef.current = addRecipe({
            title,
            ingredients: ingLines,
            instructions: insLines,
            tags: [],
            extra: { source: "manual", taxonomy },
          });
        } else {
          updateRecipe(recipeIdRef.current, {
            title,
            ingredients: ingLines,
            instructions: insLines,
            extra: { taxonomy },
          });
        }
      }
    }, 600);
    return () => clearTimeout(id);
  }, [
    recipeName,
    ingredients,
    directions,
    isDarkMode,
    yieldQty,
    yieldUnit,
    portionCount,
    portionUnit,
    cookTime,
    cookTemp,
    prepTime,
    selectedAllergens,
    selectedNationality,
    selectedCourses,
    selectedRecipeType,
    selectedPrepMethod,
    selectedCookingEquipment,
    selectedRecipeAccess,
    image,
  ]);
  useEffect(() => {
    const t = setTimeout(() => setIsRightSidebarCollapsed(true), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const s = serialize();
        pushHistory({ ...s, ts: Date.now() });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const prev = historyRef.current.pop();
        if (prev) {
          futureRef.current.push(serialize());
          restore(prev);
        }
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "z"
      ) {
        e.preventDefault();
        const next = futureRef.current.pop();
        if (next) {
          historyRef.current.push(serialize());
          restore(next);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keyboard nav in grid
  const onGridKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return;
    const move = (r: number, c: number) => {
      const next = document.querySelector<HTMLInputElement>(
        `input[data-row="${r}"][data-col="${c}"]`,
      );
      next?.focus();
      next?.select();
    };
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      col === 4 &&
      row === ingredients.length - 1
    ) {
      e.preventDefault();
      setIngredients([
        ...ingredients,
        { qty: "", unit: "", item: "", prep: "", yield: "", cost: "" },
      ]);
      setTimeout(() => {
        const next = document.querySelector<HTMLInputElement>(
          `input[data-row="${row + 1}"][data-col="0"]`,
        );
        next?.focus();
      }, 0);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(row, col + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(row, col - 1);
    }
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      move(row + 1, col);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      move(row - 1, col);
    }
  };

  // Unit + currency conversions (with mixed fraction support)
  const convertUnits = () => {
    const alias = (u: string) => {
      const k = (u || "").toUpperCase().trim();
      if (k.startsWith("TABLESPO")) return "TBSP";
      if (k.startsWith("TEASPO")) return "TSP";
      if (k === "TSP" || k === "TEASPOON" || k === "TEASPOONS") return "TSP";
      if (k === "TBSP" || k === "TABLESPOON" || k === "TABLESPOONS")
        return "TBSP";
      if (k === "QT" || k === "QTS" || k === "QUART" || k === "QUARTS")
        return "QTS";
      if (k === "PT") return "PINT";
      if (k === "LB" || k === "POUND" || k === "POUNDS") return "LBS";
      if (k === "FLOZ" || k === "FL OZ") return "FL OZ";
      if (k === "GAL") return "GALLON";
      if (k === "CUPS") return "CUP";
      return k;
    };

    // Normalize within Imperial before toggling systems for better readability
    const normalizedImperial = ingredients.map((r) => {
      const n = parseQuantity(r.qty);
      const u = alias(r.unit || "");
      if (!Number.isFinite(n)) return r;
      // Volume normalize
      const volUnits = [
        "TSP",
        "TBSP",
        "FL OZ",
        "CUP",
        "PINT",
        "QTS",
        "QUART",
        "QUARTS",
        "GAL",
        "GALLON",
      ];
      if (volUnits.includes(u)) {
        const norm = normalizeImperialVolume(n, u);
        return { ...r, qty: String(norm.qty), unit: norm.unit };
      }
      // Weight normalize
      if (u === "OZ" || u === "OUNCE" || u === "OUNCES") {
        const norm = normalizeImperialWeight(n, u);
        return { ...r, qty: String(norm.qty), unit: norm.unit };
      }
      return r;
    });

    const map: Record<string, { unit: string; f: (n: number) => number }> = {
      OZ: { unit: "G", f: (n) => n * 28.3495 },
      LBS: { unit: "KG", f: (n) => n * 0.453592 },
      QTS: { unit: "L", f: (n) => n * 0.946353 },
      TSP: { unit: "ML", f: (n) => n * 4.92892 },
      TBSP: { unit: "ML", f: (n) => n * 14.7868 },
      "FL OZ": { unit: "ML", f: (n) => n * 29.5735 },
      CUP: { unit: "ML", f: (n) => n * 236.588 },
      PINT: { unit: "ML", f: (n) => n * 473.176 },
      GALLON: { unit: "L", f: (n) => n * 3.78541 },
    };
    const back: Record<string, { unit: string; f: (n: number) => number }> = {
      G: { unit: "OZ", f: (n) => n / 28.3495 },
      KG: { unit: "LBS", f: (n) => n / 0.453592 },
      L: { unit: "QTS", f: (n) => n / 0.946353 },
      ML: { unit: "TSP", f: (n) => n / 4.92892 },
    };

    const convertTempsInText = (text: string, toMetric: boolean) => {
      if (!text) return text;
      let out = text;
      if (toMetric) {
        out = out.replace(/(\d{2,3})\s*(?:°\s*)?(?:f|fahrenheit|degf|degrees\s*f)\b/gi, (_m, a) => {
          const f = parseInt(a, 10);
          const c = Math.round((f - 32) * 5 / 9);
          return `${c}°C`;
        });
      } else {
        out = out.replace(/(\d{2,3})\s*(?:°\s*)?(?:c|celsius|degc|degrees\s*c)\b/gi, (_m, a) => {
          const c = parseInt(a, 10);
          const f = Math.round(c * 9 / 5 + 32);
          return `${f}°F`;
        });
      }
      return out;
    };
    const convertCookTemp = (s: string, toMetric: boolean) => {
      const t = String(s || '').trim();
      if (!t) return t;
      if (toMetric) {
        if (/(?:°?\s*F\b|fahrenheit)/i.test(t)) {
          const n = parseInt(t.match(/(\d{2,3})/)?.[1] || '', 10);
          if (Number.isFinite(n)) return `${Math.round((n - 32) * 5 / 9)}°C`;
        }
      } else {
        if (/(?:°?\s*C\b|celsius)/i.test(t)) {
          const n = parseInt(t.match(/(\d{2,3})/)?.[1] || '', 10);
          if (Number.isFinite(n)) return `${Math.round(n * 9 / 5 + 32)}°F`;
        }
      }
      return t;
    };

    if (currentUnits === "Imperial") {
      setIngredients(
        normalizedImperial.map((r) => {
          const n = parseQuantity(r.qty);
          const key = alias(r.unit);
          const cv = map[key];
          if (Number.isFinite(n) && cv) {
            return {
              ...r,
              qty: String(Number(cv.f(n)).toFixed(2)),
              unit: cv.unit,
            };
          }
          return r;
        }),
      );
      // convert header units
      if (
        [
          "QTS",
          "QT",
          "QUART",
          "QUARTS",
          "GALLON",
          "GAL",
          "CUP",
          "PINT",
          "FL OZ",
          "FLOZ",
          "TSP",
          "TBSP",
        ].includes(yieldUnit.toUpperCase())
      ) {
        const cv = map[alias(yieldUnit)];
        if (cv) {
          setYieldQty(Number(cv.f(yieldQty).toFixed(2)));
          setYieldUnit(cv.unit);
        }
      }
      if (
        [
          "QTS",
          "QT",
          "QUART",
          "QUARTS",
          "GALLON",
          "GAL",
          "CUP",
          "PINT",
          "FL OZ",
          "FLOZ",
          "TSP",
          "TBSP",
        ].includes(portionUnit.toUpperCase())
      ) {
        const cv = map[alias(portionUnit)];
        if (cv) {
          setPortionUnit(cv.unit);
        }
      }
      setCookTemp((prev) => convertCookTemp(prev, true));
      setDirections((prev) => convertTempsInText(prev, true));
      setCurrentUnits("Metric");
    } else {
      setIngredients(
        ingredients.map((r) => {
          const n = parseQuantity(r.qty);
          const key = alias(r.unit);
          const cv = back[key];
          if (Number.isFinite(n) && cv) {
            return {
              ...r,
              qty: String(Number(cv.f(n)).toFixed(2)),
              unit: cv.unit,
            };
          }
          return r;
        }),
      );
      if (["L", "ML", "G", "KG"].includes(yieldUnit.toUpperCase())) {
        const cv = back[alias(yieldUnit)];
        if (cv) {
          setYieldQty(Number(cv.f(yieldQty).toFixed(2)));
          setYieldUnit(cv.unit);
        }
      }
      if (["L", "ML", "G", "KG"].includes(portionUnit.toUpperCase())) {
        const cv = back[alias(portionUnit)];
        if (cv) {
          setPortionUnit(cv.unit);
        }
      }
      setCookTemp((prev) => convertCookTemp(prev, false));
      setDirections((prev) => convertTempsInText(prev, false));
      setCurrentUnits("Imperial");
    }
  };
  const cycleCurrency = () => {
    const order = ["USD", "EUR", "GBP", "JPY"];
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 0.93,
      GBP: 0.82,
      JPY: 155,
    };
    const i = order.indexOf(currentCurrency);
    const next = order[(i + 1) % order.length];
    const from = rates[currentCurrency];
    const to = rates[next];
    const fx = to / from;
    setIngredients(
      ingredients.map((r) => {
        const n = parseFloat(String(r.cost).replace(/[$€£¥,\s]/g, ""));
        if (isNaN(n)) return r;
        return { ...r, cost: (n * fx).toFixed(2) };
      }),
    );
    setCurrentCurrency(next);
  };
  const scaleRecipe = () => {
    const target = Number(
      prompt("Scale to how many portions?", String(portionCount)) ||
        portionCount,
    );
    if (!target || target <= 0) return;
    const factor = target / (portionCount || 1);
    setIngredients(
      ingredients.map((r) => {
        const n = parseQuantity(r.qty);
        return !Number.isFinite(n) ? r : { ...r, qty: (n * factor).toFixed(2) };
      }),
    );
    setPortionCount(target);
  };

  const exportCSV = () => {
    const header = ["qty", "unit", "item", "prep", "yield", "cost"];
    const rows = [
      header,
      ...ingredients.map((r) => [r.qty, r.unit, r.item, r.prep, r.yield, r.cost]),
      [""],
      ["Directions"],
      ...String(directions || "").split(/\r?\n/).filter(Boolean).map((line, i) => [`${i + 1}. ${line}`]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(recipeName || "recipe").replace(/[^a-z0-9-_]+/gi, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const shareLink = () => {
    const data = serialize();
    const url = `${location.origin}${location.pathname}#r=${encodeURIComponent(btoa(JSON.stringify(data)))}`;
    const title = recipeName || 'Recipe';
    const ing = ingredients.map((r)=>[r.qty,r.unit,r.item,r.prep].filter(Boolean).join(' ')).filter(Boolean).join('\n');
    const ins = String(directions||'').split(/\r?\n/).filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('\n');
    const text = `${title}\n\nIngredients:\n${ing || '-'}\n\nDirections:\n${ins || '-'}\n\nLink: ${url}`;
    navigator.clipboard.writeText(text);
    alert(`${title} copied to clipboard`);
  };

  // Auto-calc batch yield from volume units if not set manually
  useEffect(() => {
    if (yieldManualRef.current) return;
    const tspPer: Record<string, number> = {
      TSP: 1,
      TEASPOON: 1,
      TEASPOONS: 1,
      TBSP: 3,
      TABLESPOON: 3,
      TABLESPOONS: 3,
      FLOZ: 6,
      "FL OZ": 6,
      OZFL: 6,
      CUP: 48,
      CUPS: 48,
      PINT: 96,
      PT: 96,
      QUART: 192,
      QT: 192,
      QTS: 192,
      QUARTS: 192,
      GALLON: 768,
      GAL: 768,
      GALLONS: 768,
    };
    const toKey = (u: string) =>
      (u || "").replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
    let totalTsp = 0;
    for (const r of ingredients) {
      const n = parseQuantity(String(r.qty || ""));
      const per = tspPer[toKey(r.unit || "")];
      if (Number.isFinite(n) && per) {
        const y = Number(String(r.yield || "").replace(/[^0-9.\-]/g, ""));
        const factor =
          Number.isFinite(y) && y > 0 ? Math.max(0, Math.min(1, y / 100)) : 1;
        totalTsp += n * per * factor;
      }
    }
    if (totalTsp > 0) {
      const order: [string, number][] = [
        ["GALLON", 768],
        ["QUART", 192],
        ["PINT", 96],
        ["CUP", 48],
        ["FLOZ", 6],
        ["TBSP", 3],
        ["TSP", 1],
      ];
      for (const [name, mul] of order) {
        if (totalTsp >= mul) {
          const q = totalTsp / mul;
          setYieldQty(Number(q.toFixed(2)));
          setYieldUnit(
            name === "FLOZ" ? "FL OZ" : name === "QUART" ? "QTS" : name,
          );
          break;
        }
      }
    }
  }, [ingredients]);

  function parseIngredientInline(s: string): { qty?: string; unit?: string; item?: string; prep?: string } | null {
    if (!s) return null;
    const map: Record<string, string> = { "¼": "1/4", "½": "1/2", "¾": "3/4", "⅓": "1/3", "⅔": "2/3", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8" };
    let t = s.trim().replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, (ch) => map[ch] || ch);
    t = t.replace(/^(?:\s*)\/(\d+)/, "1/$1");
    t = t.replace(/(\d)(\s*)(\d\/\d)/, "$1 $3");
    const m = t.match(/^\s*([0-9]+(?:\.[0-9]+)?(?:\s+[0-9]+\/[0-9]+)?|[0-9]+\/[0-9]+)\s*([a-zA-Z\.]+)?\s*(.*)$/);
    const knownUnits = new Set(["LBS","LB","OZ","TSP","TBSP","FL OZ","FLOZ","CUP","CUPS","PINT","PT","QTS","QT","QUART","QUARTS","GAL","GALLON","GALLONS","ML","L","G","KG","GRAM","GRAMS","LITER","LITERS","LITRES","EACH","EA"]);
    const normalizeUnit = (u: string) => {
      const k = (u || "").replace(/\./g, "").toUpperCase();
      if (!k) return "EACH";
      if (k === "POUND" || k === "POUNDS" || k === "LB") return "LBS";
      if (k === "OUNCE" || k === "OUNCES" || k === "OZS") return "OZ";
      if (k === "TEASPOON" || k === "TEASPOONS") return "TSP";
      if (k === "TABLESPOON" || k === "TABLESPOONS") return "TBSP";
      if (k === "QUART" || k === "QUARTS" || k === "QT") return "QTS";
      if (k === "FLOZ") return "FL OZ";
      if (k === "CUPS") return "CUP";
      return k;
    };
    const finalize = (rest: string) => {
      let item = rest.trim();
      let prep = "";
      const ci = item.indexOf(",");
      if (ci >= 0) {
        prep = item.slice(ci + 1).trim().toLowerCase();
        item = item.slice(0, ci).trim();
      }
      const lead = item.match(/^(chopped|diced|minced|sliced|grated|crushed|pureed|melted|softened|cubed|julienned|shredded)\s+(.*)$/i);
      if (lead) {
        prep = prep || lead[1].toLowerCase();
        item = lead[2].trim();
      }
      return { item, prep };
    };
    if (m) {
      const rawQty = m[1];
      const rawUnit = m[2] || "";
      let rest = m[3] || "";
      let qty = rawQty;
      const parts = rawQty.split(" ");
      if (parts.length === 2 && /\d+\/\d+/.test(parts[1])) {
        const [n, d] = parts[1].split("/").map(Number);
        qty = String(Number(parts[0]) + (d ? n / d : 0));
      } else if (/^\d+\/\d+$/.test(rawQty)) {
        const [n, d] = rawQty.split("/").map(Number);
        qty = String(d ? n / d : Number(rawQty));
      }
      let unit = normalizeUnit(rawUnit);
      if (!knownUnits.has(unit)) {
        rest = `${rawUnit} ${rest}`.trim();
        unit = "EACH";
      }
      const { item, prep } = finalize(rest);
      return { qty, unit: unit || "EACH", item, prep };
    }
    if (/,/.test(t)) {
      const ci = t.indexOf(",");
      const item = t.slice(0, ci).trim();
      const prep = t.slice(ci + 1).trim().toLowerCase();
      return { item, prep };
    }
    return null;
  }

  // Auto-parse any rows that have inline qty/unit in the item field on initial load or paste
  useEffect(() => {
    let changed = false;
    const next = ingredients.map((r) => {
      if ((r.qty && r.unit) || !r.item) return r;
      if (!/^(\s*[0-9¼½¾⅓������⅜⅝⅞]|\s*\/\d+|.*,)\b/i.test(String(r.item))) return r;
      const p = parseIngredientInline(String(r.item));
      if (!p) return r;
      const updated = {
        ...r,
        qty: p.qty ?? r.qty,
        unit: ((p.unit ?? r.unit) || "").toUpperCase(),
        item: p.item ?? r.item,
        prep: p.prep ?? r.prep,
      };
      if (JSON.stringify(updated) !== JSON.stringify(r)) changed = true;
      return updated;
    });
    if (changed) setIngredients(next);
  }, [ingredients]);

  // Compute theoretical volume (ml) from ingredient rows
  const theoreticalVolumeMl = React.useMemo(() => {
    const U: Record<string, number> = {
      ML: 1,
      L: 1000,
      TSP: 4.92892,
      TBSP: 14.7868,
      OZ: 29.5735,
      'FL OZ': 29.5735,
      CUP: 240,
      PT: 473.176,
      PINT: 473.176,
      QTS: 946.353,
      QT: 946.353,
      GAL: 3785.41,
      GALLON: 3785.41,
    };
    let ml = 0;
    for (const r of ingredients) {
      const q = Number((r.qty||'').toString().replace(/[^0-9.]/g,''));
      const u = (r.unit||'').toUpperCase();
      if (!Number.isFinite(q) || q<=0) continue;
      if (U[u]) ml += q * U[u];
      else if (u==='LBS' || u==='LB' || u==='G' || u==='GRAM' || u==='GRAMS' || u==='KG') {
        const massG = u==='LBS'||u==='LB'? q*453.592 : u==='KG'? q*1000 : q;
        ml += massG; // ~1g per ml
      }
    }
    return ml;
  }, [ingredients]);
  const formatMl = (ml: number) => {
    if (!ml || ml<=0) return '—';
    if (ml >= 3785.41) return `${(ml/3785.41).toFixed(2)} GALLON`;
    if (ml >= 946.353) return `${(ml/946.353).toFixed(2)} QTS`;
    if (ml >= 473.176) return `${(ml/473.176).toFixed(2)} PINT`;
    if (ml >= 240) return `${(ml/240).toFixed(2)} CUP`;
    if (ml >= 29.5735) return `${(ml/29.5735).toFixed(1)} FL OZ`;
    return `${Math.round(ml)} ML`;
  };

  const analyzeNutrition = async () => {
    try {
      setNutritionLoading(true);
      setNutritionError(null);
      const rows = ingredients.filter((r) => r.qty || r.item);
      const isConvertible = (u: string) =>
        [
          "TSP",
          "TEASPOON",
          "TEASPOONS",
          "TBSP",
          "TABLESPOON",
          "TABLESPOONS",
          "FLOZ",
          "FL OZ",
          "CUP",
          "CUPS",
          "PINT",
          "PT",
          "QUART",
          "QUARTS",
          "QT",
          "QTS",
          "GAL",
          "GALLON",
          "GALLONS",
          "OZ",
          "OUNCE",
          "OUNCES",
          "LB",
          "LBS",
          "POUND",
          "POUNDS",
          "G",
          "GRAM",
          "GRAMS",
          "KG",
          "ML",
          "L",
          "LITER",
          "LITERS",
          "LITRES",
          "EACH",
          "EA",
        ].includes((u || "").toUpperCase());
      const ingr = rows.map((r) => {
        const u = (r.unit || "").toUpperCase();
        if (isConvertible(u))
          return [r.qty, r.unit, r.item, r.prep].filter(Boolean).join(" ");
        return [r.item, r.prep].filter(Boolean).join(", ");
      });
      const yields = rows.map((r) => {
        const y = Number(String(r.yield).replace(/[^0-9.\-]/g, ""));
        return Number.isFinite(y) ? y : null;
      });
      const res = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipeName || "Recipe",
          ingr,
          yields,
          yieldQty,
          yieldUnit,
          prepMethod: selectedPrepMethod.join(", "),
        }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({})))?.error ||
            `Request failed: ${res.status}`,
        );
      const data = await res.json();
      setNutrition(data);
    } catch (e: any) {
      setNutritionError(e.message || "Unable to analyze nutrition");
    } finally {
      setNutritionLoading(false);
    }
  };

  return (
    <div className={`relative w-full min-h-screen transition-all duration-300 text-foreground`} data-echo-key="page:recipes:add">
      <div
        className={`hidden ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-black to-blue-900" : "bg-gradient-to-br from-gray-50 to-white"}`}
      >
        <div className="w-full px-0 py-0 flex justify-between items-center">
          <div className="p-0.5">
            <div className="h-12 w-auto flex items-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fc1bbdbb47a354d9ebc60f96efcabf821%2F544726159ed9468bb33ed78346c7b51b?format=webp&width=400"
                alt="Echo Recipe Pro"
                className="h-10 md:h-12 lg:h-14 w-auto select-none"
                draggable={false}
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setIsRightSidebarCollapsed((v) => !v)}
                title="Toggle Tools"
                className="p-1 rounded hover:bg-black/10"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={scaleRecipe}
                title="Scale Recipe"
                className="p-1 rounded hover:bg-black/10"
              >
                <Scale className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  pushHistory({ ...serialize(), ts: Date.now() });
                  alert("Snapshot saved");
                }}
                title="Save Version"
                className="p-1 rounded hover:bg-black/10"
              >
                <NotebookPen className="w-5 h-5" />
              </button>
              <button
                onClick={convertUnits}
                title="Convert Units"
                className="p-1 rounded hover:bg-black/10"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
              <button
                onClick={cycleCurrency}
                title="Change Currency"
                className="p-1 rounded hover:bg-black/10"
              >
                <CircleDollarSign className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
                }
                title="Recipe Tools"
                className="p-1 rounded hover:bg-black/10"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 ml-2">
                <Sun className="w-4 h-4" />
                <button
                  onClick={() => {
                    setIsDarkMode((v) => {
                      const next = !v;
                      const root = document.documentElement;
                      if (next) root.classList.add("dark");
                      else root.classList.remove("dark");
                      const ev = new CustomEvent("theme:change", { detail: { theme: next ? "dark" : "light" } });
                      window.dispatchEvent(ev);
                      return next;
                    });
                  }}
                  className={`w-8 h-4 rounded-full transition-colors ${isDarkMode ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
                <Moon className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 h-full overflow-y-auto">
        <div className="w-full px-6 space-y-6 pb-8">
          {/* Removed old hamburger toggle button */}
          <div className="flex items-end gap-4" data-echo-key="section:add:basics">
            <div
              className={`w-2/3 border p-4 rounded-xl shadow-lg ${isDarkMode ? "border-cyan-400/30 bg-black/50 shadow-cyan-400/20" : "border-gray-200 bg-white shadow-gray-200/50"} backdrop-blur-sm`}
            >
              <input
                type="text"
                maxLength={50}
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="RECIPE NAME"
                className={`w-full text-lg font-semibold uppercase bg-transparent focus:outline-none transition-colors ${isDarkMode ? "text-cyan-400 placeholder-cyan-600" : "text-gray-900 placeholder-gray-500"} focus:placeholder-gray-400`}
                data-echo-key="field:add:name"
              />
              <textarea
                placeholder="Description"
                className={`mt-2 w-full border rounded-lg p-3 text-sm ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-300"}`}
                rows={3}
                onChange={(e)=> localStorage.setItem('recipe:add:description', e.target.value)}
                defaultValue={(()=>{ try { return localStorage.getItem('recipe:add:description') || '' } catch { return '' } })()}
                data-echo-key="field:add:description"
              />
            </div>
            <div
              className={`border rounded-xl w-1/3 flex flex-col justify-end shadow-lg ${isDarkMode ? "bg-red-900/20 border-red-400/30 shadow-red-400/20" : "bg-red-50/80 border-red-200 shadow-gray-200/50"} backdrop-blur-sm`}
              style={{ minHeight: "3rem" }}
            >
              <div className="p-3 flex flex-col" data-echo-key="section:add:allergens">
                <div
                  className={`font-semibold text-xs mb-2 ${isDarkMode ? "text-red-400" : "text-red-700"}`}
                >
                  ALLERGENS
                </div>
                {selectedAllergens.length ? (
                  <div
                    className={`grid grid-cols-6 gap-1 text-xs ${isDarkMode ? "text-red-300" : "text-red-700"}`}
                  >
                    {selectedAllergens.map((a) => (
                      <div key={a}>{a}</div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`text-xs italic ${isDarkMode ? "text-red-500" : "text-red-400"}`}
                  >
                    No allergens selected
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 mt-1">
            <div
              className="w-2/3 flex flex-col space-y-6"
              style={{ minHeight: "18rem" }}
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${isDarkMode ? "text-cyan-300" : "text-black"}`}
                    >
                      COOK TIME:
                    </span>
                    <input
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                      placeholder="2:30"
                      className={`w-24 p-3 ${inputClass}`}
                      data-echo-key="field:add:time"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${isDarkMode ? "text-cyan-300" : "text-black"}`}
                    >
                      COOK TEMP:
                    </span>
                    <input
                      value={cookTemp}
                      onChange={(e) => setCookTemp(e.target.value)}
                      placeholder="350F"
                      className={`w-24 p-3 ${inputClass}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${isDarkMode ? "text-cyan-300" : "text-black"}`}
                    >
                      PREP TIME:
                    </span>
                    <input
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="0:20"
                      className={`w-24 p-3 ${inputClass}`}
                    />
                  </div>
                </div>
                <div
                  className={`text-sm space-y-2 ${isDarkMode ? "text-cyan-300" : "text-gray-700"}`}
                >
                  <div className="flex items-center gap-4">
                    <span>
                      <span className="font-bold">FULL RECIPE:</span>{" "}
                      {getCurrencySymbol(currentCurrency)}
                      {calculateTotalCost().toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold">YIELD:</span>
                      <input
                        type="number"
                        value={yieldQty}
                        onChange={(e) => {
                          yieldManualRef.current = true;
                          setYieldQty(Math.max(0, Number(e.target.value)));
                        }}
                        className={`w-16 px-2 py-1 border rounded text-sm ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-300"}`}
                        data-echo-key="field:add:yield"
                      />
                      <input
                        value={yieldUnit}
                        onChange={(e) => {
                          yieldManualRef.current = true;
                          setYieldUnit(e.target.value.toUpperCase());
                        }}
                        className={`w-24 px-2 py-1 border rounded text-sm uppercase ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-300"}`}
                      />
                    </span>
                    <span>
                      <span className="font-bold">RECIPE ACCESS:</span>{" "}
                      {selectedRecipeAccess.length
                        ? selectedRecipeAccess.join(", ").toUpperCase()
                        : "NONE"}
                    </span>
                    <span>
                      <span className="font-bold">RECIPE:</span>{" "}
                      {selectedRecipeType.includes("Full Recipe") ? "FULL" : selectedRecipeType.includes("Sub Recipe") ? "SUB" : "UNSPECIFIED"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="font-bold">PORTION:</span>
                      <input
                        type="number"
                        value={portionCount}
                        onChange={(e) =>
                          setPortionCount(Math.max(1, Number(e.target.value)))
                        }
                        className={`w-16 px-2 py-1 border rounded text-sm ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-300"}`}
                      />
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold">UNIT:</span>
                      <input
                        value={portionUnit}
                        onChange={(e) =>
                          setPortionUnit(e.target.value.toUpperCase())
                        }
                        className={`w-24 px-2 py-1 border rounded text-sm uppercase ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-300"}`}
                      />
                    </span>
                    <span>
                      <span className="font-bold">PORTION COST:</span>{" "}
                      {getCurrencySymbol(currentCurrency)}
                      {calculatePortionCost().toFixed(2)}
                    </span>
                    <span title="Theoretical Volume">
                      <span className="font-bold">Ψ:</span> {formatMl(theoreticalVolumeMl)}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`border rounded-xl p-4 h-full shadow-lg ${isDarkMode ? "bg-blue-900/20 border-blue-400/30 shadow-blue-400/20" : "bg-blue-50 border-blue-200 shadow-gray-300/60"}`}
              >
                <div className={`font-semibold text-sm mb-3 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
                  Modifiers
                </div>
                <div className={`${isDarkMode ? "bg-blue-900/20 border-blue-400/30" : "bg-blue-50 border-blue-200"} border rounded-lg p-2 text-xs`}>
                  {(() => { const diet = new Set(taxonomy.diets); const txt=(ingredients.map(r=>`${r.qty} ${r.unit} ${r.item}`).join(' ').toLowerCase()); const meatRe=/(beef|pork|chicken|lamb|fish|shrimp|gelatin)/; const issues: string[] = []; const dir = (directions||'').toLowerCase(); const tempMatch = dir.match(/(\d{2,3})\s*(?:°\s*)?(?:f|fahrenheit|degf)/i) || dir.match(/(\d{2,3})\s*degrees?\s*f/i); const cookT = String(cookTemp||'').match(/\d{2,3}/)?.[0]; if (tempMatch && cookT && tempMatch[1]!==cookT) issues.push(`Cook temp mismatch: directions ${tempMatch[1]}F vs field ${cookT}F`); if ((diet.has('vegetarian')||diet.has('vegan')) && meatRe.test(txt)) issues.push('Selected diet conflicts with ingredients.'); return issues.length? (<div className="mb-2 text-red-600">{issues.map((s,i)=>(<div key={i}>{s}</div>))}</div>) : null; })()}
                  <div className="grid grid-cols-8 gap-1">
                    {taxonomy.cuisine && (
                      <div className="col-span-2">
                        <div className="font-semibold">Cuisine</div>
                        <div>{taxonomy.cuisine}</div>
                      </div>
                    )}
                    {taxonomy.difficulty && (
                      <div className="col-span-2">
                        <div className="font-semibold">Difficulty</div>
                        <div>{taxonomy.difficulty}</div>
                      </div>
                    )}
                    {taxonomy.mealPeriod && (
                      <div className="col-span-2">
                        <div className="font-semibold">Meal</div>
                        <div>{taxonomy.mealPeriod}</div>
                      </div>
                    )}
                    {taxonomy.serviceStyle && (
                      <div className="col-span-2">
                        <div className="font-semibold">Service</div>
                        <div>{taxonomy.serviceStyle}</div>
                      </div>
                    )}
                    {taxonomy.course.length>0 && (
                      <div className="col-span-4">
                        <div className="font-semibold">Course</div>
                        <div className="flex flex-wrap gap-1">{[...taxonomy.course].sort().map(v=> (<span key={v} className="px-1 py-0.5 rounded border">{v}</span>))}</div>
                      </div>
                    )}
                    {taxonomy.pastry.length>0 && (
                      <div className="col-span-4">
                        <div className="font-semibold">Pastry</div>
                        <div className="flex flex-wrap gap-1">{[...taxonomy.pastry].sort().map(v=> (<span key={v} className="px-1 py-0.5 rounded border">{v}</span>))}</div>
                      </div>
                    )}
                    {taxonomy.technique.length>0 && (
                      <div className="col-span-4">
                        <div className="font-semibold">Technique</div>
                        <div className="flex flex-wrap gap-1">{[...taxonomy.technique].sort().map(v=> (<span key={v} className="px-1 py-0.5 rounded border">{v}</span>))}</div>
                      </div>
                    )}
                    {taxonomy.components.length>0 && (
                      <div className="col-span-4">
                        <div className="font-semibold">Components</div>
                        <div className="flex flex-wrap gap-1">{[...taxonomy.components].sort().map(v=> (<span key={v} className="px-1 py-0.5 rounded border">{v}</span>))}</div>
                      </div>
                    )}
                    {taxonomy.equipment.length>0 && (
                      <div className="col-span-4">
                        <div className="font-semibold">Equipment</div>
                        <div className="flex flex-wrap gap-1">{[...taxonomy.equipment].sort().map(v=> (<span key={v} className="px-1 py-0.5 rounded border">{v}</span>))}</div>
                      </div>
                    )}
                    {taxonomy.diets.length>0 && (
                      <div className="col-span-4">
                        <div className="font-semibold">Diets</div>
                        <div className="flex flex-wrap gap-1">{[...taxonomy.diets].sort().map(v=> (<span key={v} className="px-1 py-0.5 rounded border">{v}</span>))}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1/3 flex justify-center" data-echo-key="section:add:photos">
              <div
                className="flex-shrink-0"
                style={{ width: "17rem", height: "17rem" }}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Recipe"
                    className="w-full h-full object-contain rounded-md bg-white"
                    style={{
                      border: "0.5px solid #000",
                      boxShadow:
                        "0 6px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 border rounded-md flex items-center justify-center">
                    <label className="text-xs text-gray-600 cursor-pointer" data-echo-key="cta:add:upload">
                      <input type="file" accept="image/*" className="hidden" onChange={async(e)=>{ const f=e.target.files?.[0]; if(!f) return; try{ const reader=new FileReader(); reader.onload=()=> setImage(String(reader.result)); reader.readAsDataURL(f);}catch{}}} />
                      Upload Photo
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className={`ingredients-card rounded-2xl p-6 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gradient-to-b from-white to-slate-50 border-gray-200"}`}
            data-echo-key="section:add:ingredients"
          >
            <h3
              className={`font-bold text-xl mb-6 ${isDarkMode ? "text-cyan-400" : "text-gray-900"}`}
            >
              INGREDIENTS
            </h3>
            <div className="ingredients-grid mt-2 mb-1">
              {["QTY", "UNIT", "ITEM", "PREP", "YIELD %", "COST"].map(
                (h, i) => (
                  <div
                    key={i}
                    className={`text-xs font-medium ${isDarkMode ? "text-cyan-400" : "text-black"} ${h === "COST" ? "text-right" : ""}`}
                  >
                    {h}
                  </div>
                ),
              )}
            </div>
            <div className="space-y-2 ingredient-grid">
              {ingredients.map((line, index) => {
                const qtyNum = parseQuantity(String(line.qty || ""));
                const qtyErr = !!line.qty && !Number.isFinite(qtyNum);
                const yieldErr =
                  !!line.yield &&
                  isNaN(Number(String(line.yield).replace(/[^0-9.\-]/g, "")));
                const costNum = Number(
                  String(line.cost).replace(/[$€£¥,\s]/g, ""),
                );
                const updateAndNormalize = (row: any) => {
                  // Auto-fill yield if empty
                  if (!row.yield) {
                    const y = estimateYieldPercent(
                      row.item || "",
                      row.prep || "",
                    );
                    row.yield = String(y ?? 100);
                  }
                  // Normalize on-the-fly for imperial units
                  const n = parseQuantity(row.qty);
                  const u = (row.unit || "").toUpperCase();
                  if (Number.isFinite(n)) {
                    const volSet = [
                      "TSP",
                      "TEASPOON",
                      "TEASPOONS",
                      "TBSP",
                      "TABLESPOON",
                      "TABLESPOONS",
                      "FL OZ",
                      "FLOZ",
                      "CUP",
                      "CUPS",
                      "PINT",
                      "PT",
                      "QUART",
                      "QUARTS",
                      "QT",
                      "QTS",
                      "GAL",
                      "GALLON",
                      "GALLONS",
                    ];
                    if (volSet.includes(u)) {
                      const norm = normalizeImperialVolume(n, u);
                      row.qty = String(norm.qty);
                      row.unit = norm.unit;
                    }
                    if (u === "OZ" || u === "OUNCE" || u === "OUNCES") {
                      const norm = normalizeImperialWeight(n, u);
                      row.qty = String(norm.qty);
                      row.unit = norm.unit;
                    }
                  }
                  return row;
                };
                return (
                  <div key={index} className="ingredients-grid ingredient-row" data-echo-key="row:add:ingredient">
                    <input
                      data-row={index}
                      data-col={0}
                      onKeyDown={onGridKeyDown}
                      aria-invalid={qtyErr}
                      title={qtyErr ? "Enter a number" : ""}
                      className={`${inputClass} ${qtyErr ? "ring-2 ring-red-500 border-red-400" : ""}`}
                      value={line.qty}
                      onChange={(e) => {
                        const v = [...ingredients];
                        v[index].qty = e.target.value;
                        setIngredients(
                          v.map((r, i) =>
                            i === index ? updateAndNormalize({ ...r }) : r,
                          ),
                        );
                      }}
                    />
                    <input
                      data-row={index}
                      data-col={1}
                      onKeyDown={onGridKeyDown}
                      className={inputClass}
                      value={line.unit}
                      onChange={(e) => {
                        const v = [...ingredients];
                        v[index].unit = e.target.value.toUpperCase();
                        setIngredients(
                          v.map((r, i) =>
                            i === index ? updateAndNormalize({ ...r }) : r,
                          ),
                        );
                      }}
                    />
                    <input
                      data-row={index}
                      data-col={2}
                      onKeyDown={onGridKeyDown}
                      className={inputClass}
                      value={line.item}
                      onPaste={(e) => {
                        const text = e.clipboardData?.getData('text') || '';
                        if (!text) return;
                        if (/\n|\r/.test(text)) {
                          e.preventDefault();
                          const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                          if (lines.length === 0) return;
                          const v = [...ingredients];
                          let i = index;
                          for (const lineText of lines) {
                            if (!v[i]) v[i] = { qty: "", unit: "", item: "", prep: "", yield: "", cost: "" };
                            const p = parseIngredientInline(lineText) || { item: lineText } as any;
                            v[i] = updateAndNormalize({
                              ...v[i],
                              qty: (p as any).qty ?? v[i].qty,
                              unit: (((p as any).unit ?? v[i].unit) || "").toUpperCase(),
                              item: (p as any).item ?? v[i].item,
                              prep: (p as any).prep ?? v[i].prep,
                            });
                            i++;
                          }
                          if (!v[i]) v.push({ qty: "", unit: "", item: "", prep: "", yield: "", cost: "" });
                          setIngredients(v);
                          setTimeout(() => {
                            const next = document.querySelector<HTMLInputElement>(`input[data-row='${index + lines.length}'][data-col='2']`);
                            next?.focus();
                          }, 0);
                        }
                      }}
                      onChange={(e) => {
                        const text = e.target.value;
                        const v = [...ingredients];
                        v[index].item = text;
                        const hasCues = /(cups?|tsp|tbsp|oz|ounces?|lb|lbs|g|kg|ml|l|quarts?|qt|qts|pints?|pt|gal|gallons?|teaspoons?|tablespoons?|^\s*[0-9¼½¾⅓⅔⅛⅜⅝⅞]|^\s*\/\d+|,)/i.test(text);
                        if (hasCues) {
                          const p = parseIngredientInline(text);
                          if (p) {
                            v[index].qty = p.qty ?? v[index].qty;
                            v[index].unit = ((p.unit ?? v[index].unit) || "").toUpperCase();
                            v[index].item = p.item ?? v[index].item;
                            v[index].prep = p.prep ?? v[index].prep;
                          }
                        }
                        setIngredients(
                          v.map((r, i) =>
                            i === index ? updateAndNormalize({ ...r }) : r,
                          ),
                        );
                      }}
                      onBlur={(e) => {
                        const text = e.target.value.trim();
                        const parsed = parseIngredientInline(text.replace(/^\s*\/(\d+)/, '1/$1'));
                        if (parsed) {
                          const v = [...ingredients];
                          v[index] = updateAndNormalize({
                            ...v[index],
                            qty: parsed.qty ?? v[index].qty,
                            unit: parsed.unit ?? v[index].unit,
                            item: parsed.item ?? v[index].item,
                            prep: parsed.prep ?? v[index].prep,
                          });
                          setIngredients(v);
                        }
                      }}
                    />
                    <input
                      data-row={index}
                      data-col={3}
                      onKeyDown={onGridKeyDown}
                      className={inputClass}
                      value={line.prep}
                      onChange={(e) => {
                        const v = [...ingredients];
                        v[index].prep = e.target.value;
                        setIngredients(
                          v.map((r, i) =>
                            i === index ? updateAndNormalize({ ...r }) : r,
                          ),
                        );
                      }}
                    />
                    <input
                      data-row={index}
                      data-col={4}
                      onKeyDown={onGridKeyDown}
                      aria-invalid={yieldErr}
                      title={yieldErr ? "Enter a number" : ""}
                      className={`${inputClass} ${yieldErr ? "ring-2 ring-red-500 border-red-400" : ""}`}
                      value={line.yield}
                      onChange={(e) => {
                        const v = [...ingredients];
                        v[index].yield = e.target.value;
                        setIngredients(v);
                      }}
                    />
                    <input
                      data-row={index}
                      data-col={5}
                      onKeyDown={onGridKeyDown}
                      className={`border p-3 rounded-lg text-sm text-right ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-200 text-black"}`}
                      value={line.cost}
                      title={isNaN(costNum) ? "Enter a number" : ""}
                      aria-invalid={isNaN(costNum)}
                      onChange={(e) => {
                        const v = [...ingredients];
                        v[index].cost = e.target.value;
                        setIngredients(v);
                      }}
                    />
                  </div>
                );
              })}
              <div className="flex items-center justify-start gap-2 mt-3">
                <button
                  onClick={() =>
                    setIngredients([
                      ...ingredients,
                      {
                        qty: "",
                        unit: "",
                        item: "",
                        prep: "",
                        yield: "",
                        cost: "",
                      },
                    ])
                  }
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
                <span
                  className={`text-sm font-medium ${isDarkMode ? "text-cyan-400" : "text-black"}`}
                >
                  INGREDIENT
                </span>
                <button
                  onClick={() =>
                    ingredients.length > 1 &&
                    setIngredients(ingredients.slice(0, -1))
                  }
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl p-6 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`font-bold text-xl ${isDarkMode ? "text-cyan-400" : "text-gray-900"}`}
              >
                DIRECTIONS
              </h3>
              <div className="flex gap-3">
                <input ref={stepImageInputRef} type="file" accept="image/*" multiple hidden onChange={async(e)=>{
                  const files = Array.from(e.target.files||[]);
                  for (const f of files){
                    try{ const img=await new Promise<HTMLImageElement>((res,rej)=>{ const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=String(r.result); }; r.onerror=rej; r.readAsDataURL(f); }); const scale = Math.min(1, STEP_IMG_MAX_W / (img.width||STEP_IMG_MAX_W)); const w = Math.round((img.width||STEP_IMG_MAX_W)*scale); const h=Math.round((img.height||STEP_IMG_MAX_W)*scale); const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); if(ctx){ ctx.drawImage(img,0,0,w,h);} const data=c.toDataURL('image/jpeg',0.85); setDirections((d)=> (d?(d+"\n"):"")+`IMG:${data}`); }
                    catch{}
                  }
                  (e.target as HTMLInputElement).value='';
                }} />
                <button
                  title="Insert Step Photo"
                  className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? "hover:bg-gray-700" : ""}`}
                  onClick={()=> stepImageInputRef.current?.click()}
                >
                  <ImageIcon
                    className={`w-5 h-5 ${isDarkMode ? "text-cyan-400" : "text-gray-600"}`}
                  />
                </button>
                <button
                  title="Bold"
                  className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? "hover:bg-gray-700" : ""}`}
                  onClick={() => document.execCommand("bold", false)}
                >
                  <Bold
                    className={`w-5 h-5 ${isDarkMode ? "text-cyan-400" : "text-gray-600"}`}
                  />
                </button>
                <button
                  title="Italic"
                  className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? "hover:bg-gray-700" : ""}`}
                  onClick={() => document.execCommand("italic", false)}
                >
                  <Italic
                    className={`w-5 h-5 ${isDarkMode ? "text-cyan-400" : "text-gray-600"}`}
                  />
                </button>
                <button
                  title="Underline"
                  className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? "hover:bg-gray-700" : ""}`}
                  onClick={() => document.execCommand("underline", false)}
                >
                  <Underline
                    className={`w-5 h-5 ${isDarkMode ? "text-cyan-400" : "text-gray-600"}`}
                  />
                </button>
                <select
                  className={`px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-200 text-gray-900"}`}
                  value={selectedFont}
                  onChange={(e) => {
                    setSelectedFont(e.target.value);
                  }}
                >
                  <option>Arial</option>
                  <option>Times</option>
                  <option>Helvetica</option>
                  <option>Georgia</option>
                </select>
                <select
                  className={`px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300" : "bg-white border-gray-200 text-gray-900"}`}
                  value={selectedFontSize}
                  onChange={(e) => setSelectedFontSize(e.target.value)}
                >
                  {["12px", "14px", "16px", "18px", "20px"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div
              id="directions-textarea"
              contentEditable
              suppressContentEditableWarning
              ref={dirRef}
              spellCheck
              onDragOver={(e)=>{ if(e.dataTransfer?.types?.includes('Files')){ e.preventDefault(); }} }
              onDrop={async(e)=>{ try{ e.preventDefault(); const files=Array.from(e.dataTransfer?.files||[]).filter(f=> f.type.startsWith('image/')); for(const f of files){ const img=await new Promise<HTMLImageElement>((res,rej)=>{ const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=String(r.result); }; r.onerror=rej; r.readAsDataURL(f); }); const scale=Math.min(1, STEP_IMG_MAX_W/(img.width||STEP_IMG_MAX_W)); const w=Math.round((img.width||STEP_IMG_MAX_W)*scale); const h=Math.round((img.height||STEP_IMG_MAX_W)*scale); const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); if(ctx){ ctx.drawImage(img,0,0,w,h);} const data=c.toDataURL('image/jpeg',0.85); setDirections((d)=> (d?(d+"\n"):"")+`IMG:${data}`); } } catch{} }}
              data-echo-key="field:add:steps"
              className={`prose prose-sm max-w-none w-full border p-3 rounded-xl shadow-sm transition-all focus:shadow-md focus:ring-2 resize-none min-h-[160px] overflow-y-auto ${isDarkMode ? "bg-black/50 border-cyan-400/50 text-cyan-300 focus:ring-cyan-400/30" : "bg-white border-gray-200 text-gray-900 focus:ring-blue-400/30 focus:border-blue-400"}`}
              style={{
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                fontFamily: selectedFont,
                fontSize: selectedFontSize,
              }}
              onKeyDown={(e) => {
                const el = dirRef.current;
                if (!el) return;
                const sel = window.getSelection();
                if (!sel || !sel.anchorNode) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const text = el.textContent || "";
                  let offset = 0;
                  const range = sel.getRangeAt(0);
                  const preRange = range.cloneRange();
                  preRange.selectNodeContents(el);
                  preRange.setEnd(range.endContainer, range.endOffset);
                  const containerText = preRange.toString();
                  offset = containerText.length;
                  const before = text.slice(0, offset);
                  const after = text.slice(offset);
                  const lineStart = before.lastIndexOf("\n") + 1;
                  const currentLine = before.slice(lineStart);
                  const m = currentLine.match(/^\s*(\d+)[\.)]?\s*/);
                  const nextNum = m ? String(Number(m[1]) + 1) + ". " : "• ";
                  const newText = before + "\n" + nextNum + after;
                  el.textContent = newText;
                  const newOffset = offset + 1 + nextNum.length;
                  const r = document.createRange();
                  const walker = document.createTreeWalker(
                    el,
                    NodeFilter.SHOW_TEXT,
                  );
                  let seen = 0;
                  let node: Node | null = walker.nextNode();
                  while (node) {
                    const len = (node.textContent || "").length;
                    if (seen + len >= newOffset) {
                      r.setStart(node, newOffset - seen);
                      r.collapse(true);
                      break;
                    }
                    seen += len;
                    node = walker.nextNode();
                  }
                  sel.removeAllRanges();
                  sel.addRange(r);
                  setDirections(newText);
                }
              }}
              onInput={(e) => {
                let t = (e.target as HTMLDivElement).textContent || "";
                const fixes: Record<string, string> = {
                  "fist ": "first ",
                  "teh ": "the ",
                  "mized ": "mixed ",
                  "choped ": "chopped ",
                  "whiskd ": "whisked ",
                };
                let changed = t;
                for (const [k, v] of Object.entries(fixes)) {
                  changed = changed.replace(
                    new RegExp("(^|\\s)" + k, "gi"),
                    (s) =>
                      s.toLowerCase().endsWith(k)
                        ? s.slice(0, -k.length) + v
                        : s,
                  );
                }
                if (changed !== t) {
                  (e.target as HTMLDivElement).textContent = changed;
                  const sel = window.getSelection();
                  if (sel) {
                    const r = document.createRange();
                    const el = dirRef.current!;
                    r.selectNodeContents(el);
                    r.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(r);
                  }
                }
                setDirections(changed);
              }}
            ></div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="ml-auto">
              <button
                data-echo-key="cta:add:publish"
                onClick={() => {
                  const title = (recipeName || '').trim() || 'Untitled Recipe';
                  const ingLines = ingredients.map((r) => [r.qty, r.unit, r.item, r.prep].filter(Boolean).join(' ').trim()).filter(Boolean);
                  const insLines = String(directions||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
                  const cover = image && image.startsWith('data:') ? [image] : undefined;
                  if (!recipeIdRef.current) {
                    recipeIdRef.current = addRecipe({ title, ingredients: ingLines, instructions: insLines, imageDataUrls: cover, tags: [], extra: { source: 'manual', taxonomy, published: true } });
                  } else {
                    updateRecipe(recipeIdRef.current, { title, ingredients: ingLines, instructions: insLines, imageDataUrls: cover, extra: { taxonomy, published: true } });
                  }
                  alert(`Published ${title}`);
                }}
                className={`px-3 py-2 text-sm rounded border ${isDarkMode? 'border-cyan-400/50 text-cyan-300' : 'border-gray-400 text-gray-800'}`}
              >
                Publish
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button
                data-echo-key="cta:add:save"
                onClick={() => {
                  const title = (recipeName || '').trim() || 'Untitled Recipe';
                  const ingLines = ingredients.map((r) => [r.qty, r.unit, r.item, r.prep].filter(Boolean).join(' ').trim()).filter(Boolean);
                  const insLines = String(directions||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
                  const cover = image && image.startsWith('data:') ? [image] : undefined;
                  if (!recipeIdRef.current) {
                    recipeIdRef.current = addRecipe({ title, ingredients: ingLines, instructions: insLines, imageDataUrls: cover, tags: [], extra: { source: 'manual', taxonomy } });
                  } else {
                    updateRecipe(recipeIdRef.current, { title, ingredients: ingLines, instructions: insLines, imageDataUrls: cover, extra: { taxonomy } });
                  }
                  pushHistory({ ...serialize(), ts: Date.now() });
                  alert(`Saved ${title}`);
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-black"
              >
                <Save className="w-5 h-5" />
                Save
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 text-gray-700 hover:text-black"
              >
                <FileDown className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 text-gray-700 hover:text-black"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={shareLink}
                className="flex items-center gap-1 text-gray-700 hover:text-black"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => {
                  const title = recipeName || 'Recipe';
                  const ing = ingredients.map((r)=>[r.qty,r.unit,r.item,r.prep].filter(Boolean).join(' ')).filter(Boolean).join('\n');
                  const ins = String(directions||'').split(/\r?\n/).filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('\n');
                  const bodyText = `${title}\n\nIngredients:\n${ing || '-'}\n\nDirections:\n${ins || '-'}`;
                  const body = encodeURIComponent(bodyText);
                  location.href = `sms:?&body=${body}`;
                }}
                className="flex items-center gap-1 text-gray-700 hover:text-black"
              >
                <Share2 className="w-4 h-4" />
                SMS
              </button>
              <button
                onClick={() => {
                  const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${recipeName || "Recipe"}</title></head><body><h1>${recipeName || "Recipe"}</h1><h3>Ingredients</h3><ul>${ingredients.map((r) => `<li>${[r.qty, r.unit, r.item, r.prep].filter(Boolean).join(" ")}</li>`).join("")}</ul><h3>Directions</h3><pre style="white-space:pre-wrap;font-family:Arial, sans-serif;">${directions}</pre></body></html>`;
                  const blob = new Blob([html], { type: "application/msword" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${(recipeName || "recipe").replace(/[^a-z0-9-_]+/gi, "_")}.doc`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                className="flex items-center gap-1 text-gray-700 hover:text-black"
              >
                <FileDown className="w-4 h-4" />
                Word
              </button>
            </div>
            <button
              onClick={analyzeNutrition}
              disabled={nutritionLoading}
              className={`text-xs px-3 py-2 rounded ${isDarkMode ? "border border-cyan-400/50 hover:bg-cyan-900/20 text-cyan-300" : "border border-gray-400 hover:bg-gray-100 text-gray-800"}`}
            >
              {nutritionLoading ? "Analyzing��" : "Generate Nutrition Label"}
            </button>
          </div>

          <div
            className={`mt-3 rounded-2xl p-6 border ${isDarkMode ? "bg-gray-900/50 border-cyan-400/30" : "bg-white/80 border-gray-200 shadow-sm"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className={`font-bold text-xl ${isDarkMode ? "text-cyan-400" : "text-gray-900"}`}
              >
                NUTRITION
              </h3>
              {nutrition && (
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setNutritionPerServing(true)}
                    className={`${nutritionPerServing ? "bg-blue-600 text-white" : ""} px-2 py-1 rounded border`}
                  >
                    Per Serving
                  </button>
                  <button
                    onClick={() => setNutritionPerServing(false)}
                    className={`${!nutritionPerServing ? "bg-blue-600 text-white" : ""} px-2 py-1 rounded border`}
                  >
                    Whole Recipe
                  </button>
                </div>
              )}
            </div>
            {!nutrition && !nutritionLoading && !nutritionError && (
              <div
                className={`${isDarkMode ? "text-cyan-400/70" : "text-gray-500"}`}
              >
                Click "Generate Nutrition Label" to analyze this recipe.
              </div>
            )}
            {nutritionError && (
              <div className="text-red-500 text-sm">{nutritionError}</div>
            )}
            {nutrition && (
              <div className="flex flex-col md:flex-row gap-4">
                <NutritionLabel
                  data={nutrition}
                  servings={portionCount || 1}
                  perServing={nutritionPerServing}
                />
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm self-start">
                  <div>
                    <span className="font-semibold">Yield:</span> {yieldQty}{" "}
                    {yieldUnit}
                  </div>
                  <div>
                    <span className="font-semibold">Servings:</span>{" "}
                    {portionCount}
                  </div>
                  <div>
                    <span className="font-semibold">Unit:</span> {portionUnit}
                  </div>
                </div>
              </div>
            )}
            {chefNotes && (
              <div className={`mt-4 rounded-xl border p-3 ${isDarkMode? 'border-gray-700 text-cyan-200' : 'border-gray-200 text-gray-800 bg-gradient-to-b from-white to-slate-50'}`}>
                <div className="font-semibold mb-1">Chef Notes</div>
                <div className="whitespace-pre-wrap text-sm">{chefNotes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RightSidebar
        isCollapsed={isRightSidebarCollapsed}
        onToggle={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        selectedAllergens={selectedAllergens}
        onAllergensChange={handleAllergensChange}
        selectedNationality={selectedNationality}
        onNationalityChange={setSelectedNationality}
        selectedCourses={selectedCourses}
        onCoursesChange={setSelectedCourses}
        selectedRecipeType={selectedRecipeType}
        onRecipeTypeChange={setSelectedRecipeType}
        selectedPrepMethod={selectedPrepMethod}
        onPrepMethodChange={setSelectedPrepMethod}
        selectedCookingEquipment={selectedCookingEquipment}
        onCookingEquipmentChange={setSelectedCookingEquipment}
        selectedRecipeAccess={selectedRecipeAccess}
        onRecipeAccessChange={setSelectedRecipeAccess}
        image={image}
        onImageChange={setImage}
        taxonomy={taxonomy}
        onTaxonomyChange={setTaxonomy}
        onRecipeImport={async (data) => {
          const decode = (s: string) =>
            s
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
          if (data?.title)
            setRecipeName(decode(String(data.title)).toUpperCase());
          if (data?.ingredients?.length) {
            const rows = (data.ingredients as string[]).map((s: string) => {
              s = decode(s);
              const fracMap: Record<string, string> = {
                "¼": "1/4",
                "½": "1/2",
                "¾": "3/4",
                "���": "1/7",
                "⅑": "1/9",
                "⅒": "1/10",
                "⅓": "1/3",
                "⅔": "2/3",
                "⅕": "1/5",
                "���": "2/5",
                "⅗": "3/5",
                "⅘": "4/5",
                "⅙": "1/6",
                "⅚": "5/6",
                "⅛": "1/8",
                "⅜": "3/8",
                "⅝": "5/8",
                "⅞": "7/8",
              };
              s = s.replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜���⅞]/g, (ch) => fracMap[ch] || ch);
              const m = s.match(
                /^\s*([0-9]+(?:\.[0-9]+)?(?:\s+[0-9]+\/[0-9]+)?)?\s*([a-zA-Z\.]+)?\s*(.*)$/,
              );
              const qty = m?.[1] ? m[1] : "";
              const unit = m?.[2] ? m[2].toUpperCase() : "";
              const rest = (m?.[3] || "").trim();
              const [item, ...prep] = rest.split(",");
              return {
                qty,
                unit,
                item: item.trim(),
                prep: prep.join(",").trim(),
                yield: "",
                cost: "",
              };
            });
            setIngredients(
              rows.length
                ? rows
                : [
                    {
                      qty: "",
                      unit: "",
                      item: "",
                      prep: "",
                      yield: "",
                      cost: "",
                    },
                  ],
            );
          }
          if (data?.instructions){
            const txt = decode(String(data.instructions));
            setDirections(txt);
            if (/recipe\s+follows|see\s+.+?\s+recipe/i.test(txt)) {
              setChefNotes((prev)=> (prev? prev+"\n" : "") + "Note: This recipe references a sub‑recipe (e.g., buttercream). Import or add the sub‑recipe and link it here.");
            }
          }
          if (data?.image) {
            try {
              const urlStr = String(data.image);
              fetch(urlStr)
                .then((res) => res.blob())
                .then(async (blob) => {
                  const ext = blob.type.includes('png')? 'png' : 'jpg';
                  const fname = `${(data.title||'cover').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-')}.${ext}`;
                  await addImages([new File([blob], fname, { type: blob.type || 'image/jpeg' })], { tags: ['import','web'] });
                  const reader = new FileReader();
                  reader.onload = () => setImage(String(reader.result || urlStr));
                  reader.readAsDataURL(blob);
                })
                .catch(() => setImage(String(data.image)));
            } catch { setImage(String(data.image)); }
          }
          // Top info
          if (data?.yield) {
            const y = String(data.yield);
            const ym = y.match(/([0-9]+(?:\.[0-9]+)?)/);
            const um = y.match(
              /(cups?|quarts?|pints?|gallons?|oz|ounces?|lb|lbs|servings?|qt|qts|gal)/i,
            );
            if (ym && um) {
              setYieldQty(Number(ym[1]));
              setYieldUnit(
                um[1]
                  .toUpperCase()
                  .replace("QUARTS", "QTS")
                  .replace("QUART", "QTS")
                  .replace("QT", "QTS")
                  .replace("GAL", "GALLON")
                  .replace("OUNCES", "OZ")
                  .replace("OUNCE", "OZ")
                  .replace("LBS", "LBS")
                  .replace("LB", "LBS")
                  .replace("CUPS", "CUP"),
              );
            }
          }
          if (data?.cookTime) setCookTime(String(data.cookTime));
          if (data?.prepTime) setPrepTime(String(data.prepTime));
        }}
      />

      <ImageEditorModal
        isOpen={showImagePopup}
        image={image}
        onClose={() => setShowImagePopup(false)}
        onApply={(d) => setImage(d)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default RecipeInputPage;
