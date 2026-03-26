/**
 * Webhook Controller
 * Handles OCR → NLP updates
 */

import { Request, Response } from "express";
import Prescription from "../models/Prescription";
import User from "../models/User";
import nlpService from "../services/nlpService";

export const ocrCompleteWebhook = async (req: Request, res: Response) => {
  try {
    const { prescriptionId, ocrText, provider, confidence } = req.body;

    if (!prescriptionId || !ocrText) {
      return res.status(400).json({
        success: false,
        error: "Missing prescriptionId or ocrText",
      });
    }

    const pres = await Prescription.findById(prescriptionId);
    if (!pres) {
      return res.status(404).json({ success: false, error: "Prescription not found" });
    }

    // ----- Fetch patient fully -----
    let patient = null;
    if (pres.patient) {
      patient = await User.findById(pres.patient).lean();
    }

    const patientContext = {
      medicalConditions: patient?.medicalConditions || [],
      age: patient?.age || null,
      weightKg: patient?.weightKg || null,
    };

    // ----- Update OCR -----
    pres.ocrText = ocrText;
    pres.ocrProvider = provider || "tesseract";

    if (confidence !== undefined) {
      (pres as any).ocrConfidence = confidence;
    }

    // ----- Run NLP -----
    const nlpResult = await nlpService.analyzePrescriptionText(
      ocrText,
      patientContext
    );

    const extracted = nlpResult.extracted || [];
    const matchedDrugs = nlpResult.matchedDrugs || [];

    // Build unmatched drugs manually
    const unmatchedDrugs = extracted
      .filter((d: any) => !matchedDrugs.includes(d.normalizedName))
      .map((d: any) => d.name);

    // ----- Store results -----
    pres.nlpResult = {
      ...nlpResult,
      unmatchedDrugs,
      clinicalLog: {
        timestamp: new Date(),
        extractedDrugs: extracted,
        matchedDrugs,
        unmatchedDrugs,
        alerts: nlpResult.alerts || [],
        suggestions: nlpResult.suggestions || [],
      },
    };

    pres.alerts = nlpResult.alerts || [];
    pres.suggestions = nlpResult.suggestions || [];

    pres.severityScore =
      pres.alerts.length > 0
        ? Math.max(...pres.alerts.map((a: any) => a.score || 0))
        : 0;

    pres.processedAt = new Date();
    pres.processingStatus = "completed";

    await pres.save();

    return res.status(200).json({
      success: true,
      message: "OCR + NLP update successful",
      data: {
        extracted,
        matchedDrugs,
        unmatchedDrugs,
        alerts: pres.alerts,
        suggestions: pres.suggestions,
        severityScore: pres.severityScore,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
