
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

// Node Information
export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull().unique(),
  reputation: doublePrecision("reputation").default(100), // 0-100 score
  totalEarningsCredits: doublePrecision("total_earnings_credits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Active/Past Sessions
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // UUID from coordinator
  buyerId: text("buyer_id").notNull(),
  nodeId: text("node_id").notNull(), // Foreign key reference
  status: text("status").notNull(), // 'active', 'idle', 'probing', 'closed', 'quarantine'
  bytesIngress: doublePrecision("bytes_ingress").default(0),
  bytesEgress: doublePrecision("bytes_egress").default(0),
  bytesTransferred: doublePrecision("bytes_transferred").default(0),
  errorRate: doublePrecision("error_rate").default(0), // 0-1 as decimal (0.05 = 5%)
  latencyP95: integer("latency_p95").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  resolvedAt: timestamp("resolved_at"), // When payout was settled
});

// Payout Records
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull(),
  sessionId: text("session_id").notNull(),
  amountCredits: doublePrecision("amount_credits").notNull(),
  status: text("status").notNull(), // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  baseRate: doublePrecision("base_rate").default(0.0005), // $0.50 per GB
  qosPenaltyApplied: boolean("qos_penalty_applied").default(false),
  reputationWeight: doublePrecision("reputation_weight").default(1.0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
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
  errorRatePct: doublePrecision("error_rate_pct").default(0), // Percentage of failed requests
  probePassRatePct: doublePrecision("probe_pass_rate_pct").default(100), // Percentage of successful probes
  latencyP95: integer("latency_p95_ms").default(0), // p95 latency in ms
});

// Health Status
export const health = pgTable("health", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  coordinatorReachable: boolean("coordinator_reachable").default(true),
  internalProxyHealthy: boolean("internal_proxy_healthy").default(true),
  probeExecutorHealthy: boolean("probe_executor_healthy").default(true),
  policyViolationDetected: boolean("policy_violation_detected").default(false),
  autoRecoveryActive: boolean("auto_recovery_active").default(false),
  alerts: jsonb("alerts").$type<{ level: 'error' | 'warning' | 'info'; message: string; timestamp: string }[]>().default([]),
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
export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions);
export const insertMetricSchema = createInsertSchema(metrics).omit({ id: true, timestamp: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });
export const insertHealthSchema = createInsertSchema(health).omit({ id: true, timestamp: true });
export const insertPayoutSchema = createInsertSchema(payouts).omit({ id: true, createdAt: true });

// === EXPLICIT TYPES ===
export type Config = typeof config.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;

export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Metric = typeof metrics.$inferSelect;
export type Health = typeof health.$inferSelect;
export type Log = typeof logs.$inferSelect;

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

// Request/Response Types
export type ConfigUpdateRequest = Partial<InsertConfig>;
export type HealthStatus = {
  coordinatorReachable: boolean;
  internalProxyHealthy: boolean;
  probeExecutorHealthy: boolean;
  policyViolationDetected: boolean;
  autoRecoveryActive: boolean;
  alerts: { level: 'error' | 'warning' | 'info'; message: string; timestamp: string }[];
};
export type DashboardStats = {
  status: 'running' | 'paused' | 'stopped';
  earningsToday: number;
  totalDataToday: number; // GB
  reputationScore: number;
  uptimeSeconds: number;
  health: HealthStatus;
};

export type SettlementRequest = {
  sessionId: string;
};

export type SettlementResponse = {
  success: boolean;
  payout?: Payout;
  message?: string;
};
