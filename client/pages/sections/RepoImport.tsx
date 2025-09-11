import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";

function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\/+/, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

function makeRawUrl(repoUrl: string, branch: string, path: string): string | null {
  try {
    // If user pasted a raw URL use it as-is
    if (/raw\.githubusercontent\.com/.test(repoUrl)) return repoUrl;
    const r = parseGithubRepo(repoUrl);
    if (!r) return null;
    const p = path.replace(/^\/+/, "");
    return `https://raw.githubusercontent.com/${r.owner}/${r.repo}/${branch}/${p}`;
  } catch {
    return null;
  }
}

function makeZipUrl(repoUrl: string, branch: string): string | null {
  const r = parseGithubRepo(repoUrl);
  if (!r) return null;
  // codeload is optimized for downloads
  return `https://codeload.github.com/${r.owner}/${r.repo}/zip/refs/heads/${branch}`;
}

export default function RepoImportSection() {
  const { addRecipesFromJsonFiles, addFromZipArchive } = useAppData();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [jsonPath, setJsonPath] = useState("recipes.json");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const importJson = async () => {
    setStatus(null);
    try {
      setLoading(true);
      setStatus("Fetching JSON from repo...");
      const q = new URLSearchParams({ repo: repoUrl, branch, path: jsonPath });
      const resp = await fetch(`/api/github/raw?${q.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const file = new File([new Blob([text], { type: "application/json" })], jsonPath.split("/").pop() || "recipes.json", { type: "application/json" });
      const { added } = await addRecipesFromJsonFiles([file]);
      setStatus(`Imported ${added} recipe(s) from repo.`);
    } catch (e: any) {
      setStatus(`Failed to import JSON: ${e?.message ?? "error"}`);
    } finally {
      setLoading(false);
    }
  };

  const importRepoZip = async () => {
    setStatus(null);
    const zipUrl = makeZipUrl(repoUrl, branch);
    if (!zipUrl) { setStatus("Invalid GitHub repository URL."); return; }
    try {
      setLoading(true);
      setStatus("Downloading repository ZIP...");
      const resp = await fetch(zipUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const name = `${repoUrl.split("/").slice(-1)[0]}-${branch}.zip`;
      const file = new File([blob], name, { type: blob.type || "application/zip" });
      const res = await addFromZipArchive(file);
      setStatus(`Imported ${res.addedRecipes} recipe(s) and ${res.addedImages} image(s) from repo ZIP.`);
    } catch (e: any) {
      setStatus(`Failed to import repo ZIP: ${e?.message ?? "error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-4 md:p-6 bg-gradient-to-br from-background to-muted/40 shadow-sm">
        <div className="text-sm text-muted-foreground mb-1">Import from GitHub</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Repository URL</label>
            <input value={repoUrl} onChange={(e)=>setRepoUrl(e.target.value)} placeholder="https://github.com/user/repo" className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Branch</label>
            <input value={branch} onChange={(e)=>setBranch(e.target.value)} placeholder="main" className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">JSON path in repo</label>
            <input value={jsonPath} onChange={(e)=>setJsonPath(e.target.value)} placeholder="data/recipes.json" className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <Button onClick={importJson} disabled={loading || !repoUrl || !jsonPath}>Import JSON</Button>
            <Button variant="secondary" onClick={importRepoZip} disabled={loading || !repoUrl}>Import repo as ZIP</Button>
          </div>
        </div>

        {status && <div className="mt-4 rounded-md border p-3 text-sm">{status}</div>}

        <div className="mt-4 text-xs text-muted-foreground">
          Works with public GitHub repos (no token). JSON must match our recipe format; ZIPs can include JSON, DOCX, and images.
        </div>
      </div>
    </div>
  );
}
