"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { analyticsApi } from "@/lib/api/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  // Fetch dashboard analytics
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load analytics. Please try again.
        </p>
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

  const COLORS = {
    DO_FIRST: "#EF4444",
    SCHEDULE: "#EAB308",
    DELEGATE: "#F97316",
    ELIMINATE: "#9CA3AF",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Insights into your productivity and task management
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_tasks}</div>
            <p className="text-xs text-muted-foreground">
              {overview.completed_tasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.completion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.in_progress_tasks} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.average_completion_time_days.toFixed(1)} days
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overview.overdue_tasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.tasks_due_today} due today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Trends</CardTitle>
          <CardDescription>
            Tasks created vs completed over the last {recent_trends.data.length} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recent_trends.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
              <Legend />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Created"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22C55E"
                strokeWidth={2}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Created</p>
              <p className="text-2xl font-bold text-blue-600">{recent_trends.total_created}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Completed</p>
              <p className="text-2xl font-bold text-green-600">{recent_trends.total_completed}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Change</p>
              <p className={`text-2xl font-bold ${recent_trends.net_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {recent_trends.net_change > 0 ? '+' : ''}{recent_trends.net_change}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Eisenhower Matrix quadrants</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={quadrantData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {quadrantData.map((entry, index) => {
                    const colorKey = entry.name.replace(" ", "_").toUpperCase() as keyof typeof COLORS;
                    return <Cell key={`cell-${index}`} fill={COLORS[colorKey] || "#9CA3AF"} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
                      <span>{quad.name}</span>
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

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Top {top_categories.length} categories by task count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top_categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed_tasks" fill="#22C55E" name="Completed" />
                <Bar dataKey="in_progress_tasks" fill="#3B82F6" name="In Progress" />
                <Bar dataKey="pending_tasks" fill="#9CA3AF" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Tags */}
      {top_tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
            <CardDescription>Most used tags by count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: tag.color || "#3B82F6" }}
                    >
                      <span className="text-white text-xs font-bold">
                        {tag.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{tag.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tag.usage_count} tasks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
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
