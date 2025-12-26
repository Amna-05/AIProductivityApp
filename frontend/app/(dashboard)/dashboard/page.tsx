"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { analyticsApi } from "@/lib/api/analytics";
import { tasksApi } from "@/lib/api/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { AITaskParserDialog } from "@/components/ai/AITaskParserDialog";
import { StatCard } from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState("");

  // Fetch overview analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.getOverview,
  });

  // Fetch upcoming tasks (sorted by due date)
  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", { limit: 10, sort_by: "due_date", sort_order: "asc" }],
    queryFn: () =>
      tasksApi.getAll({ limit: 10, sort_by: "due_date", sort_order: "asc" }),
  });

  const handleQuickAdd = () => {
    if (quickAddValue.trim()) {
      // If it looks like natural language, open AI parser
      if (quickAddValue.length > 20 || quickAddValue.includes(",")) {
        setAiDialogOpen(true);
      } else {
        // Otherwise open regular task form
        setTaskDialogOpen(true);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-success/10 text-success border-success/20";
      case "in_progress":
        return "bg-info/10 text-info border-info/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done":
        return "Done";
      case "in_progress":
        return "In Progress";
      default:
        return "To Do";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "DO_FIRST":
        return "bg-destructive";
      case "SCHEDULE":
        return "bg-warning";
      case "DELEGATE":
        return "bg-info";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="px-6 py-6 space-y-8 bg-background">{/* Ensure white background */}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Total Tasks"
          value={analytics?.total_tasks || 0}
          iconColor="text-primary"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={analytics?.completed_tasks || 0}
          iconColor="text-success"
          valueColor="text-success"
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={analytics?.in_progress_tasks || 0}
          iconColor="text-info"
          valueColor="text-info"
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={analytics?.overdue_tasks || 0}
          iconColor="text-destructive"
          valueColor="text-destructive"
        />
      </div>

      {/* Upcoming Deadlines Section - With Max Width */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View all →
            </Button>
          </Link>
        </div>

        {tasksLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !upcomingTasks?.tasks || upcomingTasks.tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  No upcoming tasks. You're all caught up!
                </p>
                <Button onClick={() => setTaskDialogOpen(true)} variant="outline">
                  Create your first task
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.tasks
              .filter((task) => task.status !== "done")
              .slice(0, 10)
              .map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Priority indicator + Task info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Priority Dot */}
                        <div
                          className={`h-2 w-2 rounded-full mt-2 shrink-0 ${getPriorityColor(
                            task.priority
                          )}`}
                        />

                        {/* Task Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base line-clamp-1 mb-1">
                            {task.title}
                          </h3>

                          {/* Meta info */}
                          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(task.due_date), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}

                            {task.category && (
                              <span className="flex items-center gap-1">
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

                      {/* Right: Status Badge */}
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full border shrink-0 ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />
      <AITaskParserDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} />
    </div>
  );
}
