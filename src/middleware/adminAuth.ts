import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { UnauthorizedError } from "../utils/errors";

export function requireAdminKey(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];
  if (!key || key !== env.ADMIN_KEY) {
    next(new UnauthorizedError("Invalid or missing admin key"));
    return;
  }
  next();
}
