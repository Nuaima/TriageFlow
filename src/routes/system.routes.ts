import { Router } from "express";
import { prisma } from "../config/prisma";
import { client } from "../middleware/requestMetrics";

export const systemRouter = Router();

systemRouter.get("/health", async (_req, res) => {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      service: "triageflow-api",
      database: "up",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      service: "triageflow-api",
      database: "down",
      timestamp: new Date().toISOString()
    });
  }
});

systemRouter.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});
