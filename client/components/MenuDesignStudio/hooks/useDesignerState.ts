import { useReducer, useCallback, useMemo } from "react";

export type DesignerElementType =
  | "heading"
  | "subheading"
  | "body"
  | "menu-item"
  | "image"
  | "shape"
  | "divider"
  | "icon"
  | "price-column";

export interface DesignerElement {
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
  locked?: boolean;
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
  mask?: ElementMask;
  createdAt?: number;
  updatedAt?: number;
  dishId?: string; // Link to EchoRecipePro recipe
}

export interface ElementMask {
  type: "circle" | "rounded-rect" | "polygon";
  radius?: number;
  points?: { x: number; y: number }[];
  feather?: number;
}

export interface PageSize {
  width: number;
  height: number;
}

export interface PrintPreset {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
  widthPx: number;
  heightPx: number;
  dpi: number;
  colorProfile: "RGB" | "CMYK";
  safeMarginIn: number;
  bleedIn: number;
}

export interface CanvasSettings {
  background: string;
  margin: number;
  bleed: number;
  columns: number;
  gutter: number;
  showGrid: boolean;
  showMargins: boolean;
  showBleed: boolean;
  showColumns: boolean;
  showRulers: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  snapDistance: number;
  zoom: number;
  scrollX: number;
  scrollY: number;
  gridSize: number;
}

export interface DesignState {
  documentName: string;
  elements: DesignerElement[];
  selectedIds: string[];
  pageSize: PageSize;
  canvasSettings: CanvasSettings;
  pagePreset: string;
  printPreset: PrintPreset;
  dirty: boolean;
  createdAt: number;
  updatedAt: number;
  version: number;
}

type DesignerAction =
  | { type: "ADD_ELEMENT"; payload: DesignerElement }
  | { type: "UPDATE_ELEMENT"; payload: { id: string; changes: Partial<DesignerElement> } }
  | { type: "DELETE_ELEMENT"; payload: string }
  | { type: "DELETE_MULTIPLE"; payload: string[] }
  | { type: "SELECT_ELEMENT"; payload: string | null }
  | { type: "SELECT_MULTIPLE"; payload: string[] }
  | { type: "DESELECT_ALL" }
  | { type: "SET_PAGE_SIZE"; payload: PageSize }
  | { type: "SET_CANVAS_SETTINGS"; payload: Partial<CanvasSettings> }
  | { type: "SET_DOCUMENT_NAME"; payload: string }
  | { type: "SET_DIRTY"; payload: boolean }
  | { type: "BATCH_UPDATE_ELEMENTS"; payload: DesignerElement[] }
  | { type: "LAYER_SHIFT"; payload: { id: string; direction: "up" | "down" } }
  | { type: "LOAD_DESIGN"; payload: DesignState };

const createInitialState = (): DesignState => ({
  documentName: "Untitled Design",
  elements: [],
  selectedIds: [],
  pageSize: { width: 816, height: 1056 }, // 8.5" x 11" at 96dpi
  canvasSettings: {
    background: "#ffffff",
    margin: 36,
    bleed: 12,
    columns: 1,
    gutter: 0,
    showGrid: false,
    showMargins: true,
    showBleed: false,
    showColumns: false,
    showRulers: false,
    showGuides: true,
    snapToGrid: true,
    snapDistance: 8,
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    gridSize: 20,
  },
  pagePreset: "letter",
  printPreset: {
    id: "letter",
    label: "US Letter",
    widthIn: 8.5,
    heightIn: 11,
    widthPx: 816,
    heightPx: 1056,
    dpi: 96,
    colorProfile: "RGB",
    safeMarginIn: 0.25,
    bleedIn: 0.125,
  },
  dirty: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
});

function designerReducer(state: DesignState, action: DesignerAction): DesignState {
  switch (action.type) {
    case "ADD_ELEMENT":
      return {
        ...state,
        elements: [...state.elements, action.payload],
        dirty: true,
        updatedAt: Date.now(),
      };

    case "UPDATE_ELEMENT":
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.payload.id
            ? {
                ...el,
                ...action.payload.changes,
                updatedAt: Date.now(),
              }
            : el
        ),
        dirty: true,
        updatedAt: Date.now(),
      };

    case "DELETE_ELEMENT":
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.payload),
        selectedIds: state.selectedIds.filter((id) => id !== action.payload),
        dirty: true,
        updatedAt: Date.now(),
      };

    case "DELETE_MULTIPLE":
      const idsToDelete = new Set(action.payload);
      return {
        ...state,
        elements: state.elements.filter((el) => !idsToDelete.has(el.id)),
        selectedIds: state.selectedIds.filter((id) => !idsToDelete.has(id)),
        dirty: true,
        updatedAt: Date.now(),
      };

    case "SELECT_ELEMENT":
      return {
        ...state,
        selectedIds: action.payload ? [action.payload] : [],
      };

    case "SELECT_MULTIPLE":
      return {
        ...state,
        selectedIds: action.payload,
      };

    case "DESELECT_ALL":
      return {
        ...state,
        selectedIds: [],
      };

    case "SET_PAGE_SIZE":
      return {
        ...state,
        pageSize: action.payload,
        dirty: true,
        updatedAt: Date.now(),
      };

    case "SET_CANVAS_SETTINGS":
      return {
        ...state,
        canvasSettings: { ...state.canvasSettings, ...action.payload },
        updatedAt: Date.now(),
      };

    case "SET_DOCUMENT_NAME":
      return {
        ...state,
        documentName: action.payload,
        dirty: true,
        updatedAt: Date.now(),
      };

    case "SET_DIRTY":
      return {
        ...state,
        dirty: action.payload,
      };

    case "BATCH_UPDATE_ELEMENTS":
      return {
        ...state,
        elements: action.payload,
        dirty: true,
        updatedAt: Date.now(),
      };

    case "LAYER_SHIFT": {
      const currentElement = state.elements.find((el) => el.id === action.payload.id);
      if (!currentElement) return state;

      const otherElements = state.elements.filter((el) => el.id !== action.payload.id);
      const currentIndex = otherElements.findIndex(
        (el) => el.zIndex < currentElement.zIndex
      );

      if (action.payload.direction === "up") {
        if (currentIndex === -1) {
          currentElement.zIndex = (otherElements[0]?.zIndex ?? 1) + 1;
        } else {
          const targetElement = otherElements[currentIndex];
          const swapZIndex = currentElement.zIndex;
          currentElement.zIndex = targetElement.zIndex;
          targetElement.zIndex = swapZIndex;
        }
      } else {
        const lowerIndex = otherElements.findIndex(
          (el) => el.zIndex > currentElement.zIndex
        );
        if (lowerIndex !== -1) {
          const targetElement = otherElements[lowerIndex];
          const swapZIndex = currentElement.zIndex;
          currentElement.zIndex = targetElement.zIndex;
          targetElement.zIndex = swapZIndex;
        } else if (otherElements.length > 0) {
          currentElement.zIndex = Math.max(...otherElements.map((el) => el.zIndex)) - 1;
        }
      }

      return {
        ...state,
        elements: [...otherElements, currentElement],
        dirty: true,
        updatedAt: Date.now(),
      };
    }

    case "LOAD_DESIGN":
      return action.payload;

    default:
      return state;
  }
}

export function useDesignerState(initialElements?: DesignerElement[]) {
  const [state, dispatch] = useReducer(designerReducer, createInitialState(), (initial) => ({
    ...initial,
    elements: initialElements || [],
  }));

  // Element operations
  const addElement = useCallback((element: DesignerElement) => {
    dispatch({ type: "ADD_ELEMENT", payload: element });
  }, []);

  const updateElement = useCallback((id: string, changes: Partial<DesignerElement>) => {
    dispatch({ type: "UPDATE_ELEMENT", payload: { id, changes } });
  }, []);

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: "DELETE_ELEMENT", payload: id });
  }, []);

  const deleteMultiple = useCallback((ids: string[]) => {
    dispatch({ type: "DELETE_MULTIPLE", payload: ids });
  }, []);

  const batchUpdateElements = useCallback((elements: DesignerElement[]) => {
    dispatch({ type: "BATCH_UPDATE_ELEMENTS", payload: elements });
  }, []);

  // Selection operations
  const selectElement = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_ELEMENT", payload: id });
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    dispatch({ type: "SELECT_MULTIPLE", payload: ids });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: "DESELECT_ALL" });
  }, []);

  const toggleSelection = useCallback((id: string, isMultiSelect: boolean) => {
    dispatch({
      type: "SELECT_MULTIPLE",
      payload: isMultiSelect
        ? state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id]
        : [id],
    });
  }, [state.selectedIds]);

  // Canvas settings
  const setPageSize = useCallback((size: PageSize) => {
    dispatch({ type: "SET_PAGE_SIZE", payload: size });
  }, []);

  const setCanvasSettings = useCallback((settings: Partial<CanvasSettings>) => {
    dispatch({ type: "SET_CANVAS_SETTINGS", payload: settings });
  }, []);

  // Document info
  const setDocumentName = useCallback((name: string) => {
    dispatch({ type: "SET_DOCUMENT_NAME", payload: name });
  }, []);

  const setDirty = useCallback((dirty: boolean) => {
    dispatch({ type: "SET_DIRTY", payload: dirty });
  }, []);

  // Layer management
  const shiftLayer = useCallback((id: string, direction: "up" | "down") => {
    dispatch({ type: "LAYER_SHIFT", payload: { id, direction } });
  }, []);

  // Load complete design
  const loadDesign = useCallback((design: DesignState) => {
    dispatch({ type: "LOAD_DESIGN", payload: design });
  }, []);

  // Helpers
  const selectedElement = useMemo(
    () => (state.selectedIds.length > 0 ? state.elements.find((el) => el.id === state.selectedIds[0]) : null),
    [state.elements, state.selectedIds]
  );

  const selectedElements = useMemo(
    () => state.elements.filter((el) => state.selectedIds.includes(el.id)),
    [state.elements, state.selectedIds]
  );

  return {
    // State
    state,
    documentName: state.documentName,
    elements: state.elements,
    selectedIds: state.selectedIds,
    pageSize: state.pageSize,
    canvasSettings: state.canvasSettings,
    pagePreset: state.pagePreset,
    printPreset: state.printPreset,
    dirty: state.dirty,

    // Element operations
    addElement,
    updateElement,
    deleteElement,
    deleteMultiple,
    batchUpdateElements,

    // Selection operations
    selectElement,
    selectMultiple,
    deselectAll,
    toggleSelection,

    // Canvas settings
    setPageSize,
    setCanvasSettings,

    // Document
    setDocumentName,
    setDirty,

    // Layers
    shiftLayer,

    // Load
    loadDesign,

    // Helpers
    selectedElement,
    selectedElements,
  };
}
