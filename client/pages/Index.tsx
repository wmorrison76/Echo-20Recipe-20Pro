import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecipeSearchSection from "./sections/RecipeSearch";
import RecipeInputSection from "./sections/RecipeInput";
import GallerySection from "./sections/Gallery";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary" />
            <span className="font-semibold tracking-tight">Recipe Studio</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto py-6">
        <Tabs defaultValue="search" className="w-full">
          <TabsList>
            <TabsTrigger value="search">Recipe Search</TabsTrigger>
            <TabsTrigger value="input">Recipe Input</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            <RecipeSearchSection />
          </TabsContent>
          <TabsContent value="input">
            <RecipeInputSection />
          </TabsContent>
          <TabsContent value="gallery">
            <GallerySection />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-6 text-xs text-muted-foreground">
          Built with love • Light & Dark mode • Drag-and-drop 50+ recipes
        </div>
      </footer>
    </div>
  );
}
