/**
 * alertAdapter.ts
 * Transforms InteractionAlert[] from interactionService
 * → the shape your Mongoose Prescription schema expects.
 *
 * Your schema requires: { severity (Number), severityLabel, drugA, drugB, description, ... }
 * Our service produces: { score, priority, type, drugs[], description, ... }
 */

import { InteractionAlert } from "../services/interactionService";

export interface MongooseAlert {
  severity: number;          // required Number in your schema
  severityLabel: string;
  drugA: string;
  drugB: string;
  description: string;
  recommendedAction?: string;
  mechanism?: string;
  references?: string[];
  heuristic?: boolean;
  type?: string;
}

export function adaptAlerts(alerts: InteractionAlert[]): MongooseAlert[] {
  return alerts.map((a) => ({
    severity: a.score,                          // score → severity (Number)
    severityLabel: a.priority,                  // "critical"|"moderate"|"minor"
    drugA: a.drugs[0] ?? "",                    // first drug
    drugB: a.drugs[1] ?? a.type ?? "",          // second drug or type label
    description: a.description,
    recommendedAction: a.recommendedAction ?? "",
    mechanism: a.mechanism ?? "",
    references: a.references ?? [],
    heuristic: false,
    type: a.type,
  }));
}