import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError } from "../utils/appError";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, "NOT_FOUND"));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: err.flatten()
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.id }, err.message);
    }
    return res.status(err.statusCode).json({ error: err.code, message: err.message });
  }

  logger.error({ err, requestId: req.id }, "Unhandled request error");
  return res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred"
  });
}
