// scripts/seed-prescriptions.ts
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

// IMPORTANT: since "type": "module", ALL imports must end with .js
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";

async function seedPrescriptions() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
    });

    console.log("🧹 Clearing prescriptions collection...");
    await Prescription.deleteMany({});

    console.log("🔎 Fetching seed users...");
    const patient1 = await User.findOne({ email: "patient1@rxsafe.com" });
    const patient2 = await User.findOne({ email: "patient2@rxsafe.com" });
    const doctor1  = await User.findOne({ email: "doctor1@rxsafe.com" });

    if (!patient1 || !patient2 || !doctor1) {
      console.log("❌ Missing users. Run `npm run seed` first.");
      process.exit(1);
    }

    console.log("📄 Creating sample prescriptions...");

    /* ------------------------------------------------------------
     * Prescription #1 — Antibiotic + Painkiller
     * ---------------------------------------------------------- */
    await Prescription.create({
      uploader: patient1._id,
      patient: patient1._id,

      filename: "rx1.pdf",
      originalFilename: "rx1.pdf",
      fileUrl: "/uploads/prescriptions/rx1.pdf",
      contentType: "application/pdf",

      ocrText: "Take Amoxicillin 250mg twice daily. Avoid Ibuprofen.",
      ocrProvider: "mock",

      nlpResult: {
        extracted: [
          { name: "Amoxicillin", dose: "250mg", frequency: "twice daily" },
          { name: "Ibuprofen", dose: "400mg" },
        ],
        matchedDrugs: ["amoxicillin"],
        unmatchedDrugs: ["Ibuprofen"],
        alerts: [
          {
            drugs: ["Ibuprofen", "Metformin"],
            severity: "moderate",
            description: "Interaction affects glucose response",
            score: 50,
          },
        ],
        suggestions: [
          {
            originalDrug: "Ibuprofen",
            alternativeDrug: "Paracetamol",
            reason: "Safer with diabetic patients",
          },
        ],
        allergies: [],
        medicalConditions: ["hypertension"],
      },

      alerts: [
        {
          drugs: ["Ibuprofen", "Metformin"],
          severity: "moderate",
          description: "Interaction affects glucose response",
          score: 50,
        },
      ],

      suggestions: [
        {
          originalDrug: "Ibuprofen",
          alternativeDrug: "Paracetamol",
          reason: "Safer with diabetic patients",
        },
      ],

      severityScore: 50,
      processingStatus: "completed",
      processedAt: new Date(),

      clinicalLog: {
        timestamp: new Date(),
        ocrProvider: "mock",
        extractedDrugs: [
          { name: "Amoxicillin", dose: "250mg" },
          { name: "Ibuprofen", dose: "400mg" },
        ],
        matchedDrugs: ["amoxicillin"],
        unmatchedDrugs: ["Ibuprofen"],
        alerts: [
          {
            drugs: ["Ibuprofen", "Metformin"],
            severity: "moderate",
            score: 50,
          },
        ],
        suggestions: [
          {
            originalDrug: "Ibuprofen",
            alternativeDrug: "Paracetamol",
          },
        ],
        severityScore: 50,
      },
    });

    /* ------------------------------------------------------------
     * Prescription #2 — Diabetes + Painkiller
     * ---------------------------------------------------------- */
    await Prescription.create({
      uploader: patient2._id,
      patient: patient2._id,

      filename: "rx2.jpg",
      originalFilename: "rx2.jpg",
      fileUrl: "/uploads/prescriptions/rx2.jpg",
      contentType: "image/jpeg",

      ocrText: "Metformin 500mg once daily. Add Paracetamol for fever.",
      ocrProvider: "mock",

      nlpResult: {
        extracted: [
          { name: "Metformin", dose: "500mg", frequency: "daily" },
          { name: "Paracetamol", dose: "650mg" },
        ],
        matchedDrugs: ["metformin", "paracetamol"],
        unmatchedDrugs: [],
        alerts: [],
        suggestions: [],
        allergies: [],
        medicalConditions: ["diabetes"],
      },

      alerts: [],
      suggestions: [],
      severityScore: 0,
      processingStatus: "completed",
      processedAt: new Date(),

      clinicalLog: {
        timestamp: new Date(),
        ocrProvider: "mock",
        extractedDrugs: [
          { name: "Metformin", dose: "500mg" },
          { name: "Paracetamol", dose: "650mg" },
        ],
        matchedDrugs: ["metformin", "paracetamol"],
        unmatchedDrugs: [],
        alerts: [],
        suggestions: [],
        severityScore: 0,
      },
    });

    /* ------------------------------------------------------------
     * Prescription #3 — Uploaded by doctor
     * ---------------------------------------------------------- */
    await Prescription.create({
      uploader: doctor1._id,
      patient: patient1._id,

      filename: "rx3.png",
      originalFilename: "rx3.png",
      fileUrl: "/uploads/prescriptions/rx3.png",
      contentType: "image/png",

      ocrText: "Cefixime 200mg twice daily for infection.",
      ocrProvider: "mock",

      nlpResult: {
        extracted: [{ name: "Cefixime", dose: "200mg" }],
        matchedDrugs: ["cefixime"],
        unmatchedDrugs: [],
        alerts: [],
        suggestions: [],
        allergies: [],
        medicalConditions: ["hypertension"],
      },

      alerts: [],
      suggestions: [],
      severityScore: 0,
      processingStatus: "completed",
      processedAt: new Date(),

      clinicalLog: {
        timestamp: new Date(),
        ocrProvider: "mock",
        extractedDrugs: [{ name: "Cefixime", dose: "200mg" }],
        matchedDrugs: ["cefixime"],
        unmatchedDrugs: [],
        alerts: [],
        suggestions: [],
        severityScore: 0,
      },
    });

    console.log("✅ Seeded 3 prescriptions successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

seedPrescriptions();
