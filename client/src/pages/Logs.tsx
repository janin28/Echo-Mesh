import { Sidebar } from "@/components/Sidebar";
import { useLogs } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, TerminalSquare } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Logs() {
  const { data: logs, isLoading } = useLogs(200);
  const [search, setSearch] = useState("");

  const filteredLogs = logs?.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) || 
    log.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto flex flex-col h-screen">
        <header className="mb-6 animate-in flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold font-display text-glow">System Logs</h1>
            <p className="text-muted-foreground mt-1">Diagnostic events and daemon output.</p>
          </div>
          <div className="w-64">
             <Input 
               placeholder="Filter logs..." 
               className="bg-card/50 border-border/50"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 bg-black/40 rounded-2xl border border-border/50 shadow-inner overflow-hidden flex flex-col font-mono text-sm animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-muted/30 border-b border-border/50 px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground font-semibold uppercase">
              <span className="w-24">Timestamp</span>
              <span className="w-16">Level</span>
              <span className="w-24">Category</span>
              <span>Message</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredLogs?.map((log) => (
                <div key={log.id} className="flex gap-4 px-2 py-1 hover:bg-white/5 rounded transition-colors group">
                  <span className="text-muted-foreground w-24 shrink-0 text-xs mt-0.5">
                    {format(new Date(log.timestamp || Date.now()), 'HH:mm:ss.SSS')}
                  </span>
                  <span className={cn(
                    "w-16 shrink-0 font-bold text-xs uppercase mt-0.5",
                    log.level === 'error' ? "text-red-500" :
                    log.level === 'warn' ? "text-yellow-500" : "text-blue-400"
                  )}>
                    {log.level}
                  </span>
                  <span className="w-24 shrink-0 text-muted-foreground text-xs uppercase mt-0.5 opacity-70">
                    {log.category}
                  </span>
                  <span className="text-foreground/90 break-all">{log.message}</span>
                </div>
              ))}
              {(!filteredLogs || filteredLogs.length === 0) && (
                <div className="text-center text-muted-foreground py-20">
                  <TerminalSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No logs found
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
