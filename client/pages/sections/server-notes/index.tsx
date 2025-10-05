import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  History,
  Plus,
  Sparkles,
  ListChecks,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/AppDataContext";
import { useLanguage } from "@/context/LanguageContext";
import ServerNotesPreview from "@/components/ServerNotesPreview";
import { ServerNotesConfig } from "@/components/ServerNotesConfig";
import { RecipeSelection } from "@/components/RecipeSelection";
import { ServerNotesGenerator } from "@/components/ServerNotesGenerator";
import { AllergyMatrixDialog } from "@/components/AllergyMatrixDialog";
import { CooksRecipeBookGenerator } from "@/components/CooksRecipeBookGenerator";
import type { LanguageCode } from "@/i18n/config";
import {
  createEmptyServerNote,
  layoutPresets,
  colorSchemes,
  type ServerNote,
  type ServerNoteRecipe,
} from "@shared/server-notes";

const SAVED_NOTES_KEY = "serverNotes:saved";
const SETTINGS_KEY = "serverNotes:settings";

const WALKTHROUGH_STEPS: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Configure your briefing",
    description:
      "Choose layout, colors, and company details so the document matches your brand.",
    icon: Sparkles,
  },
  {
    title: "Select featured recipes",
    description:
      "Search, tag, and drag recipes into the briefing to build the agenda for service.",
    icon: ListChecks,
  },
  {
    title: "Preview & generate",
    description:
      "Review the layout, adjust orientation, then export or save a reusable document.",
    icon: FileCheck2,
  },
];

export default function ServerNotesSection() {
  const { recipes } = useAppData();
  const { toast } = useToast();
  const { language, setLanguage, options: languageOptions } = useLanguage();

  const template = useMemo(
    () => createEmptyServerNote(layoutPresets[0]!, colorSchemes[0]!),
    [],
  );
  const [currentNote, setCurrentNote] = useState<ServerNote>(template);
  const [savedNotes, setSavedNotes] = useState<ServerNote[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_NOTES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ServerNote[];
        setSavedNotes(parsed);
      }
    } catch (error) {
      console.warn("Failed to read server notes", error);
    }
    try {
      const settingsRaw = localStorage.getItem(SETTINGS_KEY);
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        setCurrentNote((prev) => ({
          ...prev,
          companyName: settings.companyName || prev.companyName,
          outletName: settings.outletName || prev.outletName,
          logos: settings.logos || prev.logos,
        }));
      }
    } catch (error) {
      console.warn("Failed to read server notes settings", error);
    }
  }, [template]);

  useEffect(() => {
    localStorage.setItem(SAVED_NOTES_KEY, JSON.stringify(savedNotes));
  }, [savedNotes]);

  const handleUpdate = (patch: Partial<ServerNote>) => {
    setCurrentNote((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRecipesChange = (recipesSelection: ServerNoteRecipe[]) => {
    const normalized = recipesSelection.map((item, index) => ({
      ...item,
      order: index,
    }));
    setCurrentNote((prev) => ({
      ...prev,
      selectedRecipes: normalized,
      updatedAt: new Date().toISOString(),
    }));
  };

  const persistSettings = (note: ServerNote) => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        companyName: note.companyName,
        outletName: note.outletName,
        logos: note.logos,
      }),
    );
  };

  const createNewNote = () => {
    const next = createEmptyServerNote(
      currentNote.layout,
      currentNote.colorScheme,
    );
    next.companyName = currentNote.companyName;
    next.outletName = currentNote.outletName;
    next.logos = [...currentNote.logos];
    setCurrentNote(next);
  };

  const saveNote = (note: ServerNote) => {
    const withId = note.id ? note : { ...note, id: `note-${Date.now()}` };
    const noteWithTimestamp = {
      ...withId,
      updatedAt: new Date().toISOString(),
    };
    setSavedNotes((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === noteWithTimestamp.id,
      );
      if (existingIndex === -1) {
        return [noteWithTimestamp, ...prev];
      }
      const copy = [...prev];
      copy[existingIndex] = noteWithTimestamp;
      return copy;
    });
    setCurrentNote(noteWithTimestamp);
    persistSettings(noteWithTimestamp);
  };

  const loadSavedNote = (note: ServerNote) => {
    setCurrentNote(note);
    persistSettings(note);
    toast({
      title: "Loaded",
      description: `"${note.title || "Untitled"}" ready for editing.`,
    });
  };

  const deleteNote = (noteId: string) => {
    setSavedNotes((prev) => prev.filter((note) => note.id !== noteId));
    toast({ title: "Deleted", description: "Server notes removed." });
  };

  useEffect(() => {
    persistSettings(currentNote);
  }, [currentNote.companyName, currentNote.outletName, currentNote.logos]);

  const sortedSelected = useMemo(
    () =>
      [...currentNote.selectedRecipes].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [currentNote.selectedRecipes],
  );

  const panelSurfaceClass =
    "overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-shadow dark:border-cyan-500/20 dark:bg-slate-950/70 dark:shadow-[0_0_70px_rgba(56,189,248,0.35)]";
  const languageLabel = useMemo(
    () => languageOptions.find((option) => option.code === language)?.label || language,
    [language, languageOptions],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">Server Notes</h1>
                <p className="text-sm text-muted-foreground">
                  Connect recipes, layouts, and service notes into shareable
                  documents.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={createNewNote} className="gap-2">
              <Plus className="h-4 w-4" /> New Document
            </Button>
          </header>

          <div className={`${panelSurfaceClass} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Guided helper
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                  Walk me through creating a document
                </h2>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.25em]"
              >
                Follow the steps
              </Badge>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {WALKTHROUGH_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-colors dark:border-cyan-500/30 dark:bg-slate-950/60"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm dark:border-cyan-500/40 dark:bg-slate-900 dark:text-cyan-200">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{step.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <section className="grid items-stretch gap-6 lg:grid-cols-12">
            <Card
              className={`${panelSurfaceClass} flex h-full flex-col lg:col-span-4 xl:col-span-4`}
            >
              <CardHeader className="space-y-2 border-b border-white/70 px-6 py-5 dark:border-cyan-500/25">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
                >
                  Step 1
                </Badge>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 px-6 pb-6 pt-4 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto">
                <ServerNotesConfig
                  config={currentNote}
                  onUpdate={handleUpdate}
                />
              </CardContent>
            </Card>

            <Card
              className={`${panelSurfaceClass} flex h-full flex-col lg:col-span-4 xl:col-span-4`}
            >
              <CardHeader className="space-y-2 border-b border-white/70 px-6 py-5 dark:border-cyan-500/25">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
                >
                  Step 2
                </Badge>
                <CardTitle className="text-base">Recipe Selection</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 px-6 pb-6 pt-4 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto">
                <RecipeSelection
                  availableRecipes={recipes}
                  selectedRecipes={sortedSelected}
                  onRecipesChange={handleRecipesChange}
                />
              </CardContent>
            </Card>

            <Card
              className={`${panelSurfaceClass} flex h-full flex-col lg:col-span-4 xl:col-span-4`}
            >
              <CardHeader className="space-y-2 border-b border-white/70 px-6 py-5 dark:border-cyan-500/25">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
                >
                  Step 3
                </Badge>
                <CardTitle className="text-base">Preview & Generate</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4 px-6 pb-6 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    <span>Language</span>
                    <Select
                      value={language}
                      onValueChange={(value) => setLanguage(value as LanguageCode)}
                    >
                      <SelectTrigger className="h-8 w-[160px] text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.flag} {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <AllergyMatrixDialog
                    recipes={sortedSelected}
                    language={language}
                    languageOptions={languageOptions}
                  />
                </div>
                <ServerNotesPreview
                  layout={currentNote.layout}
                  color={currentNote.colorScheme}
                  pageFormat={currentNote.pageFormat}
                  variant="mini"
                />
                <ServerNotesGenerator
                  serverNote={currentNote}
                  onSave={saveNote}
                  language={language}
                  languageName={languageLabel}
                />
                <CooksRecipeBookGenerator
                  recipes={sortedSelected}
                  language={language}
                  onLanguageChange={(code) => setLanguage(code as LanguageCode)}
                  languageOptions={languageOptions}
                  note={currentNote}
                />
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <History className="h-4 w-4" />
              <span className="text-sm font-medium text-foreground">
                Saved Documents
              </span>
              {savedNotes.length > 0 && (
                <Badge variant="secondary">{savedNotes.length}</Badge>
              )}
            </div>
            <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
              {savedNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`${panelSurfaceClass} flex h-full flex-col hover:shadow-[0_38px_110px_-60px_rgba(15,23,42,0.45)]`}
                >
                  <CardHeader className="border-b border-white/70 px-6 py-4 dark:border-cyan-500/25">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="line-clamp-1">
                        {note.title || "Untitled"}
                      </span>
                      <Badge variant="outline">
                        {note.selectedRecipes.length} recipes
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between space-y-4 px-6 pb-6 pt-4 text-sm">
                    <div className="space-y-1 text-muted-foreground">
                      <div>
                        <strong>Company:</strong> {note.companyName || "—"}
                      </div>
                      {note.outletName && (
                        <div>
                          <strong>Outlet:</strong> {note.outletName}
                        </div>
                      )}
                      <div>
                        <strong>Distribution:</strong>{" "}
                        {new Date(note.distributionDate).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Layout:</strong> {note.layout.name}
                      </div>
                      <div>
                        <strong>Updated:</strong>{" "}
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => loadSavedNote(note)}
                      >
                        Load & Edit
                      </Button>
                      {note.docxDataUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = note.docxDataUrl!;
                            link.download = `${note.title || "server-notes"}.docx`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Download
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {savedNotes.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-white/70 bg-white/40 py-12 text-center text-sm text-muted-foreground shadow-inner backdrop-blur-sm dark:border-cyan-500/25 dark:bg-slate-950/40">
                  No saved documents yet. Generate and save a briefing to build
                  your library.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
