import RecipeSearchSection from "./sections/RecipeSearch";
import GallerySection from "./sections/Gallery";
import AddRecipeSection from "./sections/AddRecipe";
import SaasRoadmapSection from "./sections/SaasRoadmap";
import { EchoTrainingCenter } from "@/components/panels/EchoTrainingCenter";
import InventorySuppliesWorkspace from "./sections/saas/InventorySuppliesWorkspace";
import InventoryTransfersWorkspace from "./sections/saas/InventoryTransfersWorkspace";
import NutritionAllergensWorkspace from "./sections/saas/NutritionAllergensWorkspace";
import HaccpComplianceWorkspace from "./sections/saas/HaccpComplianceWorkspace";
import WasteTrackingWorkspace from "./sections/saas/WasteTrackingWorkspace";
import CustomerServiceWorkspace from "./sections/saas/CustomerServiceWorkspace";
import PlateCostingWorkspace from "./sections/saas/PlateCostingWorkspace";
import SupplierManagementWorkspace from "./sections/saas/SupplierManagementWorkspace";
import MultiTenantOrgsWorkspace from "./sections/saas/MultiTenantOrgsWorkspace";
import TeamWorkspacesWorkspace from "./sections/saas/TeamWorkspacesWorkspace";
import APIWebhooksWorkspace from "./sections/saas/APIWebhooksWorkspace";
import MobileOfflineWorkspace from "./sections/saas/MobileOfflineWorkspace";
import MultiLocationWorkspace from "./sections/saas/MultiLocationWorkspace";
import BillingSubscriptionsWorkspace from "./sections/saas/BillingSubscriptionsWorkspace";
import RecipeDeploymentPanel from "@/components/RecipeDeploymentPanel";
import ServerNotesSection from "./sections/server-notes";
import OperationsDocsSection from "./sections/operations-docs";
import DishAssemblySection from "./sections/dish-assembly";
import MenuDesignStudioWrapper from "@/components/MenuDesignStudio/MenuDesignStudioWrapper";

const MenuDesignStudioSection = MenuDesignStudioWrapper;
import ProductionSection from "./sections/Production";
import PurchasingReceivingSection from "./sections/purchasing-receiving";
import TopTabs from "@/components/TopTabs";
import SubtleBottomGlow from "@/components/SubtleBottomGlow";
import TronBackdrop from "@/components/TronBackdrop";
import CornerBrand from "@/components/CornerBrand";
import { EchoRecipeProHelpModal } from "@/components/EchoRecipeProHelpModal";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  PageToolbarProvider,
  usePageToolbar,
} from "@/context/PageToolbarContext";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { useRegisterShortcut } from "@/context/KeyboardShortcutsContext";
import { HelpCircle } from "lucide-react";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";
import EchoFloatingButton from "@/components/EchoFloatingButton";

export default function Index() {
  return (
    <PageToolbarProvider>
      <IndexContent />
    </PageToolbarProvider>
  );
}

function IndexContent() {
  const [params, setParams] = useSearchParams();
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const active = params.get("tab") || "search";
  const {
    config: { items: toolbarItems, title: toolbarTitle },
  } = usePageToolbar();
  const toolbarTransition = {
    duration: 0.375,
    ease: [0.4, 0, 0.2, 1],
  } as const;

  const handleAddRecipeShortcut = useCallback(() => {
    setParams({ tab: "add-recipe" }, { replace: true });
  }, [setParams]);

  const shortcutConfig = useMemo(
    () => ({
      key: "n",
      meta: true,
      handler: handleAddRecipeShortcut,
      preventDefault: true,
    }),
    [handleAddRecipeShortcut],
  );

  useRegisterShortcut("add-recipe-shortcut", shortcutConfig);

  const handleTabChange = useCallback(
    (v: string) => {
      setParams({ tab: v }, { replace: true });
    },
    [setParams],
  );

  return (
    <TronBackdrop>
      <CommandPalette />
      <EchoFloatingButton />
      <div
        className="relative min-h-screen text-foreground flex flex-col"
        style={{
          paddingLeft: "calc(var(--sidebar-offset, 88px) - 0.35rem)",
        }}
      >
        <TopTabs />
        <header className="flex flex-wrap items-center justify-between gap-3 pr-3 pt-3 pb-1.5 pl-2 sm:flex-nowrap sm:pl-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-xs font-semibold uppercase tracking-[0.35em] text-slate-700 shadow-sm backdrop-blur-sm dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200">
              ER
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-[0.65em] text-slate-700 dark:text-cyan-200">
                Echo Recipe Pro
              </span>
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-cyan-300/70">
                Research & Development Suite
              </span>
              {toolbarTitle ? (
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500/80 dark:text-cyan-300/70">
                  {toolbarTitle}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 sm:flex-nowrap">
            <AnimatePresence mode="sync">
              {toolbarItems.length ? (
                <motion.div
                  key="toolbar"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0, transition: toolbarTransition }}
                  exit={{ opacity: 0, y: -12, transition: toolbarTransition }}
                  className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap"
                >
                  {toolbarItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: {
                          ...toolbarTransition,
                          delay: index * 0.04,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.88,
                        transition: toolbarTransition,
                      }}
                    >
                      {item.type === "custom" ? (
                        item.element
                      ) : (
                        <button
                          type="button"
                          onClick={item.onClick}
                          className={item.className}
                          aria-label={item.ariaLabel || item.label}
                          title={item.title || item.label}
                        >
                          {item.icon ? (
                            <item.icon className="h-4 w-4" aria-hidden />
                          ) : null}
                          <span className="sr-only">{item.label}</span>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHelpModalOpen(true)}
              className="gap-2"
              title="Open EchoRecipe Pro Help"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </Button>
          </div>
        </header>
        <main className="w-full flex-1 flex flex-col overflow-hidden">
          <Tabs
            value={active}
            onValueChange={handleTabChange}
            className="w-full flex flex-col"
          >
            <TabsContent value="search">
              <ErrorBoundaryWrapper section="Recipe Search">
                <RecipeSearchSection />
              </ErrorBoundaryWrapper>
            </TabsContent>
            <TabsContent value="gallery">
              <ErrorBoundaryWrapper section="Gallery">
                <GallerySection />
              </ErrorBoundaryWrapper>
            </TabsContent>
            <TabsContent value="add-recipe">
              <ErrorBoundaryWrapper section="Add Recipe">
                <AddRecipeSection />
              </ErrorBoundaryWrapper>
            </TabsContent>
            <TabsContent value="saas">
              <SaasRoadmapSection />
            </TabsContent>
            <TabsContent value="inventory">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <InventorySuppliesWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="inventory-transfers">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <InventoryTransfersWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="nutrition">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <NutritionAllergensWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="haccp">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <HaccpComplianceWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="waste-tracking">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <WasteTrackingWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="customer-service">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <CustomerServiceWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="plate-costing">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <PlateCostingWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="suppliers">
              <div className="container mx-auto space-y-3 px-3 py-3">
                <SupplierManagementWorkspace />
              </div>
            </TabsContent>
            <TabsContent value="orgs">
              <MultiTenantOrgsWorkspace />
            </TabsContent>
            <TabsContent value="workspaces">
              <TeamWorkspacesWorkspace />
            </TabsContent>
            <TabsContent value="api-webhooks">
              <APIWebhooksWorkspace />
            </TabsContent>
            <TabsContent value="mobile-offline">
              <MobileOfflineWorkspace />
            </TabsContent>
            <TabsContent value="multi-location">
              <MultiLocationWorkspace />
            </TabsContent>
            <TabsContent value="billing">
              <BillingSubscriptionsWorkspace />
            </TabsContent>
            <TabsContent value="recipe-deployments">
              <RecipeDeploymentPanel isEnabled={true} />
            </TabsContent>
            <TabsContent value="dish-assembly">
              <DishAssemblySection />
            </TabsContent>
            <TabsContent value="menu-design">
              <MenuDesignStudioSection />
            </TabsContent>
            <TabsContent value="server-notes">
              <ServerNotesSection />
            </TabsContent>
            <TabsContent value="operations-docs">
              <OperationsDocsSection />
            </TabsContent>
            <TabsContent value="production">
              <ProductionSection />
            </TabsContent>
            <TabsContent value="purch-rec">
              <PurchasingReceivingSection />
            </TabsContent>
            <TabsContent
              value="echo-training"
              className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="mx-auto w-full max-w-[1400px] space-y-3 px-4 py-3 sm:px-6 lg:px-8">
                <ErrorBoundaryWrapper section="Echo Training">
                  <EchoTrainingCenter />
                </ErrorBoundaryWrapper>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <SubtleBottomGlow />
        <CornerBrand />
      </div>
      <EchoRecipeProHelpModal
        isOpen={helpModalOpen}
        onOpenChange={setHelpModalOpen}
      />
    </TronBackdrop>
  );
}
