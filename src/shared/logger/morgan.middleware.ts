import morgan from "morgan";

import { requestContext } from "../context/request-context.js";
import { logger } from "./winston.logger.js";

const stream = {
  write: (message: string) => {
    logger.info(message.trim(), {
      source: "http",
      requestId: requestContext.getRequestId(),
    });
  },
};

export const morganMiddleware = morgan(
  (tokens, req, res) => {
    const method = tokens["method"]?.(req, res) ?? "UNKNOWN";
    const url = tokens["url"]?.(req, res) ?? req.url ?? "/";
    const status = Number(tokens["status"]?.(req, res) ?? 0);
    const responseTime = Number(tokens["response-time"]?.(req, res) ?? 0);

    return JSON.stringify({
      method,
      url,
      status,
      responseTime,
    });
  },
  { stream },
);
