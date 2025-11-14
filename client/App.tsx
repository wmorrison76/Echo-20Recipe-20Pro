import "./global.css";
import React, { Suspense, lazy } from "react";
import "./add-recipe.styles.css";
import * as Sentry from "@sentry/react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Initialize Sentry for error tracking
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://d4120668c0cafd04be9de8c62183794c@o4510361278611456.ingest.us.sentry.io/4510361279856640",
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    sendDefaultPii: true,
  });
}

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
  { error: any; hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App error:", error, errorInfo);

    // Send error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }
  render() {
    if (this.state.hasError)
      return (
        <div
          role="alert"
          style={{
            padding: 16,
            margin: 16,
            border: "1px solid #ff6b6b",
            borderRadius: 8,
            backgroundColor: "#ffe0e0",
            color: "#c92a2a",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
          <p>We've reported this error to our team. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#c92a2a",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Refresh Page
          </button>
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
