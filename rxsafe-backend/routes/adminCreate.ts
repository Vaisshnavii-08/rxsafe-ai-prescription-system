import express from "express";
import User from "../models/User";

const router = express.Router();

/**
 * TEMPORARY ROUTE: Create Admin User
 * POST /api/admin/create
 */
router.post("/create", async (_req, res) => {
  try {
    const existing = await User.findOne({ email: "admin@example.com" });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }

    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      passwordHash: "Admin@123", // will be auto-hashed
      role: "admin",
    });

    return res.json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (error: any) {
    console.error("ADMIN CREATION ERROR >>>", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
