import { useEffect, useMemo, useState } from "react";
import { ClipboardList, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/AppDataContext";
import ServerNotesPreview from "@/components/ServerNotesPreview";
import { ServerNotesConfig } from "@/components/ServerNotesConfig";
import { RecipeSelection } from "@/components/RecipeSelection";
import { ServerNotesGenerator } from "@/components/ServerNotesGenerator";
import {
  createEmptyServerNote,
  layoutPresets,
  colorSchemes,
  type ServerNote,
  type ServerNoteRecipe,
} from "@shared/server-notes";

const SAVED_NOTES_KEY = "serverNotes:saved";
const SETTINGS_KEY = "serverNotes:settings";

export default function ServerNotesSection() {
  const { recipes } = useAppData();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
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

          <section className="grid gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-4 xl:col-span-4">
              <CardHeader className="space-y-1 px-5 py-4">
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-5 pb-5 pt-0 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto">
                <ServerNotesConfig
                  config={currentNote}
                  onUpdate={handleUpdate}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 xl:col-span-4">
              <CardHeader className="space-y-1 px-5 py-4">
                <CardTitle className="text-base">Recipe Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-5 pb-5 pt-0 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto">
                <RecipeSelection
                  availableRecipes={recipes}
                  selectedRecipes={sortedSelected}
                  onRecipesChange={handleRecipesChange}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 xl:col-span-4">
              <CardHeader className="space-y-1 px-5 py-4">
                <CardTitle className="text-base">Preview & Generate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-5 pb-5 pt-0">
                <ServerNotesPreview
                  layout={currentNote.layout}
                  color={currentNote.colorScheme}
                  pageFormat={currentNote.pageFormat}
                  variant="mini"
                />
                <ServerNotesGenerator
                  serverNote={currentNote}
                  onSave={saveNote}
                />
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Saved Documents</span>
              {savedNotes.length > 0 && (
                <Badge variant="secondary">{savedNotes.length}</Badge>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="line-clamp-1">
                        {note.title || "Untitled"}
                      </span>
                      <Badge variant="outline">
                        {note.selectedRecipes.length} recipes
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
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
                <div className="col-span-full rounded-lg border py-10 text-center text-sm text-muted-foreground">
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
