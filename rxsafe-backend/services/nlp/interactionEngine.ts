// services/nlp/interactionEngine.ts
/**
 * Interaction Engine
 *
 * - Accepts extracted drugs (from NLP)
 * - Normalizes names and queries DrugInteraction collection
 * - Returns alerts in the shape used by prescriptionController
 *
 * Note: This is intentionally defensive and asynchronous.
 */

import Interaction from "../../models/Interaction";

export type ExtractedDrug = {
  name: string;
  normalizedName?: string;
  dose?: string | null;
  frequency?: string | null;
  route?: string | null;
  originalTextSpan?: string | null;
};

export type AlertOut = {
  drugs: string[];
  severity: "low" | "moderate" | "high";
  severityLabel?: string;
  description?: string;
  recommendedAction?: string;
  mechanism?: string;
  references?: string[];
  score?: number;
  heuristic?: boolean;
};

/** normalize textual drug name to match your normalizedName generation */
export function normalizeName(s: string | undefined | null) {
  if (!s) return "";

  return s
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    // Fix common OCR confusion: lowercase L instead of I
    .replace(/^l(?=[a-z])/, "i");
}

/**
 * Query the Interaction DB for a pair (a,b) or (b,a)
 * Returns the found interaction document or null
 */
async function findInteractionPair(a: string, b: string) {
  if (!a || !b) return null;

  const normA = normalizeName(a);
  const normB = normalizeName(b);

  // check both orders
  const doc =
    (await Interaction.findOne({ drugA: normA, drugB: normB }).lean()) ||
    (await Interaction.findOne({ drugA: normB, drugB: normA }).lean());

  return doc;
}

/**
 * Build alerts for a set of extracted drugs.
 * For N drugs, check all unique pairs.
 */
export async function findInteractionsForExtracted(
  extracted: ExtractedDrug[]
): Promise<AlertOut[]> {
  const alerts: AlertOut[] = [];

  // if fewer than 2 drugs, nothing to check
  if (!extracted || extracted.length < 2) return alerts;

  // Build a map for quick normalized names
  const items = extracted.map((d) => ({
    name: d.name,
    norm: d.normalizedName || normalizeName(d.name),
  }));

  // check all unique pairs
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      try {
        const doc: any = await findInteractionPair(a.norm, b.norm);
        if (!doc) continue;

        // Normalize to the alert shape expected by prescriptionController
        const alert: AlertOut = {
          drugs: [a.name, b.name],
          severity: doc.severity || "low",
          severityLabel: doc.severityLabel || (doc.score >= 70 ? "major" : doc.score >= 40 ? "moderate" : "minor"),
          description: doc.description || "",
          recommendedAction: doc.recommendedAction || doc.recommended_action || "",
          mechanism: doc.mechanism || "",
          references: doc.references || [],
          score: typeof doc.score === "number" ? doc.score : (doc.score ?? 10),
          heuristic: false,
        };

        alerts.push(alert);
      } catch (err) {
        // non-fatal: log server-side and continue
        // eslint-disable-next-line no-console
        console.error("interactionEngine: error checking pair", a, b, err);
      }
    }
  }

  return alerts;
}
