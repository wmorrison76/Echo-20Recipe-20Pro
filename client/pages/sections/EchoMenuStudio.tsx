import { useMemo } from "react";
import type { Recipe, RecipeExport } from "@shared/recipes";
import recipes from "@/data/mockRecipes";
import {
  MENU_CATEGORIES,
  type MenuCategoryKey,
  resolveMenuCategoryKey,
  resolveMenuName,
  resolveMenuPrice,
} from "@/lib/menu-metadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrencyValue, parsePriceString } from "./dish-assembly/utils";
import { cn } from "@/lib/utils";

type CategoryKey = MenuCategoryKey | "signature";

type MenuLineItem = {
  id: string;
  name: string;
  description: string;
  cuisine: string | null;
  course: string | null;
  tags: string[];
  categoryKey: CategoryKey;
  currency: string;
  baseCost: number | null;
  recommendedPrice: number | null;
  margin: number | null;
  marginPct: number | null;
};

const PRICE_MULTIPLIER = 3.35;

const toCategoryLabel = (key: CategoryKey) => {
  if (key === "signature") {
    return "Chef Signatures";
  }
  const config = MENU_CATEGORIES.find((entry) => entry.key === key);
  if (config) {
    return config.label;
  }
  return key
    .split(/[-_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const buildMenuItems = (source: Recipe[]): MenuLineItem[] => {
  return source.map((recipe) => {
    const serverNotes = recipe.extra?.serverNotes as RecipeExport | undefined;
    const explicitPrice = resolveMenuPrice(recipe);
    const parsedExplicitPrice = explicitPrice ? parsePriceString(explicitPrice) : null;
    const baseCost = typeof serverNotes?.portionCost === "number" && Number.isFinite(serverNotes.portionCost)
      ? Number(serverNotes.portionCost)
      : null;
    const currency = serverNotes?.currency ?? "USD";
    const recommendedPrice = parsedExplicitPrice ?? (baseCost != null ? Number((baseCost * PRICE_MULTIPLIER).toFixed(2)) : null);
    const margin = recommendedPrice != null && baseCost != null
      ? Number((recommendedPrice - baseCost).toFixed(2))
      : null;
    const marginPct = margin != null && recommendedPrice
      ? Number((margin / recommendedPrice).toFixed(3))
      : null;
    const categoryKey: CategoryKey = resolveMenuCategoryKey(recipe) ?? "signature";

    const tags = Array.from(
      new Set(
        [
          ...(recipe.tags ?? []),
          ...(serverNotes?.modifiers?.prepMethod ?? []),
          ...(serverNotes?.modifiers?.recipeType ?? []),
          ...(serverNotes?.allergens ?? []),
        ]
          .map((tag) => tag?.trim())
          .filter((tag): tag is string => Boolean(tag)),
      ),
    ).slice(0, 6);

    return {
      id: recipe.id,
      name: resolveMenuName(recipe),
      description: recipe.description ?? "",
      cuisine: recipe.cuisine ?? serverNotes?.modifiers?.nationality?.[0] ?? null,
      course: recipe.course ?? serverNotes?.modifiers?.courses?.[0] ?? null,
      tags,
      categoryKey,
      currency,
      baseCost,
      recommendedPrice,
      margin,
      marginPct,
    } satisfies MenuLineItem;
  });
};

type MenuStats = {
  currency: string;
  totalItems: number;
  averageCost: number | null;
  averagePrice: number | null;
  averageMargin: number | null;
  averageMarginPct: number | null;
  priceBand: [number, number] | null;
  marginPerHundredCovers: number | null;
};

const computeStats = (items: MenuLineItem[]): MenuStats => {
  const currency = items.find((item) => item.currency)?.currency ?? "USD";
  const costValues = items.map((item) => item.baseCost).filter((value): value is number => value != null);
  const priceValues = items
    .map((item) => item.recommendedPrice)
    .filter((value): value is number => value != null);
  const marginValues = items.map((item) => item.margin).filter((value): value is number => value != null);
  const marginPctValues = items
    .map((item) => item.marginPct)
    .filter((value): value is number => value != null);

  const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

  const average = (values: number[]) => (values.length ? sum(values) / values.length : null);

  const averageCost = average(costValues);
  const averagePrice = average(priceValues);
  const averageMargin = average(marginValues);
  const averageMarginPct = average(marginPctValues);
  const priceBand = priceValues.length
    ? ([Math.min(...priceValues), Math.max(...priceValues)] as [number, number])
    : null;
  const marginPerHundredCovers = averageMargin != null ? Number((averageMargin * 100).toFixed(2)) : null;

  return {
    currency,
    totalItems: items.length,
    averageCost,
    averagePrice,
    averageMargin,
    averageMarginPct,
    priceBand,
    marginPerHundredCovers,
  } satisfies MenuStats;
};

const groupByCategory = (items: MenuLineItem[]) => {
  const map = new Map<CategoryKey, MenuLineItem[]>();
  for (const item of items) {
    const existing = map.get(item.categoryKey);
    if (existing) {
      existing.push(item);
    } else {
      map.set(item.categoryKey, [item]);
    }
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const averageMargin = computeStats(list).averageMargin ?? 0;
      return {
        key,
        label: toCategoryLabel(key),
        items: list
          .slice()
          .sort((a, b) => (b.recommendedPrice ?? 0) - (a.recommendedPrice ?? 0)),
        averageMargin,
      };
    })
    .sort((a, b) => b.averageMargin - a.averageMargin);
};

const buildCuisineHighlights = (items: MenuLineItem[]) => {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.cuisine) continue;
    const current = counts.get(item.cuisine) ?? 0;
    counts.set(item.cuisine, current + 1);
  }
  const total = Array.from(counts.values()).reduce((acc, value) => acc + value, 0);
  if (!total) return [] as Array<{ cuisine: string; share: number }>;
  return Array.from(counts.entries())
    .map(([cuisine, count]) => ({ cuisine, share: count / total }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 3);
};

const buildServiceMoments = (topItems: MenuLineItem[], stats: MenuStats) => {
  const [hero, followUp, third] = topItems;
  const formatMargin = (value: number | null) =>
    value != null ? formatCurrencyValue(value, hero?.currency ?? stats.currency) : "";

  return [
    {
      title: "Launch tasting",
      window: "Week 1",
      description:
        hero && hero.margin != null
          ? `${hero.name} anchors the preview with a ${hero.cuisine ?? "chef-driven"} profile and ${formatMargin(hero.margin)} contribution.`
          : `Lead with the strongest performer: average contribution ${formatMargin(stats.averageMargin)} per cover.`,
    },
    {
      title: "Dining room spotlight",
      window: "Week 3",
      description:
        followUp && followUp.marginPct != null
          ? `${followUp.name} keeps servers story-led with ${Math.round(followUp.marginPct * 100)}% margin and tactile plating notes.`
          : `Position high-margin dishes mid-cycle to sustain ${Math.round((stats.averageMarginPct ?? 0) * 100)}% profitability.`,
    },
    {
      title: "Seasonal refresh",
      window: "Week 7",
      description:
        third && third.tags.length
          ? `${third.name} reintroduces ${third.tags.slice(0, 2).join(" & ")} accents while holding ${formatMargin(third.margin)} in margin headroom.`
          : `Rotate a signature dish while maintaining ${formatMargin(stats.averageMargin)} contribution per plate.`,
    },
  ];
};

export default function EchoMenuStudioSection() {
  const menuItems = useMemo(() => buildMenuItems(recipes), []);
  const stats = useMemo(() => computeStats(menuItems), [menuItems]);
  const categoryGroups = useMemo(() => groupByCategory(menuItems), [menuItems]);
  const cuisineHighlights = useMemo(() => buildCuisineHighlights(menuItems), [menuItems]);
  const topContributionItems = useMemo(
    () =>
      menuItems
        .filter((item) => item.margin != null)
        .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
        .slice(0, 3),
    [menuItems],
  );
  const serviceMoments = useMemo(
    () => buildServiceMoments(topContributionItems, stats),
    [topContributionItems, stats],
  );

  const numberFormatter = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }), []);
  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 }),
    [],
  );

  const displayCurrency = (value: number | null) =>
    value != null ? formatCurrencyValue(value, stats.currency) : "—";

  const displayPriceBand = (band: MenuStats["priceBand"]) => {
    if (!band) return "—";
    return `${formatCurrencyValue(band[0], stats.currency)} – ${formatCurrencyValue(band[1], stats.currency)}`;
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-4">
      <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-background to-emerald-500/5 p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold uppercase tracking-[0.45em] text-cyan-700 dark:text-cyan-200">
              Echo Menu Studio
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Translate recipe intelligence into guest-ready menus. Echo synthesizes costing, positioning, and
              service choreography so every launch keeps profitability and storytelling aligned.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right text-xs uppercase tracking-[0.32em] text-muted-foreground md:grid-cols-3">
            <div>
              <div className="text-[11px]">Active Dishes</div>
              <div className="text-lg font-semibold text-foreground">
                {numberFormatter.format(stats.totalItems)}
              </div>
            </div>
            <div>
              <div className="text-[11px]">Avg Contribution</div>
              <div className="text-lg font-semibold text-foreground">
                {displayCurrency(stats.averageMargin)}
              </div>
            </div>
            <div>
              <div className="text-[11px]">Price Band</div>
              <div className="text-lg font-semibold text-foreground">
                {displayPriceBand(stats.priceBand)}
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-6 bg-cyan-500/20" />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Financial posture</CardTitle>
              <CardDescription>
                Balanced markup strategy grounded in current portion economics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average cost</span>
                <span className="font-medium text-foreground">{displayCurrency(stats.averageCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average price</span>
                <span className="font-medium text-foreground">{displayCurrency(stats.averagePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross margin</span>
                <span className="font-medium text-foreground">
                  {displayCurrency(stats.averageMargin)}
                  {stats.averageMarginPct != null ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({percentFormatter.format(stats.averageMarginPct)})
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margin / 100 covers</span>
                <span className="font-medium text-foreground">
                  {displayCurrency(stats.marginPerHundredCovers)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Cuisine balance</CardTitle>
              <CardDescription>
                Surface the flavor architecture that defines the lineup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cuisineHighlights.length ? (
                cuisineHighlights.map((entry) => (
                  <div key={entry.cuisine} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{entry.cuisine}</span>
                    <span className="text-muted-foreground">
                      {percentFormatter.format(entry.share)} share
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  Add cuisine metadata to diversify storytelling across the menu.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-transparent bg-white/70 shadow-sm backdrop-blur dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Launch playbook</CardTitle>
              <CardDescription>Sequenced activations tied to highest-value dishes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {serviceMoments.map((moment) => (
                <div key={moment.title} className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">
                    <span>{moment.title}</span>
                    <span>{moment.window}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90">{moment.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-cyan-500/20 bg-white/80 shadow-lg backdrop-blur dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Menu lineup</CardTitle>
            <CardDescription>
              Categories ordered by contribution margin, ready for menu engineering export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="max-h-[520px] pr-2">
              <div className="space-y-4">
                {categoryGroups.map((group) => (
                  <section key={group.key} className="rounded-xl border border-cyan-500/20 bg-white/70 p-4 dark:bg-slate-950/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-foreground">
                          {group.label}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {group.items.length} dishes · Avg margin {displayCurrency(group.averageMargin)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {group.items.map((item) => (
                        <article key={item.id} className="rounded-lg border border-cyan-500/15 bg-white/80 p-3 shadow-sm dark:bg-slate-950/60">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-foreground">{item.name}</div>
                              {item.description ? (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                                {item.course ? <Badge variant="outline">{item.course}</Badge> : null}
                                {item.cuisine ? <Badge variant="outline">{item.cuisine}</Badge> : null}
                                {item.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-200">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-end text-right">
                              <span className="text-sm font-semibold text-foreground">
                                {displayCurrency(item.recommendedPrice)}
                              </span>
                              {item.margin != null ? (
                                <span className="text-xs text-muted-foreground">
                                  Margin {displayCurrency(item.margin)}
                                  {item.marginPct != null ? ` · ${percentFormatter.format(item.marginPct)}` : ""}
                                </span>
                              ) : null}
                              {item.baseCost != null ? (
                                <span className="text-xs text-muted-foreground">Cost {displayCurrency(item.baseCost)}</span>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border border-cyan-500/20 bg-white/80 shadow-lg backdrop-blur dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Implementation checklist</CardTitle>
              <CardDescription>
                Keep teams aligned as menu cards and pricing publish across channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
                <div className="text-xs uppercase tracking-[0.32em] text-cyan-600 dark:text-cyan-300">
                  POS sync
                </div>
                <p className="mt-1 text-sm text-foreground/90">
                  Export mapped item codes directly into the Dish Assembly POS Connect dialog once menu prices are
                  approved.
                </p>
              </div>
              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
                <div className="text-xs uppercase tracking-[0.32em] text-cyan-600 dark:text-cyan-300">
                  Training cadence
                </div>
                <p className="mt-1 text-sm text-foreground/90">
                  Pair server notes briefings with the launch playbook milestones to keep storytelling and allergy
                  callouts consistent.
                </p>
              </div>
              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
                <div className="text-xs uppercase tracking-[0.32em] text-cyan-600 dark:text-cyan-300">
                  Cost guardrails
                </div>
                <p className="mt-1 text-sm text-foreground/90">
                  Monitor any dish drifting below {displayCurrency(stats.averageMargin)} contribution and trigger
                  re-costing via the Recipe Costing panel.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-cyan-500/20 bg-white/80 shadow-lg backdrop-blur dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Signal boosters</CardTitle>
              <CardDescription>
                High-impact dishes worth amplifying across social, PR, and VIP tastings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topContributionItems.length ? (
                topContributionItems.map((item, index) => (
                  <div key={item.id} className={cn("rounded-lg border border-cyan-500/15 bg-white/80 p-3 shadow-sm", {
                    "bg-cyan-500/10": index === 0,
                  })}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.name}</div>
                        <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                          {item.cuisine ?? "Chef-driven"} · {item.course ?? "Signature"}
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-foreground">
                        {displayCurrency(item.margin)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Position at {index === 0 ? "prime" : index === 1 ? "center" : "support"} placement on printed menus
                      to hold {displayCurrency(item.recommendedPrice)} price integrity while reinforcing the brand voice.
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  Select dishes with captured cost data to surface margin leaders here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
