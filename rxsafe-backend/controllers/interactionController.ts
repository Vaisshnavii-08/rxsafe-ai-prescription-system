/**
 * Interaction Controller
 *
 * CRUD operations for drug–drug interaction records.
 * Used by NLP engine when checking prescription interactions.
 */

import { Request, Response, NextFunction } from "express";
import Interaction from "../models/Interaction";

/** Normalize drug name (lowercase + trimmed) */
const norm = (d: string) => d.toLowerCase().trim();

/* ============================================================
 * CREATE NEW INTERACTION
 * ============================================================ */
export const createInteraction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { drugA, drugB, severity, severityLabel, description, recommendedAction, references, mechanism } =
      req.body;

    if (!drugA || !drugB || !severity || !severityLabel || !description) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields (drugA, drugB, severity, severityLabel, description).",
      });
    }

    // prevent duplicates
    const exists = await Interaction.findOne({
      $or: [
        { drugA: norm(drugA), drugB: norm(drugB) },
        { drugA: norm(drugB), drugB: norm(drugA) },
      ],
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        error: "Interaction between these drugs already exists.",
      });
    }

    const interaction = await Interaction.create({
      drugA: norm(drugA),
      drugB: norm(drugB),
      severity,
      severityLabel,
      description,
      recommendedAction,
      references,
      mechanism,
    });

    return res.status(201).json({
      success: true,
      data: interaction,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================
 * GET ALL INTERACTIONS
 * ============================================================ */
export const getAllInteractions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const interactions = await Interaction.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================
 * GET INTERACTION BETWEEN 2 DRUGS
 * ============================================================ */
export const getInteractionByDrugs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { drug1, drug2 } = req.query;

    if (!drug1 || !drug2) {
      return res.status(400).json({
        success: false,
        error: "drug1 and drug2 query parameters required.",
      });
    }

    const interaction = await Interaction.findOne({
      $or: [
        { drugA: norm(drug1 as string), drugB: norm(drug2 as string) },
        { drugA: norm(drug2 as string), drugB: norm(drug1 as string) },
      ],
    });

    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: "No interaction found between these drugs.",
      });
    }

    return res.status(200).json({
      success: true,
      data: interaction,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================
 * UPDATE INTERACTION
 * ============================================================ */
export const updateInteraction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const updated = await Interaction.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Interaction record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================
 * DELETE INTERACTION
 * ============================================================ */
export const deleteInteraction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deleted = await Interaction.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Interaction record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interaction deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================
 * BULK IMPORT INTERACTIONS
 * JSON ARRAY: [{ drugA, drugB, severity, ... }]
 * ============================================================ */
export const bulkImportInteractions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interactions } = req.body;

    if (!Array.isArray(interactions) || interactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "interactions must be a non-empty array.",
      });
    }

    const normalized = interactions.map((i) => ({
      ...i,
      drugA: norm(i.drugA),
      drugB: norm(i.drugB),
    }));

    const created = await Interaction.insertMany(normalized, {
      ordered: false, // continue even if some fail
    });

    res.status(201).json({
      success: true,
      inserted: created.length,
      data: created,
    });
  } catch (err) {
    next(err);
  }
};
