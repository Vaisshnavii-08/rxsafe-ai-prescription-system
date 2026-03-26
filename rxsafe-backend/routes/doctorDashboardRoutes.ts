import express from "express";
import authMiddleware from "../utils/authMiddleware";
import Prescription from "../models/Prescription";
import User from "../models/User";

const router = express.Router();

// All doctor routes require authentication
router.use(authMiddleware.protect);

/**
 * GET /api/doctor-dashboard/prescriptions
 * Fetch prescriptions assigned to logged-in doctor
 */
router.get("/prescriptions", async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const doctorId = req.user._id;

    const prescriptions = await Prescription.find({
      assignedDoctor: doctorId,
    })
      .populate("patient", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, prescriptions });
  } catch (err) {
    console.error("Doctor prescription error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * GET /api/doctor-dashboard/patients
 * Return unique patients associated with doctor
 */
router.get("/patients", async (req: any, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const doctorId = req.user._id;

    const prescriptions = await Prescription.find({
      assignedDoctor: doctorId,
    }).populate("patient", "name email age weightKg medicalConditions");

    const uniquePatients: Record<string, any> = {};

    prescriptions.forEach((p) => {
      if (p.patient) {
        const patient: any = p.patient;
        uniquePatients[patient._id] = patient;
      }
    });

    res.json({
      success: true,
      patients: Object.values(uniquePatients),
    });
  } catch (err) {
    console.error("Doctor patient error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
