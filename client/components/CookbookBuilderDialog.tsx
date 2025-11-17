import React, { useCallback, useState, useEffect, useRef } from "react";
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
  note?: ServerNote;
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
  note,
}: CookbookBuilderDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const generatorRef = useRef<any>(null);

  useEffect(() => {
    if (!open) {
      setIsGenerating(false);
      setTranslationProgress(0);
    } else {
      setSelectedLanguage(language);
    }
  }, [open, language]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!generatedHtml) {
      toast({
        title: "Error",
        description: "Please generate the cookbook first by clicking the 'Generate Cookbook' button",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setTranslationProgress(0);

    try {
      // Simulate progress for recipe processing
      const progressInterval = setInterval(() => {
        setTranslationProgress((prev) => {
          if (prev < 80) {
            return prev + Math.random() * 20;
          }
          return prev;
        });
      }, 300);

      const blob = new Blob([generatedHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collectionName}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      clearInterval(progressInterval);
      setTranslationProgress(100);

      if (onSaveToOperationsDocs) {
        onSaveToOperationsDocs({
          name: collectionName,
          html: generatedHtml,
          language: selectedLanguage,
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
  }, [generatedHtml, collectionName, selectedLanguage, onSaveToOperationsDocs]);

  const handleClose = useCallback(() => {
    if (!isGenerating) {
      onOpenChange(false);
    }
  }, [onOpenChange, isGenerating]);

  const handleLanguageChange = (newLanguage: LanguageCode) => {
    setSelectedLanguage(newLanguage);
    onLanguageChange(newLanguage);
    setGeneratedHtml(null);
  };

  const handleGeneratedHtml = useCallback((html: string) => {
    setGeneratedHtml(html);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
          <div className="flex flex-col gap-3 flex-1">
            <DialogTitle>{collectionName}</DialogTitle>
            {languageOptions && languageOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Language:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                  disabled={isGenerating}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-background text-sm"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
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
                <span>Processing recipes...</span>
                <span className="text-muted-foreground">
                  {Math.round(translationProgress)}%
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
            language={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            languageOptions={languageOptions}
            note={note}
            onGeneratedHtml={handleGeneratedHtml}
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
              disabled={isGenerating || !generatedHtml}
              className={isGenerating ? "opacity-50" : ""}
            >
              {isGenerating ? "Processing..." : generatedHtml ? "Download & Save" : "Generate First"}
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
