import type { Express } from "express";

// routes import
import userRouter from "@/modules/auth/user.routes.js";

export const setupRoutes = (app: Express) => {
  app.use("/api/v1/users", userRouter);
};
