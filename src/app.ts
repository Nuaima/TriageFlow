import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./config/logger";
import { authRouter } from "./routes/auth.routes";
import { ticketRouter } from "./routes/ticket.routes";
import { systemRouter } from "./routes/system.routes";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { requestMetrics } from "./middleware/requestMetrics";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers["x-request-id"];
      const id = typeof incoming === "string" ? incoming : crypto.randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    }
  })
);
app.use(requestMetrics);

app.get("/", (_req, res) => {
  res.json({
    service: "TriageFlow",
    version: "1.0.0",
    docs: "See README.md for API examples",
    health: "/health",
    metrics: "/metrics"
  });
});

app.use(systemRouter);
app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketRouter);

app.use(notFound);
app.use(errorHandler);
