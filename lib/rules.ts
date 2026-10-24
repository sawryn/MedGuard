import type { PatientContext } from "./types";

export const RULE_VERSION = "rules-v0.3";

export const PARACETAMOL_DAILY_RULE = {
  ruleId: "PARACETAMOL_DAILY_EXPOSURE_001",
  title: "Total paracetamol daily exposure screen",
  sourceLabel: "FDA acetaminophen dosing label used as a comparative reference",
  sourceUrl: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/204767s007lbl.pdf",
  limitations: [
    "Prototype screening rule; verify the current Indian product label and clinician instructions.",
    "Does not account for every liver, alcohol, route, timing, or comorbidity factor.",
  ],
};

export type DoseLimit = { status: "available"; limitMg: number; basis: string } | { status: "blocked"; reason: string };

export const getParacetamolDailyLimit = (context: PatientContext): DoseLimit => {
  if (context.ageYears === null) return { status: "blocked", reason: "Patient age is required for the prototype dose screen." };
  if (context.ageYears < 2) return { status: "blocked", reason: "This prototype does not screen paracetamol dosing for children under 2 years." };
  if (context.kidneyStatus === "impaired") return { status: "blocked", reason: "Kidney impairment is outside this prototype dose rule; professional review is required." };
  if (context.ageYears >= 13) {
    if (context.weightKg === null || context.weightKg <= 0) return { status: "blocked", reason: "Patient weight is required for the adult/adolescent dose screen." };
    if (context.weightKg >= 50) return { status: "available", limitMg: 4000, basis: "4,000 mg in 24 hours for people aged 13+ and weighing 50 kg or more." };
    return { status: "available", limitMg: Math.min(75 * context.weightKg, 3750), basis: "75 mg/kg in 24 hours, capped at 3,750 mg, for people aged 13+ and weighing under 50 kg." };
  }
  if (context.weightKg === null || context.weightKg <= 0) return { status: "blocked", reason: "Patient weight is required for the pediatric dose screen." };
  return { status: "available", limitMg: Math.min(75 * context.weightKg, 3750), basis: "75 mg/kg in 24 hours, capped at 3,750 mg, for children aged 2–12 years." };
};
