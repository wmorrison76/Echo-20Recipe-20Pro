import * as React from "react";

import React from "react";

export type ExperimentStatus = "ideation" | "testing" | "ready" | "archived";

export type LabExperiment = {
  id: string;
  title: string;
  status: ExperimentStatus;
  lastUpdated: string;
  owner: string;
  notes: string;
  tags: string[];
  hypothesis: string;
  variablesUnderTest: string[];
  sensoryTargets: string[];
  testPlan: string[];
  equipment: string[];
  launchWindow: string;
};

export type LabTask = {
  id: string;
  label: string;
  owner: string;
  due: string;
  isBlocked?: boolean;
  isCompleted?: boolean;
};

type NewExperimentInput = {
  title: string;
  owner: string;
  hypothesis: string;
  tags?: string[];
  variablesUnderTest?: string[];
  sensoryTargets?: string[];
  testPlan?: string[];
  equipment?: string[];
  notes?: string;
  status?: ExperimentStatus;
  launchWindow?: string;
};

type RDLabState = {
  experiments: LabExperiment[];
  focusExperimentId: string;
  setFocusExperiment: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  backlog: LabTask[];
  insights: { headline: string; detail: string; metric?: string }[];
  toggleArchive: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  setExperimentStatus: (id: string, status: ExperimentStatus) => void;
  createExperiment: (input: NewExperimentInput) => string;
  appendVariable: (id: string, variable: string) => void;
  appendTestStep: (id: string, step: string) => void;
  appendSensoryTarget: (id: string, target: string) => void;
};

const experimentsSeed: LabExperiment[] = [
  {
    id: "exp-ferment-01",
    title: "Smoked koji custard",
    status: "testing",
    lastUpdated: "2h ago",
    owner: "A. Vega",
    notes:
      "Dial in double-ferment schedule. Current batch holding saline edge; consider maple lacto brine.",
    tags: ["fermentation", "dessert", "winter menu"],
  },
  {
    id: "exp-carbon-02",
    title: "Carbonic citrus pearls",
    status: "ideation",
    lastUpdated: "6h ago",
    owner: "M. Ruiz",
    notes:
      "Need shelf-life test. Explore pairing with aged daikon broth for welcome toast amuse.",
    tags: ["spark", "amuse", "welcome"],
  },
  {
    id: "exp-satin-03",
    title: "Velvet oyster emulsion",
    status: "ready",
    lastUpdated: "Yesterday",
    owner: "C. Nguyen",
    notes: "Approved for service preview—capture allergen handoff.",
    tags: ["seafood", "sauce", "preview"],
  },
];

const backlogSeed: LabTask[] = [
  { id: "task-01", label: "Capture yield curves for koji custard", owner: "QA Team", due: "Today" },
  { id: "task-02", label: "Source electric daisy micro-lot", owner: "Purchasing", due: "Tomorrow", isBlocked: true },
  { id: "task-03", label: "Calibrate sous-vide ovens", owner: "Ops", due: "Friday" },
];

const insightSeed = [
  {
    headline: "Menu margin guardrails engaged",
    detail: "Projected cost delta now +2.1% vs baseline thanks to AI assortment.",
    metric: "▲ 2.1%",
  },
  {
    headline: "Guest sentiment heatmap",
    detail: "Spark textures trending 18% above control; continue A/B with velvet baseline.",
    metric: "18% uplift",
  },
  {
    headline: "Supplier volatility risk",
    detail: "Citrus micro-lot at 62% supply. Run dual sourcing contingency.",
  },
];

const RDLabContext = React.createContext<RDLabState | null>(null);

type RDLabProviderProps = {
  children: React.ReactNode;
};

export function RDLabProvider({ children }: RDLabProviderProps) {
  const [experiments, setExperiments] = React.useState<LabExperiment[]>(experimentsSeed);
  const [focusExperimentId, setFocusExperimentId] = React.useState<string>(experimentsSeed[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const toggleArchive = React.useCallback((id: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              status: exp.status === "archived" ? "ideation" : "archived",
            }
          : exp,
      ),
    );
  }, []);

  const updateNotes = React.useCallback((id: string, notes: string) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, notes, lastUpdated: "Just now" } : exp)),
    );
  }, []);

  const value = React.useMemo<RDLabState>(
    () => ({
      experiments,
      focusExperimentId,
      setFocusExperiment: setFocusExperimentId,
      searchQuery,
      setSearchQuery,
      backlog: backlogSeed,
      insights: insightSeed,
      toggleArchive,
      updateNotes,
    }),
    [experiments, focusExperimentId, searchQuery, toggleArchive, updateNotes],
  );

  return <RDLabContext.Provider value={value}>{children}</RDLabContext.Provider>;
}

export function useOptionalRDLabStore() {
  return React.useContext(RDLabContext);
}

export function useRDLabStore() {
  const ctx = React.useContext(RDLabContext);
  if (!ctx) throw new Error("useRDLabStore must be used within RDLabProvider");
  return ctx;
}
