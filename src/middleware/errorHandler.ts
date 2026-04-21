import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from "zod";
import { AppError } from "../utils/errors";
import { env } from "../config/env";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  if (env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(500).json({
    status: "error",
    message: "An unexpected error occurred",
  });
}
