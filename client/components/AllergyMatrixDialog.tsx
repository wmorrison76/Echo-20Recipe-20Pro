import React, { useMemo, useState } from "react";
import { ShieldAlert, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ServerNoteRecipe } from "@shared/server-notes";
import type { LanguageCode, LanguageOption } from "@/i18n/config";
import { collectUniqueAllergens, extractRecipeAllergens } from "@/lib/allergens";

const matrixLabels: Record<LanguageCode, {
  title: string;
  subtitle: string;
  allergen: string;
  recipe: string;
  present: string;
  absent: string;
  noData: string;
  noAllergensRow: string;
  print: string;
}> = {
  "en-US": {
    title: "Food Allergen Matrix",
    subtitle: "Cross-reference selected recipes against allergen flags.",
    allergen: "Allergen",
    recipe: "Recipe",
    present: "Yes",
    absent: "No",
    noData: "No recipes selected.",
    noAllergensRow: "No allergens flagged",
    print: "Print Matrix",
  },
  "fr-FR": {
    title: "Matrice des allergènes",
    subtitle: "Recoupez les recettes sélectionnées avec les allergènes signalés.",
    allergen: "Allergène",
    recipe: "Recette",
    present: "Oui",
    absent: "Non",
    noData: "Aucune recette sélectionnée.",
    noAllergensRow: "Aucun allergène signalé",
    print: "Imprimer la matrice",
  },
  "it-IT": {
    title: "Matrice degli allergeni",
    subtitle: "Incrocia le ricette selezionate con gli allergeni indicati.",
    allergen: "Allergene",
    recipe: "Ricetta",
    present: "Sì",
    absent: "No",
    noData: "Nessuna ricetta selezionata.",
    noAllergensRow: "Nessun allergene segnalato",
    print: "Stampa matrice",
  },
  "es-ES": {
    title: "Matriz de alérgenos",
    subtitle: "Cruza las recetas seleccionadas con los alérgenos indicados.",
    allergen: "Alérgeno",
    recipe: "Receta",
    present: "Sí",
    absent: "No",
    noData: "No hay recetas seleccionadas.",
    noAllergensRow: "Sin alérgenos señalados",
    print: "Imprimir matriz",
  },
  "pt-BR": {
    title: "Matriz de alérgenos",
    subtitle: "Cruze as receitas selecionadas com os alérgenos informados.",
    allergen: "Alergênico",
    recipe: "Receita",
    present: "Sim",
    absent: "Não",
    noData: "Nenhum alergênico identificado nessas receitas.",
    print: "Imprimir matriz",
  },
  "de-DE": {
    title: "Allergenmatrix",
    subtitle: "Vergleichen Sie ausgewählte Rezepte mit gemeldeten Allergenen.",
    allergen: "Allergen",
    recipe: "Rezept",
    present: "Ja",
    absent: "Nein",
    noData: "Keine Allergene für diese Rezepte gefunden.",
    print: "Matrix drucken",
  },
};

type AllergyMatrixDialogProps = {
  recipes: ServerNoteRecipe[];
  language: LanguageCode;
  languageOptions: LanguageOption[];
};

function buildMatrixHtml(
  allergens: string[],
  recipes: ServerNoteRecipe[],
  language: LanguageCode,
  labels: (typeof matrixLabels)[LanguageCode],
  languageName: string,
) {
  const headerCols = recipes
    .map((recipe) => `<th>${recipe.recipe.title ? recipe.recipe.title : labels.recipe}</th>`)
    .join("");
  const rows = allergens
    .map((allergen) => {
      const cells = recipes
        .map((entry) => {
          const set = new Set(extractRecipeAllergens(entry).map((item) => item.toLowerCase()));
          const has = set.has(allergen.toLowerCase());
          return `<td>${has ? labels.present : labels.absent}</td>`;
        })
        .join("");
      return `<tr><th>${allergen}</th>${cells}</tr>`;
    })
    .join("");
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<title>${labels.title}</title>
<style>
  body { font-family: "Inter", sans-serif; margin: 0; padding: 2rem; }
  h1 { text-transform: uppercase; letter-spacing: 0.2em; font-size: 1.4rem; margin-bottom: 0.75rem; }
  p { color: #4b5563; margin-top: 0; margin-bottom: 1.25rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #d1d5db; padding: 0.6rem; text-align: center; font-size: 0.9rem; }
  th { background: #f3f4f6; font-weight: 600; }
  th:first-child { text-align: left; }
</style>
</head>
<body>
  <h1>${labels.title}</h1>
  <p>${labels.subtitle} — ${languageName}</p>
  <table>
    <thead>
      <tr><th>${labels.allergen}</th>${headerCols}</tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

export function AllergyMatrixDialog({
  recipes,
  language,
  languageOptions,
}: AllergyMatrixDialogProps) {
  const labels = useMemo(
    () => matrixLabels[language] ?? matrixLabels["en-US"],
    [language],
  );
  const [open, setOpen] = useState(false);
  const allergens = useMemo(() => collectUniqueAllergens(recipes), [recipes]);
  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [recipes],
  );
  const languageName = useMemo(
    () => languageOptions.find((option) => option.code === language)?.label || language,
    [language, languageOptions],
  );

  const printMatrix = () => {
    if (!allergens.length || !sortedRecipes.length) return;
    const html = buildMatrixHtml(allergens, sortedRecipes, language, labels, languageName);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={sortedRecipes.length === 0}
        className="flex items-center gap-2"
      >
        <ShieldAlert className="h-4 w-4" />
        {labels.title}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>{labels.subtitle}</DialogDescription>
          </DialogHeader>
          {allergens.length === 0 || sortedRecipes.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {labels.noData}
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-background px-3 py-2 text-left font-semibold uppercase tracking-[0.18em]">
                      {labels.allergen}
                    </th>
                    {sortedRecipes.map((entry) => (
                      <th
                        key={entry.recipe.id}
                        className="px-3 py-2 text-left font-semibold uppercase tracking-[0.18em]"
                      >
                        {entry.recipe.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allergens.map((allergen) => {
                    const allergenLower = allergen.toLowerCase();
                    return (
                      <tr key={allergen} className="border-t">
                        <th className="sticky left-0 bg-background px-3 py-2 text-left font-medium">
                          {allergen}
                        </th>
                        {sortedRecipes.map((entry) => {
                          const hasAllergen = extractRecipeAllergens(entry)
                            .map((item) => item.toLowerCase())
                            .includes(allergenLower);
                          return (
                            <td
                              key={`${entry.recipe.id}-${allergen}`}
                              className={`px-3 py-2 text-center text-xs font-semibold ${
                                hasAllergen ? "text-red-600" : "text-muted-foreground"
                              }`}
                            >
                              {hasAllergen ? labels.present : labels.absent}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={printMatrix}
              disabled={!allergens.length || !sortedRecipes.length}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {labels.print}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
