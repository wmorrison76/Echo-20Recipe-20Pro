import "./global.css";
import React, { Suspense, lazy } from "react";
import "./add-recipe.styles.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Lazy load route components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const RecipeEditor = lazy(() => import("./pages/RecipeEditor"));
const RecipeTemplate = lazy(() => import("./pages/RecipeTemplate"));
const Login = lazy(() => import("./pages/Login"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));

const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
    }}
  >
    <div>Loading...</div>
  </div>
);
import { AppDataProvider } from "@/context/AppDataContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { YieldProvider } from "@/context/YieldContext";
import { CollaborationProvider } from "@/context/CollaborationContext";
import { FuzzySuggestionManager } from "@/components/FuzzySuggestionManager";
import { KeyboardShortcutsProvider } from "@/context/KeyboardShortcutsContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.error)
      return (
        <div role="alert" style={{ padding: 16 }}>
          Something went wrong. Please refresh.
        </div>
      );
    return this.props.children as any;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageProvider>
          <AppDataProvider>
            <FuzzySuggestionManager />
            <YieldProvider>
              <CollaborationProvider>
                <AuthProvider>
                  <KeyboardShortcutsProvider>
                    <BrowserRouter>
                      <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route
                            path="/password-reset"
                            element={<PasswordReset />}
                          />
                          <Route
                            path="/"
                            element={
                              <ProtectedRoute>
                                <Index />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/recipe/:id"
                            element={
                              <ProtectedRoute>
                                <RecipeEditor />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/recipe/:id/view"
                            element={
                              <ProtectedRoute>
                                <RecipeTemplate />
                              </ProtectedRoute>
                            }
                          />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </KeyboardShortcutsProvider>
                </AuthProvider>
              </CollaborationProvider>
            </YieldProvider>
          </AppDataProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

const container = document.getElementById("root")!;
const prevRoot = (window as any).__app_root;
if (prevRoot && typeof prevRoot.render === "function") {
  prevRoot.render(<App />);
} else {
  const root = createRoot(container);
  (window as any).__app_root = root;
  root.render(<App />);
}
// HMR safety: unmount previous root on module dispose to prevent duplicate portal containers
if (import.meta && (import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    const r = (window as any).__app_root;
    try {
      r?.unmount?.();
    } catch {}
    (window as any).__app_root = null;
  });
}
