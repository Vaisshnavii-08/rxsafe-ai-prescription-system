import express from "express";
import { getAlertsForPrescription } from "../controllers/alertController";

console.log("✅ alertRoutes.ts is loaded");

const router = express.Router();

router.get("/:prescriptionId", getAlertsForPrescription);

export default router;
