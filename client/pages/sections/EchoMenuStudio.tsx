import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyValue } from "./dish-assembly/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Circle,
  Copy,
  Download,
  FilePlus,
  Grid3X3,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Minus,
  Move,
  Pin,
  PinOff,
  Plus,
  Ruler,
  Sparkles,
  Square,
  Trash2,
  Type,
  Wand2,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type DesignerElementType =
  | "heading"
  | "subheading"
  | "body"
  | "menu-item"
  | "image"
  | "shape"
  | "divider";

type DesignerElement = {
  id: string;
  type: DesignerElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  text?: string;
  description?: string;
  price?: number;
  currency?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  color?: string;
  accentColor?: string;
  imageUrl?: string;
  objectFit?: "cover" | "contain";
  shape?: "rectangle" | "ellipse";
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  thickness?: number;
};

type CanvasSettings = {
  background: string;
  margin: number;
  columns: number;
  gutter: number;
  showGrid: boolean;
  showMargins: boolean;
  showColumns: boolean;
  zoom: number;
  gridSize: number;
};

type PageSize = {
  width: number;
  height: number;
};

type MenuTemplate = {
  id: string;
  name: string;
  description: string;
  elements: Array<Omit<DesignerElement, "id">>;
  settings?: Partial<CanvasSettings>;
  pageSize?: PageSize;
};

type ElementDragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

const TEXT_EDITABLE_TYPES: DesignerElementType[] = [
  "heading",
  "subheading",
  "body",
  "menu-item",
];

const isTextEditableElement = (element: DesignerElement) =>
  TEXT_EDITABLE_TYPES.includes(element.type);

const createDraftFromElement = (element: DesignerElement): Partial<DesignerElement> => {
  if (element.type === "menu-item") {
    return {
      name: element.name ?? "",
      text: element.text ?? "",
      description: element.description ?? "",
      price: element.price,
      currency: element.currency ?? "USD",
    };
  }
  return {
    text: element.text ?? "",
  };
};

const extractDraftChanges = (
  element: DesignerElement,
  draft: Partial<DesignerElement>,
): Partial<DesignerElement> => {
  const updates: Partial<DesignerElement> = {};
  if ("text" in draft) {
    updates.text = draft.text ?? "";
  }
  if (element.type === "menu-item") {
    if ("name" in draft) {
      updates.name = draft.name ?? element.name;
    }
    if ("description" in draft) {
      updates.description = draft.description ?? "";
    }
    if ("price" in draft) {
      updates.price = draft.price === undefined ? undefined : draft.price;
    }
    if ("currency" in draft) {
      updates.currency = draft.currency ?? element.currency ?? "USD";
    }
  }
  return updates;
};

type FloatingPanelState = {
  x: number;
  y: number;
  pinned: boolean;
};

const FONT_LIBRARY = [
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
];

const COLOR_PALETTES: Array<{ name: string; swatches: string[] }> = [
  {
    name: "Earthy Mineral",
    swatches: ["#fef6ec", "#c0763a", "#4a3b2a", "#8d7350", "#1f2933"],
  },
  {
    name: "Charcoal & Ice",
    swatches: ["#f8fafc", "#64748b", "#0f172a", "#38bdf8", "#ecfeff"],
  },
  {
    name: "Citrus Atelier",
    swatches: ["#fff8ed", "#f97316", "#facc15", "#2563eb", "#1e293b"],
  },
  {
    name: "Midnight Velvet",
    swatches: ["#101828", "#1f2937", "#f8fafc", "#d946ef", "#818cf8"],
  },
];

const IMAGE_LIBRARY = [
  {
    id: "charred-wagyu",
    label: "Charred Wagyu Striploin",
    url: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "autumn-salad",
    label: "Autumn Market Salad",
    url: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "signature-dessert",
    label: "Smoked Chocolate Mousse",
    url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "chefs-cocktail",
    label: "Chef's Welcome Cocktail",
    url: "https://images.unsplash.com/photo-1563371351-e53ebb744a1f?auto=format&fit=crop&w=900&q=80",
  },
];

const PAGE_PRESETS = [
  { id: "letter", label: "US Letter 8.5×11", width: 816, height: 1056 },
  { id: "legal", label: "US Legal 8.5×14", width: 816, height: 1344 },
  { id: "a4", label: "A4 210×297mm", width: 794, height: 1123 },
  { id: "square", label: "Square 12×12", width: 960, height: 960 },
];

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

const seasonalTemplate: MenuTemplate = {
  id: "seasonal",
  name: "Seasonal Tasting",
  description:
    "Serif-led hierarchy with photo-driven storytelling and right-aligned pricing.",
  pageSize: { width: 816, height: 1056 },
  settings: {
    background: "#fefaf4",
    margin: 64,
    columns: 2,
    gutter: 32,
    showGrid: true,
    showMargins: true,
    showColumns: false,
  },
  elements: [
    {
      type: "shape",
      name: "Vellum Frame",
      x: 36,
      y: 36,
      width: 744,
      height: 984,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      shape: "rectangle",
      fill: "#f6f1e7",
      borderColor: "#f6f1e7",
      borderWidth: 0,
      borderRadius: 48,
    },
    {
      type: "shape",
      name: "Copper Accent",
      x: 72,
      y: 120,
      width: 12,
      height: 720,
      rotation: 0,
      opacity: 1,
      zIndex: 5,
      shape: "rectangle",
      fill: "#c0763a",
      borderColor: "#c0763a",
      borderWidth: 0,
      borderRadius: 8,
    },
    {
      type: "heading",
      name: "Menu Title",
      text: "Spring Chef's Table",
      x: 120,
      y: 104,
      width: 420,
      height: 90,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'Playfair Display', serif",
      fontSize: 54,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: 2.2,
      color: "#1c1c1c",
      align: "left",
    },
    {
      type: "subheading",
      name: "Event Details",
      text: "April 2024 · Five Courses",
      x: 120,
      y: 176,
      width: 380,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      fontWeight: 400,
      letterSpacing: 3,
      lineHeight: 1.4,
      color: "#4b5563",
      align: "left",
    },
    {
      type: "image",
      name: "Hero Dish",
      imageUrl:
        "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1000&q=80",
      x: 500,
      y: 120,
      width: 240,
      height: 320,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      objectFit: "cover",
      borderRadius: 28,
    },
    {
      type: "divider",
      name: "Intro Divider",
      x: 120,
      y: 236,
      width: 320,
      height: 4,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      thickness: 3,
      color: "#c0763a",
    },
    {
      type: "menu-item",
      name: "Course One",
      text: "Chilled English Pea Custard",
      description: "meyer lemon · cultured cream · rye crumble",
      price: 18,
      currency: "USD",
      x: 120,
      y: 268,
      width: 360,
      height: 108,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      lineHeight: 1.6,
      letterSpacing: 0.6,
      color: "#1f2933",
      accentColor: "#c0763a",
    },
    {
      type: "menu-item",
      name: "Course Two",
      text: "Fire-Roasted Asparagus",
      description: "smoked hollandaise · preserved citrus · buckwheat",
      price: 24,
      currency: "USD",
      x: 120,
      y: 388,
      width: 360,
      height: 108,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      lineHeight: 1.6,
      letterSpacing: 0.6,
      color: "#1f2933",
      accentColor: "#c0763a",
    },
    {
      type: "menu-item",
      name: "Course Three",
      text: "Charred Wagyu Striploin",
      description: "black garlic · arrowhead cabbage · smoked potato",
      price: 46,
      currency: "USD",
      x: 120,
      y: 508,
      width: 360,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      lineHeight: 1.6,
      letterSpacing: 0.6,
      color: "#1f2933",
      accentColor: "#c0763a",
    },
    {
      type: "divider",
      name: "Mid Divider",
      x: 120,
      y: 648,
      width: 320,
      height: 4,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      thickness: 2,
      color: "#d1bfa2",
    },
    {
      type: "menu-item",
      name: "Course Four",
      text: "Lobster Agnolotti",
      description: "brown butter · sorrel · candied fennel pollen",
      price: 38,
      currency: "USD",
      x: 120,
      y: 680,
      width: 360,
      height: 108,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      lineHeight: 1.6,
      letterSpacing: 0.6,
      color: "#1f2933",
      accentColor: "#c0763a",
    },
    {
      type: "menu-item",
      name: "Course Five",
      text: "Honey Pollen Pavlova",
      description: "chamomile cream · macerated berries · verbena ice",
      price: 16,
      currency: "USD",
      x: 120,
      y: 800,
      width: 360,
      height: 108,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      lineHeight: 1.6,
      letterSpacing: 0.6,
      color: "#1f2933",
      accentColor: "#c0763a",
    },
    {
      type: "shape",
      name: "Pairing Panel",
      x: 500,
      y: 460,
      width: 240,
      height: 320,
      rotation: 0,
      opacity: 1,
      zIndex: 3,
      shape: "rectangle",
      fill: "#fff7ed",
      borderColor: "#fbd5a5",
      borderWidth: 1,
      borderRadius: 28,
    },
    {
      type: "heading",
      name: "Pairing Header",
      text: "Wine Pairings",
      x: 520,
      y: 480,
      width: 200,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'Playfair Display', serif",
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: 1.4,
      lineHeight: 1.2,
      color: "#7c2d12",
      align: "left",
    },
    {
      type: "body",
      name: "Pairing Copy",
      text: "Sommelier curated pairings available for $75 per guest. Focused on Loire whites and coastal Italian reds.",
      x: 520,
      y: 538,
      width: 200,
      height: 140,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      lineHeight: 1.6,
      letterSpacing: 0.4,
      color: "#1f2937",
      align: "left",
    },
    {
      type: "body",
      name: "Service Footer",
      text: "Kindly inform us of allergies or dietary needs. Menu evolves weekly with the season.",
      x: 120,
      y: 928,
      width: 620,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      letterSpacing: 0.3,
      color: "#4b5563",
      align: "center",
    },
  ],
};

const modernGridTemplate: MenuTemplate = {
  id: "modern-grid",
  name: "Modern Grid",
  description: "Bold sans serif layout with modular grid and alternating imagery.",
  pageSize: { width: 900, height: 1200 },
  settings: {
    background: "#0f172a",
    margin: 72,
    columns: 3,
    gutter: 40,
    showGrid: true,
    showMargins: true,
    showColumns: true,
  },
  elements: [
    {
      type: "shape",
      name: "Dark Background",
      x: 0,
      y: 0,
      width: 900,
      height: 1200,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      shape: "rectangle",
      fill: "#0f172a",
      borderColor: "#0f172a",
      borderWidth: 0,
      borderRadius: 0,
    },
    {
      type: "heading",
      name: "Hero Headline",
      text: "Chef's Sélection",
      x: 96,
      y: 96,
      width: 520,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 72,
      fontWeight: 700,
      lineHeight: 0.95,
      letterSpacing: 1.6,
      color: "#f8fafc",
      align: "left",
    },
    {
      type: "subheading",
      name: "Date Line",
      text: "May 2024 · Seven moments",
      x: 96,
      y: 206,
      width: 360,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      fontFamily: "'Inter', sans-serif",
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: 2,
      lineHeight: 1.4,
      color: "#94a3b8",
      align: "left",
    },
    {
      type: "image",
      name: "Left Panel",
      imageUrl:
        "https://images.unsplash.com/photo-1543353071-1cf6624b9987?auto=format&fit=crop&w=1000&q=80",
      x: 96,
      y: 280,
      width: 240,
      height: 320,
      rotation: 0,
      opacity: 1,
      zIndex: 3,
      objectFit: "cover",
      borderRadius: 24,
    },
    {
      type: "image",
      name: "Right Panel",
      imageUrl:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80",
      x: 552,
      y: 280,
      width: 260,
      height: 360,
      rotation: 0,
      opacity: 1,
      zIndex: 3,
      objectFit: "cover",
      borderRadius: 32,
    },
    {
      type: "shape",
      name: "Highlight Badge",
      x: 392,
      y: 280,
      width: 136,
      height: 136,
      rotation: 0,
      opacity: 0.92,
      zIndex: 4,
      shape: "ellipse",
      fill: "#f97316",
      borderColor: "#f97316",
      borderWidth: 0,
      borderRadius: 136,
    },
    {
      type: "heading",
      name: "Badge Copy",
      text: "Tasting\n$125",
      x: 400,
      y: 292,
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 5,
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 28,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: 1,
      color: "#0f172a",
      align: "center",
    },
    {
      type: "menu-item",
      name: "Course Highlight",
      text: "Coal-Roasted Langoustine",
      description: "xo butter · smoked paprika · fermented yuzu",
      price: 32,
      currency: "USD",
      x: 96,
      y: 632,
      width: 340,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      fontFamily: "'Inter', sans-serif",
      fontSize: 20,
      lineHeight: 1.5,
      letterSpacing: 0.4,
      color: "#e2e8f0",
      accentColor: "#38bdf8",
    },
    {
      type: "menu-item",
      name: "Course Secondary",
      text: "Miso Glazed Cauliflower",
      description: "togarashi caramel · pickled kumquat · sesame",
      price: 22,
      currency: "USD",
      x: 460,
      y: 632,
      width: 352,
      height: 110,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      fontFamily: "'Inter', sans-serif",
      fontSize: 20,
      lineHeight: 1.5,
      letterSpacing: 0.4,
      color: "#e2e8f0",
      accentColor: "#38bdf8",
    },
    {
      type: "divider",
      name: "Lower Divider",
      x: 96,
      y: 772,
      width: 716,
      height: 4,
      rotation: 0,
      opacity: 0.6,
      zIndex: 4,
      thickness: 2,
      color: "#1e293b",
    },
    {
      type: "body",
      name: "Pairing Caption",
      text: "Wine pairings anchored in Jura, Sicily, and Anderson Valley.",
      x: 96,
      y: 800,
      width: 716,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      fontFamily: "'Inter', sans-serif",
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0.3,
      color: "#cbd5f5",
      align: "left",
    },
    {
      type: "body",
      name: "Footer",
      text: "Service charge of 20% applies. Vegan substitutions crafted with 24-hour notice.",
      x: 96,
      y: 1000,
      width: 716,
      height: 100,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      fontFamily: "'Inter', sans-serif",
      fontSize: 14,
      lineHeight: 1.6,
      letterSpacing: 0.3,
      color: "#94a3b8",
      align: "center",
    },
  ],
};

const TEMPLATE_PRESETS: MenuTemplate[] = [seasonalTemplate, modernGridTemplate];

const createElementsFromTemplate = (template: MenuTemplate): DesignerElement[] =>
  template.elements.map((element, index) => ({
    ...element,
    id: createId(),
    zIndex: element.zIndex ?? index + 1,
  }));

const INITIAL_CANVAS: CanvasSettings = {
  background: "#fefaf4",
  margin: 64,
  columns: 2,
  gutter: 32,
  showGrid: true,
  showMargins: true,
  showColumns: false,
  zoom: 0.75,
  gridSize: 24,
};

const INITIAL_PAGE_SIZE: PageSize = { width: 816, height: 1056 };

const INITIAL_ELEMENTS = createElementsFromTemplate(seasonalTemplate);

export default function MenuDesignStudioSection() {
  const [documentName, setDocumentName] = useState("Seasonal Reveal Menu");
  const [pageSize, setPageSize] = useState<PageSize>(INITIAL_PAGE_SIZE);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(
    INITIAL_CANVAS,
  );
  const [elements, setElements] = useState<DesignerElement[]>(INITIAL_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(
    INITIAL_ELEMENTS[0]?.id ?? null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<DesignerElement> | null>(null);
  const [pagePreset, setPagePreset] = useState<string>("letter");
  const [floatingToolbar, setFloatingToolbar] = useState<FloatingPanelState>({
    x: 24,
    y: 32,
    pinned: false,
  });
  const [floatingLayersPanel, setFloatingLayersPanel] =
    useState<FloatingPanelState>({
      x: 24,
      y: 280,
      pinned: false,
    });
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const handleToolbarStateChange = useCallback(
    (changes: Partial<FloatingPanelState>) => {
      setFloatingToolbar((prev) => ({ ...prev, ...changes }));
    },
    [],
  );

  const handleLayersPanelStateChange = useCallback(
    (changes: Partial<FloatingPanelState>) => {
      setFloatingLayersPanel((prev) => ({ ...prev, ...changes }));
    },
    [],
  );

  const handleToolbarPinToggle = useCallback(() => {
    setFloatingToolbar((prev) => ({ ...prev, pinned: !prev.pinned }));
  }, []);

  const handleLayersPinToggle = useCallback(() => {
    setFloatingLayersPanel((prev) => ({ ...prev, pinned: !prev.pinned }));
  }, []);

  const sortedLayers = useMemo(
    () =>
      [...elements].sort((a, b) => {
        if (a.zIndex === b.zIndex) {
          return a.name.localeCompare(b.name);
        }
        return b.zIndex - a.zIndex;
      }),
    [elements],
  );

  const getNextZIndex = useCallback(
    () => elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0) + 1,
    [elements],
  );

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const updateElement = useCallback(
    (id: string, changes: Partial<DesignerElement>) => {
      setElements((prev) =>
        prev.map((element) =>
          element.id === id
            ? ({
                ...element,
                ...changes,
              } as DesignerElement)
            : element,
        ),
      );
    },
    [],
  );

  const handleBeginInlineEdit = useCallback(
    (id: string) => {
      const element = elements.find((item) => item.id === id);
      if (!element || !isTextEditableElement(element)) return;
      const draft = createDraftFromElement(element);
      setEditingId(id);
      setEditingDraft(draft);
      setSelectedId(id);
    },
    [elements],
  );

  const handleInlineEditingChange = useCallback((changes: Partial<DesignerElement>) => {
    setEditingDraft((prev) => ({ ...(prev ?? {}), ...changes }));
  }, []);

  const handleCommitInlineEdit = useCallback(() => {
    if (!editingId || !editingDraft) return;
    const element = elements.find((item) => item.id === editingId);
    if (!element) {
      setEditingId(null);
      setEditingDraft(null);
      return;
    }
    const updates = extractDraftChanges(element, editingDraft);
    updateElement(editingId, updates);
    setEditingId(null);
    setEditingDraft(null);
  }, [editingDraft, editingId, elements, updateElement]);

  const handleCancelInlineEdit = useCallback(() => {
    setEditingId(null);
    setEditingDraft(null);
  }, []);

  const handleCanvasPointerDownCommit = useCallback(() => {
    if (editingId) {
      handleCommitInlineEdit();
    }
  }, [editingId, handleCommitInlineEdit]);

  const handleDeselect = useCallback(() => {
    if (editingId) {
      handleCommitInlineEdit();
    }
    setSelectedId(null);
  }, [editingId, handleCommitInlineEdit]);

  const handlePositionChange = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setElements((prev) =>
        prev.map((element) => {
          if (element.id !== id) return element;
          const maxX = Math.max(0, pageSize.width - element.width);
          const maxY = Math.max(0, pageSize.height - element.height);
          return {
            ...element,
            x: clamp(position.x, 0, maxX),
            y: clamp(position.y, 0, maxY),
          } as DesignerElement;
        }),
      );
    },
    [pageSize.height, pageSize.width],
  );

  const handleSelectLayer = useCallback(
    (id: string) => {
      if (editingId && editingId !== id) {
        handleCommitInlineEdit();
      }
      setSelectedId(id);
    },
    [editingId, handleCommitInlineEdit],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((element) => element.id !== selectedId));
    setSelectedId((current) => (current === selectedId ? null : current));
    if (editingId === selectedId) {
      setEditingId(null);
      setEditingDraft(null);
    }
  }, [editingId, selectedId]);

  const handleDuplicateSelected = useCallback(() => {
    if (editingId) {
      handleCommitInlineEdit();
    }
    if (!selectedId) return;
    let createdId: string | null = null;
    setElements((prev) => {
      const source = prev.find((element) => element.id === selectedId);
      if (!source) {
        return prev;
      }
      const copy: DesignerElement = {
        ...source,
        id: createId(),
        name: `${source.name} Copy`,
        x: clamp(source.x + 32, 0, pageSize.width - source.width),
        y: clamp(source.y + 32, 0, pageSize.height - source.height),
        zIndex: getNextZIndex(),
      };
      createdId = copy.id;
      return [...prev, copy];
    });
    if (createdId) {
      setSelectedId(createdId);
    }
  }, [
    editingId,
    handleCommitInlineEdit,
    selectedId,
    pageSize.width,
    pageSize.height,
    getNextZIndex,
  ]);

  const handleLayerShift = useCallback(
    (id: string, direction: "forward" | "backward") => {
      if (editingId) {
        handleCommitInlineEdit();
      }
      setElements((prev) => {
        if (prev.length < 2) return prev;
        const ordered = [...prev].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = ordered.findIndex((item) => item.id === id);
        if (currentIndex === -1) return prev;
        const targetIndex = direction === "forward"
          ? Math.min(ordered.length - 1, currentIndex + 1)
          : Math.max(0, currentIndex - 1);
        if (targetIndex === currentIndex) return prev;
        const swapped = [...ordered];
        [swapped[currentIndex], swapped[targetIndex]] = [
          swapped[targetIndex],
          swapped[currentIndex],
        ];
        return swapped.map((element, index) => ({
          ...element,
          zIndex: index + 1,
        }));
      });
    },
    [editingId, handleCommitInlineEdit],
  );

  const handleApplyTemplate = useCallback(
    (template: MenuTemplate) => {
      setEditingId(null);
      setEditingDraft(null);
      const mappedElements = createElementsFromTemplate(template);
      setElements(mappedElements);
      setSelectedId(mappedElements[0]?.id ?? null);
      if (template.settings) {
        setCanvasSettings((prev) => ({
          ...prev,
          ...template.settings,
        }));
      }
      if (template.pageSize) {
        setPageSize(template.pageSize);
        const matchedPreset = PAGE_PRESETS.find(
          (preset) =>
            preset.width === template.pageSize?.width &&
            preset.height === template.pageSize?.height,
        );
        if (matchedPreset) {
          setPagePreset(matchedPreset.id);
        }
      }
      setDocumentName(template.name);
    },
    [],
  );

  const addElement = useCallback(
    (element: Omit<DesignerElement, "id" | "zIndex">) => {
      const payload: DesignerElement = {
        ...element,
        id: createId(),
        zIndex: getNextZIndex(),
      };
      setElements((prev) => [...prev, payload]);
      setSelectedId(payload.id);
    },
    [getNextZIndex],
  );

  const handleAddHeading = useCallback(() => {
    addElement({
      type: "heading",
      name: "Headline",
      text: "New Menu Headline",
      x: canvasSettings.margin + 24,
      y: canvasSettings.margin + 24,
      width: Math.min(520, pageSize.width - canvasSettings.margin * 2),
      height: 96,
      rotation: 0,
      opacity: 1,
      fontFamily: "'Playfair Display', serif",
      fontSize: 52,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: 1.8,
      color: "#111827",
      align: "left",
    });
  }, [addElement, canvasSettings.margin, pageSize.width]);

  const handleAddBody = useCallback(() => {
    addElement({
      type: "body",
      name: "Body Copy",
      text: "Describe ingredients, sourcing stories, or service cues.",
      x: canvasSettings.margin + 24,
      y: canvasSettings.margin + 140,
      width: Math.min(520, pageSize.width - canvasSettings.margin * 2),
      height: 140,
      rotation: 0,
      opacity: 1,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: 0.3,
      color: "#374151",
      align: "left",
    });
  }, [addElement, canvasSettings.margin, pageSize.width]);

  const handleAddMenuItem = useCallback(() => {
    addElement({
      type: "menu-item",
      name: "Menu Item",
      text: "Seared Diver Scallops",
      description: "meyer lemon · toasted barley · smoked trout roe",
      price: 28,
      currency: "USD",
      x: canvasSettings.margin + 24,
      y: canvasSettings.margin + 220,
      width: Math.min(420, pageSize.width - canvasSettings.margin * 2),
      height: 112,
      rotation: 0,
      opacity: 1,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      lineHeight: 1.55,
      letterSpacing: 0.4,
      color: "#1f2937",
      accentColor: "#38bdf8",
    });
  }, [addElement, canvasSettings.margin, pageSize.width]);

  const handleAddDivider = useCallback(() => {
    addElement({
      type: "divider",
      name: "Divider",
      x: canvasSettings.margin + 24,
      y: canvasSettings.margin + 320,
      width: Math.min(480, pageSize.width - canvasSettings.margin * 2),
      height: 4,
      rotation: 0,
      opacity: 0.65,
      thickness: 2,
      color: "#94a3b8",
    });
  }, [addElement, canvasSettings.margin, pageSize.width]);

  const handleAddShape = useCallback(
    (shape: "rectangle" | "ellipse") => {
      addElement({
        type: "shape",
        name: shape === "ellipse" ? "Spotlight" : "Backdrop",
        x: canvasSettings.margin,
        y: canvasSettings.margin,
        width: shape === "ellipse" ? 220 : 520,
        height: shape === "ellipse" ? 220 : 300,
        rotation: 0,
        opacity: 0.9,
        shape,
        fill: shape === "ellipse" ? "#facc15" : "#f1f5f9",
        borderColor: shape === "ellipse" ? "#facc15" : "#e2e8f0",
        borderWidth: shape === "ellipse" ? 0 : 1,
        borderRadius: shape === "ellipse" ? 220 : 36,
      });
    },
    [addElement, canvasSettings.margin],
  );

  const handleAddImage = useCallback(
    (url: string, label: string) => {
      addElement({
        type: "image",
        name: label,
        imageUrl: url,
        x: canvasSettings.margin + 24,
        y: canvasSettings.margin + 24,
        width: 260,
        height: 320,
        rotation: 0,
        opacity: 1,
        objectFit: "cover",
        borderRadius: 32,
      });
    },
    [addElement, canvasSettings.margin],
  );

  const handlePaletteApply = useCallback(
    (swatches: string[]) => {
      if (selectedElement) {
        if (selectedElement.type === "shape") {
          updateElement(selectedElement.id, {
            fill: swatches[1] ?? swatches[0],
            borderColor: swatches[2] ?? swatches[0],
          });
        } else if (selectedElement.type === "menu-item") {
          updateElement(selectedElement.id, {
            color: swatches[0],
            accentColor: swatches[1] ?? swatches[0],
          });
        } else {
          updateElement(selectedElement.id, {
            color: swatches[0],
          });
        }
      } else {
        setCanvasSettings((prev) => ({
          ...prev,
          background: swatches[0],
        }));
      }
    },
    [selectedElement, updateElement],
  );

  const handleToggleGrid = useCallback(() => {
    setCanvasSettings((prev) => ({
      ...prev,
      showGrid: !prev.showGrid,
    }));
  }, []);

  const handleToggleColumns = useCallback(() => {
    setCanvasSettings((prev) => ({
      ...prev,
      showColumns: !prev.showColumns,
    }));
  }, []);

  const handleToggleMargins = useCallback(() => {
    setCanvasSettings((prev) => ({
      ...prev,
      showMargins: !prev.showMargins,
    }));
  }, []);

  const handleAdjustFontSize = useCallback(
    (delta: number) => {
      if (!selectedElement) return;
      if (
        ![
          "heading",
          "subheading",
          "body",
          "menu-item",
        ].includes(selectedElement.type)
      ) {
        return;
      }
      const nextSize = clamp((selectedElement.fontSize ?? 16) + delta, 6, 240);
      updateElement(selectedElement.id, {
        fontSize: nextSize,
      });
    },
    [selectedElement, updateElement],
  );

  const handleAdjustLetterSpacing = useCallback(
    (delta: number) => {
      if (!selectedElement) return;
      if (
        ![
          "heading",
          "subheading",
          "body",
          "menu-item",
        ].includes(selectedElement.type)
      ) {
        return;
      }
      const current = selectedElement.letterSpacing ?? 0;
      updateElement(selectedElement.id, {
        letterSpacing: Number((current + delta).toFixed(2)),
      });
    },
    [selectedElement, updateElement],
  );

  const handleAdjustLineHeight = useCallback(
    (delta: number) => {
      if (!selectedElement) return;
      if (
        ![
          "heading",
          "subheading",
          "body",
          "menu-item",
        ].includes(selectedElement.type)
      ) {
        return;
      }
      const current = selectedElement.lineHeight ?? 1.4;
      updateElement(selectedElement.id, {
        lineHeight: Number(clamp(current + delta, 0.6, 3).toFixed(2)),
      });
    },
    [selectedElement, updateElement],
  );

  const handleAlignChange = useCallback(
    (align: "left" | "center" | "right") => {
      if (!selectedElement) return;
      if (
        ![
          "heading",
          "subheading",
          "body",
          "menu-item",
        ].includes(selectedElement.type)
      ) {
        return;
      }
      updateElement(selectedElement.id, { align });
    },
    [selectedElement, updateElement],
  );

  const handleExportLayout = useCallback(async () => {
    const payload = {
      name: documentName,
      pageSize,
      canvasSettings,
      elements,
    };
    const serialized = JSON.stringify(payload, null, 2);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(serialized);
        toast({
          title: "Layout copied",
          description: "JSON payload copied to clipboard for handoff.",
        });
      }
    } catch (error) {
      console.error("Failed to copy layout", error);
    }
  }, [canvasSettings, documentName, elements, pageSize, toast]);

  const handleResetWorkspace = useCallback(() => {
    setElements([]);
    setSelectedId(null);
    setDocumentName("Untitled Menu");
    setPagePreset("letter");
    setCanvasSettings(() => ({ ...INITIAL_CANVAS }));
    setPageSize(() => ({ ...INITIAL_PAGE_SIZE }));
  }, []);

  const handleZoom = useCallback(
    (delta: number) => {
      setCanvasSettings((prev) => ({
        ...prev,
        zoom: clamp(Number(prev.zoom.toFixed(2)) + delta, 0.3, 1.6),
      }));
    },
    [],
  );

  const handlePagePresetChange = useCallback((id: string) => {
    const preset = PAGE_PRESETS.find((entry) => entry.id === id);
    if (!preset) return;
    setPagePreset(id);
    setPageSize({ width: preset.width, height: preset.height });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!selectedId) return;
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) {
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        handleDeleteSelected();
        return;
      }
      if ((event.key === "d" || event.key === "D") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleDuplicateSelected();
        return;
      }
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
        const dy = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
        if (!dx && !dy) return;
        const element = elements.find((entry) => entry.id === selectedId);
        if (!element) return;
        updateElement(selectedId, {
          x: clamp(element.x + dx, 0, pageSize.width - element.width),
          y: clamp(element.y + dy, 0, pageSize.height - element.height),
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [elements, handleDeleteSelected, handleDuplicateSelected, pageSize.height, pageSize.width, selectedId, updateElement]);

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] flex-col gap-4 px-4 pb-10 pt-4 lg:px-6">
      <Card className="border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-background to-emerald-500/5 shadow-lg">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold uppercase tracking-[0.45em] text-cyan-700 dark:text-cyan-200">
              Menu Design Studio
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm">
              Start from a blank canvas or seasoned templates, arrange typography, imagery, and pricing with precise grid control, and export layout primitives ready for production.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={pagePreset} onValueChange={handlePagePresetChange}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setPageSize(({ width, height }) => ({ width: height, height: width }))}>
              <LayoutGrid className="mr-2 h-4 w-4" aria-hidden />
              Flip orientation
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetWorkspace}>
              <FilePlus className="mr-2 h-4 w-4" aria-hidden />
              Blank canvas
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleApplyTemplate(seasonalTemplate)}>
              <Sparkles className="mr-2 h-4 w-4" aria-hidden />
              Apply seasonal
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportLayout}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Export JSON
            </Button>
            <div className="flex items-center overflow-hidden rounded-full border border-cyan-500/30">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none"
                onClick={() => handleZoom(-0.05)}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" aria-hidden />
              </Button>
              <span className="px-3 text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
                {Math.round(canvasSettings.zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none"
                onClick={() => handleZoom(0.05)}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-1 flex-col gap-4 xl:flex-row">
        <ToolSidebar
          documentName={documentName}
          setDocumentName={setDocumentName}
          templates={TEMPLATE_PRESETS}
          onApplyTemplate={handleApplyTemplate}
          onAddHeading={handleAddHeading}
          onAddBody={handleAddBody}
          onAddMenuItem={handleAddMenuItem}
          onAddDivider={handleAddDivider}
          onAddShape={handleAddShape}
          onAddImage={handleAddImage}
          imageLibrary={IMAGE_LIBRARY}
          colorPalettes={COLOR_PALETTES}
          onPaletteApply={handlePaletteApply}
          selectedElement={selectedElement}
        />

        <div ref={workspaceRef} className="relative flex flex-1">
          <DesignerCanvas
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDeselect={handleDeselect}
            canvasSettings={canvasSettings}
            pageSize={pageSize}
            onPositionChange={handlePositionChange}
            editingId={editingId}
            editingDraft={editingDraft}
            onEditingChange={handleInlineEditingChange}
            onBeginEdit={handleBeginInlineEdit}
            onCommitEdit={handleCommitInlineEdit}
            onCancelEdit={handleCancelInlineEdit}
            onCanvasPointerDown={handleCanvasPointerDownCommit}
          />

          <div className="pointer-events-none fixed inset-0 z-50">
            <FloatingToolbarPanel
              containerRef={workspaceRef}
              bounds="viewport"
              state={floatingToolbar}
              onStateChange={handleToolbarStateChange}
              onTogglePin={handleToolbarPinToggle}
              onAddHeading={handleAddHeading}
              onAddBody={handleAddBody}
              onAddMenuItem={handleAddMenuItem}
              onAddDivider={handleAddDivider}
              onAddShape={handleAddShape}
              canvasSettings={canvasSettings}
              onToggleGrid={handleToggleGrid}
              onToggleColumns={handleToggleColumns}
              onToggleMargins={handleToggleMargins}
              selectedElement={selectedElement}
              onAlignChange={handleAlignChange}
              onAdjustFontSize={handleAdjustFontSize}
              onAdjustLetterSpacing={handleAdjustLetterSpacing}
              onAdjustLineHeight={handleAdjustLineHeight}
              onDuplicateSelected={handleDuplicateSelected}
              onDeleteSelected={handleDeleteSelected}
              onSelectionUpdate={updateElement}
            />
            <FloatingLayersPanel
              containerRef={workspaceRef}
              bounds="viewport"
              state={floatingLayersPanel}
              onStateChange={handleLayersPanelStateChange}
              onTogglePin={handleLayersPinToggle}
              layers={sortedLayers}
              selectedId={selectedId}
              onSelectLayer={handleSelectLayer}
              onLayerShift={handleLayerShift}
            />
          </div>
        </div>

        <InspectorPanel
          canvasSettings={canvasSettings}
          onCanvasSettingsChange={(changes) =>
            setCanvasSettings((prev) => ({ ...prev, ...changes }))
          }
          pageSize={pageSize}
          onPageSizeChange={(changes) =>
            setPageSize((prev) => ({ ...prev, ...changes }))
          }
          selectedElement={selectedElement}
          onUpdateElement={updateElement}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          layers={sortedLayers}
          onSelectLayer={handleSelectLayer}
          onLayerShift={handleLayerShift}
        />
      </div>
    </div>
  );
}

type ToolSidebarProps = {
  documentName: string;
  setDocumentName: (value: string) => void;
  templates: MenuTemplate[];
  onApplyTemplate: (template: MenuTemplate) => void;
  onAddHeading: () => void;
  onAddBody: () => void;
  onAddMenuItem: () => void;
  onAddDivider: () => void;
  onAddShape: (shape: "rectangle" | "ellipse") => void;
  onAddImage: (url: string, label: string) => void;
  imageLibrary: typeof IMAGE_LIBRARY;
  colorPalettes: typeof COLOR_PALETTES;
  onPaletteApply: (swatches: string[]) => void;
  selectedElement: DesignerElement | null;
};

function ToolSidebar({
  documentName,
  setDocumentName,
  templates,
  onApplyTemplate,
  onAddHeading,
  onAddBody,
  onAddMenuItem,
  onAddDivider,
  onAddShape,
  onAddImage,
  imageLibrary,
  colorPalettes,
  onPaletteApply,
  selectedElement,
}: ToolSidebarProps) {
  return (
    <Card className="w-full border border-slate-200/50 bg-white/80 backdrop-blur lg:w-[280px] dark:border-slate-800/60 dark:bg-slate-950/40">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Project assets</CardTitle>
        <CardDescription className="text-xs">
          Templates, components, and palettes to accelerate composition.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="document-name" className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
            Document
          </Label>
          <Input
            id="document-name"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            className="mt-2"
          />
        </div>
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs">
            <TabsTrigger value="templates">Layouts</TabsTrigger>
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="palettes">Palettes</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="mt-3">
            <ScrollArea className="h-[360px] pr-3">
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="border border-slate-200 bg-white/70 shadow-sm transition hover:border-cyan-400 dark:border-slate-800/70 dark:bg-slate-900/60"
                  >
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-sm font-semibold">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onApplyTemplate(template)}
                      >
                        <Wand2 className="mr-2 h-4 w-4" aria-hidden />
                        Apply layout
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="elements" className="mt-3">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={onAddHeading}>
                <Type className="mr-2 h-4 w-4" aria-hidden />
                Add headline
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onAddBody}>
                <Type className="mr-2 h-4 w-4" aria-hidden />
                Add body copy
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onAddMenuItem}>
                <Ruler className="mr-2 h-4 w-4" aria-hidden />
                Add menu item
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onAddShape("rectangle")}>
                <Square className="mr-2 h-4 w-4" aria-hidden />
                Add rectangle
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onAddShape("ellipse")}>
                <Circle className="mr-2 h-4 w-4" aria-hidden />
                Add ellipse
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onAddDivider}>
                <LayoutGrid className="mr-2 h-4 w-4" aria-hidden />
                Add divider
              </Button>
              <Separator className="my-3" />
              <ScrollArea className="h-[180px] pr-3">
                <div className="grid grid-cols-2 gap-2">
                  {imageLibrary.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white/80 text-left text-xs font-medium transition hover:border-cyan-500 dark:border-slate-800/70 dark:bg-slate-900/60"
                      onClick={() => onAddImage(asset.url, asset.label)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={asset.url}
                          alt={asset.label}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                        />
                      </div>
                      <div className="px-2 py-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        <ImageIcon className="mr-1 inline h-3 w-3" aria-hidden />
                        {asset.label}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent value="palettes" className="mt-3">
            <ScrollArea className="h-[360px] pr-3">
              <div className="space-y-3">
                {colorPalettes.map((palette) => (
                  <Card
                    key={palette.name}
                    className="border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60"
                  >
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-sm font-medium">
                        {palette.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Click to apply to {selectedElement ? "selection" : "canvas"}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {palette.swatches.map((swatch) => (
                          <button
                            key={swatch}
                            type="button"
                            className="h-8 w-8 rounded-full border border-slate-200 shadow-sm transition hover:scale-110 dark:border-slate-700"
                            style={{ backgroundColor: swatch }}
                            onClick={() => onPaletteApply(palette.swatches)}
                            aria-label={`Apply swatch ${swatch}`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

type DesignerCanvasProps = {
  elements: DesignerElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  canvasSettings: CanvasSettings;
  pageSize: PageSize;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  editingId: string | null;
  editingDraft: Partial<DesignerElement> | null;
  onEditingChange: (changes: Partial<DesignerElement>) => void;
  onBeginEdit: (id: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onCanvasPointerDown?: () => void;
};

function DesignerCanvas({
  elements,
  selectedId,
  onSelect,
  onDeselect,
  canvasSettings,
  pageSize,
  onPositionChange,
  editingId,
  editingDraft,
  onEditingChange,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onCanvasPointerDown,
}: DesignerCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<ElementDragState | null>(null);

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const zoom = canvasSettings.zoom || 1;
      const pointerX = (event.clientX - rect.left) / zoom;
      const pointerY = (event.clientY - rect.top) / zoom;
      const nextX = clamp(pointerX - drag.offsetX, 0, pageSize.width - drag.width);
      const nextY = clamp(pointerY - drag.offsetY, 0, pageSize.height - drag.height);
      onPositionChange(drag.id, { x: nextX, y: nextY });
    },
    [canvasSettings.zoom, onPositionChange, pageSize.height, pageSize.width],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const handleElementPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, element: DesignerElement) => {
      event.stopPropagation();
      if (event.button !== 0) return;
      if (editingId) {
        if (editingId === element.id) {
          onSelect(element.id);
          return;
        }
        onCommitEdit();
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const zoom = canvasSettings.zoom || 1;
      const pointerX = (event.clientX - rect.left) / zoom;
      const pointerY = (event.clientY - rect.top) / zoom;
      dragRef.current = {
        id: element.id,
        offsetX: pointerX - element.x,
        offsetY: pointerY - element.y,
        width: element.width,
        height: element.height,
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      onSelect(element.id);
    },
    [
      canvasSettings.zoom,
      editingId,
      handlePointerMove,
      handlePointerUp,
      onCommitEdit,
      onSelect,
    ],
  );

  const handleCanvasPointerDown = useCallback(() => {
    if (onCanvasPointerDown) {
      onCanvasPointerDown();
    }
    onDeselect();
  }, [onCanvasPointerDown, onDeselect]);

  const innerWidth = useMemo(
    () => pageSize.width - canvasSettings.margin * 2,
    [canvasSettings.margin, pageSize.width],
  );

  const columnWidth = useMemo(() => {
    if (canvasSettings.columns <= 0) return innerWidth;
    return (
      (innerWidth - canvasSettings.gutter * (canvasSettings.columns - 1)) /
      canvasSettings.columns
    );
  }, [canvasSettings.columns, canvasSettings.gutter, innerWidth]);

  const gridStyle = canvasSettings.showGrid
    ? {
        backgroundImage:
          "linear-gradient(0deg, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)",
        backgroundSize: `${canvasSettings.gridSize}px ${canvasSettings.gridSize}px`,
      }
    : {};

  const handleElementDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, element: DesignerElement) => {
      event.stopPropagation();
      if (!isTextEditableElement(element)) return;
      onSelect(element.id);
      onBeginEdit(element.id);
    },
    [onBeginEdit, onSelect],
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex min-h-0 flex-1 overflow-auto rounded-3xl border border-slate-200 bg-slate-100/40 p-6 shadow-inner dark:border-slate-800/70 dark:bg-slate-950/40">
        <div className="flex w-full justify-center">
          <div
            className="relative"
            style={{
              width: pageSize.width * canvasSettings.zoom,
              height: pageSize.height * canvasSettings.zoom,
            }}
          >
            <div
              ref={canvasRef}
              role="presentation"
              className="relative rounded-[40px] shadow-2xl transition-colors"
              style={{
                width: pageSize.width,
                height: pageSize.height,
                transform: `scale(${canvasSettings.zoom})`,
                transformOrigin: "top left",
                backgroundColor: canvasSettings.background,
                ...gridStyle,
              }}
              onPointerDown={handleCanvasPointerDown}
            >
              {canvasSettings.showMargins ? (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    padding: canvasSettings.margin,
                  }}
                >
                  <div className="h-full w-full rounded-[32px] border border-dashed border-slate-400/30" />
                </div>
              ) : null}
              {canvasSettings.showColumns && canvasSettings.columns > 0 ? (
                <div
                  className="pointer-events-none absolute inset-0 flex"
                  style={{
                    paddingLeft: canvasSettings.margin,
                    paddingRight: canvasSettings.margin,
                  }}
                >
                  {new Array(canvasSettings.columns).fill(null).map((_, index) => (
                    <div
                      key={`column-${index}`}
                      style={{
                        width: columnWidth,
                        marginRight:
                          index === canvasSettings.columns - 1
                            ? 0
                            : canvasSettings.gutter,
                        backgroundColor: "rgba(59,130,246,0.04)",
                        borderLeft: "1px solid rgba(59,130,246,0.16)",
                        borderRight: "1px solid rgba(59,130,246,0.16)",
                      }}
                    />
                  ))}
                </div>
              ) : null}
              {sortedElements.map((element) => {
                const isSelected = element.id === selectedId;
                const isEditable = isTextEditableElement(element);
                const isEditing = Boolean(editingId && editingId === element.id && editingDraft);
                const draft = isEditing && editingDraft ? editingDraft : null;
                const draftText =
                  draft && "text" in draft
                    ? ((draft.text as string | undefined) ?? "")
                    : element.text ?? "";
                const draftName =
                  draft && "name" in draft
                    ? ((draft.name as string | undefined) ?? "")
                    : element.name ?? "";
                const draftDescription =
                  draft && "description" in draft
                    ? ((draft.description as string | undefined) ?? "")
                    : element.description ?? "";
                const draftCurrency =
                  draft && "currency" in draft
                    ? (draft.currency as string | undefined) ?? element.currency ?? "USD"
                    : element.currency ?? "USD";
                const draftPrice =
                  draft && "price" in draft ? (draft.price as number | undefined) : element.price;
                const draftPriceDisplay =
                  draftPrice != null && !Number.isNaN(draftPrice) ? String(draftPrice) : "";
                return (
                  <div
                    key={element.id}
                    role="presentation"
                    className={cn(
                      "group absolute select-none transition-shadow",
                      isSelected
                        ? "ring-2 ring-cyan-500"
                        : "shadow-sm ring-1 ring-transparent",
                    )}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      transform: `rotate(${element.rotation}deg)` as string,
                      opacity: element.opacity,
                      borderRadius: element.borderRadius,
                      cursor: isEditing ? "text" : "move",
                      zIndex: element.zIndex,
                    }}
                    onPointerDown={(event) => handleElementPointerDown(event, element)}
                    onDoubleClick={(event) => handleElementDoubleClick(event, element)}
                  >
                    <div className="relative h-full w-full">
                      <div
                        className={cn(
                          "h-full w-full transition-opacity",
                          isEditing ? "pointer-events-none opacity-20" : "opacity-100",
                        )}
                      >
                        {renderElement(element)}
                      </div>
                      {isEditing && isEditable ? (
                        element.type === "menu-item" ? (
                          <div
                            className="absolute inset-0 z-10 flex h-full w-full flex-col gap-3 rounded-2xl border border-slate-300/60 bg-white/95 p-3 shadow-2xl backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-950/95"
                            onPointerDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.stopPropagation();
                                onCancelEdit();
                              }
                              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                event.preventDefault();
                                onCommitEdit();
                              }
                            }}
                          >
                            <div className="space-y-2 text-left">
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                  Label
                                </span>
                                <Input
                                  autoFocus
                                  value={draftName}
                                  onChange={(event) =>
                                    onEditingChange({ name: event.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                  Title
                                </span>
                                <Input
                                  value={draftText}
                                  onChange={(event) =>
                                    onEditingChange({ text: event.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                  Description
                                </span>
                                <Textarea
                                  rows={3}
                                  value={draftDescription}
                                  className="resize-none"
                                  onChange={(event) =>
                                    onEditingChange({ description: event.target.value })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Price
                                  </span>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={draftPriceDisplay}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      const parsed = Number.parseFloat(value);
                                      onEditingChange({
                                        price:
                                          value === "" || Number.isNaN(parsed)
                                            ? undefined
                                            : parsed,
                                      });
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Currency
                                  </span>
                                  <Input
                                    value={draftCurrency}
                                    onChange={(event) =>
                                      onEditingChange({ currency: event.target.value })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => onCancelEdit()}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => onCommitEdit()}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Textarea
                            autoFocus
                            value={draftText}
                            className="absolute inset-0 z-10 h-full w-full resize-none rounded-[inherit] border border-cyan-200/80 bg-white/95 p-3 text-base font-medium shadow-xl focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-cyan-500/40 dark:bg-slate-950/90"
                            style={{
                              fontFamily: element.fontFamily,
                              fontSize: element.fontSize,
                              fontWeight: element.fontWeight,
                              lineHeight: element.lineHeight,
                              letterSpacing: element.letterSpacing,
                              color: element.color ?? "#0f172a",
                              textAlign: element.align,
                              whiteSpace: "pre-wrap",
                            }}
                            onChange={(event) => onEditingChange({ text: event.target.value })}
                            onPointerDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.stopPropagation();
                                onCancelEdit();
                              }
                              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                event.preventDefault();
                                onCommitEdit();
                              }
                            }}
                          />
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderElement(element: DesignerElement) {
  switch (element.type) {
    case "heading":
    case "subheading":
    case "body": {
      return (
        <div
          className="h-full w-full"
          style={{
            fontFamily: element.fontFamily,
            fontSize: element.fontSize,
            fontWeight: element.fontWeight,
            lineHeight: element.lineHeight,
            letterSpacing: element.letterSpacing,
            color: element.color ?? "#1f2937",
            textAlign: element.align,
            whiteSpace: "pre-wrap",
          }}
        >
          {element.text}
        </div>
      );
    }
    case "menu-item": {
      return (
        <div className="flex h-full w-full flex-col justify-between rounded-xl bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-slate-900/70">
          <div>
            <div
              className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground"
            >
              {element.name}
            </div>
            <div
              className="mt-1 text-lg font-semibold"
              style={{
                fontFamily: element.fontFamily,
                color: element.color ?? "#111827",
                letterSpacing: element.letterSpacing,
              }}
            >
              {element.text}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {element.description}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm font-semibold">
            <span className="text-muted-foreground">{element.currency}</span>
            <span
              className="rounded-full px-3 py-1 text-sm"
              style={{
                backgroundColor: `${element.accentColor ?? "#38bdf8"}20`,
                color: element.accentColor ?? "#0f172a",
              }}
            >
              {element.price != null
                ? formatCurrencyValue(element.price, element.currency ?? "USD")
                : "--"}
            </span>
          </div>
        </div>
      );
    }
    case "image": {
      return element.imageUrl ? (
        <div className="h-full w-full overflow-hidden rounded-[inherit]">
          <img
            src={element.imageUrl}
            alt={element.name}
            className="h-full w-full"
            style={{ objectFit: element.objectFit ?? "cover" }}
          />
        </div>
      ) : null;
    }
    case "shape": {
      const borderStyle = element.borderWidth
        ? `${element.borderWidth}px solid ${element.borderColor ?? element.fill ?? "transparent"}`
        : undefined;
      if (element.shape === "ellipse") {
        return (
          <div
            className="h-full w-full"
            style={{
              backgroundColor: element.fill ?? "#f1f5f9",
              borderRadius: "9999px",
              border: borderStyle,
            }}
          />
        );
      }
      return (
        <div
          className="h-full w-full rounded-[inherit]"
          style={{
            backgroundColor: element.fill ?? "#f8fafc",
            border: borderStyle,
          }}
        />
      );
    }
    case "divider": {
      return (
        <div
          className="h-full w-full"
          style={{
            height: element.thickness ?? element.height,
            backgroundColor: element.color ?? "#cbd5e1",
          }}
        />
      );
    }
    default:
      return null;
  }
}

type InspectorPanelProps = {
  canvasSettings: CanvasSettings;
  onCanvasSettingsChange: (changes: Partial<CanvasSettings>) => void;
  pageSize: PageSize;
  onPageSizeChange: (changes: Partial<PageSize>) => void;
  selectedElement: DesignerElement | null;
  onUpdateElement: (id: string, changes: Partial<DesignerElement>) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  layers: DesignerElement[];
  onSelectLayer: (id: string) => void;
  onLayerShift: (id: string, direction: "forward" | "backward") => void;
};

function InspectorPanel({
  canvasSettings,
  onCanvasSettingsChange,
  pageSize,
  onPageSizeChange,
  selectedElement,
  onUpdateElement,
  onDeleteSelected,
  onDuplicateSelected,
  layers,
  onSelectLayer,
  onLayerShift,
}: InspectorPanelProps) {
  return (
    <Card className="w-full border border-slate-200/60 bg-white/80 backdrop-blur xl:w-[320px] dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Inspector</CardTitle>
        <CardDescription className="text-xs">
          Adjust canvas settings, manage layers, and refine element details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800/50">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-muted-foreground">
            <span>Canvas</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="page-width" className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Width
              </Label>
              <Input
                id="page-width"
                type="number"
                min={480}
                value={Math.round(pageSize.width)}
                onChange={(event) =>
                  onPageSizeChange({ width: clamp(Number(event.target.value), 480, 2000) })
                }
              />
            </div>
            <div>
              <Label htmlFor="page-height" className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Height
              </Label>
              <Input
                id="page-height"
                type="number"
                min={640}
                value={Math.round(pageSize.height)}
                onChange={(event) =>
                  onPageSizeChange({ height: clamp(Number(event.target.value), 640, 2400) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="canvas-margin" className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Margin
              </Label>
              <Input
                id="canvas-margin"
                type="number"
                min={24}
                value={Math.round(canvasSettings.margin)}
                onChange={(event) =>
                  onCanvasSettingsChange({
                    margin: clamp(Number(event.target.value), 24, pageSize.width / 2 - 24),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="canvas-gutter" className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Gutter
              </Label>
              <Input
                id="canvas-gutter"
                type="number"
                min={8}
                value={Math.round(canvasSettings.gutter)}
                onChange={(event) =>
                  onCanvasSettingsChange({
                    gutter: clamp(Number(event.target.value), 0, 120),
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="canvas-columns" className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Columns
              </Label>
              <Input
                id="canvas-columns"
                type="number"
                min={1}
                value={canvasSettings.columns}
                onChange={(event) =>
                  onCanvasSettingsChange({
                    columns: clamp(Number(event.target.value), 1, 8),
                  })
                }
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Grid size
              </Label>
              <Slider
                value={[canvasSettings.gridSize]}
                min={8}
                max={80}
                step={2}
                onValueChange={(value) =>
                  onCanvasSettingsChange({ gridSize: value[0] ?? canvasSettings.gridSize })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Show grid</span>
              <Switch
                checked={canvasSettings.showGrid}
                onCheckedChange={(checked) =>
                  onCanvasSettingsChange({ showGrid: checked })
                }
              />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Show margins</span>
              <Switch
                checked={canvasSettings.showMargins}
                onCheckedChange={(checked) =>
                  onCanvasSettingsChange({ showMargins: checked })
                }
              />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Show columns</span>
              <Switch
                checked={canvasSettings.showColumns}
                onCheckedChange={(checked) =>
                  onCanvasSettingsChange({ showColumns: checked })
                }
              />
            </label>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
              Paper tone
            </Label>
            <input
              type="color"
              value={canvasSettings.background}
              onChange={(event) =>
                onCanvasSettingsChange({ background: event.target.value })
              }
              className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800/50">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-muted-foreground">
            <span>Layers</span>
            <Layers className="h-4 w-4" aria-hidden />
          </div>
          <ScrollArea className="h-[140px] pr-2">
            <div className="space-y-2">
              {layers.map((layer) => {
                const active = selectedElement?.id === layer.id;
                return (
                  <div
                    key={layer.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition",
                      active
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-slate-200 bg-white hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900/70",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectLayer(layer.id)}
                      className="flex flex-1 flex-col text-left"
                    >
                      <span className="font-semibold text-foreground">{layer.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.34em] text-muted-foreground">
                        {layer.type}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onLayerShift(layer.id, "forward")}
                        aria-label="Move layer forward"
                      >
                        <ChevronUp className="h-3 w-3" aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onLayerShift(layer.id, "backward")}
                        aria-label="Move layer backward"
                      >
                        <ChevronDown className="h-3 w-3" aria-hidden />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800/50">
          {selectedElement ? (
            <ElementInspector
              element={selectedElement}
              onUpdate={onUpdateElement}
              onDelete={onDeleteSelected}
              onDuplicate={onDuplicateSelected}
            />
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Select a layer to expose typography, imagery, and layout controls.</p>
              <p>Use ⌘/Ctrl + D to duplicate and arrow keys to nudge 1px (⇧ + arrows for 10px).</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type ElementInspectorProps = {
  element: DesignerElement;
  onUpdate: (id: string, changes: Partial<DesignerElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

function ElementInspector({ element, onUpdate, onDelete, onDuplicate }: ElementInspectorProps) {
  const handleChange = (changes: Partial<DesignerElement>) => {
    onUpdate(element.id, changes);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Label
          </Label>
          <Input
            value={element.name}
            onChange={(event) => handleChange({ name: event.target.value })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            X
          </Label>
          <Input
            type="number"
            value={Math.round(element.x)}
            onChange={(event) => handleChange({ x: Number(event.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Y
          </Label>
          <Input
            type="number"
            value={Math.round(element.y)}
            onChange={(event) => handleChange({ y: Number(event.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Width
          </Label>
          <Input
            type="number"
            value={Math.round(element.width)}
            onChange={(event) => handleChange({ width: clamp(Number(event.target.value), 40, 2000) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Height
          </Label>
          <Input
            type="number"
            value={Math.round(element.height)}
            onChange={(event) => handleChange({ height: clamp(Number(event.target.value), 10, 2000) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Rotation
          </Label>
          <Input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(event) => handleChange({ rotation: Number(event.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Opacity
          </Label>
          <Slider
            value={[Math.round(element.opacity * 100)]}
            min={0}
            max={100}
            onValueChange={(value) => handleChange({ opacity: (value[0] ?? 100) / 100 })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" aria-hidden />
          Duplicate
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          Delete
        </Button>
      </div>
      {element.type === "heading" || element.type === "subheading" || element.type === "body" ? (
        <TextElementControls element={element} onChange={handleChange} />
      ) : null}
      {element.type === "menu-item" ? (
        <MenuItemControls element={element} onChange={handleChange} />
      ) : null}
      {element.type === "image" ? (
        <ImageControls element={element} onChange={handleChange} />
      ) : null}
      {element.type === "shape" ? (
        <ShapeControls element={element} onChange={handleChange} />
      ) : null}
      {element.type === "divider" ? (
        <DividerControls element={element} onChange={handleChange} />
      ) : null}
    </div>
  );
}

type TextElementControlsProps = {
  element: DesignerElement;
  onChange: (changes: Partial<DesignerElement>) => void;
};

function TextElementControls({ element, onChange }: TextElementControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Content
        </Label>
        <Textarea
          value={element.text ?? ""}
          onChange={(event) => onChange({ text: event.target.value })}
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Font size
          </Label>
          <Input
            type="number"
            value={Math.round(element.fontSize ?? 16)}
            onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Line height
          </Label>
          <Input
            type="number"
            step={0.05}
            value={Number(element.lineHeight ?? 1.4).toFixed(2)}
            onChange={(event) => onChange({ lineHeight: Number(event.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Letter spacing
          </Label>
          <Input
            type="number"
            step={0.1}
            value={Number(element.letterSpacing ?? 0).toFixed(1)}
            onChange={(event) => onChange({ letterSpacing: Number(event.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Weight
          </Label>
          <Input
            type="number"
            value={element.fontWeight ?? 400}
            onChange={(event) => onChange({ fontWeight: Number(event.target.value) })}
          />
        </div>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Typeface
        </Label>
        <Select
          value={element.fontFamily ?? FONT_LIBRARY[0]?.value}
          onValueChange={(value) => onChange({ fontFamily: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_LIBRARY.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={element.align === "left" ? "default" : "outline"}
          size="icon"
          onClick={() => onChange({ align: "left" })}
          aria-label="Align left"
        >
          <AlignLeft className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant={element.align === "center" ? "default" : "outline"}
          size="icon"
          onClick={() => onChange({ align: "center" })}
          aria-label="Align center"
        >
          <AlignCenter className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant={element.align === "right" ? "default" : "outline"}
          size="icon"
          onClick={() => onChange({ align: "right" })}
          aria-label="Align right"
        >
          <AlignRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Color
        </Label>
        <input
          type="color"
          value={element.color ?? "#111827"}
          onChange={(event) => onChange({ color: event.target.value })}
          className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
        />
      </div>
    </div>
  );
}

type MenuItemControlsProps = {
  element: DesignerElement;
  onChange: (changes: Partial<DesignerElement>) => void;
};

function MenuItemControls({ element, onChange }: MenuItemControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Dish name
        </Label>
        <Input
          value={element.text ?? ""}
          onChange={(event) => onChange({ text: event.target.value })}
        />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Description
        </Label>
        <Textarea
          value={element.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Price
          </Label>
          <Input
            type="number"
            value={element.price ?? 0}
            onChange={(event) => onChange({ price: Number(event.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Currency
          </Label>
          <Input
            value={element.currency ?? "USD"}
            onChange={(event) => onChange({ currency: event.target.value })}
          />
        </div>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Text color
        </Label>
        <input
          type="color"
          value={element.color ?? "#111827"}
          onChange={(event) => onChange({ color: event.target.value })}
          className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
        />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Accent color
        </Label>
        <input
          type="color"
          value={element.accentColor ?? "#38bdf8"}
          onChange={(event) => onChange({ accentColor: event.target.value })}
          className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
        />
      </div>
    </div>
  );
}

type ImageControlsProps = {
  element: DesignerElement;
  onChange: (changes: Partial<DesignerElement>) => void;
};

function ImageControls({ element, onChange }: ImageControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Image URL
        </Label>
        <Input
          value={element.imageUrl ?? ""}
          onChange={(event) => onChange({ imageUrl: event.target.value })}
          placeholder="https://"
        />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Object fit
        </Label>
        <Select
          value={element.objectFit ?? "cover"}
          onValueChange={(value) => onChange({ objectFit: value as "cover" | "contain" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="contain">Contain</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Corner radius
        </Label>
        <Slider
          value={[element.borderRadius ?? 0]}
          min={0}
          max={180}
          onValueChange={(value) => onChange({ borderRadius: value[0] ?? 0 })}
        />
      </div>
    </div>
  );
}

type ShapeControlsProps = {
  element: DesignerElement;
  onChange: (changes: Partial<DesignerElement>) => void;
};

function ShapeControls({ element, onChange }: ShapeControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={element.shape === "rectangle" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => onChange({ shape: "rectangle" })}
        >
          <Square className="mr-2 h-4 w-4" aria-hidden />
          Rectangle
        </Button>
        <Button
          variant={element.shape === "ellipse" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => onChange({ shape: "ellipse" })}
        >
          <Circle className="mr-2 h-4 w-4" aria-hidden />
          Ellipse
        </Button>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Fill
        </Label>
        <input
          type="color"
          value={element.fill ?? "#e2e8f0"}
          onChange={(event) => onChange({ fill: event.target.value })}
          className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Border color
          </Label>
          <input
            type="color"
            value={element.borderColor ?? element.fill ?? "#e2e8f0"}
            onChange={(event) => onChange({ borderColor: event.target.value })}
            className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Border width
          </Label>
          <Input
            type="number"
            value={element.borderWidth ?? 0}
            onChange={(event) => onChange({ borderWidth: Number(event.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

type DividerControlsProps = {
  element: DesignerElement;
  onChange: (changes: Partial<DesignerElement>) => void;
};

function DividerControls({ element, onChange }: DividerControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Color
        </Label>
        <input
          type="color"
          value={element.color ?? "#cbd5e1"}
          onChange={(event) => onChange({ color: event.target.value })}
          className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
        />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Thickness
        </Label>
        <Input
          type="number"
          value={element.thickness ?? 2}
          onChange={(event) => onChange({ thickness: Number(event.target.value) })}
        />
      </div>
    </div>
  );
}

type FloatingToolbarPanelProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  bounds?: "container" | "viewport";
  state: FloatingPanelState;
  onStateChange: (changes: Partial<FloatingPanelState>) => void;
  onTogglePin: () => void;
  onAddHeading: () => void;
  onAddBody: () => void;
  onAddMenuItem: () => void;
  onAddDivider: () => void;
  onAddShape: (shape: "rectangle" | "ellipse") => void;
  canvasSettings: CanvasSettings;
  onToggleGrid: () => void;
  onToggleColumns: () => void;
  onToggleMargins: () => void;
  selectedElement: DesignerElement | null;
  onAlignChange: (align: "left" | "center" | "right") => void;
  onAdjustFontSize: (delta: number) => void;
  onAdjustLetterSpacing: (delta: number) => void;
  onAdjustLineHeight: (delta: number) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSelectionUpdate: (id: string, changes: Partial<DesignerElement>) => void;
};

function FloatingToolbarPanel({
  containerRef,
  bounds = "container",
  state,
  onStateChange,
  onTogglePin,
  onAddHeading,
  onAddBody,
  onAddMenuItem,
  onAddDivider,
  onAddShape,
  canvasSettings,
  onToggleGrid,
  onToggleColumns,
  onToggleMargins,
  selectedElement,
  onAlignChange,
  onAdjustFontSize,
  onAdjustLetterSpacing,
  onAdjustLineHeight,
  onDuplicateSelected,
  onDeleteSelected,
  onSelectionUpdate,
}: FloatingToolbarPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragData = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    availableWidth: number;
    availableHeight: number;
    panelWidth: number;
    panelHeight: number;
  } | null>(null);

  const getAvailableSpace = useCallback(() => {
    if (bounds === "viewport" && typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    if (typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 0, height: 0 };
  }, [bounds, containerRef]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragData.current) return;
      const {
        startX,
        startY,
        originX,
        originY,
        availableWidth,
        availableHeight,
        panelWidth,
        panelHeight,
      } = dragData.current;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const maxX = Math.max(0, availableWidth - panelWidth);
      const maxY = Math.max(0, availableHeight - panelHeight);
      onStateChange({
        x: clamp(originX + deltaX, 0, maxX),
        y: clamp(originY + deltaY, 0, maxY),
      });
    },
    [onStateChange],
  );

  const handlePointerUp = useCallback(() => {
    dragData.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (state.pinned) return;
      if (event.button !== 0 && event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        target.closest(
          "button, a, input, textarea, select, label, [contenteditable='true'], [role='textbox'], [role='spinbutton'], [role='slider'], [data-floating-panel-interactive='true']",
        )
      ) {
        return;
      }
      const panel = panelRef.current;
      if (!panel) return;
      const { width, height } = getAvailableSpace();
      dragData.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: state.x,
        originY: state.y,
        availableWidth: width,
        availableHeight: height,
        panelWidth: panel.offsetWidth,
        panelHeight: panel.offsetHeight,
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      event.stopPropagation();
      event.preventDefault();
    },
    [getAvailableSpace, handlePointerMove, handlePointerUp, state.pinned, state.x, state.y],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const applyClamp = (availableWidth: number, availableHeight: number) => {
      const maxX = Math.max(0, availableWidth - panel.offsetWidth);
      const maxY = Math.max(0, availableHeight - panel.offsetHeight);
      const nextX = clamp(state.x, 0, maxX);
      const nextY = clamp(state.y, 0, maxY);
      if (nextX !== state.x || nextY !== state.y) {
        onStateChange({ x: nextX, y: nextY });
      }
    };

    if (bounds === "viewport") {
      if (typeof window === "undefined") {
        return;
      }
      const handleResize = () => {
        const { width, height } = getAvailableSpace();
        applyClamp(width, height);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      applyClamp(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [bounds, containerRef, getAvailableSpace, onStateChange, state.x, state.y]);

  const hasSelection = Boolean(selectedElement);
  const canAdjustTypography =
    hasSelection &&
    selectedElement &&
    ["heading", "subheading", "body", "menu-item"].includes(selectedElement.type);

  return (
    <div
      ref={panelRef}
      data-floating-panel="toolbar"
      className={cn(
        "pointer-events-auto z-40 w-[260px] rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80",
        bounds === "viewport" ? "fixed" : "absolute",
      )}
      style={{
        top: bounds === "viewport" ? 0 : undefined,
        left: bounds === "viewport" ? 0 : undefined,
        transform: `translate(${state.x}px, ${state.y}px)`,
        touchAction: state.pinned ? "auto" : "none",
      }}
      onPointerDownCapture={beginDrag}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-200",
            state.pinned ? "cursor-default" : "cursor-move",
          )}
        >
          <Move className="h-3.5 w-3.5" aria-hidden />
          Toolbox
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onTogglePin}
          title={state.pinned ? "Unpin toolbar" : "Pin toolbar"}
          aria-label={state.pinned ? "Unpin toolbar" : "Pin toolbar"}
        >
          {state.pinned ? (
            <Pin className="h-4 w-4" aria-hidden />
          ) : (
            <PinOff className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>

      <div className="mt-3 space-y-3 text-xs">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Quick add
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={onAddHeading}>
              <Type className="mr-2 h-3.5 w-3.5" aria-hidden />
              Heading
            </Button>
            <Button variant="outline" size="sm" onClick={onAddBody}>
              <Type className="mr-2 h-3.5 w-3.5" aria-hidden />
              Body copy
            </Button>
            <Button variant="outline" size="sm" onClick={onAddMenuItem}>
              <Ruler className="mr-2 h-3.5 w-3.5" aria-hidden />
              Menu item
            </Button>
            <Button variant="outline" size="sm" onClick={onAddDivider}>
              <LayoutGrid className="mr-2 h-3.5 w-3.5" aria-hidden />
              Divider
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddShape("rectangle")}
            >
              <Square className="mr-2 h-3.5 w-3.5" aria-hidden />
              Rectangle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddShape("ellipse")}
            >
              <Circle className="mr-2 h-3.5 w-3.5" aria-hidden />
              Ellipse
            </Button>
          </div>
        </div>

        {selectedElement ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Content
            </p>
            {selectedElement.type === "menu-item" ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Label
                  </span>
                  <Input
                    value={selectedElement.name}
                    onChange={(event) =>
                      onSelectionUpdate(selectedElement.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Title
                  </span>
                  <Input
                    value={selectedElement.text ?? ""}
                    onChange={(event) =>
                      onSelectionUpdate(selectedElement.id, {
                        text: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Description
                  </span>
                  <Textarea
                    rows={3}
                    value={selectedElement.description ?? ""}
                    onChange={(event) =>
                      onSelectionUpdate(selectedElement.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Price
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={selectedElement.price != null ? selectedElement.price : ""}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        const parsed = Number.parseFloat(nextValue);
                        onSelectionUpdate(selectedElement.id, {
                          price: nextValue === "" || Number.isNaN(parsed) ? undefined : parsed,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Currency
                    </span>
                    <Input
                      value={selectedElement.currency ?? "USD"}
                      onChange={(event) =>
                        onSelectionUpdate(selectedElement.id, {
                          currency: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : selectedElement.text != null ? (
              <Textarea
                rows={Math.min(6, Math.max(3, Math.ceil((selectedElement.height || 60) / 60)))}
                value={selectedElement.text ?? ""}
                onChange={(event) =>
                  onSelectionUpdate(selectedElement.id, {
                    text: event.target.value,
                  })
                }
              />
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Canvas helpers
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={canvasSettings.showGrid ? "default" : "outline"}
              size="icon"
              className="h-9 w-full"
              onClick={onToggleGrid}
              title="Toggle grid"
              aria-label="Toggle grid"
            >
              <Grid3X3 className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant={canvasSettings.showColumns ? "default" : "outline"}
              size="icon"
              className="h-9 w-full"
              onClick={onToggleColumns}
              title="Toggle columns"
              aria-label="Toggle columns"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant={canvasSettings.showMargins ? "default" : "outline"}
              size="icon"
              className="h-9 w-full"
              onClick={onToggleMargins}
              title="Toggle margins"
              aria-label="Toggle margins"
            >
              <Square className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Typography
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAdjustFontSize(-2)}
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAdjustFontSize(2)}
              title="Increase font size"
              aria-label="Increase font size"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAdjustLetterSpacing(0.2)}
              title="Loosen letter spacing"
              aria-label="Loosen letter spacing"
            >
              <BetweenHorizontalStart className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAdjustLetterSpacing(-0.2)}
              title="Tighten letter spacing"
              aria-label="Tighten letter spacing"
            >
              <BetweenHorizontalStart className="h-4 w-4 rotate-180" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAdjustLineHeight(0.1)}
              title="Increase line height"
              aria-label="Increase line height"
            >
              <BetweenVerticalStart className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAdjustLineHeight(-0.1)}
              title="Decrease line height"
              aria-label="Decrease line height"
            >
              <BetweenVerticalStart className="h-4 w-4 rotate-180" aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={selectedElement?.align === "left" ? "default" : "outline"}
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAlignChange("left")}
              title="Align left"
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant={selectedElement?.align === "center" ? "default" : "outline"}
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAlignChange("center")}
              title="Align center"
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant={selectedElement?.align === "right" ? "default" : "outline"}
              size="icon"
              className="h-9 w-full"
              disabled={!canAdjustTypography}
              onClick={() => onAlignChange("right")}
              title="Align right"
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Selection
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelection}
              onClick={onDuplicateSelected}
            >
              <Copy className="mr-2 h-3.5 w-3.5" aria-hidden />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!hasSelection}
              onClick={onDeleteSelected}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type FloatingLayersPanelProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  state: FloatingPanelState;
  onStateChange: (changes: Partial<FloatingPanelState>) => void;
  onTogglePin: () => void;
  layers: DesignerElement[];
  selectedId: string | null;
  onSelectLayer: (id: string) => void;
  onLayerShift: (id: string, direction: "forward" | "backward") => void;
};

function FloatingLayersPanel({
  containerRef,
  state,
  onStateChange,
  onTogglePin,
  layers,
  selectedId,
  onSelectLayer,
  onLayerShift,
}: FloatingLayersPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragData = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    availableWidth: number;
    availableHeight: number;
    panelWidth: number;
    panelHeight: number;
  } | null>(null);

  const getAvailableSpace = useCallback(() => {
    if (bounds === "viewport" && typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    if (typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 0, height: 0 };
  }, [bounds, containerRef]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragData.current) return;
      const {
        startX,
        startY,
        originX,
        originY,
        availableWidth,
        availableHeight,
        panelWidth,
        panelHeight,
      } = dragData.current;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const maxX = Math.max(0, availableWidth - panelWidth);
      const maxY = Math.max(0, availableHeight - panelHeight);
      onStateChange({
        x: clamp(originX + deltaX, 0, maxX),
        y: clamp(originY + deltaY, 0, maxY),
      });
    },
    [onStateChange],
  );

  const handlePointerUp = useCallback(() => {
    dragData.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (state.pinned || event.button !== 0) return;
      const panel = panelRef.current;
      if (!panel) return;
      const { width, height } = getAvailableSpace();
      dragData.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: state.x,
        originY: state.y,
        availableWidth: width,
        availableHeight: height,
        panelWidth: panel.offsetWidth,
        panelHeight: panel.offsetHeight,
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      event.preventDefault();
    },
    [getAvailableSpace, handlePointerMove, handlePointerUp, state.pinned, state.x, state.y],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const applyClamp = (availableWidth: number, availableHeight: number) => {
      const maxX = Math.max(0, availableWidth - panel.offsetWidth);
      const maxY = Math.max(0, availableHeight - panel.offsetHeight);
      const nextX = clamp(state.x, 0, maxX);
      const nextY = clamp(state.y, 0, maxY);
      if (nextX !== state.x || nextY !== state.y) {
        onStateChange({ x: nextX, y: nextY });
      }
    };

    if (bounds === "viewport") {
      if (typeof window === "undefined") {
        return;
      }
      const handleResize = () => {
        const { width, height } = getAvailableSpace();
        applyClamp(width, height);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      applyClamp(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [bounds, containerRef, getAvailableSpace, onStateChange, state.x, state.y]);

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute z-30 w-[220px] rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80"
      style={{ transform: `translate(${state.x}px, ${state.y}px)` }}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-200",
            state.pinned ? "cursor-default" : "cursor-move",
          )}
          onPointerDown={handlePointerDown}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden />
          Layers
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onTogglePin}
          title={state.pinned ? "Unpin layers" : "Pin layers"}
          aria-label={state.pinned ? "Unpin layers" : "Pin layers"}
        >
          {state.pinned ? (
            <Pin className="h-4 w-4" aria-hidden />
          ) : (
            <PinOff className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>

      <ScrollArea className="mt-3 h-[200px] pr-2">
        <div className="space-y-2 text-xs">
          {layers.map((layer) => {
            const active = layer.id === selectedId;
            return (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                  active
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-slate-200 bg-white hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900/70",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectLayer(layer.id)}
                  className="flex flex-1 flex-col text-left"
                >
                  <span className="text-xs font-semibold text-foreground">
                    {layer.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.34em] text-muted-foreground">
                    {layer.type}
                  </span>
                </button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onLayerShift(layer.id, "forward")}
                    aria-label="Bring layer forward"
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onLayerShift(layer.id, "backward")}
                    aria-label="Send layer backward"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
