import React, { useMemo } from "react";
import { useRDLabStore } from "@/stores/rdLabStore";
import {
  calculateDashboardMetrics,
  type DashboardMetrics,
  type MetricsPeriod,
} from "@/lib/dashboard-metrics";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Users, Leaf, DollarSign } from "lucide-react";

interface DashboardOverviewPanelProps {
  period?: MetricsPeriod;
}

export function DashboardOverviewPanel({
  period = "30d",
}: DashboardOverviewPanelProps) {
  const { experiments } = useRDLabStore();

  const metrics = useMemo(() => {
    try {
      return calculateDashboardMetrics(experiments || [], period);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      return calculateDashboardMetrics([], period);
    }
  }, [experiments, period]);

  // Empty state
  if (!experiments || experiments.length === 0) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">R&D Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time metrics and experiment analytics
            </p>
          </div>
        </div>
        <Card className="border border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50 p-12 text-center">
          <div className="space-y-4">
            <Target className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                No experiments yet
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Start by creating your first experiment to see metrics and analytics here
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">R&D Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time metrics and experiment analytics
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {experiments.length} experiments tracked
          </p>
          <p className="text-xs text-muted-foreground opacity-75 mt-1">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={`${Math.round(metrics.experiments.successRate)}%`}
          subtitle="Experiments reaching ready/deployed status"
          icon={Target}
          trend={metrics.experiments.successRate > 75 ? "up" : "neutral"}
          trendValue={metrics.experiments.successRate > 75 ? "+5%" : "baseline"}
          bgGradient="from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />

        <MetricCard
          title="Avg. Days to Ready"
          value={`${metrics.experiments.averageTimeToReady}d`}
          subtitle="Median time from ideation to approval"
          icon={TrendingDown}
          trend={metrics.experiments.averageTimeToReady < 60 ? "up" : "down"}
          trendValue={metrics.experiments.averageTimeToReady < 60 ? "-8 days" : "+5 days"}
          bgGradient="from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />

        <MetricCard
          title="Active Contributors"
          value={metrics.teamPerformance.activeContributors}
          subtitle="Team members with active experiments"
          icon={Users}
          trend="neutral"
          trendValue="4 this month"
          bgGradient="from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />

        <MetricCard
          title="Cost Reduction"
          value={`${metrics.financialImpact.avgPortionCostReduction}%`}
          subtitle="Avg. portion cost improvement"
          icon={DollarSign}
          trend="up"
          trendValue="+2.1% this period"
          bgGradient="from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Status Distribution */}
      <Card className="border-slate-200/50 dark:border-cyan-500/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-cyan-200 mb-4">
          Experiment Pipeline Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: "Ideation",
              value: metrics.experiments.byStatus.ideation,
              color: "bg-slate-100 dark:bg-slate-700",
              textColor: "text-slate-700 dark:text-slate-200",
            },
            {
              label: "Testing",
              value: metrics.experiments.byStatus.testing,
              color: "bg-blue-100 dark:bg-blue-900/40",
              textColor: "text-blue-700 dark:text-blue-200",
            },
            {
              label: "Ready",
              value: metrics.experiments.byStatus.ready,
              color: "bg-green-100 dark:bg-green-900/40",
              textColor: "text-green-700 dark:text-green-200",
            },
            {
              label: "Deployed",
              value: metrics.experiments.byStatus.deployed,
              color: "bg-purple-100 dark:bg-purple-900/40",
              textColor: "text-purple-700 dark:text-purple-200",
            },
            {
              label: "Archived",
              value: metrics.experiments.byStatus.archived,
              color: "bg-slate-100 dark:bg-slate-700",
              textColor: "text-slate-600 dark:text-slate-300",
            },
          ].map((status) => (
            <div
              key={status.label}
              className={`${status.color} rounded-lg p-4 text-center transition-all`}
            >
              <div className={`text-2xl font-bold ${status.textColor}`}>
                {status.value}
              </div>
              <div className={`text-xs ${status.textColor} opacity-75 mt-1`}>
                {status.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Specialization & Financial Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200/50 dark:border-cyan-500/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-cyan-200 mb-4">
            By Specialization
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "Culinary",
                value: metrics.experiments.culinaryVsPastry.culinary,
                percentage: Math.round(
                  (metrics.experiments.culinaryVsPastry.culinary /
                    metrics.experiments.totalCount) *
                    100
                ),
              },
              {
                label: "Pastry",
                value: metrics.experiments.culinaryVsPastry.pastry,
                percentage: Math.round(
                  (metrics.experiments.culinaryVsPastry.pastry /
                    metrics.experiments.totalCount) *
                    100
                ),
              },
              {
                label: "Combined",
                value: metrics.experiments.culinaryVsPastry.both,
                percentage: Math.round(
                  (metrics.experiments.culinaryVsPastry.both /
                    metrics.experiments.totalCount) *
                    100
                ),
              },
            ].map((spec) => (
              <div key={spec.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {spec.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-cyan-200">
                    {spec.value} ({spec.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 dark:from-cyan-500 dark:to-cyan-400"
                    style={{ width: `${spec.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-slate-200/50 dark:border-cyan-500/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-cyan-200 mb-4 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            Sustainability Impact
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Avg. Carbon/Serving
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-cyan-200">
                  {metrics.sustainability.averageCarbonPerServing} kg CO₂e
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600"
                  style={{
                    width: `${Math.min(
                      (metrics.sustainability.averageCarbonPerServing / 3) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Local Sourcing
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-cyan-200">
                  {metrics.sustainability.localSourcingPercentage}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  style={{
                    width: `${metrics.sustainability.localSourcingPercentage}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Waste Recovery Rate
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-cyan-200">
                  {metrics.sustainability.wasteRecoveryRate}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-teal-600"
                  style={{
                    width: `${metrics.sustainability.wasteRecoveryRate}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Approvals */}
      {metrics.experiments.recentApprovals.length > 0 && (
        <Card className="border-slate-200/50 dark:border-cyan-500/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-cyan-200 mb-4">
            Recent Approvals
          </h3>
          <div className="space-y-3">
            {metrics.experiments.recentApprovals.map((exp) => (
              <div
                key={exp.id}
                className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/30 dark:border-cyan-500/10"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-cyan-200">
                    {exp.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    by {exp.owner} • {exp.lastUpdated}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="ml-2 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30"
                >
                  Ready
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  bgGradient: string;
  iconColor: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  bgGradient,
  iconColor,
}: MetricCardProps) {
  return (
    <Card
      className={`bg-gradient-to-br ${bgGradient} border-0 shadow-sm hover:shadow-md transition-shadow p-5`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-200 mt-2">
            {value}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            {subtitle}
          </p>
        </div>
        <div className={`p-3 rounded-lg bg-white/60 dark:bg-slate-800/40`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      {trend !== "neutral" && (
        <div className="flex items-center gap-1 mt-3">
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-xs font-medium ${
              trend === "up"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {trendValue}
          </span>
        </div>
      )}
    </Card>
  );
}
