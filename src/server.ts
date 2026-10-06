import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "TriageFlow API started");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Graceful shutdown started");
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
