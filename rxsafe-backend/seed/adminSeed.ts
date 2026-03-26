/**
 * Seed Admin User
 * 
 * Creates ONE admin account:
 * email: admin@example.com
 * password: admin
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI missing in .env");
    }

    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    // check if admin exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    // create admin
    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      passwordHash: "admin", // password will be hashed by your model
      role: "admin",
    });

    console.log("Admin created successfully:", admin.email);
    process.exit(0);
  } catch (err: any) {
    console.error("Admin seed error:", err.message);
    process.exit(1);
  }
};

seedAdmin();
