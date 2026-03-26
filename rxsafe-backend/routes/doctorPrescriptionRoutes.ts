/**
 * Doctor Prescription Routes
 * Handles:
 *  - Fetch prescriptions assigned to a doctor
 *  - Resolve alerts inside a prescription
 */

import express from "express";
import authMiddleware from "../utils/authMiddleware";
import * as doctorPrescriptionController from "../controllers/doctorPrescriptionController";


const router = express.Router();

// Doctor must be logged in
router.use(authMiddleware.protect);

/**
 * @route GET /api/doctor/prescriptions
 * @desc  Get all prescriptions uploaded by doctor OR assigned to doctor
 */
router.get("/prescriptions", doctorPrescriptionController.getDoctorPrescriptions);

/**
 * @route POST /api/doctor/prescriptions/:prescriptionId/alerts/:alertId/resolve
 * @desc  Resolve a specific alert inside a prescription
 */
router.post(
  "/prescriptions/:prescriptionId/alerts/:alertId/resolve",
  doctorPrescriptionController.resolveAlert
);

export default router;
