/**
 * Express Application Setup (TypeScript)
 *
 * Configures middleware, security, routes, and error handling.
 */

import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import logger from "./config/logger";

/* ================= ROUTES ================= */

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import prescriptionRoutes from "./routes/prescriptions";
import doctorRoutes from "./routes/doctors";
import adminRoutes from "./routes/admin";
import webhookRoutes from "./routes/webhooks";
import alertRoutes from "./routes/alertRoutes";
import interactionRoutes from "./routes/interactionRoutes";

const app = express();

/* ============================================================
   SECURITY MIDDLEWARE
============================================================ */

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* ============================================================
   LOGGING
============================================================ */

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    })
  );
}

/* ============================================================
   BODY PARSERS
============================================================ */

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ============================================================
   STATIC FILE SERVING (FINAL FIX)
============================================================ */

/*
  Resolve uploads folder from project root
  This guarantees Express finds the correct directory
*/

const uploadsPath = path.resolve("uploads");

app.use("/uploads", express.static(uploadsPath));

console.log("Serving uploads from:", uploadsPath);

/* ============================================================
   HEALTH CHECK
============================================================ */

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Prescription Error Detection API is running",
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   API ROUTES
============================================================ */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/alerts", alertRoutes);

/* ============================================================
   API DOCS
============================================================ */

app.get("/api", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Prescription Error Detection API",
    version: "1.0.0",
  });
});

/* ============================================================
   404 HANDLER
============================================================ */

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */

app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): Response => {

    logger.error("Error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: Object.values(err.errors).map((e: any) => e.message),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate entry",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    return res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
);

export default app;