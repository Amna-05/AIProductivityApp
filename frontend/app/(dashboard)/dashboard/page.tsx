"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Calendar as CalendarIcon, Loader2, PartyPopper } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay } from "date-fns";

import { analyticsApi } from "@/lib/api/analytics";
import { tasksApi } from "@/lib/api/tasks";
import { useSearch } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { TaskCard, TaskCardSkeleton } from "@/components/tasks/TaskCard";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { cn } from "@/lib/utils/cn";
import { Task } from "@/lib/types";
import { toast } from "sonner";

export default function DashboardPage() {
  const { searchQuery } = useSearch();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.update(taskId, { status: "done" }),
    onMutate: (taskId) => {
      setCompletedTaskId(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Task completed!", {
        icon: <PartyPopper className="h-4 w-4" />,
      });
    },
    onSettled: () => {
      setTimeout(() => setCompletedTaskId(null), 300);
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

  // Calendar date modifiers
  const dateModifiers = useMemo(() => {
    const allTasks = [...(todayData?.tasks || []), ...(upcomingData?.tasks || [])];
    const taskDates: Date[] = [];
    const overdueDates: Date[] = [];
    const now = new Date();

    allTasks.forEach((task) => {
      if (!task.due_date) return;
      const dueDate = parseISO(task.due_date);
      if (dueDate < now && !isToday(dueDate)) {
        overdueDates.push(dueDate);
      } else {
        taskDates.push(dueDate);
      }
    });

    return { taskDates, overdueDates };
  }, [todayData, upcomingData]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleComplete = (taskId: number) => {
    completeMutation.mutate(taskId);
  };

  const completionRate = analytics?.total_tasks
    ? Math.round((analytics.completed_tasks / analytics.total_tasks) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Overdue Banner */}
      {filteredOverdueTasks.length > 0 && (
        <Card className="border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5 animate-scale-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">
                  {filteredOverdueTasks.length} Overdue Task{filteredOverdueTasks.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">Needs your attention</p>
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

      {/* Main Grid: Today's Focus + Upcoming */}
      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Today's Focus */}
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Today's Focus</h1>
            <p className="text-sm text-muted-foreground">
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
            <Card variant="flat" className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary/60 mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground">You're all caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No tasks due today. Enjoy your day!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTodayTasks.slice(0, 5).map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="minimal"
                  onComplete={handleComplete}
                  onClick={handleTaskClick}
                  animationDelay={idx * 50}
                  className={cn(
                    completedTaskId === task.id && "opacity-50 scale-95 transition-all"
                  )}
                />
              ))}
              {filteredTodayTasks.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{filteredTodayTasks.length - 5} more tasks
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming + Calendar */}
        <div className="space-y-6">
          {/* Upcoming Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>

            {loadingUpcoming ? (
              <div className="space-y-2">
                <TaskCardSkeleton variant="minimal" />
                <TaskCardSkeleton variant="minimal" />
              </div>
            ) : Object.keys(upcomingGrouped).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No upcoming tasks this week</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(upcomingGrouped).slice(0, 3).map(([dateLabel, tasks]) => (
                  <div key={dateLabel}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{dateLabel}</p>
                    <div className="space-y-1.5">
                      {tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            task.quadrant === "DO_FIRST" && "bg-red-500",
                            task.quadrant === "SCHEDULE" && "bg-amber-500",
                            task.quadrant === "DELEGATE" && "bg-blue-500",
                            task.quadrant === "ELIMINATE" && "bg-gray-400"
                          )} />
                          <span className="text-sm truncate flex-1 text-foreground">{task.title}</span>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(task.due_date), "h:mm a")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Widget - Hidden on mobile per user decision */}
          <div className="hidden lg:block">
            <Card variant="flat" className="bg-card/50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Calendar
                  mode="single"
                  className="rounded-lg"
                  modifiers={{
                    hasTask: dateModifiers.taskDates,
                    overdue: dateModifiers.overdueDates,
                  }}
                  modifiersClassNames={{
                    hasTask: "font-semibold bg-primary/10 text-primary",
                    overdue: "font-bold bg-destructive/10 text-destructive",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Progress Summary */}
          <Card variant="flat" className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Today's Progress</span>
                <span className="text-sm font-bold text-primary">{completionRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>{analytics?.completed_tasks || 0} completed</span>
                <span>{analytics?.pending_tasks || 0} remaining</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <TaskFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
