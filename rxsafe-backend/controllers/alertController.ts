import { Request, Response } from "express";
import Prescription from "../models/Prescription";
import { checkInteractions } from "../services/interactionService";
import DrugLexicon from "../models/DrugLexicon";

export const getAlertsForPrescription = async (
  req: Request,
  res: Response
) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const extractedDrugsRaw = prescription.nlpResult?.extracted || [];

const extractedDrugs = extractedDrugsRaw
  .filter((d: any) => d.name)
  .map((d: any) => ({
    name: d.name,
    normalizedName: (d.normalizedName || d.name).toLowerCase(),
  }));

    if (!extractedDrugs || extractedDrugs.length === 0) {
      return res.status(200).json({
        prescriptionId,
        totalAlerts: 0,
        alerts: [],
        message: "No drugs detected in prescription",
      });
    }

    // Call interaction engine
    const interactionResult = await checkInteractions(extractedDrugs);

    const dynamicAlerts = interactionResult.alerts.map((alert) => ({
      type: "INTERACTION",
      severity: alert.severityLabel.toUpperCase(),
      message: alert.description,
      drugNames: [alert.drugA, alert.drugB],
      createdAt: new Date(),
    }));

    // 🔹 DOSAGE VALIDATION
for (const drug of extractedDrugsRaw) {
  if (!drug.dose || !drug.normalizedName) continue;

  // extract numeric mg value
  const doseMatch = drug.dose.match(/(\d+(?:\.\d+)?)/);
  if (!doseMatch) continue;

  const doseValue = parseFloat(doseMatch[1]);

  const lexDrug = await DrugLexicon.findOne({
    normalizedName: drug.normalizedName.toLowerCase(),
  }).lean();

  if (!lexDrug || !lexDrug.maxDoseMg) continue;

  if (doseValue > lexDrug.maxDoseMg) {
    dynamicAlerts.push({
      type: "DOSAGE",
      severity: "HIGH",
      message: `${drug.name} dose ${doseValue}mg exceeds max recommended dose of ${lexDrug.maxDoseMg}mg`,
      drugNames: [drug.name],
      createdAt: new Date(),
    });

    // Update severity score if higher than interaction score
    interactionResult.maxSeverity = Math.max(
      interactionResult.maxSeverity,
      75 // treat dosage violation as MAJOR
    );
  }
}

    // 🔹 Persist alerts into prescription
prescription.alerts = dynamicAlerts;
prescription.severityScore = interactionResult.maxSeverity;

// Save updated prescription
await prescription.save();

    return res.status(200).json({
      prescriptionId,
      totalAlerts: dynamicAlerts.length,
      alerts: dynamicAlerts,
      severityScore: interactionResult.maxSeverity,
    });
  } catch (error) {
    console.error("Error generating alerts:", error);
    return res.status(500).json({
      message: "Failed to generate alerts",
    });
  }
};