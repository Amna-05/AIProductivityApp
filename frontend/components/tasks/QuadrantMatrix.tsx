"use client";

import { Task, TaskQuadrant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { Edit2, Trash2, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const quadrants = [
  {
    id: "DO_FIRST",
    label: "Do First",
    description: "Urgent & Important",
    icon: "🔴",
    color: "border-red-500",
    bgColor: "bg-red-500/10",
    accent: "text-red-400",
  },
  {
    id: "SCHEDULE",
    label: "Schedule",
    description: "Not Urgent & Important",
    icon: "🟠",
    color: "border-orange-500",
    bgColor: "bg-orange-500/10",
    accent: "text-orange-400",
  },
  {
    id: "DELEGATE",
    label: "Delegate",
    description: "Urgent & Not Important",
    icon: "🟡",
    color: "border-amber-400",
    bgColor: "bg-amber-400/10",
    accent: "text-amber-400",
  },
  {
    id: "ELIMINATE",
    label: "Eliminate",
    description: "Not Urgent & Not Important",
    icon: "⚫",
    color: "border-gray-600",
    bgColor: "bg-gray-600/10",
    accent: "text-gray-400",
  },
];

interface QuadrantMatrixProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
  onTaskQuadrantChange: (taskId: number, quadrant: TaskQuadrant) => void;
}

function QuadrantCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onClick,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isDragging && !e.ctrlKey && !e.metaKey) {
      onClick(task);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      whileHover={{ y: -2 }}
      className={cn(
        "group bg-secondary rounded-lg p-3 cursor-move transition-all",
        "border border-border hover:shadow-md hover:border-primary/40",
        task.status === "done" && "opacity-60"
      )}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start gap-2">
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={() => onComplete(task.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium text-white truncate",
                task.status === "done" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </p>
          </div>

          {/* Quick Actions */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-1"
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(task);
                }}
              >
                <Eye className="h-3.5 w-3.5 text-primary" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
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
            </motion.div>
          )}
        </div>

        {/* Meta */}
        {(task.category || task.tags?.length) && (
          <div className="flex flex-wrap gap-1">
            {task.category && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {task.category.name}
              </Badge>
            )}
            {task.tags?.slice(0, 1).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs px-2 py-0.5"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Due Date */}
        {task.due_date && (
          <p className="text-xs text-muted-foreground">
            {new Date(task.due_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function MatrixQuadrant({
  quadrant,
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onClick,
}: {
  quadrant: (typeof quadrants)[0];
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: `quadrant-${quadrant.id}`,
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col rounded-xl border-2 p-6 space-y-4 min-h-96",
        quadrant.color,
        quadrant.bgColor
      )}
    >
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-current border-opacity-20">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{quadrant.icon}</span>
          <div>
            <h3 className={cn("font-bold text-lg", quadrant.accent)}>
              {quadrant.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {quadrant.description}
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 min-h-64"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            <motion.div
              className="space-y-2"
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
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <QuadrantCard
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
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <p className="text-sm font-medium">No tasks</p>
                <p className="text-xs mt-1">Drag tasks here</p>
              </div>
            </div>
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
}

export function QuadrantMatrix({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onClick,
  onTaskQuadrantChange,
}: QuadrantMatrixProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("quadrant-")) return;

    const newQuadrant = overId.replace("quadrant-", "") as TaskQuadrant;
    const taskId = active.id as number;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.is_urgent !== (newQuadrant === "DO_FIRST" || newQuadrant === "DELEGATE")) {
      onTaskQuadrantChange(taskId, newQuadrant);
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  const getTasksByQuadrant = (quadrantId: string): Task[] => {
    return tasks.filter((task) => {
      if (quadrantId === "DO_FIRST") return task.is_urgent && task.is_important;
      if (quadrantId === "SCHEDULE") return !task.is_urgent && task.is_important;
      if (quadrantId === "DELEGATE") return task.is_urgent && !task.is_important;
      return !task.is_urgent && !task.is_important;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quadrants.map((quadrant, idx) => (
            <motion.div
              key={quadrant.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              <MatrixQuadrant
                quadrant={quadrant}
                tasks={getTasksByQuadrant(quadrant.id)}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onClick={onClick}
              />
            </motion.div>
          ))}
        </div>

        {/* Info Text */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-white mb-1">Vertical Axis: Importance</p>
            <p>↑ Important | ↓ Not Important</p>
          </div>
          <div>
            <p className="font-medium text-white mb-1">Horizontal Axis: Urgency</p>
            <p>← Not Urgent | Urgent →</p>
          </div>
        </div>
      </motion.div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 shadow-2xl rotate-3">
            <QuadrantCard
              task={activeTask}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onClick={onClick}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
