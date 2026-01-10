"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load data. Please try again.",
  actionLabel = "Try again",
  onAction,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-destructive bg-destructive/10 p-6"
    >
      <div className="flex gap-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
        </motion.div>
        <div className="flex-1">
          <h3 className="font-semibold text-destructive mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          {onAction && (
            <Button size="sm" variant="outline" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
