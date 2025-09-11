import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecipeSearchSection from "./sections/RecipeSearch";
import RecipeInputSection from "./sections/RecipeInput";
import GallerySection from "./sections/Gallery";
import AddRecipeSection from "./sections/AddRecipe";
import TopTabs from "@/components/TopTabs";
import { useSearchParams } from "react-router-dom";

export default function Index() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'search';
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopTabs />
      <main className="container mx-auto py-6">
        <Tabs value={active} onValueChange={(v)=>{ params.set('tab', v); setParams(params, { replace: true }); }} className="w-full">
          <TabsList>
            <TabsTrigger value="search">Recipe Search</TabsTrigger>
            <TabsTrigger value="input">Recipe Input</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="add-recipe">Add Recipe</TabsTrigger>
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
          <TabsContent value="add-recipe">
            <AddRecipeSection />
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
