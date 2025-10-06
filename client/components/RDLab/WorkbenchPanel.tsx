import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import { useRDLabStore, type ExperimentStatus } from "@/stores/rdLabStore";
import { cn } from "@/lib/utils";

const statusColor: Record<ExperimentStatus, string> = {
  ideation: "bg-amber-400/20 text-amber-700 dark:text-amber-200",
  testing: "bg-sky-400/20 text-sky-700 dark:text-sky-200",
  ready: "bg-emerald-400/20 text-emerald-700 dark:text-emerald-200",
  archived: "bg-slate-500/20 text-slate-600 dark:text-slate-200",
};

const statusOptions: ExperimentStatus[] = ["ideation", "testing", "ready", "archived"];

export function WorkbenchPanel() {
  const {
    experiments,
    focusExperimentId,
    toggleArchive,
    updateNotes,
    setExperimentStatus,
    appendVariable,
    appendTestStep,
    appendSensoryTarget,
    appendTextureObjective,
    appendFlavorConstellation,
    appendFutureFoodAngle,
  } = useRDLabStore();
  const experiment = useMemo(
    () => experiments.find((item) => item.id === focusExperimentId) ?? experiments[0],
    [experiments, focusExperimentId],
  );
  const [draftNotes, setDraftNotes] = useState<string>(experiment?.notes ?? "");
  const [draftVariable, setDraftVariable] = useState("");
  const [draftTestStep, setDraftTestStep] = useState("");
  const [draftSensory, setDraftSensory] = useState("");
  const [draftTextureObjective, setDraftTextureObjective] = useState("");
  const [draftFlavorConstellation, setDraftFlavorConstellation] = useState("");
  const [draftFutureAngle, setDraftFutureAngle] = useState("");

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!experiment) return;
    setExperimentStatus(experiment.id, event.target.value as ExperimentStatus);
  };

  const handleVariableSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experiment || !draftVariable.trim()) return;
    appendVariable(experiment.id, draftVariable);
    setDraftVariable("");
  };

  const handleTestStepSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experiment || !draftTestStep.trim()) return;
    appendTestStep(experiment.id, draftTestStep);
    setDraftTestStep("");
  };

  const handleSensorySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experiment || !draftSensory.trim()) return;
    appendSensoryTarget(experiment.id, draftSensory);
    setDraftSensory("");
  };

  const handleTextureSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experiment || !draftTextureObjective.trim()) return;
    appendTextureObjective(experiment.id, draftTextureObjective);
    setDraftTextureObjective("");
  };

  const handleFlavorSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experiment || !draftFlavorConstellation.trim()) return;
    appendFlavorConstellation(experiment.id, draftFlavorConstellation);
    setDraftFlavorConstellation("");
  };

  const handleFutureAngleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experiment || !draftFutureAngle.trim()) return;
    appendFutureFoodAngle(experiment.id, draftFutureAngle);
    setDraftFutureAngle("");
  };

  const isVariableDisabled = !draftVariable.trim();
  const isTestStepDisabled = !draftTestStep.trim();
  const isSensoryDisabled = !draftSensory.trim();
  const isTextureDisabled = !draftTextureObjective.trim();
  const isFlavorDisabled = !draftFlavorConstellation.trim();
  const isFutureAngleDisabled = !draftFutureAngle.trim();

  if (!experiment) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/10 text-sm text-slate-600 dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200/70">
        Select an experiment to activate the workbench.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto pr-1">
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/60 via-white/30 to-white/10 p-6 backdrop-blur dark:border-cyan-500/25 dark:from-slate-950/80 dark:via-slate-900/50 dark:to-cyan-950/30">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/60">
              Active Workbench
            </div>
            <h2 className="text-2xl font-semibold tracking-[0.08em] text-slate-900 dark:text-cyan-100">
              {experiment.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.3em] text-slate-500 dark:text-cyan-200/70">
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[11px] font-medium",
                  statusColor[experiment.status] ?? statusColor.ideation,
                )}
              >
                {experiment.status}
              </span>
              <span>Owner: {experiment.owner}</span>
              <span>Updated: {experiment.lastUpdated}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-cyan-200/70">
            <div className="flex items-center gap-2">
              <span>Stage</span>
              <select
                value={experiment.status}
                onChange={handleStatusChange}
                className="rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600 outline-none transition hover:border-sky-400 focus:border-sky-500 focus:text-slate-800 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100 dark:hover:border-cyan-400 dark:focus:border-cyan-300"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/30 bg-white/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:border-slate-500/60 hover:bg-white/80 dark:border-cyan-500/30 dark:bg-slate-950/50 dark:text-cyan-200 dark:hover:border-cyan-400 dark:hover:bg-slate-950/80"
              onClick={() => toggleArchive(experiment.id)}
            >
              {experiment.status === "archived" ? "Reopen" : "Archive"}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.35em] text-cyan-200/80">
          <span className="chalk-breath">{experiment.textureObjectives.length} texture cues</span>
          <span className="chalk-breath">{experiment.flavorConstellations.length} flavor maps</span>
          <span className="chalk-breath">{experiment.futureFoodAngles.length} future bets</span>
        </div>
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/50 p-4 text-sm text-slate-700 shadow-inner dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100">
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
            Experiment context
          </div>
          <p className="mt-2 leading-relaxed text-slate-600 dark:text-cyan-100/80">
            {experiment.notes}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/70">
            <header className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
              Variables under test
            </header>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-cyan-100/80">
              {experiment.variablesUnderTest.length ? (
                experiment.variablesUnderTest.map((variable) => (
                  <li key={variable} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500" />
                    <span>{variable}</span>
                  </li>
                ))
              ) : (
                <li className="italic text-slate-400 dark:text-cyan-300/60">
                  Log your control vs variant deltas to map the experiment.
                </li>
              )}
            </ul>
            <form onSubmit={handleVariableSubmit} className="mt-3 flex gap-2 text-xs">
              <input
                value={draftVariable}
                onChange={(event) => setDraftVariable(event.target.value)}
                placeholder="Add variable delta"
                className="flex-1 rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100"
              />
              <button
                type="submit"
                disabled={isVariableDisabled}
                className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                  isVariableDisabled
                    ? "cursor-not-allowed border border-white/40 bg-white/40 text-slate-400 dark:border-cyan-500/20 dark:bg-slate-950/60"
                    : "border border-sky-500/40 bg-sky-500/80 text-white hover:bg-sky-500 dark:border-cyan-400/40 dark:bg-cyan-500/80"
                }`}
              >
                Add
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/70">
            <header className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
              Sensory targets
            </header>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-cyan-100/80">
              {experiment.sensoryTargets.length ? (
                experiment.sensoryTargets.map((target) => (
                  <li key={target} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                    <span>{target}</span>
                  </li>
                ))
              ) : (
                <li className="italic text-slate-400 dark:text-cyan-300/60">
                  Define the mouthfeel, visual, or aromatic endpoints you are aiming for.
                </li>
              )}
            </ul>
            <form onSubmit={handleSensorySubmit} className="mt-3 flex gap-2 text-xs">
              <input
                value={draftSensory}
                onChange={(event) => setDraftSensory(event.target.value)}
                placeholder="Log sensory observation"
                className="flex-1 rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100"
              />
              <button
                type="submit"
                disabled={isSensoryDisabled}
                className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                  isSensoryDisabled
                    ? "cursor-not-allowed border border-white/40 bg-white/40 text-slate-400 dark:border-cyan-500/20 dark:bg-slate-950/60"
                    : "border border-emerald-500/40 bg-emerald-500/80 text-white hover:bg-emerald-500 dark:border-emerald-400/40 dark:bg-emerald-500/80"
                }`}
              >
                Add
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/70">
            <header className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
              Protocol queue
            </header>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-cyan-100/80">
              {experiment.testPlan.length ? (
                experiment.testPlan.map((step) => <li key={step}>{step}</li>)
              ) : (
                <li className="italic text-slate-400 dark:text-cyan-300/60">
                  Draft the next bench steps, measurements, or service simulations.
                </li>
              )}
            </ol>
            <form onSubmit={handleTestStepSubmit} className="mt-3 flex gap-2 text-xs">
              <input
                value={draftTestStep}
                onChange={(event) => setDraftTestStep(event.target.value)}
                placeholder="Add protocol step"
                className="flex-1 rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100"
              />
              <button
                type="submit"
                disabled={isTestStepDisabled}
                className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                  isTestStepDisabled
                    ? "cursor-not-allowed border border-white/40 bg-white/40 text-slate-400 dark:border-cyan-500/20 dark:bg-slate-950/60"
                    : "border border-indigo-500/40 bg-indigo-500/80 text-white hover:bg-indigo-500 dark:border-indigo-400/40 dark:bg-indigo-500/80"
                }`}
              >
                Queue
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/70">
            <header className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
              Instrumentation & launch
            </header>
            <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-cyan-200/70">
              {experiment.equipment.length ? (
                experiment.equipment.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-white/40 px-2 py-1 text-[11px] font-semibold dark:border-cyan-500/30"
                  >
                    {tool}
                  </span>
                ))
              ) : (
                <span className="italic text-slate-400 dark:text-cyan-300/60">
                  List the lab rigs or plating tools required.
                </span>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-white/30 bg-white/70 p-3 text-sm text-slate-600 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/60 dark:text-cyan-100">
              <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
                Launch window
              </div>
              <div className="mt-1 font-semibold text-slate-700 dark:text-cyan-100">
                {experiment.launchWindow}
              </div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-cyan-300/60">
                Status: {experiment.status}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/70">
            <header className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
              Texture blueprint
            </header>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-cyan-100/80">
              {experiment.textureObjectives.length ? (
                experiment.textureObjectives.map((objective) => (
                  <li key={objective} className="rounded-lg border border-white/25 bg-white/60 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200/80">
                    {objective}
                  </li>
                ))
              ) : (
                <li className="italic text-slate-400 dark:text-cyan-300/60">
                  Define the sensory checkpoints you will measure.
                </li>
              )}
            </ul>
            <form onSubmit={handleTextureSubmit} className="mt-3 space-y-2 text-xs">
              <textarea
                value={draftTextureObjective}
                onChange={(event) => setDraftTextureObjective(event.target.value)}
                rows={2}
                placeholder="e.g. Custard wobble holds at 1 Hz after 24h"
                className="w-full rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isTextureDisabled}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                    isTextureDisabled
                      ? "cursor-not-allowed border border-white/40 bg-white/40 text-slate-400 dark:border-cyan-500/20 dark:bg-slate-950/60"
                      : "border border-emerald-400/40 bg-emerald-500/80 text-white hover:bg-emerald-500 dark:border-emerald-400/50 dark:bg-emerald-500/80"
                  }`}
                >
                  Pin objective
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/70">
            <header className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
              Flavor architecture
            </header>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-cyan-100/80">
              {experiment.flavorConstellations.length ? (
                experiment.flavorConstellations.map((constellation) => (
                  <li key={constellation} className="rounded-lg border border-white/25 bg-white/60 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200/80">
                    {constellation}
                  </li>
                ))
              ) : (
                <li className="italic text-slate-400 dark:text-cyan-300/60">
                  Map the base, amplifier, and balancing elements.
                </li>
              )}
            </ul>
            <form onSubmit={handleFlavorSubmit} className="mt-3 space-y-2 text-xs">
              <textarea
                value={draftFlavorConstellation}
                onChange={(event) => setDraftFlavorConstellation(event.target.value)}
                rows={2}
                placeholder="e.g. Miso caramel × burnt citrus oil × spruce tip salt"
                className="w-full rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-slate-700 outline-none transition focus:border-rose-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isFlavorDisabled}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                    isFlavorDisabled
                      ? "cursor-not-allowed border border-white/40 bg-white/40 text-slate-400 dark:border-cyan-500/20 dark:bg-slate-950/60"
                      : "border border-rose-400/40 bg-rose-500/80 text-white hover:bg-rose-500 dark:border-rose-400/40 dark:bg-rose-500/80"
                  }`}
                >
                  Log constellation
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner dark:border-cyan-500/25 dark:bg-slate-950/70">
            <header className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
              Future-of-food hypotheses
            </header>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-cyan-100/80">
              {experiment.futureFoodAngles.length ? (
                experiment.futureFoodAngles.map((angle) => (
                  <li key={angle} className="rounded-lg border border-white/25 bg-white/60 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200/80">
                    {angle}
                  </li>
                ))
              ) : (
                <li className="italic text-slate-400 dark:text-cyan-300/60">
                  Describe the climate, nutrition, or supply impact goals.
                </li>
              )}
            </ul>
            <form onSubmit={handleFutureAngleSubmit} className="mt-3 space-y-2 text-xs">
              <textarea
                value={draftFutureAngle}
                onChange={(event) => setDraftFutureAngle(event.target.value)}
                rows={2}
                placeholder="e.g. Upcycle koji whey into sparkling dessert bases"
                className="w-full rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isFutureAngleDisabled}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                    isFutureAngleDisabled
                      ? "cursor-not-allowed border border-white/40 bg-white/40 text-slate-400 dark:border-cyan-500/20 dark:bg-slate-950/60"
                      : "border border-indigo-400/40 bg-indigo-500/80 text-white hover:bg-indigo-500 dark:border-indigo-400/40 dark:bg-indigo-500/80"
                  }`}
                >
                  Capture angle
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/60 p-4 shadow-inner backdrop-blur-sm dark:border-cyan-500/25 dark:bg-slate-950/70">
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
          Lab log — append updates
        </div>
        <textarea
          value={draftNotes}
          onChange={(event) => setDraftNotes(event.target.value)}
          onBlur={() => updateNotes(experiment.id, draftNotes)}
          className="flex-1 rounded-xl border border-white/40 bg-white/80 px-3 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:text-slate-900 dark:border-cyan-500/25 dark:bg-slate-950/70 dark:text-cyan-100"
          rows={10}
          placeholder="Capture experiments, anomalies, plating adjustments, guardrail breaches..."
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
          <span>Autosaves on blur — current snapshot stored in lab store.</span>
          <button
            type="button"
            onClick={() => {
              setDraftNotes("");
              updateNotes(experiment.id, "");
            }}
            className="rounded-full border border-white/40 px-3 py-1 text-[11px] font-semibold tracking-[0.35em] text-slate-600 transition hover:border-slate-500/60 hover:bg-white/80 dark:border-cyan-500/25 dark:text-cyan-200 dark:hover:border-cyan-400 dark:hover:bg-slate-950/60"
          >
            Clear notes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[12px] text-slate-600 dark:text-cyan-200/70">
        {experiment.tags.map((tag) => (
          <div
            key={tag}
            className="rounded-xl border border-white/20 bg-gradient-to-br from-white/70 via-white/40 to-white/20 px-3 py-2 text-center uppercase tracking-[0.35em] shadow-sm dark:border-cyan-500/25 dark:from-slate-950/70 dark:via-slate-900/60 dark:to-cyan-900/40"
          >
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}
