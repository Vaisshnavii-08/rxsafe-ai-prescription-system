/**
 * DrugInteraction Model — FINAL VERSION WITH AI RECOMMENDATIONS
 *
 * Supports:
 * - interaction detection
 * - severity scoring
 * - clinical explanation
 * - AI alternative drug suggestions
 */

import mongoose, { Document, Schema } from "mongoose";

/* ============================================================
INTERFACE
============================================================ */

export interface IDrugInteractionDocument extends Document {

  drugA: string;
  drugB: string;

  severity: "low" | "moderate" | "high";

  severityLabel?: string;
  description?: string;

  score?: number;

  mechanism?: string;

  recommendedAction?: string;

  references?: string[];

  /* AI RECOMMENDATION FIELDS */

  alternativeA?: string[];   // alternatives for drugA
  alternativeB?: string[];   // alternatives for drugB

  createdAt?: Date;
  updatedAt?: Date;
}

/* ============================================================
SCHEMA
============================================================ */

const drugInteractionSchema = new Schema<IDrugInteractionDocument>(
  {
    drugA: {
      type: String,
      required: true,
      index: true
    },

    drugB: {
      type: String,
      required: true,
      index: true
    },

    severity: {
      type: String,
      enum: ["low", "moderate", "high"],
      required: true
    },

    severityLabel: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: 10
    },

    mechanism: {
      type: String,
      default: ""
    },

    recommendedAction: {
      type: String,
      default: ""
    },

    references: {
      type: [String],
      default: []
    },

    /* ===============================
       AI SUGGESTED ALTERNATIVES
    =============================== */

    alternativeA: {
      type: [String],
      default: []
    },

    alternativeB: {
      type: [String],
      default: []
    }

  },
  {
    timestamps: true
  }
);

/* ============================================================
INDEX
============================================================ */

drugInteractionSchema.index(
  { drugA: 1, drugB: 1 },
  { unique: true }
);

/* ============================================================
EXPORT
============================================================ */

export default mongoose.model<IDrugInteractionDocument>(
  "DrugInteraction",
  drugInteractionSchema
);