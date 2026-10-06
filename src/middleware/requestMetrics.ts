import { NextFunction, Request, Response } from "express";
import client from "prom-client";

client.collectDefaultMetrics({ prefix: "triageflow_" });

export const httpRequestDuration = new client.Histogram({
  name: "triageflow_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

export function requestMetrics(req: Request, res: Response, next: NextFunction) {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route?.path ?? req.path,
      status_code: String(res.statusCode)
    });
  });
  next();
}

export { client };
