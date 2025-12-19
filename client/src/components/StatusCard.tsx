import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "secondary" | "accent" | "destructive";
}

export function StatusCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp,
  color = "primary" 
}: StatusCardProps) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    secondary: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl hover:border-border transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold mt-2 font-display tracking-tight text-foreground group-hover:text-glow transition-all">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl border", colorMap[color])}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className={cn(
            "font-medium", 
            trendUp ? "text-green-500" : "text-red-500"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
          <span className="text-muted-foreground">vs yesterday</span>
        </div>
      )}
    </div>
  );
}
