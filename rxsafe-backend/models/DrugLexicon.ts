/**
 * DrugLexicon Model — FINAL VERSION WITH AI RECOMMENDATIONS
 */

import mongoose, { Document, Schema } from "mongoose";

/* ============================================================
INTERFACE
============================================================ */

export interface IDrugLexiconDocument extends Document {
  name: string;
  normalizedName?: string;

  therapeuticClass?: string;
  category?: string;

  minDose?: number | null;
  maxDose?: number | null;

  minDoseMg?: number | null;
  maxDoseMg?: number | null;

  dosageForms?: string[];
  strengthMg?: number[];
  unit?: string;

  interactions?: string[];

  // ⭐ AI Recommendation field
  alternatives?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

/* ============================================================
SCHEMA
============================================================ */

const drugLexiconSchema = new Schema<IDrugLexiconDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedName: {
      type: String,
      index: true,
      default: "",
    },

    /* ================================
       ADMIN DASHBOARD FIELDS
    ================================= */

    category: {
      type: String,
      default: "",
    },

    therapeuticClass: {
      type: String,
      default: "",
    },

    /* ================================
       DOSAGE INFORMATION
    ================================= */

    minDose: {
      type: Number,
      default: null,
    },

    maxDose: {
      type: Number,
      default: null,
    },

    minDoseMg: {
      type: Number,
      default: null,
    },

    maxDoseMg: {
      type: Number,
      default: null,
    },

    dosageForms: {
      type: [String],
      default: [],
    },

    strengthMg: {
      type: [Number],
      default: [],
    },

    unit: {
      type: String,
      default: "mg",
    },

    /* ================================
       DRUG INTERACTIONS
    ================================= */

    interactions: {
      type: [String],
      default: [],
    },

    /* ================================
       AI ALTERNATIVE DRUGS
    ================================= */

    alternatives: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
AUTO NORMALIZE DRUG NAME
============================================================ */

drugLexiconSchema.pre("save", function (next) {
  const doc = this as IDrugLexiconDocument;

  if (doc.name) {
    doc.normalizedName = doc.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  next();
});

/* ============================================================
SEARCH INDEX
============================================================ */

drugLexiconSchema.index({
  name: "text",
  normalizedName: "text",
  category: "text",
  therapeuticClass: "text",
});

/* ============================================================
EXPORT
============================================================ */

export default mongoose.model<IDrugLexiconDocument>(
  "DrugLexicon",
  drugLexiconSchema
);