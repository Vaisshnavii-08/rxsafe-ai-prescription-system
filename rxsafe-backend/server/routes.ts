

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import authRoutes from "../routes/auth";
import userRoutes from "../routes/users";
import prescriptionRoutes from "../routes/prescriptions";
import doctorRoutes from "../routes/doctors";
import adminRoutes from "../routes/admin";
import webhookRoutes from "../routes/webhooks";

import drugLexiconRoutes from "../routes/drugLexicon"; // ⭐ ADD THIS

import * as fileStorage from "../services/fileStorageService";

export async function registerRoutes(app: Express): Promise<Server> {

  fileStorage.initGridFS();

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // ⭐ ADD THIS LINE
  app.use('/api/drug-lexicon', drugLexiconRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Prescription Error Detection API is running',
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}