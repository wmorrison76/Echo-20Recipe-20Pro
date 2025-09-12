import React, { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, LayoutGrid, Rows, List } from "lucide-react";
import { axisOptions } from "@/lib/taxonomy";

export function RecipeCard({ r, onPreview, onFav, onRate, onTrash, inTrash }: { r: ReturnType<typeof useAppData>["recipes"][number]; onPreview:()=>void; onFav:()=>void; onRate:(n:number)=>void; onTrash:()=>void; inTrash?: boolean; }) {
  const cover = r.imageDataUrls?.[0];
  const stars = Array.from({length:5},(_,i)=>i< (r.rating||0));
  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[120px_1fr] gap-3 p-3 items-start">
        {cover ? (
          <img src={cover} alt={r.title} className="h-[110px] w-[110px] object-cover rounded" />
        ) : (
          <div className="h-[110px] w-[110px] bg-muted rounded flex items-center justify-center text-muted-foreground">No Image</div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="flex items-start justify-between gap-2">
            <h2 className="m-0 text-base font-semibold line-clamp-1">{r.title}</h2>
            <button className={`shrink-0 p-1 rounded ${r.favorite? 'text-yellow-500':'text-muted-foreground'} hover:bg-black/5`} onClick={onFav} aria-label="Favorite">
              <Star className={r.favorite? 'fill-current':''} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {stars.map((on,i)=> (
              <button key={i} className={`p-0.5 ${on? 'text-yellow-500':'text-muted-foreground'}`} onClick={()=>onRate(i+1)} aria-label={`rate ${i+1}`}>★</button>
            ))}
          </div>
          {r.tags?.length ? (
            <p className="m-0 text-xs text-muted-foreground">{r.tags.slice(0,5).join(' · ')}</p>
          ) : null}
          {r.ingredients?.length ? (
            <p className="mt-2 mb-0 text-xs text-muted-foreground line-clamp-2">{r.ingredients.join(', ')}</p>
          ) : null}
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={onPreview}>Preview</Button>
            {inTrash ? (
              <Button size="sm" variant="outline" onClick={onTrash}>Restore</Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onTrash}>Trash</Button>
            )}
            <Button size="sm" variant="outline" asChild><a href={`/recipe/${r.id}/view`}>View</a></Button>
            <Button size="sm" variant="outline" onClick={()=>{ try{ const draft={ recipeName:r.title, ingredients:(r.ingredients||[]).map((s:string)=>({ qty:'', unit:'', item:String(s), prep:'', yield:'', cost:'' })), directions:Array.isArray(r.instructions)? (r.instructions as any[]).map(String).map((x,i)=>`${i+1}. ${x}`).join('\n') : String((r as any).instructions||''), taxonomy: (r.extra as any)?.taxonomy || undefined }; localStorage.setItem('recipe:draft', JSON.stringify(draft)); }catch{} location.href='/?tab=add-recipe'; }}>Edit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecipeSearchSection() {
  const { recipes, searchRecipes, linkImagesToRecipesByFilename, clearRecipes, addRecipesFromJsonFiles, addRecipesFromDocxFiles, addRecipesFromHtmlFiles, addRecipesFromPdfFiles, addRecipesFromExcelFiles, addRecipesFromImageOcr, addFromZipArchive, toggleFavorite, rateRecipe, deleteRecipe, restoreRecipe, exportAllZip, addImages } = useAppData();
  const [q, setQ] = useState("");
  type Cat = 'all'|'recent'|'top'|'favorites'|'uncategorized'|'trash';
  const [cat, setCat] = useState<Cat>('all');
  // Taxonomy filters
  const [fcuisine, setFCuisine] = useState<string>("");
  const [ftech, setFTech] = useState<string>("");
  const [fcourse, setFCourse] = useState<string>("");
  const [fdiet, setFDiet] = useState<string>("");
  const results = useMemo(() => {
    const base = searchRecipes(q);
    const filterByTax = (arr: typeof base) => arr.filter(r=>{
      const t: any = (r as any).extra?.taxonomy || {};
      if (fcuisine && t.cuisine !== fcuisine) return false;
      if (ftech && !(Array.isArray(t.technique) && t.technique.includes(ftech))) return false;
      if (fcourse && !(Array.isArray(t.course) && t.course.includes(fcourse))) return false;
      if (fdiet && !(Array.isArray(t.diets) && t.diets.includes(fdiet))) return false;
      return true;
    });
    const notDeleted = filterByTax(base.filter(r=>!r.deletedAt));
    switch(cat){
      case 'recent': return notDeleted.slice().sort((a,b)=> b.createdAt - a.createdAt);
      case 'top': return notDeleted.slice().sort((a,b)=> (b.rating||0)-(a.rating||0));
      case 'favorites': return notDeleted.filter(r=> r.favorite);
      case 'uncategorized': return notDeleted.filter(r=> !r.tags || r.tags.length===0);
      case 'trash': return filterByTax(base.filter(r=> !!r.deletedAt));
      default: return notDeleted;
    }
  }, [q, searchRecipes, cat, fcuisine, ftech, fcourse, fdiet]);

  const [status, setStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<'cards'|'grid4'|'rows'>('cards');
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<{ file: string; error: string }[]>([]);
  const [url, setUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [importedTitles, setImportedTitles] = useState<string[]>([]);
  // Book PDF import progress state
  const [bookPhase, setBookPhase] = useState<null|"reading"|"selecting"|"categorizing"|"importing"|"done">(null);
  const [bookFile, setBookFile] = useState<string | null>(null);
  const [bookPage, setBookPage] = useState(0);
  const [bookTotal, setBookTotal] = useState(0);
  const [bookImported, setBookImported] = useState<number | null>(null);

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


  const [preview, setPreview] = useState<ReturnType<typeof useAppData>["recipes"][number] | null>(null);
  const inTrashView = cat==='trash';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {(['all','recent','top','favorites','uncategorized','trash'] as Cat[]).map(c=> (
            <button key={c} onClick={()=>setCat(c)} className={`px-3 py-1 rounded-md text-sm ${cat===c? 'bg-background shadow':'text-foreground/80'}`}>{c.replace(/^[a-z]/,s=>s.toUpperCase())}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportAllZip}>Export all (ZIP)</Button>
          <Button variant="destructive" size="sm" onClick={()=>clearRecipes()}>Clear</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Dropzone className="p-1 self-start" accept=".json,application/json,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.html,.htm,text/html,.pdf,application/pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel,.csv,text/csv,application/zip,application/x-zip-compressed,.zip,image/*" multiple onFiles={onFiles}>
          <div className="flex flex-col items-center justify-center gap-0.5 text-[11px]">
            <div className="text-foreground font-medium">Drag & drop recipes (Word/PDF/Excel/HTML/JSON/ZIP) or images</div>
            <div className="text-muted-foreground">Auto-detects titles, ingredients, and instructions</div>
          </div>
        </Dropzone>
        <div className="rounded-lg border p-2 self-start">
          <div className="flex items-center justify-between mb-1"><div className="text-xs font-medium">Library (Book PDF) Import</div><div className="text-xs text-muted-foreground">{bookPhase ? (<div className="flex items-center gap-2"><span>{bookPhase === 'reading' ? 'Reading file' : bookPhase === 'selecting' ? 'Selecting recipes' : bookPhase === 'categorizing' ? 'Categorizing recipes' : bookPhase === 'importing' ? 'Importing' : 'Done'}</span>{bookPhase==='reading' && (<span>{bookPage}/{bookTotal}</span>)}</div>) : (<>Imported: {recipes.length}</>)}</div></div>
          <input type="file" accept="application/pdf" onChange={async(e)=>{ const f=e.target.files?.[0]; if(!f) return; if(!confirm('Confirm you own/purchased this cookbook PDF for personal import?')){ (e.target as HTMLInputElement).value=''; return;} try{ setBookFile(f.name); setBookPhase('reading'); setStatus('Reading book PDF...'); const ab = await f.arrayBuffer(); const pdfjs: any = await import('https://esm.sh/pdfjs-dist@4.7.76/build/pdf.mjs'); const workerSrc='https://esm.sh/pdfjs-dist@4.7.76/build/pdf.worker.mjs'; if(pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc=workerSrc; const doc = await pdfjs.getDocument({ data: ab }).promise; setBookTotal(doc.numPages); let lines:string[]=[]; for(let p=1;p<=doc.numPages;p++){ const page=await doc.getPage(p); const tc=await page.getTextContent(); lines.push(...tc.items.map((i:any)=> String(i.str)).filter(Boolean)); lines.push(''); setBookPage(p); }
            setBookPhase('selecting');
            const norm = lines.map(s=> s.replace(/\s+/g,' ').trim());
            const items:any[]=[]; let i=0; const book=f.name.replace(/\.[^.]+$/,'');
            const isTitle=(s:string)=> s && s.length<70 && /[A-Za-z]/.test(s) && (s===s.toUpperCase() || /^[A-Z][^.!?]{2,}$/.test(s));
            while(i<norm.length){
              while(i<norm.length && !/ingredients?/i.test(norm[i])) i++;
              if(i>=norm.length) break;
              let tIdx=Math.max(0,i-5); let title=''; for(let k=i-1;k>=tIdx;k--){ if(isTitle(norm[k])){ title=norm[k]; break; } }
              const ings:string[]=[]; i++; while(i<norm.length && !/ingredients?/i.test(norm[i])){ const s=norm[i]; if(/^(instructions|directions|method)/i.test(s)) break; if(s) ings.push(s); i++; }
              let ins:string[]=[]; while(i<norm.length && !/ingredients?/i.test(norm[i])){ const s=norm[i]; if(s) ins.push(s); i++; }
              if(title && (ings.length||ins.length)) items.push({ title, ingredients: ings, instructions: ins, tags:[book] });
            }
            setBookPhase('categorizing');
            const joined = norm.join(' ');
            const m = joined.match(/(?:ISBN(?:-1[03])?:?\s*)?((?:97[89][- ]?)?\d{1,5}[- ]?\d{1,7}[- ]?\d{1,7}[- ]?[\dX])/i);
            if (m) {
              const rawIsbn = m[1].replace(/[-\s]/g,'');
              const isbn = rawIsbn.length>=10 ? rawIsbn : undefined;
              if (isbn) {
                try {
                  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
                  const res = await fetch(coverUrl, { method:'GET' });
                  if (res.ok) {
                    const blob = await res.blob();
                    const file = new File([blob], `book-${isbn}.jpg`, { type: blob.type || 'image/jpeg' });
                    await addImages([file], { tags: [book, 'book'] });
                  }
                } catch {}
              }
            }
            setBookPhase('importing');
            if(items.length){ const blob=new Blob([JSON.stringify(items)],{type:'application/json'}); const file=new File([blob], `${book}.json`, { type:'application/json' }); const { added } = await addRecipesFromJsonFiles([file]); setBookImported(added); setStatus(`Imported ${added} recipes from book.`); setBookPhase('done'); } else { setStatus('Could not detect recipes in PDF'); setBookPhase(null); }
          } catch(e:any){ setStatus(`Failed: ${e?.message||'error'}`); setBookPhase(null);} finally { (e.target as HTMLInputElement).value=''; } }} />
          {(bookPhase || total>0) && (
            <div className="mt-2 space-y-1">
              {bookPhase && (
                <>
                  <div className="text-xs text-muted-foreground">{bookFile || ''}</div>
                  {bookPhase === 'reading' && (
                    <div className="h-2 w-full rounded bg-muted"><div className="h-2 rounded bg-primary transition-all" style={{ width: `${Math.round((bookPage / Math.max(bookTotal,1)) * 100)}%` }} /></div>
                  )}
                </>
              )}
              {total>0 && (
                <>
                  <div className="text-xs text-muted-foreground">{processed} / {total} files processed</div>
                  <div className="h-2 w-full rounded bg-muted"><div className="h-2 rounded bg-primary transition-all" style={{ width: `${Math.round((processed / Math.max(total,1)) * 100)}%` }} /></div>
                </>
              )}
              {importedTitles.length>0 && (
                <div className="max-h-32 overflow-auto rounded border p-2 text-xs"><div className="font-medium mb-1">Imported:</div><ul className="space-y-1 list-disc pl-4">{importedTitles.map((t,i)=>(<li key={i} className="truncate" title={t}>{t}</li>))}</ul></div>
              )}
            </div>
          )}
          <div className="mt-3 space-y-1">
            <div className="text-xs font-medium">Import from the web</div>
            <div className="flex gap-2">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search the web (e.g. 'chocolate cake recipe')" className="flex-1 rounded-md border bg-background px-2 py-1 outline-none focus:ring-2 focus:ring-ring text-sm" />
              <Button size="sm" variant="outline" onClick={()=>{ const q=encodeURIComponent(query); window.open(`https://www.google.com/search?q=${q}+recipe`, '_blank'); }}>Search</Button>
            </div>
            <div className="flex gap-2">
              <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="Paste a recipe page URL (https://...)" className="flex-1 rounded-md border bg-background px-2 py-1 outline-none focus:ring-2 focus:ring-ring text-sm" />
              <Button size="sm" onClick={async()=>{ try{ setLoadingUrl(true); setStatus('Fetching recipe...'); const r = await fetch('/api/recipe/import',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url })}); if(!r.ok) throw new Error((await r.json().catch(()=>({})))?.error||'Failed'); const data = await r.json(); let imageName: string | undefined; if (data.image) { try { const imgRes = await fetch(data.image); const blob = await imgRes.blob(); imageName = (String(data.image).split('?')[0].split('/').pop() || `${Date.now()}.jpg`).replace(/[^A-Za-z0-9_.-]/g,'_'); await addImages([new File([blob], imageName, { type: blob.type||'image/jpeg' })], { tags: ['web'] }); } catch {} } const sample = [{ title:data.title, image: imageName || undefined, ingredients:data.ingredients, instructions: Array.isArray(data.instructions)? data.instructions: String(data.instructions||'').split(/\r?\n/).filter(Boolean), tags: [] }]; const file = new File([new Blob([JSON.stringify(sample)],{type:'application/json'})], 'web.json', { type:'application/json' }); const { added } = await addRecipesFromJsonFiles([file]); setStatus(`Imported ${added} recipe(s) from web.`);} catch(e:any){ setStatus(`Failed: ${e?.message||'error'}`);} finally{ setLoadingUrl(false); } }} disabled={loadingUrl || !url}>{loadingUrl? 'Importing...' : 'Import'}</Button>
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
        <select value={fcuisine} onChange={(e)=>setFCuisine(e.target.value)} className="rounded-md border bg-background px-2 py-2 text-sm max-w-[220px]">
          <option value="">Cuisine</option>
          {axisOptions('cuisines').map(o=> <option key={o.slug} value={o.slug}>{o.label}</option>)}
        </select>
        <select value={ftech} onChange={(e)=>setFTech(e.target.value)} className="rounded-md border bg-background px-2 py-2 text-sm max-w-[220px]">
          <option value="">Technique</option>
          {axisOptions('technique').map(o=> <option key={o.slug} value={o.slug}>{o.label}</option>)}
        </select>
        <select value={fcourse} onChange={(e)=>setFCourse(e.target.value)} className="rounded-md border bg-background px-2 py-2 text-sm max-w-[220px]">
          <option value="">Course</option>
          {axisOptions('course').map(o=> <option key={o.slug} value={o.slug}>{o.label}</option>)}
        </select>
        <select value={fdiet} onChange={(e)=>setFDiet(e.target.value)} className="rounded-md border bg-background px-2 py-2 text-sm max-w-[220px]">
          <option value="">Diet</option>
          {axisOptions('diets').map(o=> <option key={o.slug} value={o.slug}>{o.label}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <button onClick={()=>setMode('cards')} title="Cards" className={`p-2 rounded-md border ${mode==='cards'? 'bg-muted': ''}`} aria-label="Cards view"><LayoutGrid className="h-4 w-4"/></button>
          <button onClick={()=>setMode('grid4')} title="Grid 4" className={`p-2 rounded-md border ${mode==='grid4'? 'bg-muted': ''}`} aria-label="4-across grid"><Rows className="h-4 w-4"/></button>
          <button onClick={()=>setMode('rows')} title="List" className={`p-2 rounded-md border ${mode==='rows'? 'bg-muted': ''}`} aria-label="List view"><List className="h-4 w-4"/></button>
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {results.length} / {recipes.length} recipes
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No recipes yet. Drop files above or import from URL.
        </div>
      ) : mode==='cards' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <RecipeCard key={r.id} r={r} inTrash={inTrashView} onPreview={()=>setPreview(r)} onFav={()=>toggleFavorite(r.id)} onRate={(n)=>rateRecipe(r.id,n)} onTrash={()=> r.deletedAt? restoreRecipe(r.id) : deleteRecipe(r.id)} />
          ))}
        </div>
      ) : mode==='grid4' ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {results.map(r=> (
            <div key={r.id} className="rounded border p-3 flex items-start gap-2">
              <div className="w-16 h-12 rounded bg-muted overflow-hidden shrink-0">
                {r.imageDataUrls?.[0] ? <img src={r.imageDataUrls[0]} alt="" className="w-full h-full object-cover"/> : null}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm line-clamp-2" title={r.title}>{r.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{r.tags?.join(' · ')}</div>
                <div className="mt-1 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={()=>setPreview(r)}>Preview</Button>
                  <a href={`/recipe/${r.id}/view`} className="text-xs underline self-center">Open</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {results.map(r=> (
            <div key={r.id} className="p-3 flex items-start gap-3">
              <div className="w-20 h-16 rounded bg-muted overflow-hidden">
                {r.imageDataUrls?.[0] ? <img src={r.imageDataUrls[0]} alt="" className="w-full h-full object-cover"/> : null}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium line-clamp-1">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">{r.tags?.join(' · ')}</div>
                <div className="mt-1 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={()=>setPreview(r)}>Preview</Button>
                  <a href={`/recipe/${r.id}/view`} className="text-xs underline self-center">Open</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-muted-foreground text-center">Total recipes in system: {recipes.length}</div>

      <Dialog open={!!preview} onOpenChange={(o)=>!o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-start">
              <div className="rounded border overflow-hidden bg-muted/20">
                {preview.imageDataUrls?.[0] ? (
                  <img src={preview.imageDataUrls[0]} alt={preview.title} className="w-full h-auto" />
                ) : (
                  <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="text-sm space-y-2">
                {preview.tags?.length ? <div className="text-muted-foreground">{preview.tags.join(' · ')}</div> : null}
                {preview.ingredients?.length ? (
                  <div>
                    <div className="font-medium">Ingredients</div>
                    <ul className="list-disc pl-5 max-h-32 overflow-auto">
                      {preview.ingredients.slice(0,20).map((x,i)=>(<li key={i}>{x}</li>))}
                    </ul>
                  </div>
                ) : null}
                {preview.instructions?.length ? (
                  <div>
                    <div className="font-medium">Instructions</div>
                    <div className="max-h-32 overflow-auto whitespace-pre-wrap">{preview.instructions.join('\n')}</div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a className="button border px-3 py-1 rounded" href={`/recipe/${preview.id}/view`}>Open</a>
                  <button className="border px-3 py-1 rounded" onClick={()=>{ const body=encodeURIComponent(`${preview.title}`); location.href=`sms:?&body=${body}`; }}>SMS</button>
                  <button className="border px-3 py-1 rounded" onClick={()=>window.print()}>Print</button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
