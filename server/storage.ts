
import { db } from "./db";
import {
  config, sessions, metrics, logs, health, nodes, payouts,
  type Config, type InsertConfig,
  type Session, type InsertSession,
  type Metric, type Log, type Health, type Node, type Payout,
  type ConfigUpdateRequest
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Config
  getConfig(): Promise<Config | undefined>;
  updateConfig(updates: ConfigUpdateRequest): Promise<Config>;
  
  // Sessions
  getSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;
  
  // Metrics
  getMetrics(limit?: number): Promise<Metric[]>;
  addMetric(metric: typeof metrics.$inferInsert): Promise<Metric>;
  
  // Logs
  getLogs(limit?: number): Promise<Log[]>;
  addLog(log: typeof logs.$inferInsert): Promise<Log>;

  // Health
  getLatestHealth(): Promise<Health | undefined>;
  updateHealth(updates: Partial<Health>): Promise<Health>;

  // Nodes
  getOrCreateNode(nodeId: string): Promise<Node>;
  updateNodeReputation(nodeId: string, reputation: number): Promise<Node>;

  // Payouts & Settlement
  getPayouts(): Promise<Payout[]>;
  settleSession(sessionId: string, nodeId: string): Promise<Payout>;

  // Dashboard Stats (Aggregated)
  getDashboardStats(): Promise<{
    earningsToday: number;
    totalDataToday: number;
    reputationScore: number;
    uptimeSeconds: number;
    health: {
      coordinatorReachable: boolean;
      internalProxyHealthy: boolean;
      probeExecutorHealthy: boolean;
      policyViolationDetected: boolean;
      autoRecoveryActive: boolean;
      alerts: { level: 'error' | 'warning' | 'info'; message: string; timestamp: string }[];
    };
  }>;
}

export class DatabaseStorage implements IStorage {
  async getConfig(): Promise<Config | undefined> {
    const [cfg] = await db.select().from(config).limit(1);
    return cfg;
  }

  async updateConfig(updates: ConfigUpdateRequest): Promise<Config> {
    // Upsert config since we only have one row usually
    const existing = await this.getConfig();
    if (existing) {
      const [updated] = await db.update(config)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(config.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(config)
        .values({ 
          nodeId: "dev-node-id", // Default for first insert
          ...updates 
        } as InsertConfig)
        .returning();
      return created;
    }
  }

  async getSessions(): Promise<Session[]> {
    return await db.select().from(sessions).orderBy(desc(sessions.startedAt));
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(sessions).values(session).returning();
    return created;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const [updated] = await db.update(sessions)
      .set(updates)
      .where(eq(sessions.id, id))
      .returning();
    return updated;
  }

  async getMetrics(limit = 60): Promise<Metric[]> {
    return await db.select().from(metrics)
      .orderBy(desc(metrics.timestamp))
      .limit(limit);
  }

  async addMetric(metric: typeof metrics.$inferInsert): Promise<Metric> {
    const [created] = await db.insert(metrics).values(metric).returning();
    return created;
  }

  async getLogs(limit = 100): Promise<Log[]> {
    return await db.select().from(logs)
      .orderBy(desc(logs.timestamp))
      .limit(limit);
  }

  async addLog(log: typeof logs.$inferInsert): Promise<Log> {
    const [created] = await db.insert(logs).values(log).returning();
    return created;
  }

  async getLatestHealth(): Promise<Health | undefined> {
    const [h] = await db.select().from(health).orderBy(desc(health.timestamp)).limit(1);
    return h;
  }

  async updateHealth(updates: Partial<Health>): Promise<Health> {
    const existing = await this.getLatestHealth();
    if (existing) {
      const [updated] = await db.update(health)
        .set(updates)
        .where(eq(health.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(health).values(updates as any).returning();
      return created;
    }
  }

  async getOrCreateNode(nodeId: string): Promise<Node> {
    const [existing] = await db.select().from(nodes).where(eq(nodes.nodeId, nodeId));
    if (existing) return existing;

    const [created] = await db.insert(nodes).values({ nodeId, reputation: 100 }).returning();
    return created;
  }

  async updateNodeReputation(nodeId: string, reputation: number): Promise<Node> {
    const [updated] = await db.update(nodes)
      .set({ reputation })
      .where(eq(nodes.nodeId, nodeId))
      .returning();
    return updated;
  }

  async getPayouts(): Promise<Payout[]> {
    return await db.select().from(payouts).orderBy(desc(payouts.createdAt));
  }

  async settleSession(sessionId: string, nodeId: string): Promise<Payout> {
    // Fetch session and ensure node exists
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) throw new Error("Session not found");

    const node = await this.getOrCreateNode(nodeId);

    // Calculate payout using provided formula
    const baseRate = 0.0005; // $0.50 per GB
    const gbTransferred = Math.max(session.bytesIngress, session.bytesEgress) / (1024 ** 3);

    let amount = gbTransferred * baseRate;
    let qosPenaltyApplied = false;

    // QoS Penalty: 20% reduction if error rate > 5%
    if (session.errorRate && session.errorRate > 0.05) {
      amount *= 0.8;
      qosPenaltyApplied = true;
    }

    // Reputation Weight
    const reputationWeight = node.reputation / 100;
    const finalAmount = amount * reputationWeight;

    // Create payout in transaction
    const [payout] = await db.transaction(async (tx) => {
      const result = await tx.insert(payouts).values({
        nodeId: node.nodeId,
        sessionId: session.id,
        amountCredits: finalAmount,
        status: "COMPLETED",
        baseRate,
        qosPenaltyApplied,
        reputationWeight,
        completedAt: new Date(),
      }).returning();

      // Update session status
      await tx.update(sessions)
        .set({ status: "closed", resolvedAt: new Date() })
        .where(eq(sessions.id, sessionId));

      // Update node earnings
      const updatedNode = node;
      updatedNode.totalEarningsCredits += finalAmount;
      await tx.update(nodes)
        .set({ totalEarningsCredits: updatedNode.totalEarningsCredits })
        .where(eq(nodes.nodeId, node.nodeId));

      return result;
    });

    return payout;
  }

  async getDashboardStats() {
    const latestHealth = await this.getLatestHealth();
    
    // Calculate total earnings from payouts
    const allPayouts = await this.getPayouts();
    const earningsToday = allPayouts
      .filter(p => {
        const today = new Date();
        const payoutDate = new Date(p.createdAt || Date.now());
        return payoutDate.toDateString() === today.toDateString();
      })
      .reduce((sum, p) => sum + p.amountCredits, 0);

    // Calculate data usage from metrics
    const recentMetrics = await this.getMetrics(24); // roughly last 2 mins at 5s intervals
    const totalDataToday = recentMetrics.reduce((sum, m) => sum + (m.ingressRate + m.egressRate) * 5 / 8000, 0); // rough approximation in GB

    // Get reputation from node
    const node = await this.getOrCreateNode("dev-node-id");
    
    return {
      earningsToday: earningsToday, // Use real data from payouts
      totalDataToday: totalDataToday, // Use real data from metrics
      reputationScore: node.reputation,
      uptimeSeconds: 14500,
      health: {
        coordinatorReachable: latestHealth?.coordinatorReachable ?? true,
        internalProxyHealthy: latestHealth?.internalProxyHealthy ?? true,
        probeExecutorHealthy: latestHealth?.probeExecutorHealthy ?? true,
        policyViolationDetected: latestHealth?.policyViolationDetected ?? false,
        autoRecoveryActive: latestHealth?.autoRecoveryActive ?? false,
        alerts: (latestHealth?.alerts as any) ?? [],
      }
    };
  }
}

export const storage = new DatabaseStorage();
