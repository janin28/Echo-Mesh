import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ConfigUpdateRequest } from "@shared/routes";
import { type InsertConfig, type Session, type Metric, type Log, type DashboardStats } from "@shared/schema";

// === CONFIGURATION ===

export function useConfig() {
  return useQuery({
    queryKey: [api.config.get.path],
    queryFn: async () => {
      const res = await fetch(api.config.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch configuration");
      return api.config.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConfigUpdateRequest) => {
      const validated = api.config.update.input.parse(data);
      const res = await fetch(api.config.update.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error("Validation failed");
        }
        throw new Error("Failed to update configuration");
      }
      return api.config.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.config.get.path] });
    },
  });
}

// === STATS & CONTROL ===

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      // Use zod parse directly if possible, or just cast if response object is complex
      return api.stats.get.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Refresh every 5s
  });
}

export function useControlNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: 'start' | 'stop' | 'pause') => {
      const url = buildUrl(api.control.post.path, { action });
      const res = await fetch(url, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Control action failed");
      return api.control.post.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

// === SESSIONS ===

export function useSessions() {
  return useQuery({
    queryKey: [api.sessions.list.path],
    queryFn: async () => {
      const res = await fetch(api.sessions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return api.sessions.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}

// === METRICS ===

export function useMetrics(limit: number = 50) {
  return useQuery({
    queryKey: [api.metrics.list.path, limit],
    queryFn: async () => {
      const url = `${api.metrics.list.path}?limit=${limit}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return api.metrics.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Frequent updates for charts
  });
}

// === LOGS ===

export function useLogs(limit: number = 100) {
  return useQuery({
    queryKey: [api.logs.list.path, limit],
    queryFn: async () => {
      const url = `${api.logs.list.path}?limit=${limit}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.logs.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}
