import { 
  Activity, 
  DollarSign, 
  Database, 
  ShieldCheck, 
  Play, 
  Pause, 
  Power
} from "lucide-react";
import { useStats, useControlNode, useLogs } from "@/hooks/use-dashboard";
import { Sidebar } from "@/components/Sidebar";
import { StatusCard } from "@/components/StatusCard";
import { NetworkChart } from "@/components/NetworkChart";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Overview() {
  const { data: stats } = useStats();
  const { mutate: controlNode, isPending } = useControlNode();
  const { data: recentLogs } = useLogs(5);

  const isRunning = stats?.status === 'running';

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-bold font-display text-glow">Overview</h1>
            <p className="text-muted-foreground mt-1">Real-time node performance and metrics.</p>
            {import.meta.env.VITE_SOLANA_PUBKEY && (
              <p className="text-xs font-mono text-primary/70 mt-2 truncate max-w-[300px]" title={import.meta.env.VITE_SOLANA_PUBKEY}>
                Wallet: {import.meta.env.VITE_SOLANA_PUBKEY}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2",
              isRunning 
                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                : "bg-red-500/10 text-red-500 border-red-500/20"
            )}>
              <span className={cn("w-2 h-2 rounded-full animate-pulse", isRunning ? "bg-green-500" : "bg-red-500")} />
              {stats?.status?.toUpperCase() || "UNKNOWN"}
            </div>

            <Button
              onClick={() => controlNode(isRunning ? 'stop' : 'start')}
              disabled={isPending}
              variant={isRunning ? "destructive" : "default"}
              className={cn(
                "gap-2 shadow-lg hover:shadow-xl transition-all",
                !isRunning && "bg-primary hover:bg-primary/90 shadow-primary/25"
              )}
            >
              {isPending ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : isRunning ? (
                <><Power className="w-4 h-4" /> Stop Daemon</>
              ) : (
                <><Play className="w-4 h-4" /> Start Daemon</>
              )}
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in" style={{ animationDelay: '0.1s' }}>
          <StatusCard 
            title="Earnings Today" 
            value={`$${stats?.earningsToday?.toFixed(2) || '0.00'}`} 
            icon={<DollarSign className="w-6 h-6" />} 
            color="primary"
            trend="+12%"
            trendUp={true}
          />
          <StatusCard 
            title="Data Used" 
            value={`${stats?.totalDataToday?.toFixed(2) || '0.00'} GB`} 
            icon={<Database className="w-6 h-6" />} 
            color="secondary"
          />
          <StatusCard 
            title="Reputation" 
            value={`${stats?.reputationScore?.toFixed(0) || '0'}/100`} 
            icon={<ShieldCheck className="w-6 h-6" />} 
            color="accent"
          />
          <StatusCard 
            title="Uptime" 
            value={`${Math.floor((stats?.uptimeSeconds || 0) / 3600)}h`} 
            icon={<Activity className="w-6 h-6" />} 
            color="secondary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in" style={{ animationDelay: '0.2s' }}>
          {/* Main Chart Section */}
          <div className="lg:col-span-2">
            <NetworkChart />
          </div>

          {/* Recent Logs Widget */}
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg flex flex-col">
            <h3 className="text-lg font-bold font-display mb-4">Recent Activity</h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
              {recentLogs?.map((log, i) => (
                <div key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors">
                  <div className={cn(
                    "w-1.5 h-1.5 mt-1.5 rounded-full shrink-0",
                    log.level === 'error' ? "bg-red-500" :
                    log.level === 'warn' ? "bg-yellow-500" : "bg-blue-500"
                  )} />
                  <div className="overflow-hidden">
                    <p className="text-foreground truncate font-mono text-xs mb-0.5">{log.message}</p>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span>{format(new Date(log.timestamp || Date.now()), 'HH:mm:ss')}</span>
                      <span>•</span>
                      <span className="uppercase">{log.category}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!recentLogs || recentLogs.length === 0) && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No recent logs
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
