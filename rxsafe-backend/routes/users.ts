/**
 * User Routes (TypeScript)
 */

import express from "express";
import userController, {
  updateMyProfile,
  getPatients
} from "../controllers/userController";

import {protect} from "../utils/authMiddleware";
import validators from "../utils/validators";

const { validate, userListSchema } = validators;

const router = express.Router();

/* ============================================================
   All routes require authentication
============================================================ */
router.use(protect);

/* ============================================================
   CURRENT USER PROFILE
   GET /api/users/me
============================================================ */
router.get("/me", userController.getCurrentUser);

/* ============================================================
   UPDATE MY PROFILE
   PUT /api/users/me
============================================================ */
router.put("/me", updateMyProfile);

/* ============================================================
   GET PATIENTS (Doctor)
   MUST BE ABOVE /:id
============================================================ */
router.get("/patients", getPatients);

/* ============================================================
   GET USERS (Admin)
============================================================ */
router.get(
  "/",
  validate(userListSchema, "query"),
  userController.getUsers
);

/* ============================================================
   GET USER BY ID
============================================================ */
router.get("/:id", userController.getUserById);

/* ============================================================
   UPDATE USER
============================================================ */
router.put("/:id", userController.updateUser);

/* ============================================================
   DELETE USER
============================================================ */
router.delete("/:id", userController.deleteUser);

export default router;