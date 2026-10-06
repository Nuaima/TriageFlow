import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/triageflow?schema=public"),
  JWT_SECRET: z.string().min(16).default("development-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  TRIAGE_WEBHOOK_URL: z.string().url().optional().or(z.literal(""))
});

export const env = envSchema.parse(process.env);
