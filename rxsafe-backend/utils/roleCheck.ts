/**
 * Role-Based Access Control Middleware (TypeScript Safe)
 */

import { Request, Response, NextFunction } from "express";

/* Extend Express Request type */

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      _id: string;
      role: "admin" | "doctor" | "patient";
    };
    [key: string]: any;
  }
}

/* ======================================================
CHECK ROLE
====================================================== */

const checkRole =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };

/* ======================================================
CHECK OWNERSHIP
====================================================== */

const checkOwnership =
  (resourceField: string = "patient") =>
  (req: Request, res: Response, next: NextFunction) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Admin override
    if (req.user.role === "admin") {
      return next();
    }

    const resource = req[resourceField];

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }

    const isOwner =
      resource.patient?.toString() === req.user._id.toString() ||
      resource.uploader?.toString() === req.user._id.toString();

    const hasRoleAccess = req.user.role === "doctor";

    if (!isOwner && !hasRoleAccess) {
      return res.status(403).json({
        success: false,
        error:
          "Access denied. You do not have permission to access this resource.",
      });
    }

    next();
  };

export default { checkRole, checkOwnership };