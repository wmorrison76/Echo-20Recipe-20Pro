import { useMemo } from "react";

import { useMemo } from "react";

import { textureAtlas } from "@/data/textureReference";
import { useRDLabStore } from "@/stores/rdLabStore";
import { cn } from "@/lib/utils";

export function DiscoveryPanel() {
  const { experiments, focusExperimentId, setFocusExperiment, searchQuery, setSearchQuery } = useRDLabStore();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return experiments;
    const query = searchQuery.toLowerCase();
    return experiments.filter((exp) =>
      [exp.title, exp.owner, exp.notes, exp.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [experiments, searchQuery]);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="rounded-2xl border border-white/20 bg-white/6 p-4 backdrop-blur md:bg-white/10 dark:border-cyan-500/25 dark:bg-cyan-500/5">
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-cyan-200/80">
          Discovery Queue
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search textures, owners, status"
          className="mt-3 w-full rounded-xl border border-white/30 bg-white/40 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-0 transition focus:border-sky-500 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-900/40 dark:text-cyan-100 dark:focus:border-cyan-400"
        />
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-white/15 bg-white/4 backdrop-blur-sm dark:border-cyan-500/20 dark:bg-slate-950/40">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:border-cyan-500/20 dark:text-cyan-300/70">
          <span>Active experiments</span>
          <span>{filtered.length}</span>
        </div>
        <div className="overflow-y-auto px-2 py-3 pr-1">
          {filtered.map((experiment) => {
            const isActive = experiment.id === focusExperimentId;
            return (
              <button
                key={experiment.id}
                type="button"
                onClick={() => setFocusExperiment(experiment.id)}
                className={cn(
                  "group relative flex w-full flex-col gap-2 rounded-xl border px-3 py-3 text-left transition",
                  isActive
                    ? "border-sky-400/60 bg-sky-500/10 text-slate-900 shadow-[0_0_24px_rgba(56,189,248,0.35)] dark:border-cyan-400/60 dark:bg-cyan-500/15 dark:text-cyan-100"
                    : "border-transparent bg-white/20 text-slate-600 hover:border-sky-300/60 hover:bg-white/50 hover:text-slate-900 dark:bg-slate-900/40 dark:text-cyan-200/60 dark:hover:border-cyan-400/40 dark:hover:text-cyan-50",
                )}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em]">
                  <span>{experiment.status}</span>
                  <span>{experiment.lastUpdated}</span>
                </div>
                <div className="text-sm font-semibold tracking-tight">
                  {experiment.title}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-300/70">
                  {experiment.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/60 px-2 py-1 dark:bg-cyan-500/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-slate-500 dark:text-cyan-200/60">Lead: {experiment.owner}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/15 bg-white/6 p-4 text-xs leading-relaxed text-slate-600 backdrop-blur dark:border-cyan-500/25 dark:bg-slate-950/60 dark:text-cyan-100/80">
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-700 dark:text-cyan-200">
          Texture Reference Index
        </div>
        <div className="space-y-3">
          {textureAtlas.map((texture) => (
            <div key={texture.id} className="rounded-xl border border-white/20 bg-white/30 p-3 dark:border-cyan-500/20 dark:bg-cyan-500/5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
                <span>{texture.family}</span>
                <span>{texture.descriptors.join(" • ")}</span>
              </div>
              <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.35em] text-slate-700 dark:text-cyan-100">
                Pairing Targets
              </div>
              <div className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-cyan-100/80">
                {texture.idealPairings.join(", ")}
              </div>
              <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
                Techniques
              </div>
              <div className="text-[12px] text-slate-500 dark:text-cyan-200/80">
                {texture.suggestedTechniques.join(" · ")}
              </div>
              {texture.platingNotes ? (
                <div className="mt-2 text-[11px] italic text-slate-500/80 dark:text-cyan-200/70">
                  {texture.platingNotes}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
