import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  base: {
    service: "triageflow-api",
    environment: env.NODE_ENV
  },
  redact: {
    paths: ["req.headers.authorization", "password", "passwordHash"],
    censor: "[REDACTED]"
  }
});
