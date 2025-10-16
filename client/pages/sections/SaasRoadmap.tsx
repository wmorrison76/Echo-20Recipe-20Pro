import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/context/LanguageContext";

const suiteLinks = [
  {
    value: "inventory",
    label: "Inventory & Supplies",
    description:
      "Supplier catalogs, stock health, purchase orders, and conversions in one workspace.",
  },
  {
    value: "nutrition",
    label: "Nutrition/Allergens",
    description:
      "Track dietary flags, allergen callouts, menu compliance, and guest-facing disclosures.",
  },
  {
    value: "haccp",
    label: "HACCP/Compliance",
    description:
      "Smart logs, checklists, and automated monitoring for HACCP plans and food safety audits.",
  },
];

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
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-100/80 p-3 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">
          <p className="font-semibold">Pricing intelligence is live</p>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-100/80">
            Ingredient costs, yield factors, recipe COGS, and menu engineering views are wired into the Recipe Search and Menu Collection workflows.
          </p>
        </div>
        <div>
          <p className="font-medium">Shipped highlights</p>
          <ul className="list-disc pl-5">
            <li>Normalized ingredient catalog with supplier price history and automatic yield adjustments.</li>
            <li>Recipe cards surface contribution margin with menu engineering quadrants (stars, plowhorses, puzzles, dogs).</li>
            <li>Dashboard widgets surface margin alerts and pricing recommendations.</li>
          </ul>
        </div>
        <div className="rounded-lg border bg-muted/40 p-3 dark:bg-zinc-800/60">
          <p className="font-medium">Next iteration</p>
          <ul className="list-disc pl-5">
            <li>Outlet-specific overrides for costs and target margins.</li>
            <li>Automated buying recommendations tied to vendor delivery calendars.</li>
          </ul>
        </div>
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
  const { t } = useTranslation();
  return (
    <div className="container mx-auto space-y-6 px-4 py-4">
      <div className="rounded-xl border bg-white/95 p-3 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-sky-500/15">
        <div className="text-sm text-muted-foreground">LUCCCA SaaS Roadmap</div>
        <div className="text-base font-semibold">{t("menu.capabilities")}</div>
      </div>

      <div className="rounded-xl border bg-white/95 p-4 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-sky-500/15">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold">{t("menu.operationalSuites")}</div>
            <p className="text-xs text-muted-foreground">
              These modules are fully coded and wired into the production
              experience. Jump into any workspace below.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suiteLinks.map((suite) => (
              <Link
                key={suite.value}
                to={`/?tab=${suite.value}`}
                className="rounded-lg border bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-zinc-800/80"
              >
                <div className="text-sm font-semibold">{suite.label}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {suite.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
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
