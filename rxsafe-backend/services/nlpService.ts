// services/nlpService.ts
/**
 * NLP Service (updated)
 *
 * - Lightweight extraction using DrugLexicon lookups (name + synonyms)
 * - Dose/frequency heuristics (simple regex-based)
 * - Calls interactionEngine to augment alerts based on DB interactions
 *
 * NOTE: This is intentionally modular — keep complex ML/NLP separate.
 */

import DrugLexicon from "../models/DrugLexicon";
import { findInteractionsForExtracted, normalizeName } from "./nlp/interactionEngine";

export type PatientContext = {
  medicalConditions?: string[];
  age?: number | null;
  weightKg?: number | null;
};

export default {
  /**
   * analyzePrescriptionText
   * @param text OCR text (string)
   * @param patientContext optional patient snapshot
   */
  async analyzePrescriptionText(text: string = "", patientContext: PatientContext = {}) {
    // ensure string
    const raw = (text || "").toString().trim();
    if (!raw) {
      return {
        extracted: [],
        matchedDrugs: [],
        alerts: [],
        suggestions: [],
        allergies: [],
        medicalConditions: patientContext.medicalConditions || [],
      };
    }

    // Load drug lexicon entries (only active ones)
    const lex = await DrugLexicon.find({ isActive: true }).lean().exec();

    // build search map: key -> lex entry
    const searchEntries = lex.map((d: any) => {
      const tokens = [d.name, ...(d.synonyms || []), ...(d.brandNames || [])]
        .filter(Boolean)
        .map((s: string) => s.toString().toLowerCase());
      return {
        id: d._id,
        name: d.name,
        normalizedName: d.normalizedName || normalizeName(d.name),
        tokens,
        doc: d,
      };
    });

    const extracted: Array<any> = [];
    const matchedSet = new Set<string>();

    const lower = raw.toLowerCase();

    // Find tokens in text — prefer longest matches first
    searchEntries
      .sort((a, b) => (b.name.length - a.name.length))
      .forEach((entry) => {
        for (const t of entry.tokens) {
          if (!t) continue;
          const re = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
          if (re.test(lower)) {
            // avoid duplicates
            if (!matchedSet.has(entry.normalizedName)) {
              // Attempt to extract dose & frequency nearby (naive)
              const snippetIndex = lower.search(re);
              const contextStart = Math.max(0, snippetIndex - 60);
              const contextSnippet = lower.slice(contextStart, snippetIndex + entry.name.length + 60);

              // dose regex like "250mg", "500 mg"
              const doseMatch = contextSnippet.match(/(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml))/i);
              const freqMatch = contextSnippet.match(/\b(once daily|twice daily|daily|once a day|bid|tid|qhs|weekly|monthly|four times daily|every \d+ hours)\b/i);

              const dose = doseMatch ? doseMatch[0].trim() : null;
              const frequency = freqMatch ? freqMatch[0].trim() : null;

              extracted.push({
                name: entry.name,
                normalizedName: entry.normalizedName,
                dose,
                frequency,
                route: (entry.doc?.routeOptions && entry.doc.routeOptions[0]) || null,
                originalTextSpan: contextSnippet.trim(),
              });

              matchedSet.add(entry.normalizedName);
            }
            break; // stop token loop once matched
          }
        }
      });

    const matchedDrugs = Array.from(matchedSet);

    // If nothing matched, attempt naive drug-name regex heuristics: capture words followed by mg
    if (extracted.length === 0) {
      const fallbackMatches = Array.from(raw.matchAll(/([A-Za-z]{3,40})\s+(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml))/gi));
      for (const fm of fallbackMatches) {
        const name = fm[1];
        const dose = fm[2];
        extracted.push({
          name,
          normalizedName: normalizeName(name),
          dose,
          frequency: null,
          route: null,
          originalTextSpan: fm[0],
        });
        matchedDrugs.push(normalizeName(name));
      }
    }

    // Find DB interactions
    const alertsFromDb = await findInteractionsForExtracted(extracted);

    // Build suggestions: if interaction exists and lexicon has preferredAlternatives
    const suggestions: any[] = [];
    for (const a of alertsFromDb) {
      // try to get alternative(s) from lexicon for the drugs involved
      const involvedNorms = a.drugs.map((n: string) => normalizeName(n));
      const alternatives: string[] = [];

      for (const norm of involvedNorms) {
        const lexEntry = lex.find((l: any) => (l.normalizedName || normalizeName(l.name)) === norm);
        const entryWithAlternatives = lexEntry as { preferredAlternatives?: string[] };
        if (entryWithAlternatives && entryWithAlternatives.preferredAlternatives && entryWithAlternatives.preferredAlternatives.length) {
          alternatives.push(...entryWithAlternatives.preferredAlternatives);
        }
      }

      suggestions.push({
        type: "interaction-avoid",
        drugs: a.drugs,
        alternatives: Array.from(new Set(alternatives)),
        reason: a.description || "Interaction detected — consider alternatives",
      });
    }

    // allergies / conditions inference (very basic — to be replaced by real NLP)
    const allergies: string[] = []; // placeholder
    const medicalConditions = patientContext.medicalConditions || [];

    // Compose final NLP result
    const result = {
      extracted,
      matchedDrugs,
      alerts: alertsFromDb,
      suggestions,
      allergies,
      medicalConditions,
    };

    return result;
  },
};
