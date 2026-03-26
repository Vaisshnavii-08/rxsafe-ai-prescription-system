/**
 * Drug Lexicon Controller
 * Admin CRUD + Bulk Import
 */

import DrugLexicon from "../models/DrugLexicon";
import { Request, Response } from "express";

/* ============================================================
   CREATE DRUG
============================================================ */
export const createDrug = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // normalize name
    if (data.name) {
      data.normalizedName = data.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    const exists = await DrugLexicon.findOne({
      normalizedName: data.normalizedName,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        error: "Drug already exists in the lexicon.",
      });
    }

    const created = await DrugLexicon.create(data);

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create drug",
    });
  }
};

/* ============================================================
   GET ALL DRUGS
============================================================ */
export const getAllDrugs = async (req: Request, res: Response) => {
  try {
    const list = await DrugLexicon.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   GET ONE DRUG
============================================================ */
export const getDrugById = async (req: Request, res: Response) => {
  try {
    const doc = await DrugLexicon.findById(req.params.id);
    if (!doc)
      return res.status(404).json({
        success: false,
        error: "Drug not found",
      });

    res.status(200).json({ success: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   UPDATE DRUG
============================================================ */
export const updateDrug = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (data.name) {
      data.normalizedName = data.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    const updated = await DrugLexicon.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({
        success: false,
        error: "Drug not found",
      });

    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   DELETE DRUG
============================================================ */
export const deleteDrug = async (req: Request, res: Response) => {
  try {
    const deleted = await DrugLexicon.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({
        success: false,
        error: "Drug not found",
      });

    res.status(200).json({ success: true, message: "Drug deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   BULK IMPORT
============================================================ */
export const bulkImport = async (req: Request, res: Response) => {
  try {
    const { list } = req.body; // expects array of drugs

    if (!Array.isArray(list) || !list.length) {
      return res.status(400).json({
        success: false,
        error: "Bulk import requires a non-empty list[]",
      });
    }

    let created = [];

    for (const item of list) {
      if (item.name) {
        item.normalizedName = item.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
      }

      const exists = await DrugLexicon.findOne({
        normalizedName: item.normalizedName,
      });

      if (exists) continue; // skip duplicates

      const doc = await DrugLexicon.create(item);
      created.push(doc);
    }

    res.status(200).json({
      success: true,
      imported: created.length,
      data: created,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
