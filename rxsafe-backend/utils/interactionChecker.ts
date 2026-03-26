/**
 * Interaction Service — MongoDB-backed
 * Queries your existing DrugInteraction collection directly.
 */

import mongoose from "mongoose";

/* ===============================
   TYPES
================================ */

export interface DrugInput {
  name: string;
  normalizedName: string;
  doseStr?: string;
  doseValue?: number;
  doseUnit?: string;
}

export interface Alert {
  type:
    | "drug-drug"
    | "drug-allergy"
    | "wrong-dosage"
    | "duplicate-therapy"
    | "drug-disease"
    | "age-weight"
    | "banned-drug";
  drugs: string[];
  severity: "minor" | "moderate" | "major";
  description: string;
  priority: "info" | "moderate" | "critical";
  score: number;
  mechanism?: string;
  recommendedAction?: string;
}

export interface InteractionResult {
  alerts: Alert[];
  suggestions: string[];
}

/* ===============================
   MONGOOSE MODEL
   Matches your exact MongoDB schema
================================ */

const drugInteractionSchema = new mongoose.Schema(
  {
    drugA:             { type: String },
    drugB:             { type: String },
    severity:          { type: String },   // "high", "moderate", "low"
    severityLabel:     { type: String },   // "major", "moderate", "minor"
    description:       { type: String },
    score:             { type: Number },
    mechanism:         { type: String },
    recommendedAction: { type: String },
    references:        [{ type: String }],
  },
  { timestamps: true }
);

// Reuse model if already registered (hot reload safe)
const DrugInteraction: mongoose.Model<any> =
  mongoose.models.DrugInteraction as mongoose.Model<any> ||
  mongoose.model("DrugInteraction", drugInteractionSchema);

/* ===============================
   UTILITIES
================================ */

const norm = (s: string) => s.trim().toLowerCase();

function severityToPriority(
  severityLabel: string
): "info" | "moderate" | "critical" {
  const s = severityLabel?.toLowerCase();
  if (s === "major" || s === "high") return "critical";
  if (s === "moderate")              return "moderate";
  return "info";
}

function parseDose(doseStr?: string): { value: number; unit: string } | null {
  if (!doseStr) return null;
  const match = doseStr.match(/(\d+\.?\d*)\s*(mg|mcg|ml|g|iu)/i);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: match[2].toLowerCase() };
}

/* ===============================
   DUPLICATE THERAPY GROUPS
================================ */

const therapyGroups: Record<string, string[]> = {
  penicillin_antibiotic: ["amoxicillin", "ampicillin", "augmentin"],
  macrolide_antibiotic:  ["azithromycin", "clarithromycin", "erythromycin"],
  nsaid:                 ["ibuprofen", "diclofenac", "naproxen", "aspirin", "ketorolac"],
  ppi:                   ["omeprazole", "pantoprazole", "esomeprazole", "rabeprazole"],
  statin:                ["atorvastatin", "rosuvastatin", "simvastatin"],
  ssri:                  ["sertraline", "fluoxetine", "escitalopram", "paroxetine"],
  quinolone_antibiotic:  ["ciprofloxacin", "levofloxacin", "ofloxacin"],
  paracetamol_group:     ["paracetamol", "acetaminophen"],
};

/* ===============================
   SAFE DOSE RANGES
================================ */

const safeDoseRanges: Record<string, { adultMax: number; childMax: number }> = {
  paracetamol: { adultMax: 1000, childMax: 15  },
  ibuprofen:   { adultMax: 800,  childMax: 10  },
  amoxicillin: { adultMax: 875,  childMax: 25  },
  aspirin:     { adultMax: 1000, childMax: 0   }, // 0 = banned for children
  diclofenac:  { adultMax: 75,   childMax: 1   },
};

/* ===============================
   ELDERLY / PEDIATRIC RISK
================================ */

const elderlyRiskDrugs: Record<string, string> = {
  ibuprofen:     "NSAIDs increase GI bleeding and renal risk in elderly (>60).",
  diclofenac:    "NSAIDs carry elevated cardiovascular risk in elderly.",
  amitriptyline: "Anticholinergic effects dangerous in elderly — confusion, falls.",
  diazepam:      "Benzodiazepines increase fall and sedation risk in elderly.",
  digoxin:       "Narrow therapeutic index — toxicity risk elevated in elderly.",
};

const pediatricBannedDrugs: Record<string, string> = {
  aspirin:       "Contraindicated in children — risk of Reye's syndrome.",
  nimesulide:    "Banned for children under 12 due to hepatotoxicity.",
  tetracycline:  "Causes permanent tooth discoloration in children <8.",
  codeine:       "Banned in children under 12 — respiratory depression risk.",
};

const bannedDrugs: Record<string, string> = {
  nimesulide:  "Banned for pediatric use in India due to liver toxicity.",
  rofecoxib:   "Withdrawn due to cardiovascular toxicity.",
  cisapride:   "Withdrawn due to fatal cardiac arrhythmias.",
};

/* ===============================
   MAIN CHECKER
================================ */

export async function checkInteractions(
  drugs: DrugInput[],
  patientAge?: number | null,
  patientWeightKg?: number | null,
  diagnoses: string[] = [],
  allergies: string[] = []
): Promise<InteractionResult> {

  const alerts: Alert[] = [];
  const suggestions: string[] = [];
  const seen = new Set<string>();

  const normalizedDrugs = drugs.map((d) => ({
    ...d,
    n: norm(d.normalizedName || d.name),
    dose: parseDose(d.doseStr),
  }));

  const drugNames = normalizedDrugs.map((d) => d.n);

  console.log("[interactionService] Checking drugs:", drugNames);

  /* ---- 1. DRUG–DRUG FROM MONGODB ---- */

  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const a = drugNames[i];
      const b = drugNames[j];
      const key = [a, b].sort().join("|");
      if (seen.has(key)) continue;

      // Query both directions: (drugA=a, drugB=b) OR (drugA=b, drugB=a)
      const record = await DrugInteraction.findOne({
        $or: [
          { drugA: a, drugB: b },
          { drugA: b, drugB: a },
        ],
      });

      if (record) {
        const priority = severityToPriority(record.severityLabel || record.severity);
        alerts.push({
          type: "drug-drug",
          drugs: [a, b],
          severity: (record.severityLabel?.toLowerCase() || "moderate") as any,
          description: record.description || `Interaction between ${a} and ${b}.`,
          priority,
          score: record.score ?? 50,
          mechanism: record.mechanism || undefined,
          recommendedAction: record.recommendedAction || undefined,
        });
        suggestions.push(
          record.recommendedAction ||
          `Avoid combining ${a} and ${b}. Consult prescribing physician.`
        );
        seen.add(key);
        console.log(`[interactionService] ✓ DB hit: ${a} + ${b} → ${record.severityLabel}`);
      } else {
        console.log(`[interactionService] No record: ${a} + ${b}`);
      }
    }
  }

  /* ---- 2. DUPLICATE THERAPY ---- */

  for (const [groupName, members] of Object.entries(therapyGroups)) {
    const found = drugNames.filter((d) => members.includes(d));
    if (found.length >= 2) {
      const key = "dup|" + found.sort().join("|");
      if (!seen.has(key)) {
        alerts.push({
          type: "duplicate-therapy",
          drugs: found,
          severity: "moderate",
          description: `Multiple drugs from the same class (${groupName.replace(/_/g, " ")}): ${found.join(", ")}. Risk of overmedication.`,
          priority: "moderate",
          score: 60,
        });
        suggestions.push(`Review duplicate therapy: ${found.join(" + ")}. Use only one.`);
        seen.add(key);
      }
    }
  }

  /* ---- 3. WRONG DOSAGE ---- */

  for (const drug of normalizedDrugs) {
    const range = safeDoseRanges[drug.n];
    if (!range || !drug.dose) continue;

    const isChild = patientAge != null && patientAge < 18;
    const weight = patientWeightKg || 30;
    const maxDose = isChild ? range.childMax * weight : range.adultMax;

    if (range.childMax === 0 && isChild) {
      alerts.push({
        type: "wrong-dosage",
        drugs: [drug.n],
        severity: "major",
        description: `${drug.n} is not recommended for pediatric patients.`,
        priority: "critical",
        score: 90,
      });
      suggestions.push(`Do not use ${drug.n} in children. Consider a pediatric alternative.`);
      continue;
    }

    if (maxDose > 0 && drug.dose.value > maxDose) {
      alerts.push({
        type: "wrong-dosage",
        drugs: [drug.n],
        severity: "major",
        description: `${drug.n} dose ${drug.dose.value}${drug.dose.unit} exceeds safe max of ${maxDose}${drug.dose.unit}.`,
        priority: "critical",
        score: 85,
      });
      suggestions.push(`Reduce ${drug.n} to within safe range (max ${maxDose}${drug.dose.unit}).`);
    }
  }

  /* ---- 4. AGE-BASED RISKS ---- */

  if (patientAge != null) {
    if (patientAge > 60) {
      for (const drug of drugNames) {
        const msg = elderlyRiskDrugs[drug];
        if (msg) {
          alerts.push({
            type: "age-weight",
            drugs: [drug],
            severity: "moderate",
            description: msg,
            priority: "moderate",
            score: 55,
          });
          suggestions.push(`Use ${drug} with caution in elderly. Monitor closely.`);
        }
      }
    }

    if (patientAge < 18) {
      for (const drug of drugNames) {
        const msg = pediatricBannedDrugs[drug];
        if (msg) {
          alerts.push({
            type: "age-weight",
            drugs: [drug],
            severity: "major",
            description: msg,
            priority: "critical",
            score: 90,
          });
          suggestions.push(`${drug} is contraindicated in children. Use a pediatric-safe alternative.`);
        }
      }
    }
  }

  /* ---- 5. BANNED DRUGS ---- */

  for (const drug of drugNames) {
    const msg = bannedDrugs[drug];
    if (msg) {
      alerts.push({
        type: "banned-drug",
        drugs: [drug],
        severity: "major",
        description: msg,
        priority: "critical",
        score: 95,
      });
      suggestions.push(`${drug} is banned/withdrawn. Do not dispense.`);
    }
  }

  console.log(`[interactionService] Total alerts: ${alerts.length}`);

  return { alerts, suggestions };
}