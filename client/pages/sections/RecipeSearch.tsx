import React, { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";

export function RecipeCard({ r }: { r: ReturnType<typeof useAppData>["recipes"][number] }) {
  const cover = r.imageDataUrls?.[0];
  return (
    <a href={`/recipe/${r.id}`} className="block rounded-xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md overflow-hidden">
      <div className="grid grid-cols-[120px_1fr] gap-4 p-4 items-start">
        {cover ? (
          <img src={cover} alt={r.title} className="h-[120px] w-[120px] object-cover rounded" />
        ) : (
          <div className="h-[120px] w-[120px] bg-muted rounded flex items-center justify-center text-muted-foreground">No Image</div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h2 className="m-0">{r.title}</h2>
          {r.tags?.length ? (
            <p className="m-0 text-xs text-muted-foreground">{r.tags.slice(0,5).join(' · ')}</p>
          ) : null}
          {r.ingredients?.length ? (
            <p className="mt-2 mb-0 text-xs text-muted-foreground line-clamp-3">{r.ingredients.join(', ')}</p>
          ) : null}
        </div>
      </div>
    </a>
  );
}

export default function RecipeSearchSection() {
  const { recipes, searchRecipes, linkImagesToRecipesByFilename, clearRecipes, addRecipesFromJsonFiles, addRecipesFromDocxFiles, addRecipesFromHtmlFiles, addRecipesFromPdfFiles, addRecipesFromExcelFiles, addRecipesFromImageOcr, addFromZipArchive } = useAppData();
  const [q, setQ] = useState("");
  const results = useMemo(() => searchRecipes(q), [q, searchRecipes]);

  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ file: string; error: string }[]>([]);
  const [url, setUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [importedTitles, setImportedTitles] = useState<string[]>([]);

  const onFiles = async (files: File[]) => {
    const list = files.slice(0, 100);
    const jsonFiles = list.filter((f) => f.type.includes("json") || f.name.toLowerCase().endsWith(".json"));
    const docxFiles = list.filter((f) => f.name.toLowerCase().endsWith(".docx"));
    const htmlFiles = list.filter((f) => /(\.html?|\.htm)$/i.test(f.name));
    const pdfFiles = list.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    const xlsFiles = list.filter((f) => /(\.xlsx|\.xls|\.csv)$/i.test(f.name));
    const imageFiles = list.filter((f)=> f.type.startsWith('image/') || /(png|jpe?g|webp|heic|heif)$/i.test(f.name));
    const zipFiles = list.filter((f) => f.type.includes("zip") || f.name.toLowerCase().endsWith(".zip"));

    const steps = jsonFiles.length + docxFiles.length + htmlFiles.length + pdfFiles.length + xlsFiles.length + imageFiles.length + zipFiles.length;
    setProcessed(0); setTotal(steps); setImportedTitles([]); setErrors([]); setStatus("Processing...");

    let importedCount = 0; const allErrors: { file: string; error: string }[] = [];

    for (const f of jsonFiles){ const { added, errors, titles } = await addRecipesFromJsonFiles([f]); importedCount+=added; allErrors.push(...errors); if(titles?.length) setImportedTitles((t)=>[...t,...titles]); setProcessed((p)=>p+1); }
    for (const f of docxFiles){ const { added, errors, titles } = await addRecipesFromDocxFiles([f]); importedCount+=added; allErrors.push(...errors); if(titles?.length) setImportedTitles((t)=>[...t,...titles]); setProcessed((p)=>p+1); }
    for (const f of htmlFiles){ const { added, errors, titles } = await addRecipesFromHtmlFiles([f]); importedCount+=added; allErrors.push(...errors); if(titles?.length) setImportedTitles((t)=>[...t,...titles]); setProcessed((p)=>p+1); }
    for (const f of pdfFiles){ const { added, errors, titles } = await addRecipesFromPdfFiles([f]); importedCount+=added; allErrors.push(...errors); if(titles?.length) setImportedTitles((t)=>[...t,...titles]); setProcessed((p)=>p+1); }
    for (const f of xlsFiles){ const { added, errors, titles } = await addRecipesFromExcelFiles([f]); importedCount+=added; allErrors.push(...errors); if(titles?.length) setImportedTitles((t)=>[...t,...titles]); setProcessed((p)=>p+1); }
    for (const f of imageFiles){ const { added, errors, titles } = await addRecipesFromImageOcr([f]); importedCount+=added; allErrors.push(...errors); if(titles?.length) setImportedTitles((t)=>[...t,...titles]); setProcessed((p)=>p+1); }
    for (const z of zipFiles){ const res = await addFromZipArchive(z); importedCount+=res.addedRecipes; for(const e of res.errors) allErrors.push({file:e.entry,error:e.error}); if(res.titles?.length) setImportedTitles((t)=>[...t,...res.titles]); setProcessed((p)=>p+1); }

    setErrors(allErrors);
    setStatus(`Imported ${importedCount} recipe(s).${allErrors.length?` ${allErrors.length} item(s) had issues.`:''}`);
  };

  const importFromUrl = async () => {
    if (!url) return; try {
      setLoadingUrl(true); setStatus("Downloading...");
      const resp = await fetch(url); const contentType = resp.headers.get('content-type')||'';
      if (/json|javascript/.test(contentType) || url.toLowerCase().endsWith('.json')){
        try { const data = await resp.json(); const blob = new Blob([JSON.stringify(data)],{type:'application/json'}); const name = (url.split('/').pop()||'import.json').replace(/\?.*$/,''); const file = new File([blob], name, { type:'application/json' }); const { added, errors:errs, titles } = await addRecipesFromJsonFiles([file]); setErrors(errs); setStatus(`Imported ${added} recipe(s) from JSON${titles.length?`: ${titles.slice(0,5).join(', ')}${titles.length>5?' …':''}`:''}.`); return; } catch {}
      }
      const blob = await resp.blob(); const name=(url.split('/').pop()||'import.zip').replace(/\?.*$/,''); const file=new File([blob], name, { type: blob.type||'application/zip' }); const res = await addFromZipArchive(file); setErrors(res.errors.map(e=>({file:e.entry,error:e.error}))); setStatus(`Imported ${res.addedRecipes} recipe(s) and ${res.addedImages} image(s) from ZIP.`);
    } catch(e:any){ setStatus(`Failed to import from URL: ${e?.message??'error'}`);} finally { setLoadingUrl(false); }
  };

  useEffect(()=>{
    if (recipes.length>0) return; const flag = localStorage.getItem('recipes.demo.loaded.v1'); if (flag==='1') return;
    (async()=>{ try{ const sample=[ { title: 'Seared Tuna', ingredients:['tuna','salt'], instructions:['Sear both sides.'] }, { title: 'Green Risotto', ingredients:['rice','spinach'], instructions:['Cook rice.','Blend spinach.'] } ]; const file = new File([new Blob([JSON.stringify(sample)],{type:'application/json'})], 'demo.json', { type:'application/json' }); setStatus('Importing demo recipes...'); const { added } = await addRecipesFromJsonFiles([file]); setStatus(`Imported ${added} demo recipes.`); localStorage.setItem('recipes.demo.loaded.v1','1'); }catch{}})();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Dropzone accept=".json,application/json,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.html,.htm,text/html,.pdf,application/pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel,.csv,text/csv,application/zip,application/x-zip-compressed,.zip,image/*" multiple onFiles={onFiles}>
          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <div className="text-foreground font-medium">Drag & drop recipes (Word/PDF/Excel/HTML/JSON/ZIP) or images</div>
            <div className="text-muted-foreground">Auto-detects titles, ingredients, and instructions</div>
          </div>
        </Dropzone>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Imported recipes</div>
          <div className="mt-1 text-2xl font-semibold">{recipes.length}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => linkImagesToRecipesByFilename()}>Link images from Gallery by filename</Button>
            <Button variant="outline" onClick={async()=>{ const sample=[ { title: 'Seared Tuna', ingredients:['tuna','salt'], instructions:['Sear both sides.'] }, { title: 'Green Risotto', ingredients:['rice','spinach'], instructions:['Cook rice.','Blend spinach.'] } ]; const file = new File([new Blob([JSON.stringify(sample)],{type:'application/json'})], 'demo.json', { type:'application/json' }); setStatus('Importing demo recipes...'); const { added } = await addRecipesFromJsonFiles([file]); setStatus(`Imported ${added} demo recipes.`); }}>Load demo recipes</Button>
            <Button variant="destructive" onClick={() => clearRecipes()}>Clear recipes</Button>
          </div>
          {total>0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-muted-foreground">{processed} / {total} files processed</div>
              <div className="h-2 w-full rounded bg-muted"><div className="h-2 rounded bg-primary transition-all" style={{ width: `${Math.round((processed / Math.max(total,1)) * 100)}%` }} /></div>
              {importedTitles.length>0 && (
                <div className="max-h-32 overflow-auto rounded border p-2 text-xs"><div className="font-medium mb-1">Imported:</div><ul className="space-y-1 list-disc pl-4">{importedTitles.map((t,i)=>(<li key={i} className="truncate" title={t}>{t}</li>))}</ul></div>
              )}
            </div>
          )}
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium">Import Recipes from URL</div>
            <div className="flex gap-2">
              <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://example.com" className="flex-1 rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
              <Button onClick={importFromUrl} disabled={loadingUrl || !url}>{loadingUrl? 'Importing...' : 'Import'}</Button>
            </div>
          </div>
        </div>
      </div>
      {status && <div className="rounded-md border p-3 text-sm">{status}</div>}
      {errors.length>0 && (
        <div className="rounded-md border p-3 text-sm"><div className="font-medium mb-2">Errors</div><ul className="space-y-1 list-disc pl-5">{errors.map((e,i)=>(<li key={i}><span className="font-mono">{e.file}</span>: {e.error}</li>))}</ul></div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, ingredients, tags..."
          className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {results.length} / {recipes.length} recipes
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No recipes yet. Add recipes on the Input tab.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <RecipeCard key={r.id} r={r} />
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-muted-foreground text-center">Total recipes in system: {recipes.length}</div>
    </div>
  );
}
