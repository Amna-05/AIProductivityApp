"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";

import { analyticsApi } from "@/lib/api/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

// Lazy load heavy recharts components (reduces initial bundle by ~100KB)
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const PieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false }
);
const Pie = dynamic(
  () => import("recharts").then((mod) => mod.Pie),
  { ssr: false }
);
const Cell = dynamic(
  () => import("recharts").then((mod) => mod.Cell),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false }
);

// Date range options
const dateRanges = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

// Skeleton components
function StatCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-3.5 w-3.5 bg-muted rounded" />
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="h-7 w-12 bg-muted rounded mb-1" />
        <div className="h-3 w-20 bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = "h-[178px]" }: { height?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted/50 rounded-lg", height)} />
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(30);

  // Fetch dashboard analytics
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "dashboard", dateRange],
    queryFn: () => analyticsApi.getDashboard(dateRange),
  });

  // Loading skeleton UI
  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-8 animate-fade-in-up">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Chart skeletons */}
        <Card>
          <CardHeader>
            <div className="h-5 w-36 bg-muted rounded animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded mt-1 animate-pulse" />
          </CardHeader>
          <CardContent>
            <ChartSkeleton />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton height="h-[167px]" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-5 w-44 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton height="h-[190px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 animate-fade-in-up">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-12">
            <p className="text-center text-destructive">
              Failed to load analytics. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { overview, recent_trends, priority_distribution, top_categories, top_tags } = data;

  // Prepare chart data
  const quadrantData = Object.entries(priority_distribution.by_quadrant).map(([name, stats]) => ({
    name: name.replace("_", " "),
    count: stats.count,
    completed: stats.completed,
    completion_rate: stats.completion_rate,
  }));

  // Emerald palette for charts
  const COLORS = {
    DO_FIRST: "#EF4444",
    SCHEDULE: "#F59E0B",
    DELEGATE: "#3B82F6",
    ELIMINATE: "#9CA3AF",
  };

  const CHART_COLORS = {
    primary: "#10B981",    // emerald-500
    secondary: "#34D399",  // emerald-400
    accent: "#059669",     // emerald-600
    muted: "#6EE7B7",      // emerald-300
  };

  return (
    <div className="px-6 py-6 space-y-8 animate-fade-in-up bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 min-h-full">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Productivity insights
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
                dateRange === range.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3">
            <CardTitle className="text-xs font-semibold text-blue-700">Total Tasks</CardTitle>
            <div className="p-1.5 rounded-lg bg-blue-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-blue-900">{overview.total_tasks}</div>
            <p className="text-xs text-blue-600/70 mt-0.5">
              {overview.completed_tasks} completed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3">
            <CardTitle className="text-xs font-semibold text-emerald-700">Completion Rate</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-emerald-600">
              {overview.completion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-emerald-600/70 mt-0.5">
              {overview.in_progress_tasks} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3">
            <CardTitle className="text-xs font-semibold text-amber-700">Avg. Completion</CardTitle>
            <div className="p-1.5 rounded-lg bg-amber-100">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-amber-700">
              {overview.average_completion_time_days.toFixed(1)}
            </div>
            <p className="text-xs text-amber-600/70 mt-0.5">
              days on average
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-rose-100 bg-gradient-to-br from-rose-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3">
            <CardTitle className="text-xs font-semibold text-rose-700">Overdue Tasks</CardTitle>
            <div className="p-1.5 rounded-lg bg-rose-100">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-rose-600">
              {overview.overdue_tasks}
            </div>
            <p className="text-xs text-rose-600/70 mt-0.5">
              {overview.tasks_due_today} due today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Trends */}
      <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-lg font-bold text-gray-900">Completion Trends</CardTitle>
          <CardDescription>
            Tasks created vs completed over the last {recent_trends.data.length} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[178px] max-w-3xl mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recent_trends.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke={CHART_COLORS.muted}
                  strokeWidth={2}
                  name="Created"
                  dot={{ fill: CHART_COLORS.muted, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  name="Completed"
                  dot={{ fill: CHART_COLORS.primary, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Created</p>
              <p className="text-2xl font-bold text-primary">{recent_trends.total_created}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Completed</p>
              <p className="text-2xl font-bold text-success">{recent_trends.total_completed}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Change</p>
              <p className={`text-2xl font-bold ${recent_trends.net_change > 0 ? 'text-destructive' : 'text-success'}`}>
                {recent_trends.net_change > 0 ? '+' : ''}{recent_trends.net_change}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-gray-50 bg-gradient-to-r from-purple-50/50 to-white">
            <CardTitle className="text-lg font-bold text-gray-900">Priority Distribution</CardTitle>
            <CardDescription>Eisenhower Matrix quadrants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[167px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quadrantData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${String(entry.name || '').split(' ')[0]} (${(entry as { count?: number }).count || 0})`}
                    outerRadius={54}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {quadrantData.map((entry, index) => {
                      const colorKey = entry.name.replace(" ", "_").toUpperCase() as keyof typeof COLORS;
                      return <Cell key={`cell-${index}`} fill={COLORS[colorKey] || "#9CA3AF"} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {quadrantData.map((quad, index) => {
                const colorKey = quad.name.replace(" ", "_").toUpperCase() as keyof typeof COLORS;
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[colorKey] || "#9CA3AF" }}
                      />
                      <span className="font-medium">{quad.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {quad.completion_rate.toFixed(0)}% completed
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-gray-50 bg-gradient-to-r from-blue-50/50 to-white">
            <CardTitle className="text-lg font-bold text-gray-900">Category Performance</CardTitle>
            <CardDescription>Top {top_categories.length} categories by task count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top_categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="completed_tasks" fill={CHART_COLORS.primary} name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="in_progress_tasks" fill={CHART_COLORS.secondary} name="In Progress" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending_tasks" fill="#9CA3AF" name="Pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Tags */}
      {top_tags.length > 0 && (
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 border-b border-gray-50 bg-gradient-to-r from-amber-50/50 to-white">
            <CardTitle className="text-base font-bold text-gray-900">Top Tags</CardTitle>
            <CardDescription className="text-xs">Most used tags by count</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 mt-4">
              {top_tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: tag.color || "#3B82F6" }}
                    >
                      <span className="text-white text-xs font-bold">
                        {tag.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tag.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tag.usage_count} {tag.usage_count === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-success">
                      {tag.completion_rate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">completed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
