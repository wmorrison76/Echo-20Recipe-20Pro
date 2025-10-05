import { useMemo, useState } from "react";

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
  } = useRDLabStore();
  const experiment = useMemo(
    () => experiments.find((item) => item.id === focusExperimentId) ?? experiments[0],
    [experiments, focusExperimentId],
  );
  const [draftNotes, setDraftNotes] = useState<string>(experiment?.notes ?? "");
  const [draftVariable, setDraftVariable] = useState("");
  const [draftTestStep, setDraftTestStep] = useState("");
  const [draftSensory, setDraftSensory] = useState("");

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

  const isVariableDisabled = !draftVariable.trim();
  const isTestStepDisabled = !draftTestStep.trim();
  const isSensoryDisabled = !draftSensory.trim();

  if (!experiment) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/10 text-sm text-slate-600 dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200/70">
        Select an experiment to activate the workbench.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5">
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
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/50 p-4 text-sm text-slate-700 shadow-inner dark:border-cyan-500/20 dark:bg-slate-950/60 dark:text-cyan-100">
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-cyan-200/70">
            Experiment context
          </div>
          <p className="mt-2 leading-relaxed text-slate-600 dark:text-cyan-100/80">
            {experiment.notes}
          </p>
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
