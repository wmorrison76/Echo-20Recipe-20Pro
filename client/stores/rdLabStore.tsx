import * as React from "react";

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
  textureObjectives: string[];
  flavorConstellations: string[];
  futureFoodAngles: string[];
};

export type LabTask = {
  id: string;
  label: string;
  owner: string;
  due: string;
  isBlocked?: boolean;
  isCompleted?: boolean;
};

export type RDLabSnapshot = {
  experiments: LabExperiment[];
  focusExperimentId: string;
  searchQuery: string;
};

const cloneState = <T,>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    if (Array.isArray(value)) {
      return [...value] as T;
    }
    if (value && typeof value === "object") {
      return { ...(value as Record<string, unknown>) } as T;
    }
    return value;
  }
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
  textureObjectives?: string[];
  flavorConstellations?: string[];
  futureFoodAngles?: string[];
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
  appendTextureObjective: (id: string, objective: string) => void;
  appendFlavorConstellation: (id: string, constellation: string) => void;
  appendFutureFoodAngle: (id: string, angle: string) => void;
  serializeState: () => RDLabSnapshot;
  hydrateState: (snapshot: RDLabSnapshot) => void;
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
    hypothesis:
      "Layering cold-smoke with maple lacto brine will yield a satin custard with amplified retronasal smoke while preserving silken structure.",
    variablesUnderTest: [
      "Maple brine salinity 1.6% vs 1.8%",
      "Smoke dwell time 30 vs 45 minutes",
      "Koji inoculation at 18%",
    ],
    sensoryTargets: [
      "Satin wobble at 1.2 Hz on rheometer",
      "Smoke intensity 6/10 on tasting panel",
      "Residual sweetness under 12° Brix",
    ],
    testPlan: [
      "Profile texture on rheometer after 12h set",
      "Quantify maple volatiles via GC sniff session",
      "Hold at 2°C for 24h to monitor syneresis",
    ],
    equipment: [
      "Circulating cold smoker",
      "Rheon texture analyzer",
      "Gas chromatograph sniff port",
    ],
    launchWindow: "Tasting menu wk 9",
    textureObjectives: [
      "Custard wobble stays within 0.8–1.3 Hz band",
      "Cold-smoke lacquer without visible weeping after 24h",
    ],
    flavorConstellations: [
      "Smoked koji custard × maple lacto brine × spruce tip garnish",
      "Fermented cream backbone balanced with buckwheat cacao crunch",
    ],
    futureFoodAngles: [
      "Valorize koji whey as a dessert texture builder",
      "Route smoker waste heat into low-carbon dessert flights",
    ],
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
    hypothesis:
      "Encasing carbonated yuzu curd in alginate pearls will deliver an effervescent burst without collapse during tray pass.",
    variablesUnderTest: [
      "CO₂ charge 18 bar vs 22 bar",
      "Alginate bath calcium ppm",
      "Holding temperature 2°C vs 5°C",
    ],
    sensoryTargets: [
      "Perlage sensation within 3 seconds of bite",
      "Acid perception balanced at 5/10",
      "Shell snap audible at 30 cm",
    ],
    testPlan: [
      "Run 90-minute pass holding to map effervescence decay",
      "Measure dissolved CO₂ post-encapsulation",
      "Record guest feedback on sparkle intensity",
    ],
    equipment: [
      "Carbonation rig",
      "Immersion circulator",
      "High-speed data logger",
    ],
    launchWindow: "Welcome toast revamp",
    textureObjectives: [
      "Membranes stay intact for 90-minute tray pass",
      "Sparkle perception sustained across 6 tasters",
    ],
    flavorConstellations: [
      "Carbonated yuzu pearl × aged daikon broth × electric daisy tincture",
      "Finger lime oil layered with kombu vapor for mineral lift",
    ],
    futureFoodAngles: [
      "Position sparkling solids as non-alcoholic celebration ritual",
      "Refillable CO₂ capsules to eliminate single-use siphon chargers",
    ],
  },
  {
    id: "exp-satin-03",
    title: "Velvet oyster emulsion",
    status: "ready",
    lastUpdated: "Yesterday",
    owner: "C. Nguyen",
    notes: "Approved for service preview—capture allergen handoff.",
    tags: ["seafood", "sauce", "preview"],
    hypothesis:
      "Stabilizing raw oyster liquor with lecithin and xanthan will create a velvet sheen while retaining salinity cues.",
    variablesUnderTest: [
      "Xanthan inclusion 0.05%",
      "Shear speed 2200 rpm",
      "Service temperature 8°C",
    ],
    sensoryTargets: [
      "Mirror gloss finish",
      "Salinity 3.2%",
      "Umami linger 9/10",
    ],
    testPlan: [
      "Hold emulsion for 4h under pass lamp",
      "Rapid cool re-test for break",
      "Plate with nitrogen-frozen herb powder",
    ],
    equipment: [
      "Pacojet",
      "Rotor-stator blender",
      "Nitrogen tunnel",
    ],
    launchWindow: "Chef's counter prelude",
    textureObjectives: [
      "Sheen maintains under pass lamp for 12 minutes",
      "Emulsion coats spoon with zero break at 8°C",
    ],
    flavorConstellations: [
      "Velvet oyster emulsion × nitrogen-frozen herb powder × smoked leek oil",
      "Sea lettuce gel layered with pickled green strawberry kosho",
    ],
    futureFoodAngles: [
      "Showcase regenerative shellfish as climate-positive luxury",
      "Prototype cold-chain friendly oyster emulsion retail pack",
    ],
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

  const generateExperimentId = React.useCallback(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `exp-${crypto.randomUUID()}`;
    }
    return `exp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }, []);

  const sanitizeList = React.useCallback((list?: string[]) => {
    return list?.map((item) => item.trim()).filter(Boolean) ?? [];
  }, []);

  const toggleArchive = React.useCallback((id: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              status: exp.status === "archived" ? "ideation" : "archived",
              lastUpdated: "Just now",
            }
          : exp,
      ),
    );
  }, []);

  const setExperimentStatus = React.useCallback((id: string, status: ExperimentStatus) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, status, lastUpdated: "Just now" } : exp)),
    );
  }, []);

  const updateNotes = React.useCallback((id: string, notes: string) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, notes, lastUpdated: "Just now" } : exp)),
    );
  }, []);

  const createExperiment = React.useCallback(
    (input: NewExperimentInput): string => {
      const id = generateExperimentId();
      const experiment: LabExperiment = {
        id,
        title: input.title.trim(),
        status: input.status ?? "ideation",
        lastUpdated: "Just now",
        owner: input.owner.trim(),
        notes: input.notes?.trim() || input.hypothesis.trim(),
        tags: (() => {
          const next = sanitizeList(input.tags);
          return next.length ? next : ["lab"];
        })(),
        hypothesis: input.hypothesis.trim(),
        variablesUnderTest: sanitizeList(input.variablesUnderTest),
      sensoryTargets: sanitizeList(input.sensoryTargets),
      testPlan: sanitizeList(input.testPlan),
      equipment: sanitizeList(input.equipment),
      launchWindow: input.launchWindow?.trim() || "TBD",
      textureObjectives: sanitizeList(input.textureObjectives),
      flavorConstellations: sanitizeList(input.flavorConstellations),
      futureFoodAngles: sanitizeList(input.futureFoodAngles),
    };
      setExperiments((prev) => [experiment, ...prev]);
      setFocusExperimentId(id);
      return id;
    },
    [generateExperimentId, sanitizeList],
  );

  const appendVariable = React.useCallback((id: string, variable: string) => {
    const entry = variable.trim();
    if (!entry) return;
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              variablesUnderTest: [...exp.variablesUnderTest, entry],
              lastUpdated: "Just now",
            }
          : exp,
      ),
    );
  }, []);

  const appendTestStep = React.useCallback((id: string, step: string) => {
    const entry = step.trim();
    if (!entry) return;
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              testPlan: [...exp.testPlan, entry],
              lastUpdated: "Just now",
            }
          : exp,
      ),
    );
  }, []);

  const appendSensoryTarget = React.useCallback((id: string, target: string) => {
    const entry = target.trim();
    if (!entry) return;
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              sensoryTargets: [...exp.sensoryTargets, entry],
              lastUpdated: "Just now",
            }
          : exp,
      ),
    );
  }, []);

  const appendTextureObjective = React.useCallback((id: string, objective: string) => {
    const entry = objective.trim();
    if (!entry) return;
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              textureObjectives: [...exp.textureObjectives, entry],
              lastUpdated: "Just now",
            }
          : exp,
      ),
    );
  }, []);

  const appendFlavorConstellation = React.useCallback((id: string, constellation: string) => {
    const entry = constellation.trim();
    if (!entry) return;
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              flavorConstellations: [...exp.flavorConstellations, entry],
              lastUpdated: "Just now",
            }
          : exp,
      ),
    );
  }, []);

  const appendFutureFoodAngle = React.useCallback((id: string, angle: string) => {
    const entry = angle.trim();
    if (!entry) return;
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              futureFoodAngles: [...exp.futureFoodAngles, entry],
              lastUpdated: "Just now",
            }
          : exp,
      ),
    );
  }, []);

  const serializeState = React.useCallback((): RDLabSnapshot => {
    return {
      experiments: cloneState(experiments),
      focusExperimentId,
      searchQuery,
    };
  }, [experiments, focusExperimentId, searchQuery]);

  const hydrateState = React.useCallback(
    (snapshot: RDLabSnapshot) => {
      const nextExperiments = Array.isArray(snapshot?.experiments)
        ? cloneState(snapshot.experiments)
        : [];
      setExperiments(nextExperiments);
      const targetId = snapshot?.focusExperimentId;
      const resolvedFocusId = nextExperiments.length
        ? nextExperiments.some((exp) => exp.id === targetId)
          ? targetId
          : nextExperiments[0].id
        : "";
      setFocusExperimentId(resolvedFocusId);
      setSearchQuery(typeof snapshot?.searchQuery === "string" ? snapshot.searchQuery : "");
    },
    [setExperiments, setFocusExperimentId, setSearchQuery],
  );

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
      setExperimentStatus,
      createExperiment,
      appendVariable,
      appendTestStep,
      appendSensoryTarget,
      appendTextureObjective,
      appendFlavorConstellation,
      appendFutureFoodAngle,
      serializeState,
      hydrateState,
    }),
    [
      experiments,
      focusExperimentId,
      searchQuery,
      toggleArchive,
      updateNotes,
      setExperimentStatus,
      createExperiment,
      appendVariable,
      appendTestStep,
      appendSensoryTarget,
      appendTextureObjective,
      appendFlavorConstellation,
      appendFutureFoodAngle,
      serializeState,
      hydrateState,
    ],
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
