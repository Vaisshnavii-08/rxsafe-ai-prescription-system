import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import DrugLexicon from "../models/DrugLexicon";
import DrugInteraction from "../models/Interaction";

import { drugSeed } from "./drugSeed";
import { interactionSeed } from "./interactionSeed";

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connected");

    // Insert drugs if they don't exist
    for (const drug of drugSeed) {
      await DrugLexicon.updateOne(
        { name: drug.name },
        { $setOnInsert: drug },
        { upsert: true }
      );
    }

    // Insert interactions if they don't exist
    for (const interaction of interactionSeed) {
      await DrugInteraction.updateOne(
        {
          drugA: interaction.drugA,
          drugB: interaction.drugB,
        },
        { $setOnInsert: interaction },
        { upsert: true }
      );
    }

    console.log("New drugs and interactions added (existing data preserved)");

    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();