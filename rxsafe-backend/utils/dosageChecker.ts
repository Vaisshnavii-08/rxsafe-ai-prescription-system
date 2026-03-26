import { dosageRules } from "../data/sampleDosageRules";

interface DosageAlert {
  type: string;
  severity: "LOW" | "MODERATE" | "CRITICAL";
  message: string;
}

export function checkDosageAnomalies(
  extractedText: string,
  detectedDrugs: string[]
): DosageAlert[] {
  const alerts: DosageAlert[] = [];

  if (!extractedText || !detectedDrugs || detectedDrugs.length === 0) {
    return alerts;
  }

  for (const drug of detectedDrugs) {
    const rule = dosageRules[drug.toLowerCase()];
    if (!rule) continue;

    const regex = new RegExp(`(\\d+)\\s?${rule.unit}`, "i");
    const match = extractedText.match(regex);

    if (!match) continue;

    const dose = parseInt(match[1], 10);

    if (dose < rule.min || dose > rule.max) {
      alerts.push({
        type: "DOSAGE_ANOMALY",
        severity: "MODERATE",
        message: `Possible dosage anomaly for ${drug} (${dose}${rule.unit}). Clinical review advised.`
      });
    }
  }

  return alerts;
}
