import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();

import User from "../models/User.js";

async function seed() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});

    console.log("👤 Seeding Users...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    const doctor1 = await User.create({
      name: "Dr. John Doe",
      email: "doctor1@rxsafe.com",
      role: "doctor",
      passwordHash: hashedPassword,
      specialties: ["general"],
      location: { type: "Point", coordinates: [77.5946, 12.9716] },
    });

    const doctor2 = await User.create({
      name: "Dr. Priya Sharma",
      email: "doctor2@rxsafe.com",
      role: "doctor",
      passwordHash: hashedPassword,
      specialties: ["cardiology"],
      location: { type: "Point", coordinates: [77.604, 12.981] },
    });

    const patient1 = await User.create({
      name: "Alice",
      email: "patient1@rxsafe.com",
      role: "patient",
      passwordHash: hashedPassword,
      age: 28,
      medicalConditions: ["hypertension"],
    });

    const patient2 = await User.create({
      name: "Bob",
      email: "patient2@rxsafe.com",
      role: "patient",
      passwordHash: hashedPassword,
      age: 45,
      medicalConditions: ["diabetes"],
    });

    console.log("🎉 Users seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder error:", error);
    process.exit(1);
  }
}

seed();
