/**
 * Doctor Controller — FIXED getNearbyDoctors
 *
 * ROOT CAUSE of empty results:
 *   $near requires every doctor document to have a valid GeoJSON
 *   location field AND a 2dsphere index on User.location.
 *   If either is missing, MongoDB returns 0 results silently.
 *
 * FIX:
 *   1. Try $near first (fast, sorted by distance)
 *   2. If 0 results → fallback to fetching ALL doctors and
 *      filtering by Haversine distance in JS
 *   3. Debug endpoint to check how many doctors have location set
 */

import { Request, Response } from "express";
import User from "../models/User";
import Prescription from "../models/Prescription";
import logger from "../config/logger";

/* ============================================================
   1. GET NEARBY DOCTORS  (fixed)
============================================================ */

export const getNearbyDoctors = async (req: Request, res: Response) => {
  try {
    const {
      lat,
      lng,
      radiusKm = "10",
      specialty,
      limit = "20",
    } = req.query as any;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const parsedLat    = parseFloat(lat);
    const parsedLng    = parseFloat(lng);
    const parsedRadius = parseFloat(radiusKm);
    const parsedLimit  = parseInt(limit);

    // Base query — role: doctor only, no specialty filter yet
    // (specialty filtered in JS below to handle both 'specialties' and 'specialization' fields)
    const baseQuery: any = { role: "doctor" };

    // ── ATTEMPT 1: $near (requires 2dsphere index + location field) ──
    let doctors: any[] = [];
    let usedFallback   = false;

    try {
      const geoQuery = {
        ...baseQuery,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parsedLng, parsedLat],
            },
            $maxDistance: parsedRadius * 1000,
          },
        },
      };

      doctors = await User.find(geoQuery)
        .select("name email specialties specialization location availability")
        .limit(parsedLimit);

      logger.info(`[getNearbyDoctors] $near returned ${doctors.length} doctors`);
    } catch (geoErr: any) {
      logger.warn(`[getNearbyDoctors] $near failed (${geoErr.message}), using JS fallback`);
    }

    // ── ATTEMPT 2: JS Haversine fallback ──
    if (doctors.length === 0) {
      usedFallback = true;
      logger.info("[getNearbyDoctors] falling back to full-collection Haversine filter");

      const totalAll        = await User.countDocuments({});
      const totalRoleDoctor = await User.countDocuments({ role: "doctor" });
      logger.info(`[getNearbyDoctors] RAW DB -> totalUsers: ${totalAll} | role=doctor: ${totalRoleDoctor}`);

      const allDoctors: any[] = await (User as any).find({ role: "doctor" }).lean();
      logger.info(`[getNearbyDoctors] lean query returned: ${allDoctors.length} doctors`);
      allDoctors.forEach((d: any) =>
        logger.info(`  -> ${d.name} | role: ${d.role} | coords: ${JSON.stringify(d.location?.coordinates)}`)
      );

      doctors = allDoctors.filter((doc: any) => {
        if (!doc.location?.coordinates?.length) return false;
        const dist = calculateDistance(
          parsedLat, parsedLng,
          doc.location.coordinates[1],
          doc.location.coordinates[0]
        );
        logger.info(`  distance: ${doc.name} -> ${dist.toFixed(2)} km (max: ${parsedRadius} km)`);
        return dist <= parsedRadius;
      });

      doctors.sort((a: any, b: any) => {
        const da = calculateDistance(parsedLat, parsedLng, a.location.coordinates[1], a.location.coordinates[0]);
        const db = calculateDistance(parsedLat, parsedLng, b.location.coordinates[1], b.location.coordinates[0]);
        return da - db;
      });

      doctors = doctors.slice(0, parsedLimit);
      logger.info(`[getNearbyDoctors] Haversine fallback found ${doctors.length} doctors`);
    }

    // ── filter by specialty (handles both 'specialties[]' and 'specialization' string) ──
    let filtered = doctors;
    if (specialty) {
      const s = specialty.toLowerCase();
      filtered = doctors.filter((doc: any) => {
        const inArray = Array.isArray(doc.specialties) &&
          doc.specialties.some((x: string) => x.toLowerCase().includes(s));
        const inField = typeof doc.specialization === "string" &&
          doc.specialization.toLowerCase().includes(s);
        return inArray || inField;
      });
    }

    // ── attach distanceKm + normalise specialties field ──
    const result = filtered.map((doc: any) => {
      const obj = doc.toObject ? doc.toObject() : doc;

      // unify: expose specialties array whether DB has specialties[] or specialization string
      const specialtiesArr: string[] =
        obj.specialties?.length
          ? obj.specialties
          : obj.specialization
          ? [obj.specialization]
          : [];

      const distanceKm = obj.location?.coordinates
        ? Math.round(
            calculateDistance(
              parsedLat, parsedLng,
              obj.location.coordinates[1],
              obj.location.coordinates[0]
            ) * 10
          ) / 10
        : null;

      return { ...obj, specialties: specialtiesArr, distanceKm };
    });

    return res.status(200).json({
      success:      true,
      count:        result.length,
      usedFallback,           // helpful for debugging on the frontend
      data:         result,
    });

  } catch (err) {
    logger.error("Error in getNearbyDoctors:", err);
    return res.status(500).json({
      success: false,
      error: "Server error locating nearby doctors",
    });
  }
};

/* ============================================================
   2. UPDATE DOCTOR LOCATION
============================================================ */

export const updateDoctorLocation = async (req: any, res: Response) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      {
        location: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
      },
      { new: true }
    ).select("name email specialties location");

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: doctor,
    });
  } catch (err) {
    logger.error("Error in updateDoctorLocation:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/* ============================================================
   3. DEBUG — how many doctors have location set?
   GET /api/doctors/debug-location
   (remove in production)
============================================================ */

export const debugDoctorLocations = async (_req: Request, res: Response) => {
  try {
    const total         = await User.countDocuments({ role: "doctor" });
    const withLocation  = await User.countDocuments({
      role: "doctor",
      "location.coordinates": { $exists: true, $ne: [] },
    });
    const sample = await User.find({ role: "doctor" })
      .select("name location")
      .limit(5);

    return res.json({
      total,
      withLocation,
      withoutLocation: total - withLocation,
      sample: sample.map((d: any) => ({
        name: d.name,
        location: d.location,
      })),
      fix: withLocation === 0
        ? "No doctors have location set. Call POST /api/doctors/seed-location while logged in as a doctor to set one."
        : "OK",
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Debug error" });
  }
};

/* ============================================================
   4. SEED — set location on the logged-in doctor (dev helper)
   POST /api/doctors/seed-location
   Body: { lat, lng }  OR uses Coimbatore default
============================================================ */

export const seedDoctorLocation = async (req: any, res: Response) => {
  try {
    const doctorId = req.user.id || req.user._id;

    // default: Coimbatore city centre
    const lat = parseFloat(req.body.lat ?? "11.0168");
    const lng = parseFloat(req.body.lng ?? "76.9558");

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      { location: { type: "Point", coordinates: [lng, lat] } },
      { new: true }
    ).select("name email location");

    return res.json({
      success: true,
      message: `Location set to [${lat}, ${lng}]`,
      data: doctor,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Seed error" });
  }
};

/* ============================================================
   5. GET DOCTOR PROFILE
============================================================ */

export const getDoctorProfile = async (req: Request, res: Response) => {
  try {
    const doctor = await User.findOne({
      _id:  req.params.id,
      role: "doctor",
    }).select("-passwordHash");

    if (!doctor)
      return res.status(404).json({ success: false, error: "Doctor not found" });

    return res.status(200).json({ success: true, data: doctor });
  } catch {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/* ============================================================
   6. GET DOCTORS BY SPECIALTY
============================================================ */

export const getDoctorsBySpecialty = async (req: Request, res: Response) => {
  try {
    const doctors = await User.find({
      role:       "doctor",
      specialties: { $in: [new RegExp(req.params.specialty, "i")] },
    }).select("name email specialties location availability");

    return res.status(200).json({
      success: true,
      count:   doctors.length,
      data:    doctors,
    });
  } catch {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/* ============================================================
   7. GET MY PATIENTS
============================================================ */

export const getMyPatients = async (req: any, res: Response) => {
  try {
    const doctorId = req.user.id || req.user._id;

    const prescriptions = await Prescription.find({
      assignedDoctor: doctorId,
    }).populate("patient", "name email age weightKg medicalConditions");

    const seen = new Set<string>();
    const patients: any[] = [];

    prescriptions.forEach((p: any) => {
      if (p.patient && !seen.has(p.patient._id.toString())) {
        seen.add(p.patient._id.toString());
        patients.push(p.patient);
      }
    });

    return res.status(200).json({
      success: true,
      count:   patients.length,
      data:    patients,
    });
  } catch (err) {
    logger.error("Error in getMyPatients:", err);
    return res.status(500).json({
      success: false,
      error: "Server error fetching patients",
    });
  }
};

/* ============================================================
   8. DOCTOR DASHBOARD STATS
============================================================ */

export const getDoctorDashboardStats = async (req: Request, res: Response) => {
  try {
    const doctor     = (req as any).user;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [assignedPatients, totalPrescriptions, todayReviews, pendingReports] =
      await Promise.all([
        Prescription.distinct("patient", { assignedDoctor: doctor._id }),
        Prescription.countDocuments({ assignedDoctor: doctor._id }),
        Prescription.countDocuments({
          assignedDoctor: doctor._id,
          doctorReviewed: true,
          reviewedAt: { $gte: todayStart, $lte: todayEnd },
        }),
        Prescription.countDocuments({
          assignedDoctor: doctor._id,
          doctorReviewed: false,
        }),
      ]);

    return res.json({
      totalPatients:      assignedPatients.length,
      totalPrescriptions,
      todayReviews,
      pendingReports,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to load dashboard stats" });
  }
};

/* ============================================================
   9. GET ASSIGNED PRESCRIPTIONS
============================================================ */

export const getAssignedPrescriptions = async (req: Request, res: Response) => {
  try {
    const doctor = (req as any).user;

    const prescriptions = await Prescription.find({ assignedDoctor: doctor._id })
      .populate("patient", "name email age")
      .sort({ createdAt: -1 });

    return res.json({ success: true, prescriptions });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Failed to load assigned prescriptions",
    });
  }
};

/* ============================================================
   UTIL — Haversine distance (km)
============================================================ */

function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R    = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}