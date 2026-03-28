import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import { env } from "@/config/env.js";

import { logger } from "../logger/winston.logger.js";
import { ApiError } from "../utils/api-error.js";

type BodyParserError = SyntaxError & {
  body?: unknown;
  status?: number;
  statusCode?: number;
  type?: string;
};

type DuplicateKeyError = {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isMalformedJsonError = (err: unknown): err is BodyParserError => {
  if (!(err instanceof SyntaxError) || !isRecord(err)) return false;

  return (
    err["type"] === "entity.parse.failed" || err["status"] === 400 || err["statusCode"] === 400
  );
};

const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError => {
  return isRecord(err) && err["code"] === 11000;
};

const createMalformedJsonError = () => {
  return ApiError.badRequest("Malformed JSON in request body", {
    body: [
      "Send valid JSON. Remove trailing commas and use double quotes for keys and string values.",
    ],
  });
};

const createDuplicateKeyConflict = (err: DuplicateKeyError) => {
  const duplicateFields = Object.keys(err["keyPattern"] ?? {});
  const duplicateValues = err["keyValue"] ?? {};
  const error = ApiError.conflict("User with email or username already exists");

  error.errors = {
    body: duplicateFields.map((field) => {
      const value = duplicateValues[field];

      return value === undefined
        ? `${field} is already in use`
        : `${field} '${String(value)}' is already in use`;
    }),
  };

  return error;
};

const normalizeError = (err: unknown) => {
  if (err instanceof ApiError) {
    return err;
  }

  if (isMalformedJsonError(err)) {
    return createMalformedJsonError();
  }

  if (isDuplicateKeyError(err)) {
    return createDuplicateKeyConflict(err);
  }

  if (err instanceof mongoose.Error) {
    return ApiError.badRequest(err.message);
  }

  if (err instanceof Error) {
    return ApiError.internal(err.message);
  }

  return ApiError.internal("Unknown error occurred");
};

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = normalizeError(err);

  // ---------------------
  // Logging structured
  // ---------------------
  logger.error({
    message: error.message,
    statusCode: error.statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: error.stack,
    errors: error.errors ?? null,
  });

  // -------------------------------
  // Normalize error into ApiError
  // -------------------------------

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors ?? null,
    ...(env.NODE_ENV === "development" &&
      error.statusCode >= 500 && {
        stack: error.stack,
      }),
  });
};
