"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";
import { motion } from "framer-motion";

import { analyticsApi } from "@/lib/api/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

// Lazy load recharts
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const PieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
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

const dateRanges = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

// Chart colors - dark theme with orange accents
const chartColors = {
  primary: "#FF6B35",      // primary orange
  accent: "#FF8C42",       // accent orange
  success: "#10B981",      // success green
  warning: "#FBBF24",      // warning amber
  destructive: "#EF4444",  // destructive red
  muted: "#6B7280",        // muted gray
};

function StatCardSkeleton() {
  return (
    <Card className="animate-pulse bg-secondary/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted rounded mb-2" />
        <div className="h-3 w-24 bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = "h-80" }: { height?: string }) {
  return (
    <div className={cn("animate-pulse bg-secondary/50 rounded-lg", height)} />
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "dashboard", dateRange],
    queryFn: () => analyticsApi.getDashboard(dateRange),
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-secondary/30">
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="border-destructive bg-destructive/10">
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

  const { overview, recent_trends, priority_distribution, top_categories } = data;

  const quadrantData = Object.entries(priority_distribution.by_quadrant).map(
    ([name, stats]: [string, { count: number; completed: number; completion_rate: number }]) => ({
      name: name.replace("_", " "),
      count: stats.count,
      value: stats.count,
      completed: stats.completed,
      completion_rate: stats.completion_rate,
    })
  );

  const QUADRANT_COLORS: Record<string, string> = {
    "Do First": chartColors.destructive,
    "Schedule": chartColors.primary,
    "Delegate": chartColors.warning,
    "Eliminate": chartColors.muted,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Productivity insights & performance metrics
          </p>
        </div>

        {/* Date Range Selector & Export */}
        <div className="flex gap-3">
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg border border-border">
            {dateRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  dateRange === range.value
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-secondary"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {/* Total Tasks */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-border hover:border-primary/40 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Tasks
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-black text-white"
              >
                {overview.total_tasks}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                {overview.completed_tasks} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Rate */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-border hover:border-primary/40 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Completion Rate
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/20">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-black text-success"
              >
                {overview.completion_rate.toFixed(0)}%
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                {overview.in_progress_tasks} in progress
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Avg Completion Time */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-border hover:border-primary/40 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg. Completion
              </CardTitle>
              <div className="p-2 rounded-lg bg-warning/20">
                <Clock className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-black text-warning"
              >
                {overview.average_completion_time_days.toFixed(1)}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">days</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue Tasks */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-border hover:border-primary/40 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Overdue
              </CardTitle>
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-black text-destructive"
              >
                {overview.overdue_tasks}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                {overview.tasks_due_today} due today
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Completion Trend */}
        <Card className="bg-secondary/30 border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Completion Trend</CardTitle>
            <CardDescription>Tasks completed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recent_trends.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={false}
                  name="Completed"
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke={chartColors.muted}
                  strokeWidth={2}
                  dot={false}
                  name="Created"
                  strokeOpacity={0.6}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-secondary/30 border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Priority Distribution</CardTitle>
            <CardDescription>Tasks by Eisenhower quadrant</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={quadrantData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${(entry.name as string)?.split(" ")[0] || ""}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {quadrantData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={QUADRANT_COLORS[entry.name] || chartColors.primary}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Performance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-secondary/30 border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Category Performance</CardTitle>
            <CardDescription>Tasks completed by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top_categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill={chartColors.primary} name="Total Tasks" />
                <Bar
                  dataKey="completed"
                  fill={chartColors.success}
                  name="Completed"
                  radius={[0, 0, 8, 8]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <span>💡</span>
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {overview.completion_rate > 80
                      ? "Excellent productivity!"
                      : overview.completion_rate > 60
                      ? "Good progress on tasks"
                      : "Room for improvement"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your completion rate is {overview.completion_rate.toFixed(0)}% this period.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">⏱️</div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Average completion: {overview.average_completion_time_days.toFixed(1)} days
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tasks take {overview.average_completion_time_days.toFixed(1)} days on average to complete.
                  </p>
                </div>
              </div>
              {overview.overdue_tasks > 0 && (
                <div className="flex gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      {overview.overdue_tasks} overdue task{overview.overdue_tasks !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consider prioritizing overdue tasks to get back on track.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
