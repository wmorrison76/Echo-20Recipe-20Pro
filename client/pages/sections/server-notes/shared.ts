export type LayoutPreset = {
  id: string;
  name: string;
  summary: string;
  orientation: "vertical" | "horizontal";
  highlights: string[];
};

export type ServerNotesConfig = {
  outlet: string;
  layoutId: string;
  orientation: "vertical" | "horizontal";
  includeAllergens: boolean;
  includeServiceNotes: boolean;
  includePairings: boolean;
  includeChefNotes: boolean;
};

export const layoutPresets: LayoutPreset[] = [
  {
    id: "brasserie-classic",
    name: "Brasserie Classic",
    summary: "Large hero block with service rhythm, plated courses, and chef signature footer.",
    orientation: "vertical",
    highlights: [
      "Wide title header with outlet and service date",
      "Two-column body: left for recipes, right for prep reminders",
      "Footer for chef initials and pass coordination",
    ],
  },
  {
    id: "tasting-flight",
    name: "Tasting Flight",
    summary: "Compact tasting menu layout with emphasis on cadence and pairings.",
    orientation: "horizontal",
    highlights: [
      "Horizontal orientation for quick pass reference",
      "Structured plating queue and heat lamp slots",
      "Pairing badges beside each course",
    ],
  },
  {
    id: "banquet-rally",
    name: "Banquet Rally",
    summary: "High-volume rally sheet organized by station with timing checkpoints.",
    orientation: "vertical",
    highlights: [
      "Station callouts with staff assignments",
      "Color coded allergen flags for bulk service",
      "Completion checkmarks with QR handoff",
    ],
  },
];

export const DEFAULT_CONFIG: ServerNotesConfig = {
  outlet: "all-outlets",
  layoutId: layoutPresets[0]!.id,
  orientation: layoutPresets[0]!.orientation,
  includeAllergens: true,
  includeServiceNotes: true,
  includePairings: true,
  includeChefNotes: true,
};

export const orientationLabels: Record<"vertical" | "horizontal", string> = {
  vertical: "Vertical orientation",
  horizontal: "Horizontal orientation",
};

export const outletOptions: { id: string; name: string }[] = [
  { id: "all-outlets", name: "All Outlets" },
  { id: "main-dining", name: "Main Dining" },
  { id: "banquets", name: "Banquets" },
  { id: "mixology", name: "Beverage & Mixology" },
];
