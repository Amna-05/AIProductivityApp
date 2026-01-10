"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  onClick?: () => void;
}

const CountUp = ({ end, duration = 1000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(end * progress));
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [end, duration]);

  return <>{count}</>;
};

export function MetricCard({
  title,
  value,
  icon,
  trend,
  description,
  onClick,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, borderColor: "rgb(255, 107, 53)" }}
    >
      <Card
        variant="metric"
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-primary text-lg">
                {icon}
              </div>
            )}
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-4xl font-black text-primary">
              <CountUp end={value} />
            </p>
          </motion.div>
          {trend && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className={`text-xs font-semibold ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </motion.span>
          )}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
