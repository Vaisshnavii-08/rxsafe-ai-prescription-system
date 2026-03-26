/**
 * Controller: Doctor Prescription Management
 */

import Prescription from "../models/Prescription";
import { Request, Response } from "express";

/**
 * GET /api/doctor/prescriptions
 * Returns all prescriptions for logged-in doctor
 */
export const getDoctorPrescriptions = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user.id;

    const prescriptions = await Prescription.find({
      uploader: doctorId
    })
      .populate("patient", "name email")
      .lean();

    return res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error: any) {
    console.error("Fetch doctor prescriptions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching prescriptions",
    });
  }
};

/**
 * POST /api/doctor/prescriptions/:prescriptionId/alerts/:alertId/resolve
 * Marks an alert as resolved
 */
export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const { prescriptionId, alertId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Ensure alerts array exists
    if (!Array.isArray(prescription.alerts)) {
      return res.status(400).json({
        success: false,
        message: "This prescription contains no alerts",
      });
    }

    // Locate alert
    const alert: any = prescription.alerts.find(
      (a: any) => a._id.toString() === alertId
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Add the missing 'resolved' property safely
    alert.resolved = true;

    await prescription.save();

    return res.json({
      success: true,
      message: "Alert resolved",
    });
  } catch (error) {
    console.error("Resolve alert error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while resolving alert",
    });
  }
};
