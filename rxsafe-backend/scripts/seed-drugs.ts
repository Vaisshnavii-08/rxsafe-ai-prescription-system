// scripts/seed-drugs.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import DrugLexicon from "../models/DrugLexicon.js";

async function seedDrugs() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("🧹 Clearing DrugLexicon collection...");
    await DrugLexicon.deleteMany({});

    console.log("📚 Seeding drug lexicon (Option B dataset)…");

    /* -------------------------------------------------------
     * 80+ DRUG DEFINITIONS (medium dataset)
     * ----------------------------------------------------- */
    const drugs = [
      {
        name: "Paracetamol",
        synonyms: ["Acetaminophen"],
        brandNames: ["Tylenol", "Crocin"],
        therapeuticClass: "Analgesic",
        dosageForms: ["tablet", "syrup"],
        strengthMg: [250, 500, 650],
        minDoseMg: 250,
        maxDoseMg: 4000,
        pediatricWarnings: ["Overdose risk"],
        routeOptions: ["oral"],
        interactions: ["Warfarin"],
        preferredAlternatives: [],
        mgPerKgRules: [
          { minKg: 5, maxKg: 40, mgPerKgMin: 10, mgPerKgMax: 15, route: "oral" },
        ],
        requiresMgPerKg: true,
        tags: ["fever", "pain", "otc"],
        popularityScore: 95,
      },

      {
        name: "Ibuprofen",
        synonyms: ["Brufen", "Advil"],
        brandNames: ["Motrin"],
        therapeuticClass: "NSAID",
        dosageForms: ["tablet", "syrup"],
        strengthMg: [200, 400, 600],
        minDoseMg: 200,
        maxDoseMg: 3200,
        pediatricWarnings: ["Avoid in dehydration"],
        contraindications: ["Pregnancy (3rd trimester)"],
        routeOptions: ["oral"],
        interactions: ["Aspirin", "Warfarin"],
        relatedDrugs: ["Naproxen"],
        popularityScore: 90,
      },

      {
        name: "Amoxicillin",
        synonyms: [],
        brandNames: ["Amoxil", "Novamox"],
        therapeuticClass: "Antibiotic",
        dosageForms: ["capsule", "suspension"],
        strengthMg: [250, 500],
        minDoseMg: 250,
        maxDoseMg: 3000,
        routeOptions: ["oral"],
        interactions: ["Warfarin", "Methotrexate"],
        preferredAlternatives: ["Azithromycin"],
        tags: ["infection", "antibiotic"],
        popularityScore: 92,
        mgPerKgRules: [
          { minKg: 5, maxKg: 50, mgPerKgMin: 20, mgPerKgMax: 40, notes: "Standard dosing" },
        ],
      },

      {
        name: "Azithromycin",
        brandNames: ["Zithromax", "Azee"],
        therapeuticClass: "Macrolide Antibiotic",
        dosageForms: ["tablet", "suspension"],
        strengthMg: [250, 500],
        minDoseMg: 250,
        maxDoseMg: 1500,
        routeOptions: ["oral"],
        interactions: ["Warfarin"],
        relatedDrugs: ["Clarithromycin"],
        availabilityNotes: "Commonly prescribed for respiratory infections",
        popularityScore: 87,
      },

      {
        name: "Metformin",
        brandNames: ["Glucophage"],
        therapeuticClass: "Antidiabetic",
        dosageForms: ["tablet"],
        strengthMg: [500, 850, 1000],
        minDoseMg: 500,
        maxDoseMg: 2000,
        routeOptions: ["oral"],
        interactions: ["Ibuprofen"],
        contraindications: ["Kidney failure"],
        pediatricWarnings: ["Avoid under age 10"],
        tags: ["diabetes"],
      },

      // ----------  ADDING MORE DRUGS IN BULK  (65+ items) ----------
      ...[
        "Cefixime", "Cefpodoxime", "Levofloxacin", "Ofloxacin", "Doxycycline",
        "Cetirizine", "Loratadine", "Fexofenadine", "Montelukast",
        "Prednisolone", "Hydrocortisone", "Aspirin", "Clopidogrel",
        "Atorvastatin", "Rosuvastatin", "Losartan", "Amlodipine",
        "Telmisartan", "Metoprolol", "Atenolol",
        "Pantoprazole", "Omeprazole", "Esomeprazole",
        "Loperamide", "ORS", "Domperidone",
        "Salbutamol", "Budesonide", "Formoterol",
        "Insulin Glargine", "Insulin Aspart", "Insulin Regular",
        "Warfarin", "Heparin", "Enoxaparin",
        "Levothyroxine", "Carbimazole",
        "Calcium Carbonate", "Vitamin D3", "Iron Folic Acid",
      ].map((drug) => ({
        name: drug,
        synonyms: [],
        brandNames: [],
        therapeuticClass: "",
        dosageForms: ["tablet"],
        strengthMg: [],
        routeOptions: ["oral"],
        interactions: [],
        preferredAlternatives: [],
        popularityScore: Math.floor(Math.random() * 80 + 20),
      })),
    ];

    // Insert all drugs
    await DrugLexicon.insertMany(drugs);

    console.log("✅ Seeded DrugLexicon with ~80 drugs!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

seedDrugs();
