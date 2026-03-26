import express from "express";
import { protect } from "../utils/authMiddleware";
import validators from "../utils/validators";

import {
  createDrug,
  getAllDrugs,
  getDrugById,
  updateDrug,
  deleteDrug,
  bulkImport
} from "../controllers/drugLexiconController";

const router = express.Router();

/* ================= ADMIN ONLY ================= */

router.use(protect);

router.use((req: any, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({
    success: false,
    error: "Forbidden — Admin role required",
  });
});

/* ================= ROUTES ================= */

router.get("/", getAllDrugs);

router.get("/:id", getDrugById);

router.post(
  "/",
  validators.validate(validators.drugLexiconCreateSchema, "body"),
  createDrug
);

router.put(
  "/:id",
  validators.validate(validators.drugLexiconUpdateSchema, "body"),
  updateDrug
);

router.delete("/:id", deleteDrug);

router.post(
  "/bulk",
  validators.validate(validators.drugLexiconBulkImportSchema, "body"),
  bulkImport
);

export default router;