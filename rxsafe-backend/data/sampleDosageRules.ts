// Sample dosage reference rules (DEMO DATA ONLY)
export const dosageRules: Record<
  string,
  { min: number; max: number; unit: string }
> = {
  paracetamol: { min: 250, max: 1000, unit: "mg" },
  ibuprofen: { min: 200, max: 800, unit: "mg" },
  amoxicillin: { min: 250, max: 500, unit: "mg" }
};
