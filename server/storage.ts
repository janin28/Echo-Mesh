
import { db } from "./db";
import {
  config, sessions, metrics, logs,
  type Config, type InsertConfig,
  type Session, type InsertSession,
  type Metric, type Log,
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

  // Dashboard Stats (Aggregated)
  getDashboardStats(): Promise<{
    earningsToday: number;
    totalDataToday: number;
    reputationScore: number;
    uptimeSeconds: number;
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

  async getDashboardStats() {
    // In a real app, this would aggregate from metrics/sessions tables
    // For MVP, we'll return mock values or values stored in a 'stats' table if we had one.
    // Here we'll just mock it or calculate simply.
    return {
      earningsToday: 1.25,
      totalDataToday: 4.5,
      reputationScore: 98,
      uptimeSeconds: 14500
    };
  }
}

export const storage = new DatabaseStorage();
