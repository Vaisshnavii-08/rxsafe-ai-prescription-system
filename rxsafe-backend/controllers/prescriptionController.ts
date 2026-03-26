import dotenv from "dotenv";
dotenv.config();
import { Request, Response } from "express";
import path from "path";
import Prescription from "../models/Prescription";
import User from "../models/User";
import { processImage } from "../services/ocrService";
import { extractDrugsFromText, extractAgeFromText, mergeDrugsWithDoses } from "../utils/drugMatcher";
import { checkInteractions } from "../services/interactionService";
import { generatePrescriptionReport } from "../services/pdfReportService";
import { adaptAlerts } from "../utils/alertAdapter";

/* ======================================================
   UPLOAD PRESCRIPTION
====================================================== */

export const uploadPrescription = async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;

    console.log("=== UPLOAD HIT ===");
    console.log("File:", req.file?.filename);

    if (!user)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    if (!req.file)
      return res.status(400).json({ success: false, error: "No file uploaded" });

    const { patientId } = req.body;
    if (!patientId)
      return res.status(400).json({ success: false, error: "Patient ID required" });

    // Fetch full patient profile — age, weight, allergies
    const patient = await User.findById(patientId).select("age weightKg allergies");

    const availableDoctor = await User.findOne({
      role: "doctor",
      "availability.status": "Available",
    });

    const prescription = await Prescription.create({
      uploader:         user._id,
      patient:          patientId,
      assignedDoctor:   availableDoctor?._id || null,
      filename:         req.file.filename,
      originalFilename: req.file.originalname,
      fileUrl:          `/uploads/${req.file.filename}`,
      contentType:      req.file.mimetype,
      processingStatus: "pending",
    });

    try {
      /* ─── OCR ─────────────────────────────────────────── */

      const imagePath = path.join(process.cwd(), "uploads", req.file.filename);
      const ocrResult = await processImage(imagePath);

      console.log("=== OCR RESULT ===");
      console.log("Provider:", ocrResult.provider);
      console.log("Text:\n", ocrResult.text);
      console.log("OCR drugs:", ocrResult.drugs);

      prescription.ocrText     = ocrResult.text;
      prescription.ocrProvider = ocrResult.provider;

      /* ─── DRUG EXTRACTION ────────────────────────────── */

      let rawDrugs: string[] = [];

      if (ocrResult.drugs && ocrResult.drugs.length > 0) {
        rawDrugs = ocrResult.drugs;
        console.log("Using ocrService drugs:", rawDrugs);
      } else {
        rawDrugs = await extractDrugsFromText(ocrResult.text);
        console.log("Using drugMatcher drugs:", rawDrugs);
      }

      const drugsWithDoses = mergeDrugsWithDoses(rawDrugs, ocrResult.text);
      const detectedDrugs  = drugsWithDoses.map((d) => d.name);

      console.log("DRUGS WITH DOSES:", JSON.stringify(drugsWithDoses, null, 2));
      console.log("FINAL DETECTED DRUGS:", detectedDrugs);

      /* ─── PATIENT CONTEXT ────────────────────────────── */

      const extractedAge  = extractAgeFromText(ocrResult.text);
      const patientAge    = extractedAge ?? (patient?.age ?? null);
      const patientWeight = (patient as any)?.weightKg ?? null;
      const allergies: string[] = (patient as any)?.allergies ?? [];

      const diagnosisMatch = ocrResult.text.match(/diagnosis[:\s]+([^\n]+)/i);
      const diagnoses      = diagnosisMatch ? [diagnosisMatch[1].trim().toLowerCase()] : [];

      console.log("Patient age:", patientAge, "| weight:", patientWeight, "| allergies:", allergies);
      console.log("Diagnoses from OCR:", diagnoses);

      /* ─── BUILD DrugInput ARRAY ──────────────────────── */

      const drugInputs = drugsWithDoses.map((d) => ({
        name:           d.name,
        normalizedName: d.name.toLowerCase().trim(),
        doseStr:        d.doses?.[0] ?? undefined,
      }));

      /* ─── INTERACTION CHECK ──────────────────────────── */

      const interactionResult = await checkInteractions(
        drugInputs,
        patientAge,
        patientWeight,
        diagnoses,
        allergies
      );

      // ✅ Adapt alert shape to match Mongoose schema
      // interactionService returns { score, priority, type, drugs[] }
      // Mongoose schema requires  { severity (Number), severityLabel, drugA, drugB }
      const mongooseAlerts = adaptAlerts(interactionResult?.alerts ?? []);
      const suggestions    = interactionResult?.suggestions ?? [];

      console.log("=== INTERACTION RESULT ===");
      console.log("Alerts:", mongooseAlerts.length);
      mongooseAlerts.forEach((a) =>
        console.log(`  [${a.severityLabel}] ${a.drugA} + ${a.drugB} — ${a.description}`)
      );

      /* ─── RISK SCORE ─────────────────────────────────── */

      const severityScore =
        mongooseAlerts.length > 0
          ? Math.max(...mongooseAlerts.map((a) => a.severity ?? 0))
          : 0;

      let riskLevel: "Safe" | "Low" | "Moderate" | "Critical" = "Safe";
      if (severityScore >= 70)      riskLevel = "Critical";
      else if (severityScore >= 50) riskLevel = "Moderate";
      else if (severityScore >= 20) riskLevel = "Low";

      /* ─── SAVE ───────────────────────────────────────── */

      (prescription as any).alerts        = mongooseAlerts;
      (prescription as any).suggestions   = suggestions;
      (prescription as any).severityScore = severityScore;
      (prescription as any).riskLevel     = riskLevel;
      (prescription as any).detectedAge   = patientAge;

      prescription.nlpResult = {
        extracted: drugsWithDoses.map((d) => ({
          name:  d.name,
          doses: d.doses,
        })),
        matchedDrugs:   detectedDrugs,
        unmatchedDrugs: [],
        alerts:         mongooseAlerts,
        suggestions,
      };

      prescription.processingStatus = "completed";
      await prescription.save();

      console.log(`✅ Prescription saved | riskLevel: ${riskLevel} | score: ${severityScore}`);

    } catch (err) {
      console.error("❌ OCR/Processing failed:", err);
      prescription.processingStatus = "failed";
      await prescription.save();
    }

    return res.status(201).json({
      success: true,
      message: "Prescription uploaded successfully",
      data:    prescription,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ success: false, error: "Failed to upload prescription" });
  }
};

/* ======================================================
   GET ALL PRESCRIPTIONS
====================================================== */

export const getPrescriptions = async (_req: Request, res: Response) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("uploader", "name email")
      .populate("patient",  "name email age weightKg")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to load prescriptions" });
  }
};

/* ======================================================
   PATIENT — MY PRESCRIPTIONS
====================================================== */

export const getMyPrescriptions = async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;
    const prescriptions = await Prescription.find({ patient: user._id })
      .populate("uploader", "name email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Unable to load prescriptions" });
  }
};

/* ======================================================
   DOCTOR — MY PRESCRIPTIONS
====================================================== */

export const getMyPrescriptionsForDoctor = async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;
    const prescriptions = await Prescription.find({ assignedDoctor: user._id })
      .populate("patient", "name email age")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to load doctor prescriptions" });
  }
};

/* ======================================================
   GET PRESCRIPTION BY ID
====================================================== */

export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("uploader", "name email")
      .populate("patient",  "name email age weightKg medicalConditions allergies");

    if (!prescription)
      return res.status(404).json({ success: false, error: "Prescription not found" });

    return res.json({ success: true, data: prescription });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to load prescription" });
  }
};

/* ======================================================
   DOCTOR — PATIENT PRESCRIPTIONS
====================================================== */

export const getPrescriptionsForPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate("uploader", "name email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch patient prescriptions" });
  }
};

/* ======================================================
   DOWNLOAD REPORT
====================================================== */

export const downloadPrescriptionReport = async (req: Request, res: Response) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription)
      return res.status(404).json({ success: false, error: "Prescription not found" });

    const filePath = await generatePrescriptionReport(prescription);
    return res.download(filePath);
  } catch {
    return res.status(500).json({ success: false, error: "Failed to generate report" });
  }
};

/* ======================================================
   GET MY ALERTS
====================================================== */

export const getMyAlerts = async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;
    const prescriptions = await Prescription.find({
      patient: user._id,
      alerts:  { $exists: true, $not: { $size: 0 } },
    });

    const alerts = prescriptions.flatMap((p: any) =>
      (p.alerts || []).map((alert: any) => ({
        prescriptionId: p._id,
        createdAt:      p.createdAt,
        ...alert,
      }))
    );

    return res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch alerts" });
  }
};

/* ======================================================
   DOCTOR REVIEW
====================================================== */

export const reviewPrescription = async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;

    if (user.role !== "doctor")
      return res.status(403).json({ success: false, error: "Doctor access only" });

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription)
      return res.status(404).json({ success: false, error: "Prescription not found" });

    const { doctorReviewStatus, doctorNotes } = req.body;

    prescription.doctorReviewed      = true;
    prescription.doctorReviewStatus  = doctorReviewStatus;
    prescription.doctorNotes         = doctorNotes || "";
    prescription.reviewedAt          = new Date();

    await prescription.save();
    return res.json({ success: true, message: "Prescription review saved" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to save review" });
  }
};