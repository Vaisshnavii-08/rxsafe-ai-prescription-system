import mongoose from "mongoose";
import dotenv from "dotenv";
import DrugLexicon from "../models/DrugLexicon";

dotenv.config();

const alternatives = [
  {
    drug: "ibuprofen",
    alternatives: ["paracetamol", "acetaminophen"]
  },
  {
    drug: "warfarin",
    alternatives: ["apixaban", "dabigatran"]
  },
  {
    drug: "aspirin",
    alternatives: ["clopidogrel"]
  },
  {
    drug: "amoxicillin",
    alternatives: ["azithromycin", "doxycycline"]
  },
  {
    drug: "metformin",
    alternatives: ["glipizide", "glyburide"]
  },
  {
    drug: "lisinopril",
    alternatives: ["losartan"]
  },
  {
    drug: "atorvastatin",
    alternatives: ["rosuvastatin"]
  },
  {
    drug: "omeprazole",
    alternatives: ["pantoprazole"]
  },
  {
    drug: "prednisone",
    alternatives: ["methylprednisolone"]
  },
  {
    drug: "naproxen",
    alternatives: ["paracetamol"]
  }
];

async function seedAlternatives() {

  try {

    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("MongoDB Connected");

    for (const item of alternatives) {

      const normalized = item.drug
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const drug = await DrugLexicon.findOne({
        normalizedName: normalized
      });

      if (!drug) {

        console.log(`Drug not found in lexicon: ${item.drug}`);
        continue;

      }

      drug.alternatives = item.alternatives;

      await drug.save();

      console.log(
        `Added alternatives for ${item.drug}: ${item.alternatives.join(", ")}`
      );

    }

    console.log("Drug alternatives seeded successfully");

    process.exit();

  } catch (error) {

    console.error(error);
    process.exit(1);

  }

}

seedAlternatives();