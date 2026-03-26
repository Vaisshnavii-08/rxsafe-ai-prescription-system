/**
 * Server Entry Point (TypeScript)
 *
 * Initializes environment,
 * connects database,
 * starts HTTP server.
 */

import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import logger from "./config/logger";

const PORT: number = Number(process.env.PORT) || 5001;

/* ============================================================
   DATABASE
============================================================ */
connectDB();

/* ============================================================
   START SERVER
============================================================ */
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

/* ============================================================
   ERROR HANDLING
============================================================ */
process.on("unhandledRejection", (err: any) => {
  logger.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});