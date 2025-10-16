import type { DesignerElement } from "@/pages/sections/EchoMenuStudio";

const INCH_TO_PX = 96;
const CM_TO_INCH = 1 / 2.54;

export async function exportDesignAsPDF(
  canvas: HTMLDivElement,
  designName: string,
  printPreset: any
) {
  try {
    // Dynamically import to avoid build issues if libraries aren't installed
    let jsPDFLib: any;
    let html2canvasLib: any;

    try {
      const jsPDFModule = await import("jspdf");
      jsPDFLib = jsPDFModule.jsPDF;
    } catch {
      throw new Error("jsPDF is not installed. Please install it with: npm install jspdf");
    }

    try {
      const html2canvasModule = await import("html2canvas");
      html2canvasLib = html2canvasModule.default;
    } catch {
      throw new Error("html2canvas is not installed. Please install it with: npm install html2canvas");
    }

    // Take screenshot of canvas
    const screenshot = await html2canvasLib(canvas, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = screenshot.toDataURL("image/png");
    const widthInches = printPreset.widthIn || 8.5;
    const heightInches = printPreset.heightIn || 11;

    // Create PDF with correct dimensions
    const pdf = new jsPDFLib({
      orientation: widthInches > heightInches ? "landscape" : "portrait",
      unit: "in",
      format: [widthInches, heightInches],
    });

    // Add image to PDF, accounting for bleed
    const bleedInches = printPreset.bleedIn || 0.125;
    pdf.addImage(imgData, "PNG", -bleedInches, -bleedInches, widthInches + bleedInches * 2, heightInches + bleedInches * 2);

    // Save PDF
    pdf.save(`${designName}.pdf`);
    return { success: true };
  } catch (error) {
    console.error("PDF export failed:", error);
    throw error;
  }
}

export async function exportDesignAsSVG(
  elements: DesignerElement[],
  pageSize: { width: number; height: number },
  designName: string
) {
  try {
    const svgContent = generateSVG(elements, pageSize);
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${designName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error("SVG export failed:", error);
    throw new Error("Failed to export SVG.");
  }
}

function generateSVG(
  elements: DesignerElement[],
  pageSize: { width: number; height: number }
): string {
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageSize.width} ${pageSize.height}" width="${pageSize.width}" height="${pageSize.height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
    </style>
  </defs>`;

  // Sort elements by z-index
  const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const element of sorted) {
    svg += generateSVGElement(element);
  }

  svg += "\n</svg>";
  return svg;
}

function generateSVGElement(element: DesignerElement): string {
  const { x, y, width, height, rotation, opacity } = element;
  const transform = rotation ? `transform="rotate(${rotation} ${x + width / 2} ${y + height / 2})"` : "";
  const opacityAttr = opacity !== undefined ? `opacity="${opacity}"` : "";

  let elementSVG = "";

  switch (element.type) {
    case "shape":
      if (element.shape === "ellipse") {
        elementSVG = `
  <ellipse cx="${x + width / 2}" cy="${y + height / 2}" rx="${width / 2}" ry="${height / 2}" 
    fill="${element.fill || "transparent"}" stroke="${element.borderColor || "none"}" 
    stroke-width="${element.borderWidth || 0}" ${opacityAttr} ${transform} />`;
      } else {
        elementSVG = `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${element.borderRadius || 0}"
    fill="${element.fill || "transparent"}" stroke="${element.borderColor || "none"}" 
    stroke-width="${element.borderWidth || 0}" ${opacityAttr} ${transform} />`;
      }
      break;

    case "divider":
      elementSVG = `
  <line x1="${x}" y1="${y + height / 2}" x2="${x + width}" y2="${y + height / 2}"
    stroke="${element.color || "#000000"}" stroke-width="${element.thickness || 1}" ${opacityAttr} ${transform} />`;
      break;

    case "image":
      if (element.imageUrl) {
        elementSVG = `
  <image x="${x}" y="${y}" width="${width}" height="${height}" href="${element.imageUrl}"
    preserveAspectRatio="${element.objectFit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}" 
    ${opacityAttr} ${transform} />`;
      }
      break;

    case "heading":
    case "subheading":
    case "body":
    case "menu-item":
      const fontFamily = element.fontFamily || "Arial, sans-serif";
      const fontSize = element.fontSize || 16;
      const color = element.color || "#000000";
      const textAnchor = element.align === "center" ? "middle" : element.align === "right" ? "end" : "start";
      const startX = element.align === "center" ? x + width / 2 : element.align === "right" ? x + width : x;

      elementSVG = `
  <text x="${startX}" y="${y + fontSize}" font-family="${fontFamily}" font-size="${fontSize}"
    fill="${color}" text-anchor="${textAnchor}" 
    letter-spacing="${element.letterSpacing || 0}"
    line-height="${element.lineHeight || 1.4}" ${opacityAttr} ${transform}
    style="white-space: pre-wrap; word-wrap: break-word; max-width: ${width}px;">
    ${escapeXML(element.text || "")}
  </text>`;

      // Add description for menu items
      if ((element.type === "menu-item" || element.type === "body") && element.description) {
        const descY = y + fontSize + 4;
        const descSize = (fontSize * 0.8) | 0;
        elementSVG += `
  <text x="${startX}" y="${descY + descSize}" font-family="${fontFamily}" font-size="${descSize}"
    fill="${element.accentColor || color}" text-anchor="${textAnchor}" opacity="0.8"
    style="white-space: pre-wrap; word-wrap: break-word; max-width: ${width}px;">
    ${escapeXML(element.description)}
  </text>`;
      }

      // Add price for menu items
      if (element.type === "menu-item" && element.price) {
        const priceX = x + width - 20;
        elementSVG += `
  <text x="${priceX}" y="${y + fontSize}" font-family="${fontFamily}" font-size="${fontSize}"
    fill="${element.accentColor || color}" text-anchor="end" ${opacityAttr}>
    ${element.currency === "USD" ? "$" : ""}${element.price}
  </text>`;
      }
      break;
  }

  return elementSVG;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
