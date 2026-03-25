import { randomUUID } from "node:crypto";

import { Request, Response, NextFunction } from "express";

import { requestContext } from "../context/request-context.js";

export const requestContextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const requestId = randomUUID();

  requestContext.run({ requestId }, () => {
    // attach for debugging if needed
    (req as any).requestId = requestId;
    next();
  });
};
