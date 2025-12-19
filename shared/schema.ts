
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Node Configuration
export const config = pgTable("config", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull(),
  maxMbps: integer("max_mbps").default(10),
  maxDailyGb: integer("max_daily_gb").default(20),
  httpsOnly: boolean("https_only").default(true),
  sandboxMode: text("sandbox_mode").default("strict"),
  schedules: jsonb("schedules").$type<{ days: string[], start: string, end: string }[]>().default([]),
  regionAllow: text("region_allow").array().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Active/Past Sessions
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // UUID from coordinator
  buyerId: text("buyer_id").notNull(),
  status: text("status").notNull(), // 'active', 'idle', 'probing', 'closed', 'quarantine'
  bytesIngress: doublePrecision("bytes_ingress").default(0),
  bytesEgress: doublePrecision("bytes_egress").default(0),
  latencyP95: integer("latency_p95").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// System Metrics (Snapshot for graphs)
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  ingressRate: doublePrecision("ingress_rate").default(0), // Mbps
  egressRate: doublePrecision("egress_rate").default(0), // Mbps
  activeSessions: integer("active_sessions").default(0),
  cpuUsage: doublePrecision("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0), // MB
});

// Activity Logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  level: text("level").notNull(), // 'info', 'warn', 'error'
  message: text("message").notNull(),
  category: text("category").notNull(), // 'system', 'network', 'policy'
});

// === SCHEMAS ===
export const insertConfigSchema = createInsertSchema(config).omit({ id: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(sessions);
export const insertMetricSchema = createInsertSchema(metrics).omit({ id: true, timestamp: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });

// === EXPLICIT TYPES ===
export type Config = typeof config.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Metric = typeof metrics.$inferSelect;
export type Log = typeof logs.$inferSelect;

// Request/Response Types
export type ConfigUpdateRequest = Partial<InsertConfig>;
export type DashboardStats = {
  status: 'running' | 'paused' | 'stopped';
  earningsToday: number;
  totalDataToday: number; // GB
  reputationScore: number;
  uptimeSeconds: number;
};
