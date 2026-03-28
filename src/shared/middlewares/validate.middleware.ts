import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { ApiError } from "../utils/api-error.js";

export const validateRequest = (schema: {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params) as Request["params"];
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query) as Request["query"];
      }

      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return next(ApiError.badRequest("Validation Failed", z.treeifyError(error)));
      }

      return next(error);
    }
  };
};
