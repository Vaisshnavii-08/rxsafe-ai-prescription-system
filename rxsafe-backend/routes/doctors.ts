import express from "express";
import { protect } from "../utils/authMiddleware";

import {
  getDoctorDashboardStats,
  getMyPatients,
  updateDoctorLocation,
  getNearbyDoctors,
  getDoctorProfile,
  getAssignedPrescriptions,
  getDoctorsBySpecialty
} from "../controllers/doctorController";

const router = express.Router();

/* PUBLIC ROUTES */

router.get("/nearby", getNearbyDoctors);
router.get("/profile/:id", getDoctorProfile);
router.get("/specialty/:specialty", getDoctorsBySpecialty);

/* PROTECTED ROUTES */

router.use(protect);

router.get("/dashboard", getDoctorDashboardStats);
router.get("/my-patients", getMyPatients);
router.put("/update-location", updateDoctorLocation);
router.get("/assigned-prescriptions", getAssignedPrescriptions);

export default router;