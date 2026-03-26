/**
 * Prescription Model — FINAL VERSION (Doctor Workflow + Risk Categorization + AI Support)
 */

import mongoose, { Document, Schema } from "mongoose";

/* ============================================================
Interfaces
============================================================ */

interface DrugInfo {
  name: string;
  normalizedName?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  originalTextSpan?: string;
}

interface AlertInfo {
  type?: string;
  drugs?: string[];
  relatedFactor?: string;
  severity: string;
  description?: string;
  score?: number;
  priority?: "critical" | "moderate" | "info";
}

interface SuggestionInfo {
  type?: string;
  originalDrug?: string;
  alternativeDrug?: string;
  alternativeNormalized?: string;
  reason?: string;
}

interface ClinicalLog {
  timestamp: Date;
  ocrProvider?: string;
  extractedDrugs?: DrugInfo[];
  matchedDrugs?: string[];
  unmatchedDrugs?: string[];
  alerts?: AlertInfo[];
  suggestions?: SuggestionInfo[];
  severityScore?: number;
}

export interface PrescriptionDoc extends Document {
  uploader: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  assignedDoctor?: mongoose.Types.ObjectId;

  filename: string;
  originalFilename?: string;
  fileUrl?: string;
  contentType: string;

  ocrText?: string;
  ocrProvider?: string;

  nlpResult?: any;

  alerts?: AlertInfo[];
  suggestions?: SuggestionInfo[];

  severityScore?: number;

  riskLevel?: "Safe" | "Low" | "Moderate" | "Critical";

  clinicalLog?: ClinicalLog;

  processedAt?: Date;

  processingStatus?: string;
  processingError?: string;

  /* AI Analysis Result */
  aiAnalysis?: string;

  /* Doctor review workflow */
  doctorReviewed?: boolean;
  doctorReviewStatus?: "Safe" | "Needs Attention" | "Critical";
  doctorNotes?: string;
  reviewedAt?: Date;

  notes?: string;
}

/* ============================================================
Sub Schemas
============================================================ */

const drugSchema = new Schema(
  {
    name: String,
    normalizedName: String,
    dose: String,
    frequency: String,
    route: String,
    originalTextSpan: String,
  },
  { _id: false }
);

const alertSchema = new Schema(
  {
    type: String,
    drugs: [String],
    relatedFactor: String,
    severity: { type: String, required: true },
    description: String,
    score: Number,
    priority: { type: String, enum: ["critical", "moderate", "info"] },
  },
  { _id: false }
);

const suggestionSchema = new Schema(
  {
    type: String,
    originalDrug: String,
    alternativeDrug: String,
    alternativeNormalized: String,
    reason: String,
  },
  { _id: false }
);

const clinicalLogSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    ocrProvider: String,
    extractedDrugs: [drugSchema],
    matchedDrugs: [String],
    unmatchedDrugs: [String],
    alerts: [alertSchema],
    suggestions: [suggestionSchema],
    severityScore: Number,
  },
  { _id: false }
);

const nlpResultSchema = new Schema(
  {
    extracted: [drugSchema],
    matchedDrugs: [String],
    unmatchedDrugs: [String],
    alerts: [alertSchema],
    suggestions: [suggestionSchema],
    allergies: [String],
    medicalConditions: [String],
    patientAge: Number,
    patientWeightKg: Number,
  },
  { _id: false }
);

/* ============================================================
Main Schema
============================================================ */

const prescriptionSchema = new Schema(
  {
    uploader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* Doctor Assignment */
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    filename: { type: String, required: true },

    originalFilename: String,

    fileUrl: String,

    contentType: { type: String, required: true },

    ocrText: { type: String, default: "" },

    ocrProvider: { type: String, default: "tesseract" },

    /* NLP Processing Result */
    nlpResult: {
      type: nlpResultSchema,
      default: () => ({}),
    },

    alerts: {
      type: [alertSchema],
      default: [],
    },

    suggestions: {
      type: [suggestionSchema],
      default: [],
    },

    severityScore: {
      type: Number,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: ["Safe", "Low", "Moderate", "Critical"],
      default: "Safe",
    },

    /* AI Verification Result */
    aiAnalysis: {
      type: String,
      default: "",
    },

    clinicalLog: {
      type: clinicalLogSchema,
      default: () => ({}),
    },

    processedAt: Date,

    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    processingError: String,

    /* ============================================================
       Doctor Review Fields
    ============================================================ */

    doctorReviewed: {
      type: Boolean,
      default: false,
    },

    doctorReviewStatus: {
      type: String,
      enum: ["Safe", "Needs Attention", "Critical"],
    },

    doctorNotes: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
    },

    notes: String,
  },
  { timestamps: true }
);

/* ============================================================
Indexes
============================================================ */

prescriptionSchema.index({ uploader: 1, createdAt: -1 });
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ assignedDoctor: 1 });
prescriptionSchema.index({ severityScore: -1 });
prescriptionSchema.index({ processingStatus: 1 });
prescriptionSchema.index({ doctorReviewed: 1 });

/* ============================================================
Export
============================================================ */

const Prescription = mongoose.model<PrescriptionDoc>(
  "Prescription",
  prescriptionSchema
);

export default Prescription;