import { Sidebar } from "@/components/Sidebar";
import { useConfig, useUpdateConfig } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConfigSchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = insertConfigSchema.pick({
  maxMbps: true,
  maxDailyGb: true,
  httpsOnly: true,
  sandboxMode: true,
  regionAllow: true,
});

type FormValues = z.infer<typeof formSchema>;

export default function Config() {
  const { data: config, isLoading } = useConfig();
  const { mutate: updateConfig, isPending } = useUpdateConfig();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maxMbps: 10,
      maxDailyGb: 20,
      httpsOnly: true,
      sandboxMode: "strict",
      regionAllow: [],
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        maxMbps: config.maxMbps || 10,
        maxDailyGb: config.maxDailyGb || 20,
        httpsOnly: config.httpsOnly ?? true,
        sandboxMode: config.sandboxMode || "strict",
        regionAllow: config.regionAllow || [],
      });
    }
  }, [config, form]);

  const onSubmit = (data: FormValues) => {
    updateConfig(data, {
      onSuccess: () => {
        toast({
          title: "Configuration Saved",
          description: "Your node settings have been updated successfully.",
        });
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 animate-in">
          <h1 className="text-3xl font-bold font-display text-glow">Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage bandwidth limits and security policies.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-w-2xl animate-in" style={{ animationDelay: '0.1s' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Bandwidth Limits Card */}
                <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg space-y-6">
                  <div className="flex items-center gap-2 text-primary font-bold text-lg font-display">
                    <span className="w-1 h-6 bg-primary rounded-full" />
                    Limits & Bandwidth
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="maxMbps"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between mb-2">
                          <FormLabel>Max Throughput (Mbps)</FormLabel>
                          <span className="text-sm font-mono text-primary font-bold">{field.value} Mbps</span>
                        </div>
                        <FormControl>
                          <Slider 
                            min={1} 
                            max={100} 
                            step={1} 
                            value={[field.value || 10]} 
                            onValueChange={(val) => field.onChange(val[0])}
                            className="py-4"
                          />
                        </FormControl>
                        <FormDescription>Limits the maximum upload/download speed per session.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxDailyGb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Data Cap (GB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(Number(e.target.value))}
                            className="bg-background/50 border-border/50 font-mono"
                          />
                        </FormControl>
                        <FormDescription>Node stops accepting new sessions after this limit.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Security Settings Card */}
                <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg space-y-6">
                  <div className="flex items-center gap-2 text-accent font-bold text-lg font-display">
                    <span className="w-1 h-6 bg-accent rounded-full" />
                    Security & Sandbox
                  </div>

                  <FormField
                    control={form.control}
                    name="httpsOnly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-background/30 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">HTTPS Only</FormLabel>
                          <FormDescription>
                            Block all unencrypted HTTP traffic.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sandboxMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sandbox Isolation Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "strict"}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 border-border/50">
                              <SelectValue placeholder="Select a mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="strict">Strict (Recommended)</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="open">Open (Risky)</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.value === 'open' && (
                          <div className="flex items-center gap-2 mt-2 text-yellow-500 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Warning: This reduces isolation security.</span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 min-w-[150px]"
                  >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </main>
    </div>
  );
}
