import React, { useCallback, useState, useEffect } from "react";
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
  onLanguageChange?: (code: LanguageCode) => void;
  languageOptions?: LanguageOption[];
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setIsGenerating(false);
      setTranslationProgress(0);
    }
  }, [open]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    setTranslationProgress(0);

    try {
      // Translate recipes if needed
      if (language !== "en-US" && recipes.length > 0) {
        await translateRecipes();
      }

      const content = document.querySelector("[data-cookbook-content]");
      if (!content) {
        throw new Error("Could not generate cookbook content");
      }

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

      setTranslationProgress(100);

      if (onSaveToOperationsDocs) {
        onSaveToOperationsDocs({
          name: collectionName,
          html,
          language,
        });
      }

      setTimeout(() => {
        setIsGenerating(false);
        setTranslationProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to download cookbook",
        variant: "destructive",
      });
      setIsGenerating(false);
      setTranslationProgress(0);
    }
  }, [collectionName, language, recipes, onSaveToOperationsDocs]);

  const translateRecipes = useCallback(async () => {
    try {
      // Prepare recipes for translation
      const recipesToTranslate = recipes.map((recipe) => ({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
      }));

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipes: recipesToTranslate,
          targetLanguage: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation service unavailable");
      }

      const data = (await response.json()) as any;

      // Update progress to show completion
      const totalRecipes = data.recipes?.length || recipes.length;
      setTranslationProgress(Math.round((totalRecipes / totalRecipes) * 80));
    } catch (error) {
      console.error("Translation error:", error);
      // Continue with untranslated recipes
      setTranslationProgress(80);
    }
  }, [recipes, language]);

  const handleClose = useCallback(() => {
    if (!isGenerating) {
      onOpenChange(false);
    }
  }, [onOpenChange, isGenerating]);

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
            disabled={isGenerating}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator */}
          {isGenerating && translationProgress < 100 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Translating recipes...</span>
                <span className="text-muted-foreground">
                  {translationProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${translationProgress}%` }}
                />
              </div>
            </div>
          )}

          <CooksRecipeBookGenerator
            recipes={recipes}
            language={language}
            onLanguageChange={undefined}
            languageOptions={[]}
          />

          <div className="sticky bottom-0 flex gap-2 border-t bg-background p-4" data-no-print="true">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isGenerating}
            >
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isGenerating}
              className={isGenerating ? "opacity-50" : ""}
            >
              {isGenerating ? "Processing..." : "Download & Save"}
            </Button>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isGenerating}
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
