/**
 * Admin Routes (TypeScript)
 *
 * Full admin control:
 * - DrugLexicon CRUD
 * - Interaction CRUD
 * - Users
 * - Prescriptions
 * - Dashboard statistics
 * - Bulk import
 * - Seeder
 */

import express from "express";
import { protect } from "../utils/authMiddleware";
import * as adminController from "../controllers/adminController";
import validators from "../utils/validators";

const {
  validate,
  drugLexiconCreateSchema,
  drugLexiconUpdateSchema,
  drugLexiconBulkImportSchema,
  interactionCreateSchema,   
} = validators;

const router = express.Router();

/* ============================================================
   ADMIN AUTH MIDDLEWARE
============================================================ */

// Must be logged in
router.use(protect);

router.use((req: any, res, next) => {

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const role = (req.user.role || "").toLowerCase();

  if (role === "admin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: "Forbidden — Admin role required"
  });

});

/* ============================================================
   DASHBOARD STATS
============================================================ */
router.get("/stats", adminController.getAdminStats);

/* ============================================================
   DRUG LEXICON ROUTES
============================================================ */

// All drugs
router.get("/drugs", adminController.getAllDrugs);

// Single drug by ID
router.get("/drugs/:id", adminController.getDrugById);

// Create new drug
router.post(
  "/drugs",
  validate(drugLexiconCreateSchema),
  adminController.createDrug
);

// Update drug
router.put(
  "/drugs/:id",
  validate(drugLexiconUpdateSchema),
  adminController.updateDrug
);

// Delete drug
router.delete("/drugs/:id", adminController.deleteDrug);

// Bulk import
router.post(
  "/drugs/bulk",
  validate(drugLexiconBulkImportSchema),
  adminController.bulkImportDrugs
);

/* ============================================================
   INTERACTIONS
============================================================ */
// Create new interaction
router.post(
  "/interactions",
  validate(interactionCreateSchema),
  adminController.createInteraction
);

// All interactions
router.get("/interactions", adminController.getAllInteractions);

// Delete interaction
router.delete("/interactions/:id", adminController.deleteInteraction);

// Bulk import interactions
router.post("/interactions/bulk", adminController.bulkImportInteractions);

/* ============================================================
   USERS (ADMIN VIEW)
============================================================ */
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.delete("/users/:id", adminController.deleteUser);

/* ============================================================
   PRESCRIPTIONS (ADMIN VIEW)
============================================================ */
router.get("/prescriptions", adminController.getAllPrescriptions);
router.get("/prescriptions/:id", adminController.getPrescriptionById);

/* ============================================================
   SEED DRUG DATABASE
============================================================ */
router.post("/seed-drugs", adminController.seedDrugData);

/* ============================================================
   EXPORT
============================================================ */
export default router;
