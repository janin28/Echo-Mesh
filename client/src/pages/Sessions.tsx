import { Sidebar } from "@/components/Sidebar";
import { useSessions } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MonitorSmartphone, Wifi, WifiOff } from "lucide-react";

export default function Sessions() {
  const { data: sessions, isLoading } = useSessions();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 animate-in">
          <h1 className="text-3xl font-bold font-display text-glow">Sessions</h1>
          <p className="text-muted-foreground mt-1">Active client connections handled by your node.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 border-b border-border/50 text-muted-foreground font-mono uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Session ID</th>
                    <th className="px-6 py-4">Buyer ID</th>
                    <th className="px-6 py-4 text-right">Ingress</th>
                    <th className="px-6 py-4 text-right">Egress</th>
                    <th className="px-6 py-4 text-right">Latency</th>
                    <th className="px-6 py-4">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {sessions?.map((session) => (
                    <tr key={session.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          session.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          session.status === 'probing' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                          "bg-muted text-muted-foreground border-border"
                        )}>
                          {session.status === 'active' ? <Wifi className="w-3 h-3" /> : 
                           session.status === 'probing' ? <MonitorSmartphone className="w-3 h-3" /> : 
                           <WifiOff className="w-3 h-3" />}
                          {session.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{session.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 font-mono text-primary">{session.buyerId}</td>
                      <td className="px-6 py-4 text-right font-mono text-muted-foreground">{(session.bytesIngress || 0).toFixed(2)} MB</td>
                      <td className="px-6 py-4 text-right font-mono text-muted-foreground">{(session.bytesEgress || 0).toFixed(2)} MB</td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span className={cn(
                          (session.latencyP95 || 0) < 50 ? "text-green-500" : 
                          (session.latencyP95 || 0) < 150 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {session.latencyP95}ms
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {session.startedAt ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true }) : '-'}
                      </td>
                    </tr>
                  ))}
                  
                  {(!sessions || sessions.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <MonitorSmartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        No active sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
