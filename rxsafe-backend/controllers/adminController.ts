/**
 * Admin Controller
 *
 * Full admin management:
 * - DrugLexicon CRUD
 * - Interaction CRUD
 * - Users & Prescriptions overview
 * - Dashboard statistics
 * - Bulk import
 * - Seeder
 */

import { Request, Response } from "express";
import DrugLexicon from "../models/DrugLexicon";
import Interaction from "../models/Interaction";
import Prescription from "../models/Prescription";
import User from "../models/User";
import logger from "../config/logger";

import { drugLexiconCreateSchema } from "../utils/validators";

/* ============================================================
   ADMIN DASHBOARD STATS
============================================================ */

export const getAdminStats = async (_req: Request, res: Response) => {
  try {

    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalLexicon,
      totalInteractions,
      totalPrescriptions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "patient" }),
      DrugLexicon.countDocuments(),
      Interaction.countDocuments(),
      Prescription.countDocuments()
    ]);

    const severityCounts = await Prescription.aggregate([
      { $unwind: "$alerts" },
      {
        $group: {
          _id: "$alerts.severity",
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalLexicon,
        totalInteractions,
        totalPrescriptions,
        severityCounts
      }
    });

  } catch (error) {
    logger.error("Admin Stats Error:", error);

    return res.status(500).json({
      success: false,
      error: "Stats fetch failed"
    });
  }
};

/* ============================================================
   DRUG LEXICON CRUD
============================================================ */

export const createDrug = async (req: Request, res: Response) => {
  try {

    const { error, value } = drugLexiconCreateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message
        }))
      });
    }

    const payload = {
      name: value.name,
      category: value.category || "",
      minDose: value.minDose ?? null,
      maxDose: value.maxDose ?? null,

      // keep advanced fields synced
      therapeuticClass: value.category || "",
      minDoseMg: value.minDose ?? null,
      maxDoseMg: value.maxDose ?? null
    };

    const drug = await DrugLexicon.create(payload);

    return res.status(201).json({
      success: true,
      data: drug
    });

  } catch (err: any) {

    logger.error("Create drug error:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });

  }
};

export const getAllDrugs = async (_req: Request, res: Response) => {

  try {

    const drugs = await DrugLexicon.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: drugs
    });

  } catch {

    return res.status(500).json({
      success: false,
      error: "Failed to fetch drugs"
    });

  }
};

export const getDrugById = async (req: Request, res: Response) => {

  const drug = await DrugLexicon.findById(req.params.id);

  if (!drug)
    return res.status(404).json({
      success: false,
      error: "Drug not found"
    });

  return res.status(200).json({
    success: true,
    data: drug
  });
};

export const updateDrug = async (req: Request, res: Response) => {

  try {

    const payload = {
      name: req.body.name,
      category: req.body.category || "",
      minDose: req.body.minDose ?? null,
      maxDose: req.body.maxDose ?? null,

      // sync advanced fields
      therapeuticClass: req.body.category || "",
      minDoseMg: req.body.minDose ?? null,
      maxDoseMg: req.body.maxDose ?? null
    };

    const drug = await DrugLexicon.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    );

    if (!drug)
      return res.status(404).json({
        success: false,
        error: "Drug not found"
      });

    return res.status(200).json({
      success: true,
      data: drug
    });

  } catch {

    return res.status(400).json({
      success: false,
      error: "Update failed"
    });

  }
};

export const deleteDrug = async (req: Request, res: Response) => {

  const drug = await DrugLexicon.findByIdAndDelete(req.params.id);

  if (!drug)
    return res.status(404).json({
      success: false,
      error: "Drug not found"
    });

  return res.status(200).json({
    success: true,
    message: "Drug removed"
  });
};

/* ============================================================
   BULK IMPORT DRUGS
============================================================ */

export const bulkImportDrugs = async (req: Request, res: Response) => {
  try {

    await DrugLexicon.insertMany(req.body.list);

    return res.status(200).json({
      success: true,
      imported: req.body.list.length
    });

  } catch {

    return res.status(400).json({
      success: false,
      error: "Bulk import failed"
    });

  }
};

/* ============================================================
   INTERACTIONS
============================================================ */

export const createInteraction = async (req: Request, res: Response) => {

  try {

    const interaction = await Interaction.create(req.body);

    return res.status(201).json({
      success: true,
      data: interaction
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      error: error.message || "Interaction creation failed"
    });

  }
};

export const getAllInteractions = async (_req: Request, res: Response) => {

  const interactions = await Interaction.find().sort({ severity: -1 });

  return res.status(200).json({
    success: true,
    data: interactions
  });
};

export const deleteInteraction = async (req: Request, res: Response) => {

  const inter = await Interaction.findByIdAndDelete(req.params.id);

  if (!inter)
    return res.status(404).json({
      success: false,
      error: "Interaction not found"
    });

  return res.status(200).json({
    success: true,
    message: "Interaction removed"
  });
};

export const bulkImportInteractions = async (req: Request, res: Response) => {

  try {

    await Interaction.insertMany(req.body.interactions);

    return res.status(200).json({
      success: true,
      imported: req.body.interactions.length
    });

  } catch {

    return res.status(400).json({
      success: false,
      error: "Bulk import failed"
    });

  }
};

/* ============================================================
   USERS
============================================================ */

export const getAllUsers = async (_req: Request, res: Response) => {

  const users = await User.find().select("-passwordHash");

  return res.status(200).json({
    success: true,
    data: users
  });
};

export const getUserById = async (req: Request, res: Response) => {

  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user)
    return res.status(404).json({
      success: false,
      error: "User not found"
    });

  return res.status(200).json({
    success: true,
    data: user
  });
};

export const deleteUser = async (req: Request, res: Response) => {

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user)
    return res.status(404).json({
      success: false,
      error: "User not found"
    });

  return res.status(200).json({
    success: true,
    message: "User removed"
  });
};

/* ============================================================
   PRESCRIPTIONS
============================================================ */

export const getAllPrescriptions = async (_req: Request, res: Response) => {

  const pres = await Prescription.find()
    .populate("patient uploader")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: pres
  });
};

export const getPrescriptionById = async (req: Request, res: Response) => {

  const pres = await Prescription.findById(req.params.id)
    .populate("patient uploader");

  if (!pres)
    return res.status(404).json({
      success: false,
      error: "Not found"
    });

  return res.status(200).json({
    success: true,
    data: pres
  });
};

/* ============================================================
   SEED DRUG DATABASE
============================================================ */

export const seedDrugData = async (req: Request, res: Response) => {

  try {

    await DrugLexicon.deleteMany({});
    await Interaction.deleteMany({});

    const { drugs, interactions } = req.body;

    await DrugLexicon.insertMany(drugs);
    await Interaction.insertMany(interactions);

    return res.status(200).json({
      success: true,
      message: "Drug database seeded successfully",
      drugsAdded: drugs.length,
      interactionsAdded: interactions.length
    });

  } catch (error) {

    logger.error("Seed error:", error);

    return res.status(500).json({
      success: false,
      error: "Seed failed"
    });

  }
};