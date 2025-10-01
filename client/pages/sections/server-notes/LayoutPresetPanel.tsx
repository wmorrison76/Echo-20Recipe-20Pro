import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { orientationLabels, outletOptions } from "./shared";
import type { LayoutPreset, ServerNotesConfig } from "./shared";

const toggleIntentClasses =
  "border border-white/10 bg-black/30 text-left text-sm transition hover:border-primary/60 data-[state=on]:border-primary data-[state=on]:bg-primary/10";

type LayoutPresetPanelProps = {
  presets: LayoutPreset[];
  config: ServerNotesConfig;
  onConfigChange: (next: ServerNotesConfig) => void;
};

export function LayoutPresetPanel({ presets, config, onConfigChange }: LayoutPresetPanelProps) {
  const selectedPreset =
    presets.find((preset) => preset.id === config.layoutId) ?? presets[0];

  const updateConfig = (patch: Partial<ServerNotesConfig>) => {
    onConfigChange({ ...config, ...patch });
  };

  return (
    <Card className="border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-950/80 shadow-lg">
      <CardHeader className="gap-2 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-white">
              Configuration
            </CardTitle>
            <CardDescription className="text-sm text-slate-300">
              Tune the layout and content before generating briefings for the
              pass.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-sky-500/20 text-sky-100">
            {orientationLabels[config.orientation]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-white/90">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-slate-400">
              Outlet
            </Label>
            <Select
              value={config.outlet}
              onValueChange={(value) => updateConfig({ outlet: value })}
            >
              <SelectTrigger className="h-11 bg-white/5 text-left text-sm text-white/90">
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent>
                {outletOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-slate-400">
              Layout preset
            </Label>
            <ToggleGroup
              type="single"
              value={config.layoutId}
              onValueChange={(value) => {
                if (!value) return;
                const preset = presets.find((item) => item.id === value);
                updateConfig({
                  layoutId: value,
                  orientation: preset?.orientation ?? config.orientation,
                });
              }}
              className="grid grid-cols-1 gap-2"
            >
              {presets.map((preset) => (
                <ToggleGroupItem
                  key={preset.id}
                  value={preset.id}
                  className={`${toggleIntentClasses} rounded-xl p-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">
                        {preset.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {preset.summary}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/5 text-[11px] uppercase tracking-wide text-slate-100"
                    >
                      {preset.orientation}
                    </Badge>
                  </div>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-slate-400">
              Orientation
            </Label>
            <ToggleGroup
              type="single"
              value={config.orientation}
              onValueChange={(value) =>
                value && updateConfig({ orientation: value as ServerNotesConfig["orientation"] })
              }
              className="grid grid-cols-2 gap-2"
            >
              <ToggleGroupItem
                value="vertical"
                className={`${toggleIntentClasses} rounded-lg px-3 py-2 text-center`}
              >
                Vertical
              </ToggleGroupItem>
              <ToggleGroupItem
                value="horizontal"
                className={`${toggleIntentClasses} rounded-lg px-3 py-2 text-center`}
              >
                Horizontal
              </ToggleGroupItem>
            </ToggleGroup>
            {selectedPreset && (
              <ul className="mt-3 space-y-2 rounded-lg border border-white/5 bg-white/5 p-3 text-xs text-slate-200">
                {selectedPreset.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-sky-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            id="server-notes-include-allergens"
            label="Highlight allergens"
            description="Displays top allergens beside each recipe push to keep the pass aligned."
            checked={config.includeAllergens}
            onCheckedChange={(checked) => updateConfig({ includeAllergens: checked })}
          />
          <ToggleRow
            id="server-notes-service-notes"
            label="Include service strategy"
            description="Adds pacing notes, plating rhythm, and chef signals for each station."
            checked={config.includeServiceNotes}
            onCheckedChange={(checked) => updateConfig({ includeServiceNotes: checked })}
          />
          <ToggleRow
            id="server-notes-pairings"
            label="Surface pairings"
            description="Appends beverage pairings and responsible mixology station callouts."
            checked={config.includePairings}
            onCheckedChange={(checked) => updateConfig({ includePairings: checked })}
          />
          <ToggleRow
            id="server-notes-chef-signature"
            label="Require chef initials"
            description="Adds a signature strip for chef and service lead sign-off before release."
            checked={config.includeChefNotes}
            onCheckedChange={(checked) => updateConfig({ includeChefNotes: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type ToggleRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function ToggleRow({ id, label, description, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-white">
          {label}
        </Label>
        <p className="mt-1 text-xs text-slate-300">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
