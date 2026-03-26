/**
 * User Controller
 *
 * Handles:
 * * User listing, retrieval, update, deletion
 * * Doctor verification submission (doctor)
 * * Doctor approval / rejection (admin)
 * * Patient profile self update
 * * Current logged-in user profile
 */

import { Request, Response } from "express";
import User, { IUserDocument } from "../models/User";
import logger from "../config/logger";
import bcrypt from "bcryptjs";

/* ============================================================
GET CURRENT USER (Logged in)
GET /api/users/me
============================================================ */

export const getCurrentUser = async (req: Request, res: Response) => {
  try {

    const requester = (req as any).user;

    if (!requester) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const user = await User.findById(requester.id || requester._id)
      .select("-passwordHash -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch user profile"
    });
  }
};

/* ============================================================
GET USERS (Admin)
GET /api/users
============================================================ */

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {

    const { role, page = "1", limit = "10" } = req.query;

    const query: Record<string, any> = {};
    if (role) query.role = role;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = (await User.find(query)
      .select("-passwordHash")
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 })) as IUserDocument[];

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });

  } catch (error) {
    logger.error("Get users error:", error);
    res.status(500).json({ success: false, error: "Error fetching users" });
  }
};

/* ============================================================
GET PATIENTS (Doctor)
GET /api/users/patients
============================================================ */

export const getPatients = async (_req: Request, res: Response) => {
  try {

    const patients = await User.find({ role: "patient" })
      .select("_id name email age weightKg")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: patients,
    });

  } catch (error) {
    logger.error("Get patients error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch patients",
    });
  }
};

/* ============================================================
GET USER BY ID
GET /api/users/:id
============================================================ */

export const getUserById = async (req: Request, res: Response) => {
  try {

    const { id } = req.params;
    const requester = (req as any).user;

    if (
      requester.role !== "admin" &&
      requester.role !== "doctor" &&
      requester.id !== id
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    const user = await User.findById(id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error("Get user by ID error:", error);

    return res.status(500).json({
      success: false,
      error: "Error fetching user"
    });
  }
};

/* ============================================================
UPDATE USER (Self / Admin)
PUT /api/users/:id
============================================================ */

export const updateUser = async (req: Request, res: Response) => {
  try {

    const requester = (req as any).user;
    const targetId = req.params.id;

    if (!requester) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (requester.id !== targetId && requester.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const allowedFields = [
      "name",
      "email",
      "age",
      "weightKg",
      "medicalConditions",
      "allergies",
      "location",
      "specialties",
      "availability",
    ];

    const updates: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetId,
      { $set: updates },
      { new: true }
    ).select("-passwordHash -__v");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      error: error.message
    });

  }
};

/* ============================================================
UPDATE MY PROFILE
============================================================ */

export const updateMyProfile = async (req: Request, res: Response) => {
  try {

    const requester = (req as any).user;

    if (!requester) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const { age, weightKg, allergies, medicalConditions } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      requester.id,
      {
        age,
        weightKg,
        allergies,
        medicalConditions
      },
      { new: true }
    ).select("-passwordHash -__v");

    return res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      error: error.message
    });

  }
};

/* ============================================================
DELETE USER (Admin)
============================================================ */

export const deleteUser = async (req: Request, res: Response) => {
  try {

    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User removed"
    });

  } catch (err: any) {

    return res.status(400).json({
      success: false,
      error: err.message
    });

  }
};

/* ============================================================
EXPORTS
============================================================ */

export default {
  getCurrentUser,
  getUsers,
  getPatients,
  getUserById,
  updateUser,
  updateMyProfile,
  deleteUser,
};