import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/auth";
import onboardingRoutes from "./routes/onboarding";
import accountRoutes from "./routes/account";
import transactionRoutes from "./routes/transaction";
import { errorHandler } from "./middleware/errorHandler";
import { authLimiter, transferLimiter } from "./middleware/rateLimiter";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";

const app = express();

// ─── Security & Parsing ──────────────────────────────────────────────────────
// CSP is disabled globally — Swagger UI requires inline scripts/styles.
// All other helmet protections (HSTS, frameguard, COEP, etc.) remain active.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? false : "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key", "Idempotency-Key"],
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Docs ─────────────────────────────────────────────────────────────────
app.get("/api/docs/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", onboardingRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/transactions", transferLimiter, transactionRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
