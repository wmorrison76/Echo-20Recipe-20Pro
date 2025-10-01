import { useState } from "react";
import {
  FileText,
  Download,
  Save,
  Eye,
  Clock,
  ChefHat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { ServerNote, ServerNoteRecipe } from "@shared/server-notes";
import {
  AlignmentType,
  BorderStyle,
  Document as DocxDocument,
  HeadingLevel,
  HeightRule,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";

export type ServerNotesGeneratorProps = {
  serverNote: ServerNote;
  onSave: (next: ServerNote) => void;
};

export function ServerNotesGenerator({ serverNote, onSave }: ServerNotesGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [generatedDocxUrl, setGeneratedDocxUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      const blob = await createDocx(serverNote);
      if (generatedDocxUrl) URL.revokeObjectURL(generatedDocxUrl);
      const docxUrl = URL.createObjectURL(blob);
      setGeneratedDocxUrl(docxUrl);
      setGeneratedDocument(createDocumentHtml(serverNote));
      toast({
        title: "Document Generated",
        description: "Server notes document ready to print or download.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Generation Failed",
        description: "Unable to build the document. Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDocument = async () => {
    let docxDataUrl: string | undefined;
    if (generatedDocxUrl) {
      try {
        const response = await fetch(generatedDocxUrl);
        const blob = await response.blob();
        docxDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Failed to capture docx data", error);
      }
    }

    const next: ServerNote = {
      ...serverNote,
      docxDataUrl,
      updatedAt: new Date().toISOString(),
    };
    onSave(next);
    toast({
      title: "Server Notes Saved",
      description: `"${serverNote.title || "Untitled"}" stored successfully.`,
    });
  };

  const printDocument = () => {
    if (!generatedDocument) {
      toast({
        title: "Generate document first",
        description: "Build the document before printing or downloading.",
        variant: "destructive",
      });
      return;
    }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(generatedDocument);
    win.document.close();
    win.focus();
    win.print();
  };

  const downloadDocument = () => {
    if (!generatedDocxUrl) {
      toast({
        title: "No document yet",
        description: "Generate a document before downloading.",
        variant: "destructive",
      });
      return;
    }
    const link = document.createElement("a");
    link.href = generatedDocxUrl;
    link.download = `${serverNote.title || "server-notes"}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Server Notes Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryRow
            icon={<ChefHat className="h-4 w-4 text-primary" />}
            label="Recipes Selected"
            value={`${serverNote.selectedRecipes.length}`}
          />
          <SummaryRow
            icon={<Clock className="h-4 w-4 text-primary" />}
            label="Layout"
            value={serverNote.layout.name}
          />
          <SummaryRow
            icon={<Eye className="h-4 w-4 text-primary" />}
            label={serverNote.pageFormat === "standard" ? "Orientation" : "Card Format"}
            value={
              serverNote.pageFormat === "standard"
                ? serverNote.orientation
                : `${serverNote.cardsPerPage} cards / page`
            }
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Color Scheme:</span>
          <div className="flex gap-1">
            <span className="h-4 w-4 rounded border" style={{ background: serverNote.colorScheme.primary }} />
            <span className="h-4 w-4 rounded border" style={{ background: serverNote.colorScheme.secondary }} />
            <span className="h-4 w-4 rounded border" style={{ background: serverNote.colorScheme.accent }} />
          </div>
          <Badge variant="outline">{serverNote.colorScheme.name}</Badge>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Button
            onClick={generateDocument}
            disabled={isGenerating || serverNote.selectedRecipes.length === 0}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Document"}
          </Button>
          <Button variant="outline" onClick={saveDocument} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          {generatedDocument ? (
            <Button variant="outline" onClick={printDocument} className="flex items-center gap-2">
              Print
            </Button>
          ) : null}
          {generatedDocxUrl ? (
            <Button variant="outline" onClick={downloadDocument} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Word (.docx)
            </Button>
          ) : null}
        </div>

        {serverNote.selectedRecipes.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-2 h-10 w-10 text-muted" />
            Select recipes to generate your server notes document.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type SummaryRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function createDocumentHtml(serverNote: ServerNote): string {
  const { colorScheme, orientation, pageFormat, cardsPerPage } = serverNote;

  if (pageFormat === "index-card") {
    const perPage = Math.max(1, Math.min(2, cardsPerPage || 2));
    const fontSize =
      serverNote.layout.indexCardLayout.fontSize === "small" ? "12px" : "14px";

    const sheets: string[] = [];
    for (let cursor = 0; cursor < serverNote.selectedRecipes.length; cursor += perPage) {
      const chunk = serverNote.selectedRecipes.slice(cursor, cursor + perPage);
      const cards = chunk
        .map((item) => {
          const ingredientsSection =
            serverNote.layout.indexCardLayout.contentPriority !== "instructions"
              ? `<div class="card-subtitle">Ingredients</div>
                 <ul class="tight-list">
                   ${item.recipe.ingredients?.slice(0, 8).map((ing) => `<li>${ing}</li>`).join("") || ""}
                 </ul>`
              : "";
          const instructionsSection =
            serverNote.layout.indexCardLayout.contentPriority !== "ingredients"
              ? `<div class="card-subtitle">Steps</div>
                 <ol class="tight-list">
                   ${item.recipe.instructions?.slice(0, 6).map((step) => `<li>${step}</li>`).join("") || ""}
                 </ol>`
              : "";
          const wineSection = item.wineSelection
            ? `<div class="card-subtitle">Wine</div><div class="small-note">${item.wineSelection}</div>`
            : "";
          const sellingSection = item.sellingNotes
            ? `<div class="card-subtitle">Selling Points</div><div class="small-note">${item.sellingNotes}</div>`
            : "";

          const imageHtml =
            serverNote.layout.indexCardLayout.includeImages && item.recipe.image
              ? `<img src="${item.recipe.image}" alt="${item.recipe.title}" class="card-image" />`
              : "";

          return `<div class="card">
            <div class="card-header">${item.recipe.title}</div>
            <div class="card-content">
              ${imageHtml}
              <div class="card-section">
                ${ingredientsSection}
                ${instructionsSection}
                ${wineSection}
                ${sellingSection}
              </div>
            </div>
          </div>`;
        })
        .join("");

      sheets.push(`<div class="sheet">${cards}</div>`);
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${serverNote.title} - Server Notes</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    body { margin: 0; background: ${colorScheme.background}; color: ${colorScheme.text}; font-family: ${serverNote.layout.standardLayout.fontFamily}; }
    .sheet { page-break-after: always; display: grid; grid-template-rows: repeat(${perPage}, 1fr); gap: 0.5in; align-content: center; }
    .card { width: 5in; height: 3in; margin: 0 auto; border: 1px solid ${colorScheme.secondary}; border-radius: 8px; padding: 10px; box-sizing: border-box; }
    .card-header { font-weight: bold; color: ${colorScheme.primary}; border-bottom: 1px solid ${colorScheme.accent}; padding-bottom: 4px; margin-bottom: 6px; text-align: ${serverNote.layout.indexCardLayout.headerStyle === "centered" ? "center" : "left"}; }
    .card-content { font-size: ${fontSize}; line-height: 1.25; position: relative; }
    .card-image { width: 1.2in; height: 1in; object-fit: cover; border-radius: 4px; float: right; margin-left: 8px; }
    .card-subtitle { font-weight: 600; color: ${colorScheme.primary}; margin-top: 4px; }
    .tight-list { margin: 4px 0; padding-left: 16px; }
    .tight-list li { margin: 2px 0; }
    .small-note { font-style: italic; color: ${colorScheme.secondary}; }
  </style>
</head>
<body>
  ${sheets.join("")}
</body>
</html>`;
  }

  const pages = serverNote.selectedRecipes
    .map((item, index) => {
      const wineSection = item.wineSelection
        ? `<div class="section"><div class="section-title">Wine Pairing & Selection</div><div class="wine-notes">${item.wineSelection}</div></div>`
        : "";
      const sellingSection = item.sellingNotes
        ? `<div class="section"><div class="section-title">Server Selling Points</div><p>${item.sellingNotes}</p></div>`
        : "";
      const serviceSection = item.serviceInstructions
        ? `<div class="section"><div class="section-title">Service Instructions</div><p>${item.serviceInstructions}</p></div>`
        : "";
      const silverwareSection =
        item.silverwareRequired && item.silverwareRequired.length
          ? `<div class="section"><div class="section-title">Required Silverware</div><div class="silverware-list">${item.silverwareRequired
              .map((s) => `<span class="silverware-item">${s}</span>`)
              .join("")}</div></div>`
          : "";
      const allergenBlock = item.recipe.tags?.filter((tag) => /gluten|dairy|nut|shellfish|soy|egg|sesame/i.test(tag));
      const allergenSection =
        allergenBlock && allergenBlock.length && serverNote.layout.standardLayout.includeNutrition
          ? `<div class="section"><div class="section-title">Allergens</div><div class="wine-notes">${allergenBlock.join(", ")}</div></div>`
          : "";

      const imageHtml =
        serverNote.layout.standardLayout.includeImages && item.recipe.image
          ? `<img src="${item.recipe.image}" alt="${item.recipe.title}" class="recipe-image" />`
          : "";

      return `<div class="page recipe-item">
        <div class="recipe-header">${item.recipe.title}</div>
        <div class="recipe-content">
          ${imageHtml}
          <div class="recipe-description">"${item.recipe.description ?? ""}"</div>
          <div class="section"><div class="section-title">Ingredients & Quantities</div><div class="ingredients-list">${
            item.recipe.ingredients?.map((ing) => `<div class="ingredient">• ${ing}</div>`).join("") ?? ""
          }</div></div>
          <div class="section"><div class="section-title">Preparation Method</div><ol>${
            item.recipe.instructions?.map((instruction) => `<li>${instruction}</li>`).join("") ?? ""
          }</ol></div>
          ${wineSection}
          ${sellingSection}
          ${serviceSection}
          ${silverwareSection}
          ${allergenSection}
          <div class="meta">
            <strong>Course:</strong> ${item.recipe.course ?? "—"} •
            <strong> Cuisine:</strong> ${item.recipe.cuisine ?? "—"}
          </div>
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${serverNote.title} - Server Notes</title>
  <style>
    @page { size: ${orientation === "horizontal" ? "landscape" : "portrait"}; margin: 0.75in; }
    body { font-family: '${serverNote.layout.standardLayout.fontFamily}'; color: ${colorScheme.text}; background-color: ${colorScheme.background}; line-height: 1.4; margin: 0; padding: 0; }
    .header { text-align: ${serverNote.layout.standardLayout.headerStyle === "centered" ? "center" : "left"}; border-bottom: 2px solid ${colorScheme.primary}; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-container { display: flex; justify-content: center; gap: 20px; margin-bottom: 15px; }
    .logo { height: 60px; width: auto; }
    .company-name { font-size: 28px; font-weight: bold; color: ${colorScheme.primary}; margin: 10px 0; }
    .outlet-name { font-size: 18px; color: ${colorScheme.secondary}; margin: 5px 0; }
    .document-title { font-size: 24px; font-weight: bold; color: ${colorScheme.primary}; margin: 15px 0 5px 0; }
    .distribution-date { font-size: 14px; color: ${colorScheme.secondary}; margin-bottom: 20px; }
    .recipe-item { page-break-inside: avoid; margin-bottom: 30px; border: 1px solid ${colorScheme.secondary}; border-radius: 8px; overflow: hidden; }
    .recipe-header { background-color: ${colorScheme.primary}; color: white; padding: 15px; font-size: 20px; font-weight: bold; }
    .recipe-content { padding: 20px; position: relative; }
    .recipe-image { float: right; width: 150px; height: 120px; object-fit: cover; border-radius: 6px; margin-left: 20px; margin-bottom: 10px; }
    .recipe-description { font-style: italic; margin-bottom: 15px; color: ${colorScheme.secondary}; }
    .section { margin-bottom: 15px; }
    .section-title { font-weight: bold; color: ${colorScheme.primary}; border-bottom: 1px solid ${colorScheme.accent}; padding-bottom: 2px; margin-bottom: 5px; }
    .ingredients-list { ${serverNote.layout.standardLayout.recipeLayout === "two-column" ? "columns: 2; column-gap: 20px;" : ""} margin-bottom: 15px; }
    .ingredient { break-inside: avoid; margin-bottom: 3px; }
    .silverware-list { display: flex; flex-wrap: wrap; gap: 5px; }
    .silverware-item { background-color: ${colorScheme.accent}; color: ${colorScheme.text}; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
    .wine-notes { background-color: ${colorScheme.background}; border-left: 4px solid ${colorScheme.accent}; padding: 10px; margin: 10px 0; font-style: italic; }
    .index-page { page-break-after: always; }
    .index-list { list-style: none; padding: 0; }
    .index-item { padding: 10px; border-bottom: 1px dotted ${colorScheme.secondary}; display: flex; justify-content: space-between; }
    .meta { margin-top: 16px; font-size: 12px; color: ${colorScheme.secondary}; border-top: 1px solid ${colorScheme.secondary}; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="page title-page">
    <div class="header">
      ${serverNote.logos.length ? `<div class="logo-container">${serverNote.logos
        .map((logo) => `<img src="${logo}" alt="Logo" class="logo" />`)
        .join("")}</div>` : ""}
      ${serverNote.companyName ? `<div class="company-name">${serverNote.companyName}</div>` : ""}
      ${serverNote.outletName ? `<div class="outlet-name">${serverNote.outletName}</div>` : ""}
      <div class="document-title">${serverNote.title}</div>
      <div class="distribution-date">Distribution Date: ${new Date(serverNote.distributionDate).toLocaleDateString()}</div>
    </div>
  </div>
  <div class="page index-page">
    <h2 style="color: ${colorScheme.primary}; border-bottom: 2px solid ${colorScheme.primary}; padding-bottom: 10px;">Menu Index</h2>
    <ul class="index-list">
      ${serverNote.selectedRecipes
        .map((item, index) => `<li class="index-item"><span>${item.recipe.title}</span><span>Page ${index + 3}</span></li>`)
        .join("")}
    </ul>
  </div>
  ${pages}
</body>
</html>`;
}

async function createDocx(note: ServerNote): Promise<Blob> {
  const standard = note.pageFormat === "standard";
  const cardsPerPage = standard ? 1 : Math.max(1, Math.min(2, note.cardsPerPage || 2));

  const pageSize = standard
    ? {
        width: note.orientation === "horizontal" ? convertInchesToTwip(11) : convertInchesToTwip(8.5),
        height: note.orientation === "horizontal" ? convertInchesToTwip(8.5) : convertInchesToTwip(11),
        orientation: note.orientation === "horizontal" ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
      }
    : {
        width: convertInchesToTwip(8.5),
        height: convertInchesToTwip(11),
        orientation: PageOrientation.PORTRAIT,
      };

  const font = (note.layout.standardLayout.fontFamily || "Times New Roman").split(",")[0]?.replace(/['"]/g, "").trim() || "Times New Roman";

  const toHex = (color: string) => color.replace("#", "") || "000000";

  const dataUrlToUint8 = async (dataUrl: string): Promise<Uint8Array> => {
    if (dataUrl.startsWith("data:")) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return new Uint8Array(await blob.arrayBuffer());
    }
    const response = await fetch(dataUrl, { mode: "cors" });
    return new Uint8Array(await response.arrayBuffer());
  };

  const fetchImage = async (url?: string) => {
    if (!url) return null;
    try {
      return await dataUrlToUint8(url);
    } catch {
      return null;
    }
  };

  type HeadingValue = (typeof HeadingLevel)[keyof typeof HeadingLevel];
  type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType];

  const heading = (text: string, level: HeadingValue, align: AlignmentValue = AlignmentType.LEFT) =>
    new Paragraph({
      heading: level,
      alignment: align,
      children: [
        new TextRun({ text, bold: true, color: toHex(note.colorScheme.primary), font }),
      ],
    });

  const paragraph = (
    text: string,
    options?: { align?: AlignmentValue; color?: string; bold?: boolean; size?: number },
  ) =>
    new Paragraph({
      alignment: options?.align,
      children: [
        new TextRun({
          text,
          color: toHex(options?.color || note.colorScheme.text),
          bold: options?.bold,
          size: options?.size,
          font,
        }),
      ],
    });

  const sections: any[] = [];

  const headerChildren: Paragraph[] = [];
  if (note.logos.length) {
    for (const logo of note.logos.slice(0, 2)) {
      const data = await fetchImage(logo);
      if (!data) continue;
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({ data, transformation: { width: 140, height: 70 } }),
          ],
        }),
      );
    }
  }

  if (note.companyName) {
    headerChildren.push(
      paragraph(note.companyName, {
        align: AlignmentType.CENTER,
        color: note.colorScheme.primary,
        bold: true,
        size: 56,
      }),
    );
  }
  if (note.outletName) {
    headerChildren.push(
      paragraph(note.outletName, {
        align: AlignmentType.CENTER,
        color: note.colorScheme.secondary,
      }),
    );
  }

  headerChildren.push(
    new Paragraph({
      text: note.title || "Server Notes",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ font })],
    }),
  );
  headerChildren.push(
    paragraph(`Distribution Date: ${new Date(note.distributionDate).toLocaleDateString()}`, {
      align: AlignmentType.CENTER,
      color: note.colorScheme.secondary,
    }),
  );

  sections.push({
    properties: {
      page: {
        size: pageSize,
        margin: {
          top: convertInchesToTwip(0.75),
          right: convertInchesToTwip(0.75),
          bottom: convertInchesToTwip(0.75),
          left: convertInchesToTwip(0.75),
        },
      },
    },
    children: headerChildren,
  });

  if (standard) {
    for (const entry of note.selectedRecipes) {
      const children: Paragraph[] = [];
      const headerAlign =
        note.layout.standardLayout.headerStyle === "centered"
          ? AlignmentType.CENTER
          : AlignmentType.LEFT;

      children.push(
        new Paragraph({
          alignment: headerAlign,
          children: [
            new TextRun({
              text: entry.recipe.title,
              bold: true,
              size: 36,
              color: toHex(note.colorScheme.primary),
              font,
            }),
          ],
        }),
      );

      if (note.layout.standardLayout.includeImages) {
        const imageData = await fetchImage(entry.recipe.image);
        if (imageData) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new ImageRun({ data: imageData, transformation: { width: 300, height: 220 } }),
              ],
            }),
          );
        }
      }

      if (entry.recipe.description) {
        children.push(paragraph(entry.recipe.description, { color: note.colorScheme.secondary }));
      }

      if (note.layout.standardLayout.recipeLayout === "two-column") {
        const ingredientParagraphs = entry.recipe.ingredients?.map((ing) => paragraph(`• ${ing}`)) || [];
        const instructionParagraphs = entry.recipe.instructions?.map((step, idx) => paragraph(`${idx + 1}. ${step}`)) || [];

        const row = new TableRow({
          children: [
            new TableCell({ children: [heading("Ingredients", HeadingLevel.HEADING_3), ...ingredientParagraphs] }),
            new TableCell({ children: [heading("Preparation", HeadingLevel.HEADING_3), ...instructionParagraphs] }),
          ],
        });

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [row],
          }),
        );
      } else {
        children.push(heading("Ingredients", HeadingLevel.HEADING_3));
        entry.recipe.ingredients?.forEach((ing) => children.push(paragraph(`• ${ing}`)));
        children.push(heading("Preparation", HeadingLevel.HEADING_3));
        entry.recipe.instructions?.forEach((step, idx) => children.push(paragraph(`${idx + 1}. ${step}`)));
      }

      if (entry.wineSelection) {
        children.push(heading("Wine Pairing", HeadingLevel.HEADING_3));
        children.push(paragraph(entry.wineSelection));
      }

      if (entry.sellingNotes) {
        children.push(heading("Selling Points", HeadingLevel.HEADING_3));
        children.push(paragraph(entry.sellingNotes));
      }

      if (entry.serviceInstructions) {
        children.push(heading("Service Instructions", HeadingLevel.HEADING_3));
        children.push(paragraph(entry.serviceInstructions));
      }

      if (entry.silverwareRequired?.length) {
        children.push(heading("Required Silverware", HeadingLevel.HEADING_3));
        entry.silverwareRequired.forEach((item) => children.push(paragraph(`• ${item}`)));
      }

      sections.push({
        properties: {
          page: {
            size: pageSize,
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      });
    }
  } else {
    for (let idx = 0; idx < note.selectedRecipes.length; idx += cardsPerPage) {
      const pageRecipes = note.selectedRecipes.slice(idx, idx + cardsPerPage);
      const rows: TableRow[] = [];

      for (const item of pageRecipes) {
        const cells: Paragraph[] = [];
        cells.push(
          new Paragraph({
            alignment: note.layout.indexCardLayout.headerStyle === "centered" ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: [
              new TextRun({
                text: item.recipe.title,
                bold: true,
                size: 32,
                color: toHex(note.colorScheme.primary),
                font,
              }),
            ],
          }),
        );

        if (note.layout.indexCardLayout.includeImages) {
          const img = await fetchImage(item.recipe.image);
          if (img) {
            cells.push(
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new ImageRun({ data: img, transformation: { width: 180, height: 140 } })],
              }),
            );
          }
        }

        if (note.layout.indexCardLayout.contentPriority !== "instructions") {
          cells.push(heading("Ingredients", HeadingLevel.HEADING_3));
          item.recipe.ingredients?.slice(0, 8).forEach((ing) => cells.push(paragraph(`• ${ing}`)));
        }

        if (note.layout.indexCardLayout.contentPriority !== "ingredients") {
          cells.push(heading("Steps", HeadingLevel.HEADING_3));
          item.recipe.instructions?.slice(0, 6).forEach((step, indexStep) => cells.push(paragraph(`${indexStep + 1}. ${step}`)));
        }

        if (item.wineSelection) {
          cells.push(heading("Wine", HeadingLevel.HEADING_3));
          cells.push(paragraph(item.wineSelection));
        }

        if (item.sellingNotes) {
          cells.push(heading("Selling", HeadingLevel.HEADING_3));
          cells.push(paragraph(item.sellingNotes));
        }

        rows.push(
          new TableRow({
            height: { value: convertInchesToTwip(3), rule: HeightRule.EXACT },
            children: [
              new TableCell({
                margins: {
                  top: convertInchesToTwip(0.15),
                  bottom: convertInchesToTwip(0.15),
                  left: convertInchesToTwip(0.2),
                  right: convertInchesToTwip(0.2),
                },
                width: { size: convertInchesToTwip(5), type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
                  bottom: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
                  left: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
                  right: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
                },
                children: cells,
              }),
            ],
          }),
        );
      }

      sections.push({
        properties: {
          page: {
            size: pageSize,
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children: [
          new Table({
            width: { size: convertInchesToTwip(5), type: WidthType.DXA },
            rows,
          }),
        ],
      });
    }
  }

  const doc = new DocxDocument({ sections });
  return Packer.toBlob(doc);
}
