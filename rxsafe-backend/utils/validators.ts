/**
 * Request Validation Schemas
 *
 * Joi schemas for validating API request bodies and query parameters.
 */

import Joi from "joi";
import { Request, Response, NextFunction } from "express";

/* ============================================================
 * AUTH SCHEMAS
 * ============================================================ */

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid("patient", "doctor", "admin").required(),
  specialties: Joi.array().items(Joi.string()).when("role", {
    is: "doctor",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  location: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array().length(2).items(Joi.number()).required(),
  }).when("role", {
    is: "doctor",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/* ============================================================
 * PRESCRIPTIONS
 * ============================================================ */

const prescriptionUploadSchema = Joi.object({
  patientId: Joi.string().optional(),
  notes: Joi.string().max(1000).optional(),
  filename: Joi.string().optional(),
  data: Joi.string().optional(),
  contentType: Joi.string().optional(),
});

const prescriptionListSchema = Joi.object({
  patientId: Joi.string().optional(),
  minSeverity: Joi.number().min(0).max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid("pending", "processing", "completed", "failed")
    .optional(),
});

/* ============================================================
 * USER LIST (ADMIN)
 * ============================================================ */

const userListSchema = Joi.object({
  role: Joi.string().valid("patient", "doctor", "admin").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

/* ============================================================
 * GEO DOCTOR SEARCH
 * ============================================================ */

const doctorNearbySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radiusKm: Joi.number().min(0.1).max(500).default(10),
  specialty: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

/* ============================================================
 * OCR WEBHOOK
 * ============================================================ */

const webhookOcrCompleteSchema = Joi.object({
  prescriptionId: Joi.string().required(),
  ocrText: Joi.string().required(),
  provider: Joi.string().valid("tesseract", "google").required(),
  confidence: Joi.number().min(0).max(1).optional(),
});

/* ============================================================
 * DRUG LEXICON VALIDATORS
 * ============================================================ */

/* ============================================================
 * DRUG LEXICON VALIDATORS (FIXED)
 * ============================================================ */

export const drugLexiconCreateSchema = Joi.object({
  name: Joi.string().min(1).required(),

  therapeuticClass: Joi.string().optional().allow(""),

  minDoseMg: Joi.number().optional().allow(null),

  maxDoseMg: Joi.number().optional().allow(null),
});

export const drugLexiconUpdateSchema = Joi.object({
  name: Joi.string().optional(),

  therapeuticClass: Joi.string().optional().allow(""),

  minDoseMg: Joi.number().optional().allow(null),

  maxDoseMg: Joi.number().optional().allow(null),
});

export const drugLexiconBulkImportSchema = Joi.object({
  list: Joi.array()
    .items(drugLexiconCreateSchema)
    .min(1)
    .required(),
});

/* ============================================================
 * INTERACTION VALIDATORS
 * ============================================================ */

export const interactionCreateSchema = Joi.object({
  drugA: Joi.string().min(1).required(),
  drugB: Joi.string().min(1).required(),

  severity: Joi.number().min(0).max(100).required(),
  severityLabel: Joi.string()
    .valid("minor", "moderate", "major", "high", "life-threatening")
    .required(),

  description: Joi.string().min(5).required(),

  recommendedAction: Joi.string().allow("").optional(),
  mechanism: Joi.string().allow("").optional(),

  references: Joi.array().items(Joi.string().uri().allow("")).default([]),
});

export const interactionUpdateSchema = Joi.object({
  drugA: Joi.string().optional(),
  drugB: Joi.string().optional(),
  severity: Joi.number().min(0).max(100).optional(),
  severityLabel: Joi.string()
    .valid("minor", "moderate", "major", "high", "life-threatening")
    .optional(),
  description: Joi.string().min(5).optional(),
  recommendedAction: Joi.string().allow("").optional(),
  mechanism: Joi.string().allow("").optional(),
  references: Joi.array().items(Joi.string().uri().allow("")).optional(),
}).min(1);

export const interactionBulkImportSchema = Joi.object({
  interactions: Joi.array()
    .items(interactionCreateSchema)
    .min(1)
    .required(),
});

/* ============================================================
 * VALIDATION MIDDLEWARE
 * ============================================================ */

const validate = (
  schema: Joi.ObjectSchema,
  property: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.log("VALIDATION ERROR:", error.details);
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    req[property] = value;
    next();
  };
};

/* ============================================================
 * EXPORT BLOCK (UPDATED)
 * ============================================================ */

export default {
  validate,

  signupSchema,
  loginSchema,

  prescriptionUploadSchema,
  prescriptionListSchema,

  userListSchema,
  doctorNearbySchema,
  webhookOcrCompleteSchema,

  drugLexiconCreateSchema,
  drugLexiconUpdateSchema,
  drugLexiconBulkImportSchema,   // ✅ Added

  interactionCreateSchema,
  interactionUpdateSchema,
  interactionBulkImportSchema,
};
