import { createServer } from "node:http";

import mongoose from "mongoose";

import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

const httpServer = createServer(app);

async function main() {
  await connectDB();

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(env.PORT, resolve);
    httpServer.once("error", reject);
  });

  console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
}

// Gracefully shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received -- shutting down gracefully`);

  httpServer.on("close", async () => {
    await mongoose.disconnect();
    console.log(`Server Closed, DB Disconnected`);
    process.exit(0);
  });

  // Force kill if gracefully shutdown takes too long

  setTimeout(() => {
    console.error(`Forced shutdown after timeout`);
    process.exit(1);
  }, 10_000).unref();
  // .unref() so this timer doesn't block shutdown itself
}

// Docker/K8s stop
process.on("SIGTERM", () => shutdown("SIGTERM"));
// Ctrl+C
process.on("SIGINT", () => shutdown("SIGINT"));

// Unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
  process.exit(1);
});

await main().catch((err) => {
  console.error("Main failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
