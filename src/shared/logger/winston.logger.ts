import winston from "winston";

import { env } from "@/config/env.js";

import { requestContext } from "../context/request-context.js";

const isDev = env.NODE_ENV !== "production";

/**
 * Inject requestId from AsyncLocalStorage into every log
 */
const injectRequestId = winston.format((info) => {
  const requestId = requestContext.getRequestId();
  if (requestId) {
    info["requestId"] = requestId;
  }
  return info;
});

/**
 * Development format (human-readable)
 */
const devFormat = winston.format.printf(
  ({ level, message, timestamp, stack, requestId, ...meta }) => {
    return `${timestamp} [${level}]${requestId ? ` [req:${requestId}]` : ""}: ${stack || message} ${
      Object.keys(meta).length > 0 ? JSON.stringify(meta) : ""
    }`;
  },
);

/**
 * Production format (structured JSON)
 */
const prodFormat = winston.format.json();

/**
 * Logger instance
 */
export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",

  format: isDev
    ? winston.format.combine(
        injectRequestId(),
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        devFormat,
      )
    : winston.format.combine(
        injectRequestId(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        prodFormat,
      ),

  transports: [
    // Console (always enabled)
    new winston.transports.Console(),

    // Error logs
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    // Combined logs
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],

  /**
   * Prevent exit on handled exceptions
   */
  exitOnError: false,
});
