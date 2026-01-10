"use client";

import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TimePeriod = "week" | "month" | "3months";

interface TimelineViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
}

export function TimelineView({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onClick,
}: TimelineViewProps) {
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [startDate, setStartDate] = useState(new Date());

  const getDaysInPeriod = () => {
    if (period === "week") return 7;
    if (period === "month") return 30;
    return 90; // 3months
  };

  const daysInPeriod = getDaysInPeriod();
  const endDate = new Date(startDate.getTime() + daysInPeriod * 24 * 60 * 60 * 1000);

  // Group tasks by date
  const timelineData = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysInPeriod; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().split("T")[0];
      grouped[key] = [];
    }

    tasks.forEach((task) => {
      if (!task.due_date) {
        grouped["no-date"] = grouped["no-date"] || [];
        grouped["no-date"].push(task);
      } else {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const key = dueDate.toISOString().split("T")[0];
        if (grouped[key]) {
          grouped[key].push(task);
        }
      }
    });

    return Object.entries(grouped).filter(([, items]) => items.length > 0);
  }, [tasks, startDate, daysInPeriod]);

  const isToday = (dateStr: string) => {
    if (dateStr === "no-date") return false;
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (dateStr: string) => {
    if (dateStr === "no-date") return "No Due Date";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handlePrevious = () => {
    const newDate = new Date(startDate);
    if (period === "week") newDate.setDate(newDate.getDate() - 7);
    else if (period === "month") newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setMonth(newDate.getMonth() - 3);
    setStartDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(startDate);
    if (period === "week") newDate.setDate(newDate.getDate() + 7);
    else if (period === "month") newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setMonth(newDate.getMonth() + 3);
    setStartDate(newDate);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["week", "month", "3months"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as TimePeriod)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                period === p
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-white hover:bg-secondary/50"
              )}
            >
              {p === "week" && "Week"}
              {p === "month" && "Month"}
              {p === "3months" && "3 Months"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            —{" "}
            {endDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-400px)]">
        {timelineData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No tasks in this period</p>
          </div>
        ) : (
          <motion.div
            className="space-y-6"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
            initial="hidden"
            animate="show"
          >
            {timelineData.map(([dateStr, dateTasks]) => (
              <motion.div
                key={dateStr}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 },
                }}
                className="space-y-3"
              >
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  {isToday(dateStr) && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                  <h3 className="text-sm font-semibold text-white">
                    {formatDate(dateStr)}
                  </h3>
                  {isToday(dateStr) && (
                    <Badge variant="secondary" className="text-xs">
                      Today
                    </Badge>
                  )}
                </div>

                {/* Tasks for this date */}
                <div className="space-y-2 ml-5 border-l-2 border-primary/20 pl-4">
                  {dateTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      whileHover={{ x: 4 }}
                      onClick={() => onClick(task)}
                      className={cn(
                        "p-3 rounded-lg bg-secondary border border-border transition-all cursor-pointer group",
                        "hover:shadow-md hover:border-primary/40",
                        task.status === "done" && "opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.status === "done"}
                          onChange={() => onComplete(task.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 cursor-pointer accent-primary"
                        />

                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "font-medium text-sm text-white truncate",
                              task.status === "done" && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </p>
                          {task.category && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.category.name}
                            </p>
                          )}
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                            }}
                          >
                            <Edit2 className="h-3 w-3 text-primary" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(task.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
