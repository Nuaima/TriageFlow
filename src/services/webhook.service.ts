import { env } from "../config/env";
import { logger } from "../config/logger";

export async function publishTriageEvent(payload: unknown) {
  if (!env.TRIAGE_WEBHOOK_URL) return { delivered: false, reason: "webhook_not_configured" };

  try {
    const response = await fetch(env.TRIAGE_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, "Triage webhook returned non-success status");
      return { delivered: false, reason: `http_${response.status}` };
    }
    return { delivered: true };
  } catch (error) {
    logger.warn({ err: error }, "Triage webhook delivery failed");
    return { delivered: false, reason: "delivery_failed" };
  }
}
