import express from "express";

import { morganMiddleware } from "./shared/logger/morgan.middleware.js";
import { globalErrorHandler } from "./shared/middlewares/error.middleware.js";

const app = express();

// Add middlewares
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// request logging
app.use(morganMiddleware);

// routes
// app.use("/api/health", healthRoutes)
app.get("/hello", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Hello from the server",
  });
});

// global error handler (must be last)
app.use(globalErrorHandler);

export { app };
