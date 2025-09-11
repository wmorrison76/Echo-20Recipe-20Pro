import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecipeSearchSection from "./sections/RecipeSearch";
import RecipeInputSection from "./sections/RecipeInput";
import GallerySection from "./sections/Gallery";
import AddRecipeSection from "./sections/AddRecipe";
import TopTabs from "@/components/TopTabs";
import SubtleBottomGlow from "@/components/SubtleBottomGlow";
import { useSearchParams } from "react-router-dom";

export default function Index() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'search';
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopTabs />
      <main className="w-full py-4">
        <Tabs value={active} onValueChange={(v)=>{ params.set('tab', v); setParams(params, { replace: true }); }} className="w-full">
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

      <SubtleBottomGlow />
    </div>
  );
}
