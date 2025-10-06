import { Dispatch, FormEvent, SetStateAction, useCallback, useMemo, useState } from "react";

import { textureAtlas } from "@/data/textureReference";
import { flavorConstellationLibrary, futureFoodDrivers } from "@/data/flavorMatrix";
import { useRDLabStore } from "@/stores/rdLabStore";
import { cn } from "@/lib/utils";

export function DiscoveryPanel() {
  const {
    experiments,
    focusExperimentId,
    setFocusExperiment,
    searchQuery,
    setSearchQuery,
    createExperiment,
  } = useRDLabStore();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return experiments;
    const query = searchQuery.toLowerCase();
    return experiments.filter((exp) =>
      [
        exp.title,
        exp.owner,
        exp.notes,
        exp.hypothesis,
        exp.tags.join(" "),
        exp.variablesUnderTest.join(" "),
        exp.sensoryTargets.join(" "),
        exp.textureObjectives.join(" "),
        exp.flavorConstellations.join(" "),
        exp.futureFoodAngles.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [experiments, searchQuery]);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftOwner, setDraftOwner] = useState("Lab Team");
  const [draftHypothesis, setDraftHypothesis] = useState("");
  const [draftVariables, setDraftVariables] = useState("");
  const [draftTargets, setDraftTargets] = useState("");
  const [draftEquipment, setDraftEquipment] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftLaunchWindow, setDraftLaunchWindow] = useState("");
  const [draftTextureObjectives, setDraftTextureObjectives] = useState("");
  const [draftFlavorConstellations, setDraftFlavorConstellations] = useState("");
  const [draftFutureAngles, setDraftFutureAngles] = useState("");

  const pushDraftLine = useCallback((setter: Dispatch<SetStateAction<string>>, value: string) => {
    setter((prev) => {
      const trimmed = prev.trim();
      return trimmed.length ? `${trimmed}\n${value}` : value;
    });
  }, []);

  const splitList = (value: string) =>
    value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleCreateExperiment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draftTitle.trim();
    const hypothesis = draftHypothesis.trim();
    if (!title || !hypothesis) return;
    const owner = draftOwner.trim() || "Lab Team";
    const experimentId = createExperiment({
      title,
      hypothesis,
      owner,
      tags: splitList(draftTags),
      variablesUnderTest: splitList(draftVariables),
      sensoryTargets: splitList(draftTargets),
      equipment: splitList(draftEquipment),
      textureObjectives: splitList(draftTextureObjectives),
      flavorConstellations: splitList(draftFlavorConstellations),
      futureFoodAngles: splitList(draftFutureAngles),
      testPlan: ["Bench validation queued"],
      notes: hypothesis,
      launchWindow: draftLaunchWindow.trim(),
    });
    setFocusExperiment(experimentId);
    setSearchQuery("");
    setDraftTitle("");
    setDraftHypothesis("");
    setDraftVariables("");
    setDraftTargets("");
    setDraftEquipment("");
    setDraftTags("");
    setDraftLaunchWindow("");
    setDraftTextureObjectives("");
    setDraftFlavorConstellations("");
    setDraftFutureAngles("");
  };

  const isCreateDisabled = !draftTitle.trim() || !draftHypothesis.trim();

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto pr-1">
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
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-cyan-100/70">
          <span className="chalk-breath">Textures {textureAtlas.length}</span>
          <span className="chalk-breath">Constellations {flavorConstellationLibrary.length}</span>
          <span className="chalk-breath">Drivers {futureFoodDrivers.length}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/8 p-4 backdrop-blur md:bg-white/14 dark:border-cyan-500/25 dark:bg-cyan-500/10">
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-cyan-200/80">
          Rapid prototyping
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-cyan-200/70">
          Spin up a fresh experiment with hypothesis, variables, and target service window before you hit the bench.
        </p>
        <form onSubmit={handleCreateExperiment} className="mt-3 space-y-3 text-xs text-slate-600 dark:text-cyan-200/80">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Working title"
              className="rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
            <input
              value={draftOwner}
              onChange={(event) => setDraftOwner(event.target.value)}
              placeholder="Lab owner / lead"
              className="rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
          </div>
          <textarea
            value={draftHypothesis}
            onChange={(event) => setDraftHypothesis(event.target.value)}
            placeholder="Hypothesis: what will this technique unlock?"
            rows={3}
            className="w-full rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
          />
          <div className="grid gap-2 md:grid-cols-2">
            <textarea
              value={draftVariables}
              onChange={(event) => setDraftVariables(event.target.value)}
              placeholder="Variables under test (comma or newline separated)"
              rows={2}
              className="w-full rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
            <textarea
              value={draftTargets}
              onChange={(event) => setDraftTargets(event.target.value)}
              placeholder="Sensory targets (comma or newline separated)"
              rows={2}
              className="w-full rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
          </div>
          <textarea
            value={draftEquipment}
            onChange={(event) => setDraftEquipment(event.target.value)}
            placeholder="Key instrumentation (comma or newline separated)"
            rows={2}
            className="w-full rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
          />
          <div className="grid gap-2 md:grid-cols-2">
            <textarea
              value={draftTextureObjectives}
              onChange={(event) => setDraftTextureObjectives(event.target.value)}
              placeholder="Texture objectives (comma or newline separated)"
              rows={2}
              className="w-full rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
            <textarea
              value={draftFlavorConstellations}
              onChange={(event) => setDraftFlavorConstellations(event.target.value)}
              placeholder="Flavor constellations (comma or newline separated)"
              rows={2}
              className="w-full rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-rose-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
          </div>
          <textarea
            value={draftFutureAngles}
            onChange={(event) => setDraftFutureAngles(event.target.value)}
            placeholder="Future-of-food angles (comma or newline separated)"
            rows={2}
            className="w-full rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
          />
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={draftTags}
              onChange={(event) => setDraftTags(event.target.value)}
              placeholder="Tags (comma separated)"
              className="rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
            <input
              value={draftLaunchWindow}
              onChange={(event) => setDraftLaunchWindow(event.target.value)}
              placeholder="Launch window or service"
              className="rounded-lg border border-white/30 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100"
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-cyan-200/70">
            <span>Use quick adds below or split entries with commas or new lines.</span>
            <button
              type="submit"
              disabled={isCreateDisabled}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold transition ${
                isCreateDisabled
                  ? "cursor-not-allowed border border-white/40 bg-white/30 text-slate-400 dark:border-cyan-500/15 dark:bg-slate-950/50 dark:text-cyan-300/40"
                  : "border border-sky-400/50 bg-sky-500/80 text-white shadow-sm hover:bg-sky-500 dark:border-cyan-400/50 dark:bg-cyan-500/80"
              }`}
            >
              Add to bench
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/15 bg-white/4 backdrop-blur-sm dark:border-cyan-500/20 dark:bg-slate-950/40">
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
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-cyan-200/70">
                  {experiment.hypothesis}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-cyan-300/60">
                  <span>Variables:</span>
                  {experiment.variablesUnderTest.slice(0, 3).map((variable) => (
                    <span key={variable} className="rounded-full border border-white/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] dark:border-cyan-400/30">
                      {variable}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-300/70">
                  {experiment.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/60 px-2 py-1 dark:bg-cyan-500/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-cyan-200/70">
                  <span>Lead: {experiment.owner}</span>
                  <span>Launch: {experiment.launchWindow}</span>
                </div>
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
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    pushDraftLine(
                      setDraftTextureObjectives,
                      `${texture.family}: ${texture.descriptors.join(" / ")} finish`
                    )
                  }
                  className="rounded-full border border-white/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-sky-400 hover:text-slate-800 dark:border-cyan-500/20 dark:text-cyan-200/80 dark:hover:border-cyan-400 dark:hover:text-cyan-50"
                >
                  Add texture cue
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/15 bg-white/6 p-4 text-xs leading-relaxed text-slate-600 backdrop-blur dark:border-cyan-500/25 dark:bg-slate-950/60 dark:text-cyan-100/80">
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-700 dark:text-cyan-200">
          Flavor Constellation Library
        </div>
        <div className="space-y-3">
          {flavorConstellationLibrary.map((constellation) => (
            <div key={constellation.id} className="rounded-xl border border-white/20 bg-white/30 p-3 dark:border-cyan-500/20 dark:bg-cyan-500/5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
                <span>{constellation.name}</span>
                <span>{constellation.futureAngle}</span>
              </div>
              <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-cyan-100">
                Texture hook
              </div>
              <p className="text-[12px] text-slate-600 dark:text-cyan-100/80">{constellation.textureHook}</p>
              <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-cyan-200/80">
                Flavor drivers
              </div>
              <ul className="mt-1 space-y-1 text-[12px] text-slate-600 dark:text-cyan-100/80">
                {constellation.flavorDrivers.map((driver) => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
              <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-cyan-200/80">
                Balancing notes
              </div>
              <ul className="mt-1 space-y-1 text-[12px] text-slate-600 dark:text-cyan-100/80">
                {constellation.balancingNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <div className="mt-2 text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
                Builds
              </div>
              <div className="text-[11px] text-slate-500 dark:text-cyan-200/80">
                {constellation.applications.join(" · ")}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    pushDraftLine(
                      setDraftFlavorConstellations,
                      `${constellation.name}: ${constellation.flavorDrivers.join(" + ")} | ${constellation.textureHook}`
                    )
                  }
                  className="rounded-full border border-white/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-rose-400 hover:text-slate-800 dark:border-cyan-500/20 dark:text-cyan-200/80 dark:hover:border-cyan-400 dark:hover:text-cyan-50"
                >
                  Add flavor constellation
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/15 bg-white/6 p-4 text-xs leading-relaxed text-slate-600 backdrop-blur dark:border-cyan-500/25 dark:bg-slate-950/60 dark:text-cyan-100/80">
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-700 dark:text-cyan-200">
          Future of Food Drivers
        </div>
        <div className="space-y-3">
          {futureFoodDrivers.map((driver) => (
            <div key={driver.id} className="rounded-xl border border-white/20 bg-white/30 p-3 dark:border-cyan-500/20 dark:bg-cyan-500/5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
                <span>{driver.theme}</span>
                <span>{driver.signal}</span>
              </div>
              <div className="mt-2 text-[12px] text-slate-600 dark:text-cyan-100/80">
                {driver.insight}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
                Action
              </div>
              <div className="text-[11px] text-slate-500 dark:text-cyan-200/80">{driver.action}</div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => pushDraftLine(setDraftFutureAngles, `${driver.theme}: ${driver.action}`)}
                  className="rounded-full border border-white/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-emerald-400 hover:text-slate-800 dark:border-cyan-500/20 dark:text-cyan-200/80 dark:hover:border-cyan-400 dark:hover:text-cyan-50"
                >
                  Add future angle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
