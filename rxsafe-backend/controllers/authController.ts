/**
 * Authentication Controller — FINAL & CORRECT VERSION
 *
 * Notes:
 * - Uses `passwordHash` (schema field) everywhere.
 * - Explicit types to satisfy TypeScript.
 * - Uses `logger` so imports are used and no TS unused-import error.
 */

import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Request, Response } from "express";
import User, { IUserDocument } from "../models/User";
import logger from "../config/logger";

/* -------------------------------------------
   Generate JWT Token
-------------------------------------------- */
const generateToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET as Secret;
  if (!secret) throw new Error("JWT_SECRET missing!");

  const expires = (process.env.JWT_EXPIRES_IN || "7d") as string;

  const options = {
    expiresIn: expires,
  } as SignOptions;

  return jwt.sign({ id, role }, secret, options);
};


/* -------------------------------------------
   SIGNUP
-------------------------------------------- */
const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, specialties, location } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      specialties?: string[];
      location?: any;
    };

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Name, email and password are required",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
      return;
    }

    // Build user data using the correct schema field: passwordHash
    const userData: Partial<IUserDocument> & Record<string, any> = {
      name,
      email: normalizedEmail,
      passwordHash: password,
      role: (role as any) || "patient",
    };

    if (userData.role === "doctor") {
      if (specialties) userData.specialties = specialties;
      if (location?.coordinates) userData.location = location;
    }

    const user = (await User.create(userData)) as IUserDocument;

   const token = generateToken(String(user._id), user.role);

    logger.info(`New user registered: ${normalizedEmail} (${user.role})`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    logger.error("SIGNUP ERROR >>>", err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      error: "Error creating user",
    });
  }
};

/* -------------------------------------------
   LOGIN — FINAL FIXED VERSION
-------------------------------------------- */
const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    logger.debug("REQ BODY:", { email });

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password required" });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // select the passwordHash explicitly (it is select: false in schema)
    const user = (await User.findOne({ email: normalizedEmail }).select(
      "+passwordHash"
    )) as IUserDocument | null;

    logger.debug("USER FROM DB:", !!user);

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    // ensure the field exists before calling comparePassword to avoid bcrypt error
    if (!user.passwordHash) {
      logger.error(`User ${normalizedEmail} has no passwordHash field`);
      res.status(500).json({ success: false, error: "Server misconfiguration" });
      return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

   const token = generateToken(String(user._id), user.role);

    logger.info(`User logged in: ${normalizedEmail}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    logger.error("LOGIN ERROR >>>", err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      error: "Error during login",
    });
  }
};

/* -------------------------------------------
   GET CURRENT USER
-------------------------------------------- */
const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      user: (req as any).user,
    });
  } catch (err: unknown) {
    logger.error("GET ME ERROR >>>", err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      error: "Error loading profile",
    });
  }
};

export default { signup, login, getMe };
