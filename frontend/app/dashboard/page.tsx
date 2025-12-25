"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  Sparkles,
  ListTodo,
  Grid2x2,
  BarChart3,
  Loader2,
} from "lucide-react";

import { analyticsApi } from "@/lib/api/analytics";
import { tasksApi } from "@/lib/api/tasks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { AITaskParserDialog } from "@/components/ai/AITaskParserDialog";

export default function DashboardPage() {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  // Fetch overview analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.getOverview,
  });

  // Fetch recent tasks
  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", { limit: 5, sort_by: "updated_at", sort_order: "desc" }],
    queryFn: () =>
      tasksApi.getAll({ limit: 5, sort_by: "updated_at", sort_order: "desc" }),
  });

  const isLoading = analyticsLoading || tasksLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAiDialogOpen(true)} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Parser
          </Button>
          <Button onClick={() => setTaskDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{analytics?.total_tasks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.pending_tasks || 0} pending
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {analytics?.completion_rate.toFixed(0) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.completed_tasks || 0} completed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {analytics?.in_progress_tasks || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently working on</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    (analytics?.overdue_tasks || 0) > 0
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {analytics?.overdue_tasks || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.tasks_due_today || 0} due today
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Tasks */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your task management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setTaskDialogOpen(true)}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Task
            </Button>
            <Link href="/tasks">
              <Button className="w-full justify-start" variant="outline">
                <ListTodo className="mr-2 h-4 w-4" />
                View All Tasks
              </Button>
            </Link>
            <Link href="/priority-matrix">
              <Button className="w-full justify-start" variant="outline">
                <Grid2x2 className="mr-2 h-4 w-4" />
                Priority Matrix
              </Button>
            </Link>
            <Link href="/analytics">
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
            <Button
              onClick={() => setAiDialogOpen(true)}
              className="w-full justify-start"
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Task Parser
            </Button>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest updated tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentTasks?.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks yet. Create your first task to get started!
              </p>
            ) : (
              <div className="space-y-3">
                {recentTasks?.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === "done"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {task.status === "in_progress"
                            ? "In Progress"
                            : task.status === "done"
                            ? "Done"
                            : "To Do"}
                        </span>
                        {task.category && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: task.category.color || "#3B82F6",
                              }}
                            />
                            {task.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/tasks">
                  <Button variant="link" className="w-full text-sm">
                    View all tasks →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity Insights */}
      {analytics && analytics.total_tasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productivity Insights</CardTitle>
            <CardDescription>Your task management performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Productivity Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {analytics.productivity_score.toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${analytics.productivity_score}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
                <p className="text-2xl font-bold">
                  {analytics.average_completion_time_days.toFixed(1)} days
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tasks Due This Week</p>
                <p className="text-2xl font-bold">{analytics.tasks_due_this_week}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />
      <AITaskParserDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} />
    </div>
  );
}
