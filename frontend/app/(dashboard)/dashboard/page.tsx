"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  AlertTriangle,
  PartyPopper,
  ListTodo,
  Clock,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay } from "date-fns";
import confetti from "canvas-confetti";

import { analyticsApi } from "@/lib/api/analytics";
import { tasksApi } from "@/lib/api/tasks";
import { useSearch } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard, TaskCardSkeleton } from "@/components/tasks/TaskCard";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { cn } from "@/lib/utils/cn";
import { Task } from "@/lib/types";
import { toast } from "sonner";

// Motivational quotes for progress
const motivationalQuotes = [
  { text: "You're on fire! Keep crushing it!", emoji: "🔥" },
  { text: "Every task completed is a step forward!", emoji: "🚀" },
  { text: "Productivity level: Expert!", emoji: "💪" },
  { text: "Making progress one task at a time!", emoji: "⭐" },
  { text: "You've got this! Keep going!", emoji: "🌟" },
  { text: "Crushing goals like a champion!", emoji: "🏆" },
  { text: "Look at you being productive!", emoji: "✨" },
];

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "emerald" | "amber" | "rose";
}) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "text-blue-600",
      text: "text-blue-700",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "text-emerald-600",
      text: "text-emerald-700",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "text-amber-600",
      text: "text-amber-700",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-100",
      icon: "text-rose-600",
      text: "text-rose-700",
    },
  };

  const c = colors[color];

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        c.bg,
        c.border,
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white/80 shadow-sm", c.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className={cn("text-2xl font-bold", c.text)}>{value ?? 0}</p>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { searchQuery } = useSearch();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [completedTaskId, setCompletedTaskId] = useState<number | null>(null);

  // Fetch analytics overview
  const { data: analytics } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.getOverview,
  });

  // Fetch today's tasks (overdue + due today)
  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ["tasks", "today"],
    queryFn: () =>
      tasksApi.getAll({
        due_before: addDays(startOfDay(new Date()), 1).toISOString(),
        completed: false,
        limit: 10,
        sort_by: "due_date",
        sort_order: "asc",
      }),
  });

  // Fetch upcoming tasks (next 7 days)
  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["tasks", "upcoming"],
    queryFn: () =>
      tasksApi.getAll({
        due_after: addDays(startOfDay(new Date()), 1).toISOString(),
        due_before: addDays(startOfDay(new Date()), 8).toISOString(),
        completed: false,
        limit: 15,
        sort_by: "due_date",
        sort_order: "asc",
      }),
  });

  // Complete task mutation with confetti celebration
  const completeMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.update(taskId, { status: "done" }),
    onMutate: (taskId) => {
      setCompletedTaskId(taskId);
    },
    onSuccess: () => {
      // Trigger confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Task completed! 🎉", {
        icon: <PartyPopper className="h-4 w-4" />,
      });
    },
    onSettled: () => {
      setTimeout(() => setCompletedTaskId(null), 300);
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Task deleted");
    },
  });

  // Separate overdue from today's tasks
  const { overdueTasks, todayTasks } = useMemo(() => {
    const tasks = todayData?.tasks || [];
    const now = new Date();
    const overdue: Task[] = [];
    const today: Task[] = [];

    tasks.forEach((task) => {
      if (task.due_date) {
        const dueDate = parseISO(task.due_date);
        if (dueDate < now && !isToday(dueDate)) {
          overdue.push(task);
        } else {
          today.push(task);
        }
      } else {
        today.push(task);
      }
    });

    return { overdueTasks: overdue, todayTasks: today };
  }, [todayData]);

  // Group upcoming by date
  const upcomingGrouped = useMemo(() => {
    const tasks = upcomingData?.tasks || [];
    const groups: { [key: string]: Task[] } = {};

    tasks.forEach((task) => {
      if (task.due_date) {
        const dueDate = parseISO(task.due_date);
        let label: string;

        if (isTomorrow(dueDate)) {
          label = "Tomorrow";
        } else {
          label = format(dueDate, "EEEE, MMM d");
        }

        if (!groups[label]) groups[label] = [];
        groups[label].push(task);
      }
    });

    return groups;
  }, [upcomingData]);

  // Filter tasks by search
  const filterBySearch = (tasks: Task[]) => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category?.name.toLowerCase().includes(query)
    );
  };

  const filteredTodayTasks = filterBySearch(todayTasks);
  const filteredOverdueTasks = filterBySearch(overdueTasks);

  // Click card -> open detail modal
  const handleTaskClick = (task: Task) => {
    setDetailTask(task);
    setDetailModalOpen(true);
  };

  // Edit from detail modal
  const handleEditFromDetail = (task: Task) => {
    setDetailModalOpen(false);
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  // Direct edit click
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleComplete = (taskId: number) => {
    completeMutation.mutate(taskId);
  };

  const handleDelete = (taskId: number) => {
    deleteMutation.mutate(taskId);
  };

  const completionRate = analytics?.total_tasks
    ? Math.round((analytics.completed_tasks / analytics.total_tasks) * 100)
    : 0;

  // Get a consistent motivational quote based on completion rate
  const motivationalQuote = useMemo(() => {
    const index = Math.floor((completionRate / 100) * (motivationalQuotes.length - 1));
    return motivationalQuotes[Math.min(index, motivationalQuotes.length - 1)];
  }, [completionRate]);

  // Quadrant colors for upcoming tasks
  const getQuadrantStyles = (quadrant: string) => {
    switch (quadrant) {
      case "DO_FIRST":
        return { border: "border-l-red-500", dot: "bg-red-500", bg: "bg-red-50/50", hover: "hover:bg-red-100/70", borderColor: "border-red-100" };
      case "SCHEDULE":
        return { border: "border-l-blue-500", dot: "bg-blue-500", bg: "bg-blue-50/50", hover: "hover:bg-blue-100/70", borderColor: "border-blue-100" };
      case "DELEGATE":
        return { border: "border-l-purple-500", dot: "bg-purple-500", bg: "bg-purple-50/50", hover: "hover:bg-purple-100/70", borderColor: "border-purple-100" };
      default:
        return { border: "border-l-gray-400", dot: "bg-gray-400", bg: "bg-gray-50/50", hover: "hover:bg-gray-100/70", borderColor: "border-gray-100" };
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in-up bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 min-h-full">
      {/* Overdue Banner */}
      {filteredOverdueTasks.length > 0 && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50 animate-scale-in shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">
                  {filteredOverdueTasks.length} Overdue Task{filteredOverdueTasks.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-600/70">Needs your attention</p>
              </div>
            </div>
            {/* Show overdue tasks inline */}
            <div className="mt-4 space-y-2">
              {filteredOverdueTasks.slice(0, 3).map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="minimal"
                  onComplete={handleComplete}
                  onClick={handleTaskClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  animationDelay={idx * 50}
                  className={cn(
                    completedTaskId === task.id && "opacity-50 scale-95 transition-all"
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Today's Focus + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
        {/* Left Column - Today's Focus */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Today&apos;s Focus</h1>
            <p className="text-sm text-gray-500 font-medium">
              {filteredTodayTasks.length} task{filteredTodayTasks.length !== 1 ? "s" : ""} for today
            </p>
          </div>

          {loadingToday ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <TaskCardSkeleton key={i} variant="minimal" />
              ))}
            </div>
          ) : filteredTodayTasks.length === 0 ? (
            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">You&apos;re all caught up!</p>
                <p className="text-sm text-gray-500 mt-1">
                  No tasks due today. Enjoy your day!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTodayTasks.slice(0, 6).map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="minimal"
                  onComplete={handleComplete}
                  onClick={handleTaskClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  animationDelay={idx * 50}
                  className={cn(
                    completedTaskId === task.id && "opacity-50 scale-95 transition-all"
                  )}
                />
              ))}
              {filteredTodayTasks.length > 6 && (
                <p className="text-xs text-gray-400 text-center py-2 font-medium">
                  +{filteredTodayTasks.length - 6} more tasks
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Stats + Upcoming */}
        <div className="space-y-6">
          {/* Stats Header */}
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Stats</h2>
            <p className="text-xs text-gray-500 font-medium">Your productivity overview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Total Tasks"
              value={analytics?.total_tasks}
              icon={ListTodo}
              color="blue"
            />
            <StatCard
              title="Completed"
              value={analytics?.completed_tasks}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="In Progress"
              value={analytics?.in_progress_tasks}
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="Overdue"
              value={analytics?.overdue_tasks}
              icon={AlertTriangle}
              color="rose"
            />
          </div>

          {/* Progress Summary */}
          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Progress</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">{completionRate}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500 font-medium">
                <span>{analytics?.completed_tasks || 0} completed</span>
                <span>{analytics?.pending_tasks || 0} remaining</span>
              </div>
              {/* Motivational Quote */}
              {completionRate > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <p className="text-sm text-gray-600 font-medium">
                      {motivationalQuote.emoji} {motivationalQuote.text}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Section */}
          <Card className="border-blue-100 bg-linear-to-br from-blue-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-4 px-4 border-b border-blue-50">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-100">
                  <Clock className="h-3 w-3 text-blue-600" />
                </div>
                Upcoming This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loadingUpcoming ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-100 rounded animate-pulse" />
                  <div className="h-8 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : Object.keys(upcomingGrouped).length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No upcoming tasks</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(upcomingGrouped).slice(0, 3).map(([dateLabel, tasks]) => (
                    <div key={dateLabel}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                        {dateLabel}
                      </p>
                      <div className="space-y-1.5">
                        {tasks.slice(0, 2).map((task) => {
                          const styles = getQuadrantStyles(task.quadrant);
                          return (
                            <div
                              key={task.id}
                              onClick={() => handleTaskClick(task)}
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg cursor-pointer",
                                "transition-all duration-150 border-l-4 border",
                                "hover:shadow-sm hover:-translate-x-0.5",
                                styles.border,
                                styles.bg,
                                styles.borderColor,
                                styles.hover,
                                "group"
                              )}
                            >
                              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", styles.dot)} />
                              <span className="text-sm truncate flex-1 text-gray-700 font-semibold group-hover:text-gray-900">
                                {task.title}
                              </span>
                              {task.due_date && (
                                <span className="text-xs text-gray-500 font-medium group-hover:text-gray-700">
                                  {format(parseISO(task.due_date), "h:mm a")}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Detail Modal - Read only view */}
      <TaskDetailModal
        task={detailTask}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={handleEditFromDetail}
        onDelete={handleDelete}
      />

      {/* Edit Task Dialog */}
      <TaskFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
