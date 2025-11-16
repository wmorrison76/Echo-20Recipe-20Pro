import { useCallback } from "react";
import { DesignerElement, DesignerElementType } from "./useDesignerState";

interface UseCanvasOperationsProps {
  elements: DesignerElement[];
  selectedElement: DesignerElement | null;
  onAddElement: (element: DesignerElement) => void;
  onUpdateElement: (id: string, changes: Partial<DesignerElement>) => void;
  onDeleteElement: (id: string) => void;
  onSelectElement: (id: string | null) => void;
  onBatchUpdate: (elements: DesignerElement[]) => void;
}

export function useCanvasOperations({
  elements,
  selectedElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onSelectElement,
  onBatchUpdate,
}: UseCanvasOperationsProps) {
  // Generate unique ID
  const generateId = useCallback(() => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  // Get highest Z-index
  const getHighestZIndex = useCallback(() => {
    return elements.length > 0 ? Math.max(...elements.map((el) => el.zIndex)) + 1 : 1;
  }, [elements]);

  // Add text element
  const addTextElement = useCallback(
    (type: "heading" | "subheading" | "body" | "menu-item", text: string = "", x = 50, y = 50) => {
      const fontSizeMap = {
        heading: 32,
        subheading: 24,
        body: 14,
        "menu-item": 16,
      };

      const element: DesignerElement = {
        id: generateId(),
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Text`,
        x,
        y,
        width: 300,
        height: 40,
        rotation: 0,
        opacity: 100,
        zIndex: getHighestZIndex(),
        text: text || `Sample ${type} text`,
        fontSize: fontSizeMap[type],
        fontFamily: '"Inter", sans-serif',
        fontWeight: type === "heading" || type === "subheading" ? 700 : 400,
        lineHeight: 1.4,
        letterSpacing: 0,
        align: "left",
        color: "#000000",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onAddElement(element);
      onSelectElement(element.id);
      return element;
    },
    [generateId, getHighestZIndex, onAddElement, onSelectElement]
  );

  // Add image element
  const addImageElement = useCallback(
    (imageUrl: string, x = 50, y = 50, width = 300, height = 300) => {
      const element: DesignerElement = {
        id: generateId(),
        type: "image",
        name: "Image",
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 100,
        zIndex: getHighestZIndex(),
        imageUrl,
        objectFit: "cover",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onAddElement(element);
      onSelectElement(element.id);
      return element;
    },
    [generateId, getHighestZIndex, onAddElement, onSelectElement]
  );

  // Add shape element
  const addShapeElement = useCallback(
    (shape: "rectangle" | "ellipse", x = 50, y = 50, width = 150, height = 150) => {
      const element: DesignerElement = {
        id: generateId(),
        type: "shape",
        name: shape.charAt(0).toUpperCase() + shape.slice(1),
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 100,
        zIndex: getHighestZIndex(),
        shape,
        fill: "#cccccc",
        borderColor: "#000000",
        borderWidth: 1,
        borderRadius: shape === "rectangle" ? 0 : 150,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onAddElement(element);
      onSelectElement(element.id);
      return element;
    },
    [generateId, getHighestZIndex, onAddElement, onSelectElement]
  );

  // Add divider
  const addDivider = useCallback(
    (x = 50, y = 50, width = 300) => {
      const element: DesignerElement = {
        id: generateId(),
        type: "divider",
        name: "Divider",
        x,
        y,
        width,
        height: 2,
        rotation: 0,
        opacity: 100,
        zIndex: getHighestZIndex(),
        fill: "#000000",
        borderColor: "#000000",
        borderWidth: 1,
        thickness: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onAddElement(element);
      onSelectElement(element.id);
      return element;
    },
    [generateId, getHighestZIndex, onAddElement, onSelectElement]
  );

  // Add icon
  const addIcon = useCallback(
    (iconName: string, x = 50, y = 50, size = 32, color = "#000000") => {
      const element: DesignerElement = {
        id: generateId(),
        type: "icon",
        name: `Icon: ${iconName}`,
        x,
        y,
        width: size,
        height: size,
        rotation: 0,
        opacity: 100,
        zIndex: getHighestZIndex(),
        text: iconName,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onAddElement(element);
      onSelectElement(element.id);
      return element;
    },
    [generateId, getHighestZIndex, onAddElement, onSelectElement]
  );

  // Add price column (LUCCCA-specific)
  const addPriceColumn = useCallback(
    (x = 50, y = 50) => {
      const element: DesignerElement = {
        id: generateId(),
        type: "price-column",
        name: "Price Column",
        x,
        y,
        width: 100,
        height: 40,
        rotation: 0,
        opacity: 100,
        zIndex: getHighestZIndex(),
        text: "$24.95",
        fontSize: 14,
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
        align: "right",
        color: "#000000",
        currency: "$",
        price: 24.95,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onAddElement(element);
      onSelectElement(element.id);
      return element;
    },
    [generateId, getHighestZIndex, onAddElement, onSelectElement]
  );

  // Duplicate element
  const duplicateElement = useCallback(
    (id: string) => {
      const element = elements.find((el) => el.id === id);
      if (!element) return;

      const newElement: DesignerElement = {
        ...element,
        id: generateId(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: getHighestZIndex(),
        name: `${element.name} copy`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onAddElement(newElement);
      onSelectElement(newElement.id);
      return newElement;
    },
    [elements, generateId, getHighestZIndex, onAddElement, onSelectElement]
  );

  // Group elements (flatten to same container - simplified)
  const groupElements = useCallback(
    (ids: string[]) => {
      const groupId = generateId();
      const groupElements = elements.filter((el) => ids.includes(el.id));

      if (groupElements.length === 0) return;

      // Calculate bounding box
      const minX = Math.min(...groupElements.map((el) => el.x));
      const minY = Math.min(...groupElements.map((el) => el.y));
      const maxX = Math.max(...groupElements.map((el) => el.x + el.width));
      const maxY = Math.max(...groupElements.map((el) => el.y + el.height));

      // For now, we'll just select all and add metadata
      // True grouping would require a different data structure
      const updated = elements.map((el) => ({
        ...el,
        groupId: ids.includes(el.id) ? groupId : el.groupId,
      }));

      onBatchUpdate(updated);
    },
    [elements, generateId, onBatchUpdate]
  );

  // Align elements
  const alignElements = useCallback(
    (ids: string[], direction: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      const targetElements = elements.filter((el) => ids.includes(el.id));
      if (targetElements.length === 0) return;

      const updated = [...elements];

      switch (direction) {
        case "left": {
          const minX = Math.min(...targetElements.map((el) => el.x));
          targetElements.forEach((el) => {
            const index = updated.findIndex((e) => e.id === el.id);
            updated[index].x = minX;
          });
          break;
        }
        case "center": {
          const avgX = targetElements.reduce((sum, el) => sum + el.x, 0) / targetElements.length;
          targetElements.forEach((el) => {
            const index = updated.findIndex((e) => e.id === el.id);
            updated[index].x = avgX - el.width / 2;
          });
          break;
        }
        case "right": {
          const maxX = Math.max(...targetElements.map((el) => el.x + el.width));
          targetElements.forEach((el) => {
            const index = updated.findIndex((e) => e.id === el.id);
            updated[index].x = maxX - el.width;
          });
          break;
        }
        case "top": {
          const minY = Math.min(...targetElements.map((el) => el.y));
          targetElements.forEach((el) => {
            const index = updated.findIndex((e) => e.id === el.id);
            updated[index].y = minY;
          });
          break;
        }
        case "middle": {
          const avgY = targetElements.reduce((sum, el) => sum + el.y, 0) / targetElements.length;
          targetElements.forEach((el) => {
            const index = updated.findIndex((e) => e.id === el.id);
            updated[index].y = avgY - el.height / 2;
          });
          break;
        }
        case "bottom": {
          const maxY = Math.max(...targetElements.map((el) => el.y + el.height));
          targetElements.forEach((el) => {
            const index = updated.findIndex((e) => e.id === el.id);
            updated[index].y = maxY - el.height;
          });
          break;
        }
      }

      onBatchUpdate(updated);
    },
    [elements, onBatchUpdate]
  );

  // Distribute elements
  const distributeElements = useCallback(
    (ids: string[], direction: "horizontal" | "vertical") => {
      const targetElements = elements.filter((el) => ids.includes(el.id)).sort((a, b) => {
        if (direction === "horizontal") return a.x - b.x;
        return a.y - b.y;
      });

      if (targetElements.length < 2) return;

      const updated = [...elements];

      if (direction === "horizontal") {
        const minX = Math.min(...targetElements.map((el) => el.x));
        const maxX = Math.max(...targetElements.map((el) => el.x + el.width));
        const totalWidth = maxX - minX;
        const totalElementWidth = targetElements.reduce((sum, el) => sum + el.width, 0);
        const spacing = (totalWidth - totalElementWidth) / (targetElements.length - 1);

        let currentX = minX;
        targetElements.forEach((el) => {
          const index = updated.findIndex((e) => e.id === el.id);
          updated[index].x = currentX;
          currentX += el.width + spacing;
        });
      } else {
        const minY = Math.min(...targetElements.map((el) => el.y));
        const maxY = Math.max(...targetElements.map((el) => el.y + el.height));
        const totalHeight = maxY - minY;
        const totalElementHeight = targetElements.reduce((sum, el) => sum + el.height, 0);
        const spacing = (totalHeight - totalElementHeight) / (targetElements.length - 1);

        let currentY = minY;
        targetElements.forEach((el) => {
          const index = updated.findIndex((e) => e.id === el.id);
          updated[index].y = currentY;
          currentY += el.height + spacing;
        });
      }

      onBatchUpdate(updated);
    },
    [elements, onBatchUpdate]
  );

  return {
    // Element creation
    addTextElement,
    addImageElement,
    addShapeElement,
    addDivider,
    addIcon,
    addPriceColumn,

    // Element operations
    duplicateElement,
    groupElements,

    // Alignment
    alignElements,
    distributeElements,

    // Helpers
    generateId,
    getHighestZIndex,
  };
}
