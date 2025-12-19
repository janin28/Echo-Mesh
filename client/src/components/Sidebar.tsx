import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Settings, 
  Network, 
  TerminalSquare, 
  Zap,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Sessions", icon: Network, href: "/sessions" },
  { label: "Configuration", icon: Settings, href: "/config" },
  { label: "System Logs", icon: TerminalSquare, href: "/logs" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-border/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight text-white">EchoMesh</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-muted-foreground font-mono">DAEMON ONLINE</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs font-mono uppercase">
            <Activity className="w-3 h-3" />
            System Status
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CPU</span>
              <span className="font-mono text-primary">12%</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[12%]" />
            </div>
            
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">RAM</span>
              <span className="font-mono text-accent">450MB</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div className="h-full bg-accent w-[30%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
