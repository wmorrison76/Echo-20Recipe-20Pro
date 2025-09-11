import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";

export default function RecipeInputSection() {
  const { addRecipesFromJsonFiles, addRecipesFromDocxFiles, addFromZipArchive, clearRecipes, recipes, linkImagesToRecipesByFilename } = useAppData();
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ file: string; error: string }[]>([]);
  const [zipUrl, setZipUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);

  const onFiles = async (files: File[]) => {
    setStatus("Processing...");
    const jsonFiles = files.filter((f) => f.type.includes("json") || f.name.toLowerCase().endsWith(".json"));
    const docxFiles = files.filter((f) => f.name.toLowerCase().endsWith(".docx"));
    const zipFiles = files.filter((f) => f.type.includes("zip") || f.name.toLowerCase().endsWith(".zip"));

    let importedCount = 0;
    const allErrors: { file: string; error: string }[] = [];

    if (jsonFiles.length) {
      const { added, errors } = await addRecipesFromJsonFiles(jsonFiles);
      importedCount += added;
      allErrors.push(...errors);
    }

    if (docxFiles.length) {
      const { added, errors } = await addRecipesFromDocxFiles(docxFiles);
      importedCount += added;
      allErrors.push(...errors);
    }

    for (const z of zipFiles) {
      const res = await addFromZipArchive(z);
      importedCount += res.addedRecipes;
      for (const e of res.errors) allErrors.push({ file: e.entry, error: e.error });
    }

    setErrors(allErrors);
    setStatus(`Imported ${importedCount} recipe(s).${allErrors.length ? ` ${allErrors.length} item(s) had issues.` : ""}`);
  };

  const importFromUrl = async () => {
    if (!zipUrl) return;
    try {
      setLoadingUrl(true);
      setStatus("Downloading ZIP...");
      const resp = await fetch(zipUrl);
      const blob = await resp.blob();
      const name = zipUrl.split("/").pop() || "import.zip";
      const file = new File([blob], name, { type: blob.type || "application/zip" });
      const res = await addFromZipArchive(file);
      setErrors(res.errors.map((e) => ({ file: e.entry, error: e.error })));
      setStatus(`Imported ${res.addedRecipes} recipe(s) and ${res.addedImages} image(s) from ZIP.`);
    } catch (e: any) {
      setStatus(`Failed to import from URL: ${e?.message ?? "error"}`);
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Dropzone accept="application/json,.json,application/zip,.zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" multiple onFiles={onFiles}>
          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <div className="text-foreground font-medium">Drag & drop 50+ JSON, DOCX, or a Vibe Garden ZIP</div>
            <div className="text-muted-foreground">or click to select (.json / .docx / .zip)</div>
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
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium">Import ZIP from URL</div>
            <div className="flex gap-2">
              <input
                value={zipUrl}
                onChange={(e) => setZipUrl(e.target.value)}
                placeholder="https://example.com/vibe-garden.zip"
                className="flex-1 rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={importFromUrl} disabled={loadingUrl || !zipUrl}>
                {loadingUrl ? "Importing..." : "Import ZIP"}
              </Button>
            </div>
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
