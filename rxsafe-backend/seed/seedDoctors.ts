/**
 * Seed Doctors Script (TypeScript Version)
 *
 * Run with:
 *   npx tsx seed/seedDoctors.ts
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js"; // correct ES module import
import logger from "../config/logger.js";

// Sample doctor data with coordinates
const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Cardiology", "Internal Medicine"],
    location: { type: "Point", coordinates: [-122.4194, 37.7749] },
    availability: "Mon-Fri 9AM-5PM",
  },
  {
    name: "Dr. Michael Chen",
    email: "michael.chen@clinic.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Family Medicine", "Pediatrics"],
    location: { type: "Point", coordinates: [-122.4083, 37.7833] },
    availability: "Tue-Sat 10AM-6PM",
  },
  {
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@medical.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Neurology", "Pain Management"],
    location: { type: "Point", coordinates: [-118.2437, 34.0522] },
    availability: "Mon-Fri 8AM-4PM",
  },
  {
    name: "Dr. James Williams",
    email: "james.williams@health.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Orthopedics", "Sports Medicine"],
    location: { type: "Point", coordinates: [-73.9352, 40.7306] },
    availability: "Mon-Thu 9AM-7PM",
  },
  {
    name: "Dr. Lisa Patel",
    email: "lisa.patel@wellness.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Endocrinology", "Diabetes Care"],
    location: { type: "Point", coordinates: [-87.6298, 41.8781] },
    availability: "Mon-Fri 9AM-5PM",
  },
  {
    name: "Dr. David Kim",
    email: "david.kim@hospital.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Gastroenterology", "Internal Medicine"],
    location: { type: "Point", coordinates: [-122.3321, 47.6062] },
    availability: "Tue-Sat 8AM-6PM",
  },
  {
    name: "Dr. Maria Garcia",
    email: "maria.garcia@clinic.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Dermatology", "Cosmetic Medicine"],
    location: { type: "Point", coordinates: [-80.1918, 25.7617] },
    availability: "Mon-Fri 10AM-6PM",
  },
  {
    name: "Dr. Robert Taylor",
    email: "robert.taylor@medical.com",
    passwordHash: "password123",
    role: "doctor",
    specialties: ["Psychiatry", "Addiction Medicine"],
    location: { type: "Point", coordinates: [-71.0589, 42.3601] },
    availability: "Mon-Fri 9AM-5PM",
  },
];

const seedDoctors = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI is missing in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    logger.info("Connected to MongoDB");

    // Delete old doctors only in dev/test
    if (process.env.NODE_ENV !== "production") {
      await User.deleteMany({ role: "doctor" });
      logger.info("Cleared existing doctor records");
    }

    // Insert new doctors
    const result = await User.insertMany(sampleDoctors);
    logger.info(`Seeded ${result.length} doctors\n`);

    console.log("✔ Seeded Doctors:");
    result.forEach((d) => {
      console.log(
        `- ${d.name} (${d.specialties.join(", ")})\n  Email: ${d.email}\n  Location: [${d.location.coordinates.join(
          ", "
        )}]\n`
      );
    });

    process.exit(0);
  } catch (err) {
    logger.error("❌ Error seeding doctors:", err);
    process.exit(1);
  }
};

seedDoctors();
