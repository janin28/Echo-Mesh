
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Config Routes
  app.get(api.config.get.path, async (req, res) => {
    const config = await storage.getConfig();
    if (!config) {
      // Return default if not initialized
      return res.json({
        id: 0,
        nodeId: "node_init_" + Math.random().toString(36).substring(7),
        maxMbps: 10,
        maxDailyGb: 20,
        httpsOnly: true,
        sandboxMode: "strict",
        schedules: [],
        regionAllow: ["US-West"],
        updatedAt: new Date().toISOString()
      });
    }
    res.json(config);
  });

  app.put(api.config.update.path, async (req, res) => {
    try {
      const input = api.config.update.input.parse(req.body);
      const updated = await storage.updateConfig(input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Stats/Control Routes
  let daemonStatus = "running";

  app.get(api.stats.get.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json({
      status: daemonStatus as any,
      ...stats
    });
  });

  app.post(api.control.post.path, async (req, res) => {
    const action = req.params.action;
    if (action === "start") daemonStatus = "running";
    else if (action === "stop") daemonStatus = "stopped";
    else if (action === "pause") daemonStatus = "paused";
    else return res.status(400).json({ success: false, newState: daemonStatus });

    // Log the action
    await storage.addLog({
      level: "info",
      category: "system",
      message: `User requested daemon ${action}`,
    });

    res.json({ success: true, newState: daemonStatus });
  });

  // Sessions Route
  app.get(api.sessions.list.path, async (req, res) => {
    const sessions = await storage.getSessions();
    res.json(sessions);
  });

  // Metrics Route
  app.get(api.metrics.list.path, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 60;
    const metrics = await storage.getMetrics(limit);
    // Return reverse for chart to show chronological left-to-right if needed, 
    // but usually frontend handles it. Recharts often wants array [oldest ... newest]
    res.json(metrics.reverse()); 
  });

  // Logs Route
  app.get(api.logs.list.path, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await storage.getLogs(limit);
    res.json(logs);
  });

  // Background Metrics Simulation (to make the dashboard alive)
  setInterval(async () => {
    if (daemonStatus !== "running") return;

    // Simulate varying load
    const baseIngress = Math.random() * 5;
    const baseEgress = Math.random() * 4;
    
    await storage.addMetric({
      ingressRate: baseIngress,
      egressRate: baseEgress,
      activeSessions: Math.floor(Math.random() * 5) + 1,
      cpuUsage: Math.random() * 10 + 2,
      memoryUsage: Math.floor(Math.random() * 50) + 100,
    });
  }, 5000);

  // Initialize Seed Data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingConfig = await storage.getConfig();
  if (!existingConfig) {
    await storage.updateConfig({
      nodeId: "node_" + Math.random().toString(36).substring(7),
      maxMbps: 25,
      maxDailyGb: 50,
      regionAllow: ["US-East", "EU-West"],
      schedules: [{ days: ["Mon", "Wed", "Fri"], start: "09:00", end: "17:00" }]
    });

    // Add some logs
    await storage.addLog({ level: "info", category: "system", message: "Daemon started successfully v1.0.4" });
    await storage.addLog({ level: "info", category: "network", message: "Connected to coordinator hub-01" });
    
    // Add some sessions
    await storage.createSession({
      id: "sess_1",
      buyerId: "buyer_alpha",
      status: "active",
      bytesIngress: 1024 * 50,
      bytesEgress: 1024 * 40,
      latencyP95: 45
    });
    await storage.createSession({
      id: "sess_2",
      buyerId: "buyer_beta",
      status: "probing",
      bytesIngress: 1024,
      bytesEgress: 512,
      latencyP95: 120
    });
  }
}
