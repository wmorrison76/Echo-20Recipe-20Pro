# Echo Recipe Pro - Panel Integration Guide
## For Builder.io Multi-Instance Deployment

This guide explains how to integrate Echo Recipe Pro as a lazy-loaded panel within another Builder.io instance.

---

## 📋 Overview

**What you're importing:**
- Full-featured recipe management system
- RBAC with 5+ roles and 25+ permissions
- Chef approval workflow with comments
- Inventory management with inter-outlet transfers
- Real-time costing engine
- Multi-outlet support

**Integration approach:**
- Register as a lazy-loaded panel/module
- Launch from sidebar navigation
- Share authentication context with main app
- Maintain isolation via dedicated routes

---

## 🏗️ Architecture

```
Main Builder.io App
├── Sidebar Navigation
│   └── "Echo Menu Studio" (new item)
│       └── Lazy Load: EchoRecipePro Panel
├── Layout Context (shared)
├── Auth Context (shared)
└── App Providers
    ├── QueryClient
    ├── TooltipProvider
    ├── Toast/Notification handlers
    └── Theme provider
```

---

## 📦 Step 1: Extract Core Files

The following files/folders are essential for panel integration:

```
/src (or /client)
├── pages/
│   ├── Index.tsx              ← Main panel component
│   ├── RecipeEditor.tsx
│   ├── RecipeTemplate.tsx
│   └── sections/              ← All sub-modules
│       ├── RecipeSearch.tsx
│       ├── AddRecipe.tsx
│       ├── Gallery.tsx
│       ├── EchoMenuStudio.tsx
│       ├── Production.tsx
│       ├── dish-assembly/
│       ├── saas/
│       ├── server-notes/
│       ├── operations-docs/
│       └── purchasing-receiving/
├── components/
│   ├── TopTabs.tsx            ← Navigation within panel
│   ├── TronBackdrop.tsx
│   ├── ui/                    ← Shadcn UI components
│   └── [all other components]
├── context/
│   ├── AuthContext.tsx        ← Share this with main app
│   ├── AppDataContext.tsx
│   ├── PageToolbarContext.tsx
│   └── [other contexts]
├── lib/
│   ├── auth-service.ts
│   ├── approval-workflow.ts
│   ├── inventory-utils.ts
│   └── [all utilities]
├── hooks/
│   └── [all custom hooks]
└── data/
    └── [mock data]

/server
├── index.ts                   ← API endpoints
├── routes/
│   ├── recipe.ts
│   ├── nutrition.ts
│   └── [other routes]
└── [database setup]

/shared
├── api.ts
├── recipes.ts
├── nutrition.ts
└── server-notes.ts
```

---

## 🛠️ Step 2: Create Panel Wrapper Component

Create a new wrapper component in your main Builder.io app:

**File: `src/components/EchoRecipeProPanel.tsx`**

```typescript
import React, { Suspense, lazy } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageToolbarProvider } from "@echo-recipe-pro/context/PageToolbarContext";

// Lazy load the main Echo Recipe Pro panel
const EchoRecipePanel = lazy(() => import("@echo-recipe-pro/pages/Index"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border border-slate-200 border-t-cyan-500 mx-auto mb-2"></div>
      <p className="text-sm text-slate-500">Loading Echo Recipe Pro...</p>
    </div>
  </div>
);

export function EchoRecipeProPanel() {
  return (
    <PageToolbarProvider>
      <div className="w-full h-full">
        <Suspense fallback={<LoadingFallback />}>
          <EchoRecipePanel />
        </Suspense>
      </div>
    </PageToolbarProvider>
  );
}
```

---

## 📌 Step 3: Register in Sidebar Navigation

**File: `src/components/Sidebar.tsx` (or equivalent)**

Add to your sidebar navigation items:

```typescript
import { EchoRecipeProPanel } from "./EchoRecipeProPanel";

// In your sidebar/navigation configuration:
const navigationItems = [
  // ... existing items
  {
    id: "echo-menu-studio",
    label: "Echo Menu Studio",
    icon: "ChefHat", // or your preferred icon
    component: EchoRecipeProPanel,
    type: "panel",
    lazy: true,
    requiredRoles: ["admin", "chef"], // RBAC integration
  },
  // ... other items
];

// In your sidebar render:
{navigationItems.map((item) => (
  <button
    key={item.id}
    onClick={() => {
      if (item.lazy && item.component) {
        // Dynamically load panel
        setActivePanel(item.id);
        setPanelComponent(item.component);
      }
    }}
  >
    {item.label}
  </button>
))}
```

---

## 🔐 Step 4: Share Authentication Context

Ensure the main app's AuthContext is used by Echo Recipe Pro:

**In your main app's `App.tsx`:**

```typescript
import { AuthProvider } from "@echo-recipe-pro/context/AuthContext";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            {/* Your main layout with sidebar */}
            <MainLayout>
              {/* Panel content loads here */}
            </MainLayout>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

## 🔗 Step 5: API Configuration

Echo Recipe Pro needs a backend API connection. Set environment variables:

**`.env` file:**

```bash
# Echo Recipe Pro API Configuration
VITE_ECHO_API_URL=http://localhost:3001  # Or your deployed server URL
VITE_ECHO_API_TIMEOUT=30000

# Database (if running server locally)
VITE_DATABASE_URL=postgresql://user:password@localhost:5432/echo_recipe_pro

# Authentication
VITE_AUTH_TOKEN_EXPIRY=3600
VITE_REFRESH_TOKEN_EXPIRY=604800

# Features
VITE_ENABLE_APPROVALS=true
VITE_ENABLE_INVENTORY=true
VITE_ENABLE_COSTING=true
```

---

## 📡 Step 6: Backend API Setup

The server needs to be running separately or integrated into your existing backend:

**Option A: Standalone Server**
```bash
# In the echo-recipe-pro directory
pnpm run build:server
pnpm start
# Runs on http://localhost:3001
```

**Option B: Express Integration**
If your main app uses Express, merge the routes:

```typescript
// In your main Express app (server/index.ts)
import recipeRoutes from "@echo-recipe-pro/server/routes/recipe";
import nutritionRoutes from "@echo-recipe-pro/server/routes/nutrition";
import approvalRoutes from "@echo-recipe-pro/server/routes/approvals";
import inventoryRoutes from "@echo-recipe-pro/server/routes/inventory";

// Register routes
app.use("/api/recipes", recipeRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/inventory", inventoryRoutes);
```

---

## 🗄️ Step 7: Database Setup

Echo Recipe Pro requires these tables. Run migrations:

**Core Tables:**
- `recipes` - Recipe definitions
- `recipe_versions` - Recipe history
- `ingredients` - Ingredient master list
- `recipe_ingredients` - Recipe composition
- `users` - User management
- `user_roles` - RBAC assignments
- `outlets` - Multi-outlet support
- `approval_workflows` - Chef approvals
- `approval_steps` - Approval stages
- `inventory_items` - Inventory tracking
- `inventory_transfers` - Inter-outlet transfers
- `nutrition_facts` - Nutritional data
- `audit_logs` - Compliance tracking

**Migration Command:**
```bash
# If using Supabase/PostgreSQL
psql -U postgres -d echo_recipe_pro -f migrations/001_init_schema.sql

# Or with migration tools
npm run migrate:up
```

---

## 🎛️ Step 8: Lazy Loading Configuration

Ensure dynamic imports are properly configured in your bundler:

**`vite.config.ts`:**

```typescript
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@radix-ui/react-tabs",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate chunk for Echo Recipe Pro
          "echo-recipe-pro": [
            "src/components/EchoRecipeProPanel",
            "src/pages/Index",
          ],
        },
      },
    },
  },
});
```

---

## ✅ Step 9: Verify Integration

**Checklist before going live:**

- [ ] Panel loads without errors
- [ ] Sidebar navigation triggers lazy loading
- [ ] Authentication context is shared
- [ ] API endpoints are accessible
- [ ] Database connection is active
- [ ] All RBAC roles are properly configured
- [ ] Approval workflow functions
- [ ] Inventory system responds
- [ ] Notifications (toast/sonner) work
- [ ] File exports (PDF, Excel) function
- [ ] Theme/dark mode persists across panels
- [ ] Keyboard shortcuts work (Cmd+N for new recipe)

---

## 🚀 Performance Optimization Tips

1. **Chunk splitting**: Keep Echo Recipe Pro in separate chunks
2. **Route-based code splitting**: Lazy load sub-sections only when accessed
3. **Asset optimization**: Pre-load common assets (icons, fonts)
4. **Cache strategy**: Use React Query for smart API caching
5. **Bundle size monitoring**: Track growth with `vite-plugin-visualizer`

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Panel doesn't load | Check VITE_ECHO_API_URL in .env |
| Auth fails | Ensure AuthProvider wraps the panel |
| Database connection error | Verify DATABASE_URL and schema exists |
| Styles not applying | Check Tailwind CSS in main app config |
| API 404 errors | Verify server routes are registered |
| Slow loading | Enable code splitting, check Network tab |

---

## 📚 Additional Documentation

Refer to these files in the project for deeper understanding:

- `AUTH_INTEGRATION.md` - Authentication flow details
- `RECIPE_ACCESS_CONTROL.md` - RBAC permission matrix
- `CHEF_APPROVAL_WORKFLOW.md` - Approval system setup
- `PRODUCTION_DEPLOYMENT.md` - Deployment strategies
- `SYSTEM_INTEGRATION_TESTING.md` - Complete test suite

---

## 💬 Support

For integration questions or issues, reference:
- Project repository structure
- API endpoint documentation in `server/routes/*.ts`
- Context providers in `client/context/`
- Type definitions in `client/types/`
