import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  iconColor?: string;
  valueColor?: string;
}

export function StatCard({ icon: Icon, label, value, iconColor, valueColor }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-8 w-8 shrink-0", iconColor)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn("text-3xl font-bold", valueColor)}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
