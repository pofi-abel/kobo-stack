import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  NIBSS_BASE_URL: z.string().min(1, "NIBSS_BASE_URL is required"),
  NIBSS_API_KEY: z.string().min(1, "NIBSS_API_KEY is required"),
  NIBSS_API_SECRET: z.string().min(1, "NIBSS_API_SECRET is required"),
  ADMIN_KEY: z.string().min(16, "ADMIN_KEY must be at least 16 characters"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
