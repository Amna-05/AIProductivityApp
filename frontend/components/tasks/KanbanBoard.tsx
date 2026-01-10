"use client";

import { Task, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
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
} from "@dnd-kit/core";
import { useState } from "react";
import { KanbanCard } from "./KanbanCard";

const columns: TaskStatus[] = ["todo", "in_progress", "done"];

interface KanbanBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
  onTaskStatusChange: (taskId: number, newStatus: TaskStatus) => void;
}

export function KanbanBoard({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onClick,
  onTaskStatusChange,
}: KanbanBoardProps) {
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
    if (!overId.startsWith("column-")) return;

    const newStatus = overId.replace("column-", "") as TaskStatus;
    const taskId = active.id as number;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      onTaskStatusChange(taskId, newStatus);
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId);

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
        className="flex gap-6 overflow-x-auto pb-4 -mr-6 pr-6"
      >
        {columns.map((status, idx) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              <KanbanColumn
                status={status}
                tasks={columnTasks}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onClick={onClick}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 shadow-2xl rotate-3">
            <KanbanCard
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
