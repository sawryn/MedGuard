import type { DoseCalculation, ResolvedMedicine } from "./types";

export const calculateExposures = (medicines: ResolvedMedicine[]): DoseCalculation[] => {
  const calculations: DoseCalculation[] = [];

  for (const medicine of medicines) {
    if (medicine.status !== "verified" || !medicine.record) continue;
    const instructions = medicine.parsedInstructions;
    for (const ingredient of medicine.record.ingredients) {
      const label = `${medicine.record.brand} · ${ingredient.name}`;
      if (!ingredient.strengthMg) {
        calculations.push({ medicine: medicine.record.brand, ingredient: ingredient.name, status: "blocked", reason: `${label} has no verified strength in the current snapshot.` });
        continue;
      }
      if (!instructions?.quantity || !instructions.unit || instructions.asNeeded || !instructions.timesPerDay) {
        calculations.push({ medicine: medicine.record.brand, ingredient: ingredient.name, status: "blocked", reason: instructions?.asNeeded ? `${label} is marked SOS/as-needed, so a fixed daily exposure cannot be calculated.` : `${label} needs an explicit quantity and frequency before daily exposure can be calculated.` });
        continue;
      }
      calculations.push({ medicine: medicine.record.brand, ingredient: ingredient.name, status: "calculated", dailyAmountMg: ingredient.strengthMg * instructions.quantity * instructions.timesPerDay });
    }
  }

  return calculations;
};
