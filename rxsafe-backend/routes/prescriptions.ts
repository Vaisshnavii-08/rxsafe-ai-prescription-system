import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../utils/authMiddleware";
import validators from "../utils/validators";
import upload from "../middleware/upload";

import {
  uploadPrescription,
  getPrescriptions,
  getPrescriptionById,
  getMyPrescriptions,
  getMyPrescriptionsForDoctor,
  getPrescriptionsForPatient,
  getMyAlerts,
  reviewPrescription,
  downloadPrescriptionReport
} from "../controllers/prescriptionController";

const { validate, prescriptionUploadSchema, prescriptionListSchema } =
  validators;

const router = express.Router();

router.use(protect);

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many uploads, try again later." }
});

/* PATIENT */

router.get("/alerts", getMyAlerts);
router.get("/my", getMyPrescriptions);

/* DOCTOR */

router.get("/doctor/my", getMyPrescriptionsForDoctor);
router.get("/doctor/:patientId", getPrescriptionsForPatient);

/* ADMIN */

router.get("/", validate(prescriptionListSchema, "query"), getPrescriptions);

router.get("/:id/report", downloadPrescriptionReport);

router.get("/:id", getPrescriptionById);

router.put("/:id/review", reviewPrescription);

/* UPLOAD */

router.post(
  "/upload",
  uploadLimiter,
  upload.single("file"),
  validate(prescriptionUploadSchema),
  uploadPrescription
);

export default router;