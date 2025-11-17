import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CooksRecipeBookGenerator } from "@/components/CooksRecipeBookGenerator";
import type { Recipe } from "@shared/recipes";
import type { LanguageCode, LanguageOption } from "@/i18n/config";
import type { ServerNote } from "@shared/server-notes";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CookbookBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  collectionName: string;
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  languageOptions: LanguageOption[];
  onSaveToOperationsDocs?: (cookbook: { name: string; html: string; language: string }) => void;
}

export function CookbookBuilderDialog({
  open,
  onOpenChange,
  recipes,
  collectionName,
  language,
  onLanguageChange,
  languageOptions,
  onSaveToOperationsDocs,
}: CookbookBuilderDialogProps) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    const content = document.querySelector("[data-cookbook-content]");
    if (!content) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${collectionName}</title>
  <style>
    ${document.head.innerHTML}
  </style>
</head>
<body>
  ${content.innerHTML}
</body>
</html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${collectionName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onSaveToOperationsDocs) {
      onSaveToOperationsDocs({
        name: collectionName,
        html,
        language,
      });
    }
  }, [collectionName, language, onSaveToOperationsDocs]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
          <DialogTitle>{collectionName}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <CooksRecipeBookGenerator
            recipes={recipes}
            language={language}
            onLanguageChange={onLanguageChange}
            languageOptions={languageOptions}
          />

          <div className="sticky bottom-0 flex gap-2 border-t bg-background p-4" data-no-print="true">
            <Button
              variant="outline"
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
            >
              Download & Save
            </Button>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
