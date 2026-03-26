import { Express } from "express";

import authRoutes from "./auth";
import prescriptionRoutes from "./prescriptions";
import interactionRoutes from "./interactionRoutes";
import userRoutes from "./users";
import doctorRoutes from "./doctors";
import drugLexiconRoutes from "./drugLexicon";
import adminRoutes from "./admin";
import webhookRoutes from "./webhooks";

export async function registerRoutes(app: Express) {

  // Authentication
  app.use("/api/auth", authRoutes);

  // Prescriptions (OCR + NLP)
  app.use("/api/prescriptions", prescriptionRoutes);

  // Drug Interaction checking
  app.use("/api/interactions", interactionRoutes);

  // User Management
  app.use("/api/users", userRoutes);

  // Doctor endpoints
  app.use("/api/doctors", doctorRoutes);

  // Drug Lexicon
  app.use("/api/drug-lexicon", drugLexiconRoutes);

  // Admin
  app.use("/api/admin", adminRoutes);

  // Webhooks
  app.use("/api/webhooks", webhookRoutes);

  return app;
}
