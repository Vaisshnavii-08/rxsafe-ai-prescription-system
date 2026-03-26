/**
 * Webhook Routes (TypeScript)
 *
 * OCR → NLP Update (Fixed Version)
 */

import express, { Request, Response, NextFunction } from "express";
import Prescription from "../models/Prescription";
import validators from "../utils/validators";
import logger from "../config/logger";
import nlpService from "../services/nlpService";

const { validate, webhookOcrCompleteSchema } = validators;

const router = express.Router();

/**
 * @route   POST /api/webhooks/ocr-complete
 * @desc    Handle OCR completion webhook + NLP processing
 * @access  Public (should add signature verification in production)
 */
router.post(
  "/ocr-complete",
  validate(webhookOcrCompleteSchema, "body"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prescriptionId, ocrText, provider, confidence } = req.body;

      logger.info(`📩 OCR webhook received for prescription ${prescriptionId}`);

      const pres = await Prescription.findById(prescriptionId)
        .populate("patient uploader")
        .exec();

      if (!pres) {
        return res
          .status(404)
          .json({ success: false, error: "Prescription not found" });
      }

      // -------------------------------
      // Update OCR fields
      // -------------------------------

      const allowedProviders = ["tesseract", "google", "manual"] as const;

      pres.ocrText = ocrText;
      pres.ocrProvider = allowedProviders.includes(provider)
        ? provider
        : "manual";

      if (confidence !== undefined) {
        (pres as any).ocrConfidence = confidence;
      }

      // -------------------------------
      // Patient context for NLP
      // -------------------------------

      const patient = pres.patient as any;

      const patientContext = {
        medicalConditions: patient?.medicalConditions || [],
        age: typeof patient?.age === "number" ? patient.age : null,
        weightKg: typeof patient?.weightKg === "number" ? patient.weightKg : null,
      };

      // -------------------------------
      // Run NLP
      // -------------------------------

      const nlpResult = await nlpService.analyzePrescriptionText(
        ocrText,
        patientContext
      );

      // -------------------------------
      // Apply NLP Results
      // -------------------------------

      pres.nlpResult = {
        extracted: nlpResult.extracted || [],
        matchedDrugs: nlpResult.matchedDrugs || [],
        alerts: nlpResult.alerts || [],
        suggestions: nlpResult.suggestions || [],
        allergies: nlpResult.allergies || [],
        medicalConditions: nlpResult.medicalConditions || [],

        clinicalLog: {
          timestamp: new Date(),
          extractedDrugs: nlpResult.extracted || [],
          matchedDrugs: nlpResult.matchedDrugs || [],
          // ❌ unmatchedDrugs removed — not part of NLP output
          alerts: nlpResult.alerts || [],
          suggestions: nlpResult.suggestions || [],
        },
      };

      // Top-level fields
      pres.alerts = nlpResult.alerts || [];
      pres.suggestions = nlpResult.suggestions || [];

      pres.severityScore =
        pres.alerts.length > 0
          ? Math.max(...pres.alerts.map((a: any) => a.score || 0))
          : 0;

      pres.processingStatus = "completed";
      pres.processedAt = new Date();

      await pres.save();

      logger.info(`✅ OCR + NLP updated for prescription ${prescriptionId}`);

      return res.status(200).json({
        success: true,
        message: "OCR + NLP update successful",
        data: {
          extracted: nlpResult.extracted,
          matchedDrugs: nlpResult.matchedDrugs,
          alerts: nlpResult.alerts,
          suggestions: nlpResult.suggestions,
          severityScore: pres.severityScore,
        },
      });
    } catch (error: any) {
      logger.error("❌ OCR webhook error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Error processing webhook",
      });
    }
  }
);

export default router;
