import type { Request, Response } from 'express';

function decodeHtml(s: string) { return s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'); }

function parseJsonLdRecipe(html: string) {
  const scripts = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  for (const m of scripts) {
    try {
      const raw = m[1].trim();
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : [data];
      for (const entry of list) {
        if (!entry) continue;
        const graph = entry['@graph'];
        const candidates = Array.isArray(graph) ? graph : [entry];
        for (const cand of candidates) {
          const type = Array.isArray(cand['@type']) ? cand['@type'] : [cand['@type']];
          if (type.includes('Recipe')) {
            return {
              title: decodeHtml(String(cand.name || '')),
              ingredients: (cand.recipeIngredient || []).map((x: any) => decodeHtml(String(x))),
              instructions: decodeHtml((Array.isArray(cand.recipeInstructions)
                ? cand.recipeInstructions.map((ri: any) => typeof ri === 'string' ? ri : ri.text).join('\n')
                : String(cand.recipeInstructions || '')).trim()),
              yield: decodeHtml(String(cand.recipeYield || '')),
              image: Array.isArray(cand.image) ? cand.image[0] : cand.image,
            };
          }
        }
      }
    } catch { /* ignore */ }
  }
  return null;
}

export async function handleRecipeImport(req: Request, res: Response) {
  try {
    const { url } = req.body as { url: string };
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Invalid url' });

    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 RecipeStudioBot' } });
    if (!r.ok) return res.status(400).json({ error: `Fetch failed (${r.status})` });
    const html = await r.text();

    const rec = parseJsonLdRecipe(html);
    if (!rec) return res.status(404).json({ error: 'No recipe schema found' });

    res.json(rec);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Import failed' });
  }
}
