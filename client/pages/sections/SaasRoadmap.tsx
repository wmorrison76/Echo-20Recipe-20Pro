import InventorySuppliesWorkspace from "./saas/InventorySuppliesWorkspace";
import NutritionAllergensWorkspace from "./saas/NutritionAllergensWorkspace";
import HaccpComplianceWorkspace from "./saas/HaccpComplianceWorkspace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roadmapSections = [
  {
    slug: "orgs",
    label: "Multi‑tenant Orgs/SSO",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>Organizations with roles (Owner, Admin, Editor, Viewer)</li>
          <li>Invite by email, role-based access control, audit trail</li>
          <li>SSO via OAuth2/OIDC (Google, Microsoft, Okta)</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>
            Use Supabase Auth or Auth.js; RBAC tables (orgs, memberships, roles)
          </li>
          <li>Row-level security by org_id on all records</li>
          <li>Sentry for security/event logging</li>
        </ul>
      </div>
    ),
  },
  {
    slug: "workspaces",
    label: "Team Workspaces / Sync",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>Shared collections, real-time presence, comments</li>
          <li>Cloud sync with optimistic updates and conflict resolution</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>Supabase Realtime or Convex for live sync</li>
          <li>Activity feed with per-entity history</li>
        </ul>
      </div>
    ),
  },
  {
    slug: "pricing",
    label: "Pricing/COGS/Menu",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>Ingredient costs, yield factors, recipe COGS</li>
          <li>Menu engineering (stars, plowhorses, etc.)</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>Normalized ingredients, suppliers, price history</li>
          <li>Dashboards with margin and price recommendations</li>
        </ul>
      </div>
    ),
  },
  {
    slug: "approvals",
    label: "Approvals/Versioning",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>Draft → Review → Approved workflow with comments</li>
          <li>Version snapshots, diffs, rollbacks</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>Immutable version table; reviewer assignments</li>
          <li>Notifications via email/Zapier</li>
        </ul>
      </div>
    ),
  },
  {
    slug: "api",
    label: "API/Webhooks/Zapier",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>Public REST/GraphQL, API keys per org</li>
          <li>Outgoing webhooks and Zapier actions</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>Rate limits, audit logs, HMAC signatures</li>
          <li>Docs portal with examples</li>
        </ul>
      </div>
    ),
  },
  {
    slug: "mobile",
    label: "Mobile/Offline",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>PWA with home-screen install</li>
          <li>Offline edits and background sync</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>Service worker, IndexedDB cache, conflict resolution</li>
          <li>Responsive pages for phones/tablets</li>
        </ul>
      </div>
    ),
  },
  {
    slug: "multi",
    label: "Multi-location",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>Sites/locations with overrides and rollouts</li>
          <li>Centralized content with local variations</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>Inheritance model by location_id</li>
          <li>Release waves and publish windows</li>
        </ul>
      </div>
    ),
  },
  {
    slug: "billing",
    label: "Billing/Subscriptions",
    body: (
      <div className="space-y-2 text-sm">
        <p className="font-medium">What it includes</p>
        <ul className="list-disc pl-5">
          <li>Plans, seats, meter-based usage, invoices</li>
          <li>Trials, coupons, dunning and proration</li>
        </ul>
        <p className="font-medium">Implementation notes</p>
        <ul className="list-disc pl-5">
          <li>Stripe Billing + Customer Portal</li>
          <li>Org-scoped entitlements checked server-side</li>
        </ul>
      </div>
    ),
  },
];

export default function SaasRoadmapSection() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-4">
      <div className="rounded-xl border bg-white/95 p-3 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-sky-500/15">
        <div className="text-sm text-muted-foreground">LUCCCA SaaS Roadmap</div>
        <div className="text-base font-semibold">Capabilities</div>
      </div>

      <div className="rounded-xl border bg-white/95 p-4 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-sky-500/15">
        <div className="mb-4 space-y-1">
          <div className="text-sm font-semibold">Operational suites</div>
          <p className="text-xs text-muted-foreground">
            These modules are fully coded and wired into the production
            experience.
          </p>
        </div>
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            <TabsTrigger value="inventory" className="text-xs">
              Inventory &amp; Supplies
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="text-xs">
              Nutrition/Allergens
            </TabsTrigger>
            <TabsTrigger value="haccp" className="text-xs">
              HACCP/Compliance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inventory" className="mt-4">
            <InventorySuppliesWorkspace />
          </TabsContent>
          <TabsContent value="nutrition" className="mt-4">
            <NutritionAllergensWorkspace />
          </TabsContent>
          <TabsContent value="haccp" className="mt-4">
            <HaccpComplianceWorkspace />
          </TabsContent>
        </Tabs>
      </div>

      {roadmapSections.length ? (
        <div className="rounded-xl border bg-white/95 p-4 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-sky-500/15">
          <div className="mb-4 space-y-1">
            <div className="text-sm font-semibold">Remaining roadmap</div>
            <p className="text-xs text-muted-foreground">
              High-level milestones that remain in discovery or backlog
              planning.
            </p>
          </div>
          <Tabs defaultValue={roadmapSections[0].slug} className="w-full">
            <TabsList className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
              {roadmapSections.map((section) => (
                <TabsTrigger
                  key={section.slug}
                  value={section.slug}
                  className="text-xs"
                >
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {roadmapSections.map((section) => (
              <TabsContent
                key={section.slug}
                value={section.slug}
                className="mt-3"
              >
                <div className="rounded-xl border bg-white/95 p-4 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-sky-500/15">
                  {section.body}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}
