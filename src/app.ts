import os from "node:os";

import express, { type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";

import { setupMiddlewares } from "@/config/middleware.config.js";
import { setupRoutes } from "@/config/routes.config.js";

import { globalErrorHandler } from "./shared/middlewares/error.middleware.js";

const app = express();

setupMiddlewares(app);

const healthCheckHandler = (_req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  Promise.allSettled([checkDatabase()])
    .then(([dbStatus]) => {
      const uptime = process.uptime();
      const memUsage = process.memoryUsage();
      const latency = Date.now() - start;

      const checks = {
        database: dbStatus.status === "fulfilled" ? "healthy" : "unhealthy",
      };

      const isHealthy = Object.values(checks).every((status) => status === "healthy");

      return res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        latency_ms: latency,
        uptime_seconds: Math.floor(uptime),
        checks,
        system: {
          memory: {
            used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
            total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss_mb: Math.round(memUsage.rss / 1024 / 1024),
          },
          cpu_count: os.cpus().length,
          load_avg: os.loadavg(),
          node_version: process.version,
        },
      });
    })
    .catch(next);
};

app.get(["/api/health", "/api/v1/health"], healthCheckHandler);

setupRoutes(app);

// Error handler (MUST BE LAST)
app.use(globalErrorHandler);

async function checkDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error("Database is not connected");
  }

  await mongoose.connection.db.admin().ping();
}

export { app };
