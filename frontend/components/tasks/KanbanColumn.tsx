"use client";

import { Task, TaskStatus } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";
import { motion } from "framer-motion";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils/cn";

const statusConfig: Record<
  TaskStatus,
  { title: string; icon: string; color: string; bgColor: string }
> = {
  todo: {
    title: "To Do",
    icon: "📋",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
  in_progress: {
    title: "In Progress",
    icon: "⚡",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  done: {
    title: "Done",
    icon: "✓",
    color: "text-success",
    bgColor: "bg-success/10",
  },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
}

export function KanbanColumn({
  status,
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onClick,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `column-${status}`,
  });

  const config = statusConfig[status];
  const taskIds = tasks.map((t) => t.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-w-80 bg-secondary/50 rounded-xl p-4 border border-border space-y-4"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{config.title}</h3>
            <p className="text-xs text-muted-foreground">{tasks.length} tasks</p>
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            config.bgColor,
            config.color
          )}
        >
          {tasks.length}
        </div>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 min-h-96 rounded-lg transition-colors hover:bg-secondary/30"
      >
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length > 0 ? (
            <motion.div
              className="space-y-2"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              initial="hidden"
              animate="show"
            >
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <KanbanCard
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onComplete={onComplete}
                    onClick={onClick}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-sm text-muted-foreground">
                No tasks yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag tasks here or create new ones
              </p>
            </motion.div>
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
}
