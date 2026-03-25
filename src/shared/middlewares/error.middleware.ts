import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import { env } from "@/config/env.js";

import { logger } from "../logger/winston.logger.js";
import { ApiError } from "../utils/api-error.js";

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let error: ApiError;

  // -------------------------------
  // Normalize error into ApiError
  // -------------------------------
  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof mongoose.Error) {
    error = ApiError.badRequest(err.message);
  } else if (err instanceof Error) {
    error = ApiError.internal(err.message);
  } else {
    error = ApiError.internal("Unknown error occurred");
  }

  // ---------------------
  // Logging structured
  // ---------------------
  logger.error({
    message: error.message,
    statusCode: error.statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: error.stack,
  });

  // -------------------------------
  // Normalize error into ApiError
  // -------------------------------

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors ?? null,
    ...(env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
};
