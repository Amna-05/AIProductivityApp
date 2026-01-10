"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  AlertTriangle,
  PartyPopper,
  ListTodo,
  Clock,
  TrendingUp,
  Sparkles,
  Zap
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
import { cardContainerVariants, cardItemVariants } from "@/lib/animations/variants";

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

// Enhanced Stat card - dark theme with orange/amber accents
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string;
  value: number | undefined;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "success" | "warning" | "destructive";
  delay?: number;
}) {
  const colors = {
    primary: {
      gradient: "from-primary to-accent",
      iconBg: "bg-primary/20",
      shadow: "shadow-primary/20 hover:shadow-primary/40",
      glow: "bg-primary/10",
    },
    success: {
      gradient: "from-success to-success/80",
      iconBg: "bg-success/20",
      shadow: "shadow-success/20 hover:shadow-success/40",
      glow: "bg-success/10",
    },
    warning: {
      gradient: "from-warning to-warning/80",
      iconBg: "bg-warning/20",
      shadow: "shadow-warning/20 hover:shadow-warning/40",
      glow: "bg-warning/10",
    },
    destructive: {
      gradient: "from-destructive to-destructive/80",
      iconBg: "bg-destructive/20",
      shadow: "shadow-destructive/20 hover:shadow-destructive/40",
      glow: "bg-destructive/10",
    },
  };

  const c = colors[color];

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 h-[120px]",
        "bg-gradient-to-br", c.gradient,
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "hover:-translate-y-1 hover:scale-[1.02]",
        "cursor-default group",
        c.shadow
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
    >
      {/* Glow effect */}
      <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity", c.glow)} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{title}</p>
            <p className="text-white text-3xl font-black mt-1">{value ?? 0}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl", c.iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {subtitle && (
          <p className="text-white/70 text-xs font-medium">{subtitle}</p>
        )}
      </div>
    </motion.div>
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
        colors: ["#FF6B35", "#FF8C42", "#FFA55C", "#D97706"],
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

  // Quadrant colors for upcoming tasks (dark theme)
  const getQuadrantStyles = (quadrant: string) => {
    switch (quadrant) {
      case "DO_FIRST":
        return { border: "border-l-destructive", dot: "bg-destructive", bg: "bg-destructive/10", hover: "hover:bg-destructive/20", borderColor: "border-destructive/30" };
      case "SCHEDULE":
        return { border: "border-l-primary", dot: "bg-primary", bg: "bg-primary/10", hover: "hover:bg-primary/20", borderColor: "border-primary/30" };
      case "DELEGATE":
        return { border: "border-l-warning", dot: "bg-warning", bg: "bg-warning/10", hover: "hover:bg-warning/20", borderColor: "border-warning/30" };
      default:
        return { border: "border-l-border", dot: "bg-muted-foreground", bg: "bg-secondary/50", hover: "hover:bg-secondary", borderColor: "border-border" };
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 bg-background min-h-full">
      {/* Stats Row - 4 cards at top */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          title="Total Tasks"
          value={analytics?.total_tasks}
          subtitle={`${analytics?.pending_tasks || 0} pending`}
          icon={ListTodo}
          color="primary"
          delay={0}
        />
        <StatCard
          title="Completed"
          value={analytics?.completed_tasks}
          subtitle={`${completionRate}% completion rate`}
          icon={CheckCircle2}
          color="success"
          delay={50}
        />
        <StatCard
          title="In Progress"
          value={analytics?.in_progress_tasks}
          subtitle="Currently working"
          icon={Clock}
          color="warning"
          delay={100}
        />
        <StatCard
          title="Overdue"
          value={analytics?.overdue_tasks}
          subtitle={analytics?.tasks_due_today ? `${analytics.tasks_due_today} due today` : "None due today"}
          icon={AlertTriangle}
          color="destructive"
          delay={150}
        />
      </motion.div>

      {/* Overdue Banner */}
      {filteredOverdueTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-destructive/30 bg-destructive/10 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-destructive">
                    {filteredOverdueTasks.length} Overdue Task{filteredOverdueTasks.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-destructive/70">Needs your attention</p>
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
        </motion.div>
      )}

      {/* Main Grid: Today's Focus + Upcoming */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6"
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Column - Today's Focus */}
        <motion.div variants={cardItemVariants} className="space-y-4">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Today&apos;s Focus</h1>
            <p className="text-sm text-muted-foreground font-medium">
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
            <Card className="border-success/30 bg-success/10">
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-bold text-foreground">You&apos;re all caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
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

        {/* Right Column - Progress + Upcoming */}
        <motion.div variants={cardItemVariants} className="space-y-6">
          {/* Progress Summary */}
          <Card className="border-success/30 bg-success/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-success/20">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm font-bold text-foreground">Progress</span>
                </div>
                <span className="text-lg font-bold text-success">{completionRate}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-success to-success/80 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground font-medium">
                <span>{analytics?.completed_tasks || 0} completed</span>
                <span>{analytics?.pending_tasks || 0} remaining</span>
              </div>
              {/* Motivational Quote */}
              {completionRate > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">
                      {motivationalQuote.emoji} {motivationalQuote.text}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Section */}
          <Card className="border-info/30 bg-info/10 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-4 px-4 border-b border-info/20">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="p-1 rounded-md bg-info/20">
                  <Clock className="h-3 w-3 text-info" />
                </div>
                Upcoming This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loadingUpcoming ? (
                <div className="space-y-2">
                  <div className="h-8 bg-secondary rounded animate-pulse" />
                  <div className="h-8 bg-secondary rounded animate-pulse" />
                </div>
              ) : Object.keys(upcomingGrouped).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming tasks</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(upcomingGrouped).slice(0, 3).map(([dateLabel, tasks]) => (
                    <div key={dateLabel}>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                        {dateLabel}
                      </p>
                      <div className="space-y-1.5">
                        {tasks.slice(0, 2).map((task) => {
                          const styles = getQuadrantStyles(task.quadrant);
                          return (
                            <motion.div
                              key={task.id}
                              onClick={() => handleTaskClick(task)}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg cursor-pointer",
                                "transition-all duration-150 border-l-4",
                                "hover:shadow-sm hover:-translate-x-0.5",
                                styles.border,
                                styles.bg,
                                styles.borderColor,
                                styles.hover,
                                "group"
                              )}
                            >
                              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", styles.dot)} />
                              <span className="text-sm truncate flex-1 text-foreground font-semibold group-hover:text-foreground">
                                {task.title}
                              </span>
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground">
                                  {format(parseISO(task.due_date), "h:mm a")}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

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
