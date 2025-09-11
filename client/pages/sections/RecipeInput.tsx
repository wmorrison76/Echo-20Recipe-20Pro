import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";

export default function RecipeInputSection() {
  const { addRecipesFromJsonFiles, clearRecipes, recipes, linkImagesToRecipesByFilename } = useAppData();
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ file: string; error: string }[]>([]);

  const onFiles = async (files: File[]) => {
    setStatus("Processing...");
    const { added, errors } = await addRecipesFromJsonFiles(files);
    setErrors(errors);
    setStatus(`Imported ${added} recipe(s).${errors.length ? ` ${errors.length} file(s) had issues.` : ""}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Dropzone accept="application/json,.json" multiple onFiles={onFiles}>
          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <div className="text-foreground font-medium">Drag & drop 50+ JSON recipe files</div>
            <div className="text-muted-foreground">or click to select (.json)</div>
          </div>
        </Dropzone>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Imported recipes</div>
          <div className="mt-1 text-2xl font-semibold">{recipes.length}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => linkImagesToRecipesByFilename()}>
              Link images from Gallery by filename
            </Button>
            <Button variant="destructive" onClick={() => clearRecipes()}>Clear recipes</Button>
          </div>
        </div>
      </div>

      {status && (
        <div className="rounded-md border p-3 text-sm">{status}</div>
      )}
      {errors.length > 0 && (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium mb-2">Errors</div>
          <ul className="space-y-1 list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>
                <span className="font-mono">{e.file}</span>: {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Tip: We accept arrays or single objects. Recognized fields include title/name, ingredients/ingredientLines, instructions/directions/steps, tags, images/image.
      </div>
    </div>
  );
}
