/**
 * Interaction Service — FINAL VERSION
 * 7-check CDSS pipeline:
 *   1. Drug–Drug Interaction    (MongoDB)
 *   2. Drug–Allergy Conflict
 *   3. Wrong Dosage Detection   (DrugLexicon maxDoseMg)
 *   4. Duplicate Therapy        (same therapeuticClass)
 *   5. Drug–Disease Contraindication
 *   6. Age / Weight Safety
 *   7. Banned / Restricted Drug
 */

import Interaction from "../models/Interaction";
import DrugLexicon from "../models/DrugLexicon";
import logger from "../config/logger";

/* ============================================================
   TYPES
============================================================ */

export interface DrugInput {
  name: string;
  normalizedName: string;
  doseStr?: string; // e.g. "500mg"
}

export interface InteractionAlert {
  type:
    | "drug-drug"
    | "allergy"
    | "dosage"
    | "duplicate"
    | "contraindication"
    | "age-weight"
    | "banned";
  drugs: string[];
  priority: "critical" | "moderate" | "minor";
  score: number;
  description: string;
  recommendedAction?: string;
  mechanism?: string;
  references?: string[];
}

export interface InteractionSuggestion {
  originalDrug: string;
  alternativeDrug: string;
  reason: string;
}

export interface InteractionResult {
  alerts: InteractionAlert[];
  suggestions: InteractionSuggestion[];
  riskLevel: "Safe" | "Low" | "Moderate" | "Critical";
  severityScore: number;
}

/* ============================================================
   CONSTANTS
============================================================ */

// Drugs that are banned / restricted for certain populations
const BANNED_DRUGS: Record<string, { reason: string; bannedFor: string }> = {
  nimesulide: {
    reason: "Banned for children under 12 due to hepatotoxicity risk.",
    bannedFor: "pediatric",
  },
  "phenyl butazone": {
    reason: "Withdrawn from most markets due to severe blood disorders.",
    bannedFor: "all",
  },
  cisapride: {
    reason: "Withdrawn due to fatal cardiac arrhythmias.",
    bannedFor: "all",
  },
  rofecoxib: {
    reason: "Withdrawn due to increased cardiovascular risk.",
    bannedFor: "all",
  },
};

// Drug-disease contraindications: disease keyword → drugs to avoid
const CONTRAINDICATIONS: Record<string, string[]> = {
  kidney: ["ibuprofen", "naproxen", "diclofenac", "indomethacin"],
  renal: ["ibuprofen", "naproxen", "diclofenac", "metformin"],
  liver: ["paracetamol", "acetaminophen", "methotrexate", "isoniazid"],
  hepatic: ["paracetamol", "acetaminophen", "methotrexate"],
  asthma: ["aspirin", "ibuprofen", "naproxen", "propranolol"],
  peptic: ["ibuprofen", "aspirin", "naproxen", "diclofenac"],
  ulcer: ["ibuprofen", "aspirin", "naproxen", "diclofenac"],
  diabetes: ["prednisolone", "dexamethasone", "betamethasone"],
  heart: ["ibuprofen", "naproxen", "diclofenac"],
  cardiac: ["ibuprofen", "naproxen", "diclofenac"],
  hypertension: ["pseudoephedrine", "phenylephrine"],
  glaucoma: ["atropine", "ipratropium", "scopolamine"],
};

// Elderly high-risk drugs (≥65)
const ELDERLY_HIGH_RISK = [
  "ibuprofen",
  "naproxen",
  "diclofenac",
  "diazepam",
  "alprazolam",
  "clonazepam",
  "amitriptyline",
  "doxepin",
  "diphenhydramine",
];

// Pediatric banned drugs (< 12)
const PEDIATRIC_BANNED = [
  "nimesulide",
  "aspirin",
  "tetracycline",
  "doxycycline",
  "ciprofloxacin",
];

// Drug allergy cross-reactivity groups
const ALLERGY_GROUPS: Record<string, string[]> = {
  penicillin: [
    "penicillin",
    "amoxicillin",
    "ampicillin",
    "amoxicillin-clavulanate",
    "piperacillin",
    "oxacillin",
  ],
  sulfa: ["sulfamethoxazole", "trimethoprim-sulfamethoxazole", "sulfadiazine"],
  nsaid: ["ibuprofen", "aspirin", "naproxen", "diclofenac", "indomethacin"],
  cephalosporin: [
    "cephalexin",
    "cefuroxime",
    "ceftriaxone",
    "cefixime",
    "cefdinir",
  ],
  macrolide: [
    "azithromycin",
    "clarithromycin",
    "erythromycin",
    "roxithromycin",
  ],
};

/* ============================================================
   HELPERS
============================================================ */

function parseDoseMg(doseStr?: string): number | null {
  if (!doseStr) return null;
  const match = doseStr.match(/(\d+(?:\.\d+)?)\s*mg/i);
  return match ? parseFloat(match[1]) : null;
}

function toPriority(score: number): "critical" | "moderate" | "minor" {
  if (score >= 75) return "critical";
  if (score >= 45) return "moderate";
  return "minor";
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/* ============================================================
   MAIN ENTRY — 5 PARAMS
============================================================ */

export const checkInteractions = async (
  drugs: DrugInput[],
  patientAge?: number | null,
  patientWeightKg?: number | null,
  diagnoses: string[] = [],
  allergies: string[] = []
): Promise<InteractionResult> => {
  if (!drugs || drugs.length === 0) {
    return { alerts: [], suggestions: [], riskLevel: "Safe", severityScore: 0 };
  }

  const alerts: InteractionAlert[] = [];
  const suggestions: InteractionSuggestion[] = [];

  const normDrugs = drugs.map((d) => normalize(d.normalizedName || d.name));
  const normAllergies = allergies.map(normalize);
  const normDiagnoses = diagnoses.map(normalize);

  /* ----------------------------------------------------------
     CHECK 1 — Drug–Drug Interaction (MongoDB)
  ---------------------------------------------------------- */
  for (let i = 0; i < normDrugs.length; i++) {
    for (let j = i + 1; j < normDrugs.length; j++) {
      const a = normDrugs[i];
      const b = normDrugs[j];

      const record = await Interaction.findOne({
        $or: [
          { drugA: a, drugB: b },
          { drugA: b, drugB: a },
        ],
      }).exec();

      if (!record) continue;

      // Map your DB severity → score
      const severityMap: Record<string, number> = {
        high: 90,
        major: 90,
        moderate: 60,
        medium: 60,
        low: 25,
        minor: 25,
      };
      const rawSeverity = (
        record.severity ||
        record.severityLabel ||
        "low"
      ).toLowerCase();
      const score = severityMap[rawSeverity] ?? 50;

      alerts.push({
        type: "drug-drug",
        drugs: [drugs[i].name, drugs[j].name],
        priority: toPriority(score),
        score,
        description:
          record.description ||
          `${drugs[i].name} interacts with ${drugs[j].name}.`,
        recommendedAction: record.recommendedAction,
        mechanism: record.mechanism,
        references: record.references || [],
      });

      // Suggest alternatives for critical interactions
      if (score >= 75) {
        const alt = await findSaferAlternative(a);
        if (alt && !suggestions.find((s) => s.originalDrug === drugs[i].name)) {
          suggestions.push({
            originalDrug: drugs[i].name,
            alternativeDrug: alt,
            reason: `${drugs[i].name} has a critical interaction with ${drugs[j].name}. ${alt} may be a safer option.`,
          });
        }
      }
    }
  }

  /* ----------------------------------------------------------
     CHECK 2 — Drug–Allergy Conflict
  ---------------------------------------------------------- */
  for (const allergy of normAllergies) {
    // Find which allergy group the patient belongs to
    for (const [group, members] of Object.entries(ALLERGY_GROUPS)) {
      const allergyMatches = members.some(
        (m) => normalize(m) === allergy || normalize(m).includes(allergy)
      );
      if (!allergyMatches) continue;

      // Check if any prescribed drug is in that group
      for (let i = 0; i < normDrugs.length; i++) {
        const isInGroup = members.some((m) => normalize(m) === normDrugs[i]);
        if (!isInGroup) continue;

        alerts.push({
          type: "allergy",
          drugs: [drugs[i].name],
          priority: "critical",
          score: 95,
          description: `Patient has a ${allergy} allergy. ${drugs[i].name} belongs to the ${group} group and may trigger an allergic reaction.`,
          recommendedAction: `Avoid ${drugs[i].name}. Consult prescriber immediately.`,
        });

        suggestions.push({
          originalDrug: drugs[i].name,
          alternativeDrug: "Consult prescriber",
          reason: `${drugs[i].name} is contraindicated due to patient's ${allergy} allergy.`,
        });
      }
    }
  }

  /* ----------------------------------------------------------
     CHECK 3 — Wrong Dosage Detection
  ---------------------------------------------------------- */
  for (const drug of drugs) {
    const doseMg = parseDoseMg(drug.doseStr);
    if (!doseMg) continue;

    const lexicon = await DrugLexicon.findOne({
      normalizedName: normalize(drug.normalizedName || drug.name),
    }).exec();

    if (!lexicon) continue;

    const maxDose =
      patientAge && patientAge < 12
        ? lexicon.maxPediatricDoseMg || lexicon.maxDoseMg
        : lexicon.maxDoseMg;

    if (maxDose && doseMg > maxDose) {
      const score = 85;
      alerts.push({
        type: "dosage",
        drugs: [drug.name],
        priority: toPriority(score),
        score,
        description: `${drug.name} prescribed at ${doseMg}mg exceeds the safe maximum of ${maxDose}mg.`,
        recommendedAction: `Reduce dose to ≤${maxDose}mg or switch medication.`,
      });
    }
  }

  /* ----------------------------------------------------------
     CHECK 4 — Duplicate Therapy (same therapeutic class)
  ---------------------------------------------------------- */
  const classMap: Record<string, DrugInput[]> = {};

  for (const drug of drugs) {
    const lexicon = await DrugLexicon.findOne({
      normalizedName: normalize(drug.normalizedName || drug.name),
    }).exec();

    if (!lexicon?.therapeuticClass) continue;

    const cls = lexicon.therapeuticClass.toLowerCase();
    if (!classMap[cls]) classMap[cls] = [];
    classMap[cls].push(drug);
  }

  for (const [cls, members] of Object.entries(classMap)) {
    if (members.length < 2) continue;

    const score = 60;
    alerts.push({
      type: "duplicate",
      drugs: members.map((m) => m.name),
      priority: toPriority(score),
      score,
      description: `Duplicate therapy detected: ${members.map((m) => m.name).join(", ")} are all ${cls} class drugs.`,
      recommendedAction: `Consider using only one ${cls} agent to avoid additive side effects.`,
    });
  }

  /* ----------------------------------------------------------
     CHECK 5 — Drug–Disease Contraindication
  ---------------------------------------------------------- */
  for (const diagnosis of normDiagnoses) {
    for (const [keyword, contraDrugs] of Object.entries(CONTRAINDICATIONS)) {
      if (!diagnosis.includes(keyword)) continue;

      for (let i = 0; i < normDrugs.length; i++) {
        if (!contraDrugs.includes(normDrugs[i])) continue;

        const score = 90;
        alerts.push({
          type: "contraindication",
          drugs: [drugs[i].name],
          priority: toPriority(score),
          score,
          description: `${drugs[i].name} is contraindicated in patients with ${diagnosis}-related conditions.`,
          recommendedAction: `Avoid ${drugs[i].name}. Consider a safer alternative.`,
        });
      }
    }
  }

  /* ----------------------------------------------------------
     CHECK 6 — Age / Weight Safety
  ---------------------------------------------------------- */
  if (patientAge !== null && patientAge !== undefined) {
    const isElderly = patientAge >= 65;
    const isPediatric = patientAge < 12;

    for (let i = 0; i < normDrugs.length; i++) {
      if (isElderly && ELDERLY_HIGH_RISK.includes(normDrugs[i])) {
        const score = 70;
        alerts.push({
          type: "age-weight",
          drugs: [drugs[i].name],
          priority: toPriority(score),
          score,
          description: `${drugs[i].name} carries elevated risk in patients aged ≥65.`,
          recommendedAction: `Use lowest effective dose or consider a safer alternative.`,
        });

        if (!suggestions.find((s) => s.originalDrug === drugs[i].name)) {
          suggestions.push({
            originalDrug: drugs[i].name,
            alternativeDrug: "Paracetamol",
            reason: `${drugs[i].name} increases bleeding/renal risk in elderly. Paracetamol is preferred for analgesia.`,
          });
        }
      }

      if (isPediatric && PEDIATRIC_BANNED.includes(normDrugs[i])) {
        const score = 95;
        alerts.push({
          type: "age-weight",
          drugs: [drugs[i].name],
          priority: "critical",
          score,
          description: `${drugs[i].name} is not recommended for children under 12.`,
          recommendedAction: `Discontinue ${drugs[i].name}. Consult a pediatrician.`,
        });
      }
    }
  }

  /* ----------------------------------------------------------
     CHECK 7 — Banned / Restricted Drug
  ---------------------------------------------------------- */
  for (let i = 0; i < normDrugs.length; i++) {
    const banned = BANNED_DRUGS[normDrugs[i]];
    if (!banned) continue;

    const isRelevant =
      banned.bannedFor === "all" ||
      (banned.bannedFor === "pediatric" &&
        patientAge !== null &&
        patientAge !== undefined &&
        patientAge < 12);

    if (!isRelevant) continue;

    const score = 95;
    alerts.push({
      type: "banned",
      drugs: [drugs[i].name],
      priority: "critical",
      score,
      description: `${drugs[i].name} is a banned or restricted drug. ${banned.reason}`,
      recommendedAction: `Remove ${drugs[i].name} from the prescription immediately.`,
    });
  }

  /* ----------------------------------------------------------
     FINAL SCORING
  ---------------------------------------------------------- */
  const severityScore =
    alerts.length > 0 ? Math.max(...alerts.map((a) => a.score)) : 0;

  const riskLevel: InteractionResult["riskLevel"] =
    severityScore >= 85
      ? "Critical"
      : severityScore >= 60
      ? "Moderate"
      : severityScore >= 25
      ? "Low"
      : "Safe";

  logger.info(
    `[interactionService] ${alerts.length} alerts | score=${severityScore} | risk=${riskLevel}`
  );

  return { alerts, suggestions, riskLevel, severityScore };
};

/* ============================================================
   FIND SAFER ALTERNATIVE (DrugLexicon)
============================================================ */
const findSaferAlternative = async (
  normalizedName: string
): Promise<string | null> => {
  const drug = await DrugLexicon.findOne({
    normalizedName: normalizedName.toLowerCase(),
  }).exec();

  if (!drug) return null;

  if (drug.alternatives?.length) return drug.alternatives[0];

  if (drug.therapeuticClass) {
    const alt = await DrugLexicon.findOne({
      therapeuticClass: drug.therapeuticClass,
      normalizedName: { $ne: normalizedName.toLowerCase() },
    }).exec();
    if (alt) return alt.name;
  }

  return null;
};

/* ============================================================
   SEVERITY HELPERS (kept for backward compat)
============================================================ */
export const SEVERITY_LEVELS = {
  high: { score: 90, label: "major" },
  moderate: { score: 60, label: "moderate" },
  low: { score: 25, label: "minor" },
} as const;

export const getSeverityLevel = (severityText: string) => {
  const s = severityText.toLowerCase();
  if (s.includes("major") || s.includes("serious") || s.includes("high"))
    return SEVERITY_LEVELS.high;
  if (s.includes("moderate") || s.includes("medium"))
    return SEVERITY_LEVELS.moderate;
  return SEVERITY_LEVELS.low;
};

export default {
  checkInteractions,
  getSeverityLevel,
  SEVERITY_LEVELS,
};