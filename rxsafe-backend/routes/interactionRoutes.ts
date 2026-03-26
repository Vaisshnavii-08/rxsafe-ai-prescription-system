/**
 * Interaction Routes (TypeScript)
 *
 * Admin-only access for creating, updating, deleting, and bulk importing
 * drug–drug interaction records. Also allows querying interactions between drugs.
 */

import express from "express";
import {protect} from "../utils/authMiddleware";
import validators from "../utils/validators";

import {
  createInteraction,
  getAllInteractions,
  getInteractionByDrugs,
  updateInteraction,
  deleteInteraction,
  bulkImportInteractions,
} from "../controllers/interactionController";

const router = express.Router();

/* ============================================================
   AUTHENTICATION + ADMIN ONLY
============================================================ */

router.use(protect);

// Admin role check
router.use((req: any, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({
    success: false,
    error: "Forbidden — Admin access required",
  });
});

/* ============================================================
   ROUTES
============================================================ */

/**
 * @route POST /api/interactions
 * @desc Create an interaction
 */
router.post(
  "/",
  validators.validate(validators.interactionCreateSchema),
  createInteraction
);

/**
 * @route GET /api/interactions
 * @desc Get all interactions
 */
router.get("/", getAllInteractions);

/**
 * @route GET /api/interactions/check?drug1=A&drug2=B
 * @desc Get interaction between two drugs
 */
router.get("/check", getInteractionByDrugs);

/**
 * @route PUT /api/interactions/:id
 * @desc Update an interaction
 */
router.put(
  "/:id",
  validators.validate(validators.interactionUpdateSchema),
  updateInteraction
);

/**
 * @route DELETE /api/interactions/:id
 * @desc Delete an interaction
 */
router.delete("/:id", deleteInteraction);

/**
 * @route POST /api/interactions/bulk
 * @desc Bulk import interactions
 */
router.post(
  "/bulk",
  validators.validate(validators.interactionBulkImportSchema),
  bulkImportInteractions
);

export default router;
