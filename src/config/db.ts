import mongoose from "mongoose";

import { env } from "@/config/env.js";
import {
  DB_NAME,
  MAX_POOL_SIZE,
  SERVER_SELECTION_TIMEOUT_MS,
  SOCKET_TIMEOUT_MS,
} from "@/shared/constants/db.constants.js";

export async function connectDB() {
  mongoose.set("debug", env.NODE_ENV === "development");
  try {
    mongoose.connection.on("disconnected", () => {
      console.warn(`MongoDB Disconnected`);
    });

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB Error: ${err.message}`);
    });

    await mongoose.connect(env.DATABASE_URL, {
      dbName: DB_NAME,
      maxPoolSize: MAX_POOL_SIZE,
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: SOCKET_TIMEOUT_MS,
    });

    console.log(`MongoDB connected [${env.NODE_ENV}]`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Error";
    console.log(`MongoDB Connection Failed: ${message}`);
    process.exit(1);
  }
}
