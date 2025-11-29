import "./global.css";
import "./add-recipe.styles.css";

// Load global polyfills first, before any other code runs
import { polyfillsLoaded } from "@/lib/global-polyfills";
if (!polyfillsLoaded) {
  throw new Error("Failed to load global polyfills");
}

// Install fetch interceptor to handle CORS and API errors gracefully
import { installFetchInterceptor } from "@/lib/fetch-interceptor";
installFetchInterceptor();

// Install global object URL wrapper to use LRU cache for all blob operations
import { installGlobalObjectURLWrapper } from "@/lib/global-object-url-wrapper";
installGlobalObjectURLWrapper();

// Install global error handlers for unhandled errors and rejections
import { installGlobalErrorHandlers } from "@/lib/error-handlers";
installGlobalErrorHandlers();

import React, { Suspense, lazy } from "react";
import * as Sentry from "@sentry/react";
import { Replay } from "@sentry/replay";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { AppDataProvider } from "@/context/AppDataContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { YieldProvider } from "@/context/YieldContext";
import { CollaborationProvider } from "@/context/CollaborationContext";
import { FuzzySuggestionManager } from "@/components/FuzzySuggestionManager";
import { KeyboardShortcutsProvider } from "@/context/KeyboardShortcutsContext";
import { AuthProvider } from "@/context/AuthContext";
import { CrawlerProvider } from "@/context/CrawlerContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Initialize Sentry for error tracking
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      new Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: parseFloat(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "0.1",
    ),
    replaysSessionSampleRate: parseFloat(
      import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "0.1",
    ),
    replaysOnErrorSampleRate: parseFloat(
      import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || "1.0",
    ),
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    sendDefaultPii: true,
    enabled:
      import.meta.env.PROD ||
      import.meta.env.VITE_ENABLE_ERROR_REPORTING === "true",
  });
}

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

const ErrorFallback = ({ error }: { error: Error }) => (
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
    <h2 style={{ marginTop: 0 }}>Failed to load page</h2>
    <p>There was an error loading this page. Please try refreshing.</p>
    <details
      style={{ marginTop: 12, whiteSpace: "pre-wrap", fontSize: "12px" }}
    >
      <summary>Error details</summary>
      {error?.message || String(error)}
    </details>
    <button
      onClick={() => window.location.reload()}
      style={{
        marginTop: 12,
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

// Lazy load route components to reduce initial bundle size
const lazyWithErrorBoundary = (
  loader: () => Promise<{ default: React.ComponentType<any> }>,
) => {
  return lazy(() =>
    loader().catch((err) => {
      console.error("Failed to load module:", err);
      return {
        default: () => (
          <ErrorFallback
            error={err instanceof Error ? err : new Error(String(err))}
          />
        ),
      };
    }),
  );
};

const Index = lazyWithErrorBoundary(() => import("./pages/Index"));
const RecipeEditor = lazyWithErrorBoundary(
  () => import("./pages/RecipeEditor"),
);
const RecipeTemplate = lazyWithErrorBoundary(
  () => import("./pages/RecipeTemplate"),
);
const TabletSetup = lazyWithErrorBoundary(
  () => import("./pages/sections/TabletSetup"),
);
const TabletLabels = lazyWithErrorBoundary(
  () => import("./pages/sections/TabletLabels"),
);
const TabletAdminDashboard = lazyWithErrorBoundary(
  () => import("./pages/sections/TabletAdminDashboard"),
);
const TabletWasteTracking = lazyWithErrorBoundary(
  () => import("./pages/sections/TabletWasteTracking"),
);
const TabletInventoryTransfer = lazyWithErrorBoundary(
  () => import("./pages/sections/TabletInventoryTransfer"),
);
const Login = lazyWithErrorBoundary(() => import("./pages/Login"));
const PasswordReset = lazyWithErrorBoundary(
  () => import("./pages/PasswordReset"),
);

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
          <p>
            We've reported this error to our team. Please try refreshing the
            page.
          </p>
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
        <AuthProvider>
          <LanguageProvider>
            <AppDataProvider>
              <CrawlerProvider>
                <FuzzySuggestionManager />
                <YieldProvider>
                  <CollaborationProvider>
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
                            <Route
                              path="/tablet/setup"
                              element={<TabletSetup />}
                            />
                            <Route
                              path="/tablet/labels"
                              element={<TabletLabels />}
                            />
                            <Route
                              path="/tablet/waste"
                              element={<TabletWasteTracking />}
                            />
                            <Route
                              path="/tablet/transfers"
                              element={<TabletInventoryTransfer />}
                            />
                            <Route
                              path="/tablet/admin"
                              element={
                                <ProtectedRoute>
                                  <TabletAdminDashboard />
                                </ProtectedRoute>
                              }
                            />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </BrowserRouter>
                    </KeyboardShortcutsProvider>
                  </CollaborationProvider>
                </YieldProvider>
              </CrawlerProvider>
            </AppDataProvider>
          </LanguageProvider>
        </AuthProvider>
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
