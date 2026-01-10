import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-secondary rounded-lg", className)}
      {...props}
    />
  );
}

export { Skeleton };
