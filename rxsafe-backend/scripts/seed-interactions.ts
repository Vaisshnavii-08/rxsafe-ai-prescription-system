// scripts/seed-interactions.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Interaction from "../models/Interaction";

async function seedInteractions() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("🧹 Clearing Interaction collection...");
    await Interaction.deleteMany({});

    const interactions = [];

    // Example pairs
    const pairs: [string, string, number][] = [
      ["amoxicillin", "metformin", 70],
      ["ibuprofen", "warfarin", 90],
      ["azithromycin", "atorvastatin", 60],
      ["paracetamol", "alcohol", 40],
      ["doxycycline", "antacids", 50]
    ];

    for (const [a, b, score] of pairs) {
      interactions.push({
        drugA: a,
        drugB: b,
        severity: score >= 70 ? "high" : score >= 40 ? "moderate" : "low",
        severityLabel:
          score >= 70 ? "major" : score >= 40 ? "moderate" : "minor",
        description: "Auto-generated interaction record.",
        score,
      });
    }

    console.log("📚 Inserting interactions...");
    await Interaction.insertMany(interactions);

    console.log(`✅ Seeded ${interactions.length} interactions!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

seedInteractions();
