import type { Finding, PatientContext, ResolvedMedicine, SafetyReport } from "./types";
import { calculateExposures } from "./dose";
import { getParacetamolDailyLimit, PARACETAMOL_DAILY_RULE } from "./rules";

const getVerified = (medicines: ResolvedMedicine[]) => medicines.filter((medicine) => medicine.status === "verified" && medicine.record);

const DEFAULT_CONTEXT: PatientContext = { ageYears: null, weightKg: null, kidneyStatus: "unknown", liverDisease: "unknown" };

export const analyzeSafety = (medicines: ResolvedMedicine[], patientContext: PatientContext = DEFAULT_CONTEXT): SafetyReport => {
  const findings: Finding[] = [];
  const verified = getVerified(medicines);
  const blockedChecks: string[] = [];
  const checksCompleted = ["Brand-to-formulation resolution", "Ingredient expansion", "Duplicate active-ingredient scan"];
  const doseCalculations = calculateExposures(medicines);

  const uncertain = medicines.filter((medicine) => medicine.status !== "verified");
  if (uncertain.length > 0) {
    blockedChecks.push("Dose and interaction checks for unresolved or unconfirmed products");
    findings.push({
      id: "uncertain-resolution",
      title: `${uncertain.length} medicine${uncertain.length > 1 ? "s" : ""} need confirmation`,
      priority: "high",
      summary: "The safety engine is deliberately stopping before it guesses an ingredient or strength.",
      evidence: "Confidence-gated resolver: only verified formulations are used for brand-dependent checks.",
      nextStep: "Confirm the suggested formulation, strength, and dosage form before continuing.",
    });
  }

  const missingInstructions = medicines.filter((medicine) => medicine.status === "verified" && !medicine.extractedInstructions);
  if (missingInstructions.length > 0) {
    findings.push({
      id: "missing-instructions",
      title: "Dose schedule is incomplete",
      priority: "medium",
      summary: `${missingInstructions.map((medicine) => medicine.input).join(", ")} has no interpretable frequency or duration in the entered text.`,
      evidence: "Exposure calculations require a verified strength plus a complete instruction set.",
      nextStep: "Add frequency, dose quantity, and duration where clinically appropriate.",
    });
  } else if (verified.length > 0) {
    checksCompleted.push("Instruction normalization");
  }

  const calculatedExposures = doseCalculations.filter((calculation) => calculation.status === "calculated");
  const blockedExposures = doseCalculations.filter((calculation) => calculation.status === "blocked");
  if (calculatedExposures.length > 0) checksCompleted.push("Daily exposure arithmetic");
  if (blockedExposures.length > 0) {
    blockedChecks.push("Daily exposure for incomplete or as-needed instructions");
    findings.push({
      id: "dose-exposure-blocked",
      title: "Some daily exposure checks need more detail",
      priority: "medium",
      summary: blockedExposures.map((calculation) => calculation.reason).join(" "),
      evidence: "Exposure arithmetic runs only when verified strength, quantity, and fixed frequency are available.",
      nextStep: "Confirm the dose quantity and schedule, or review as-needed instructions with a qualified professional.",
    });
  }

  const paracetamolExposure = calculatedExposures
    .filter((calculation) => calculation.ingredient.toLowerCase() === "paracetamol")
    .reduce((total, calculation) => total + (calculation.dailyAmountMg ?? 0), 0);
  const hasParacetamol = verified.some((medicine) => medicine.record!.ingredients.some((ingredient) => ingredient.name.toLowerCase() === "paracetamol"));
  if (hasParacetamol) {
    const limit = getParacetamolDailyLimit(patientContext);
    if (patientContext.liverDisease === "yes") {
      findings.push({
        id: "liver-context-review",
        title: "Liver history needs professional review",
        priority: "high",
        summary: "The patient context indicates liver disease while a paracetamol-containing product is present.",
        evidence: `${PARACETAMOL_DAILY_RULE.sourceLabel}. The prototype does not decide whether paracetamol is appropriate for this patient.`,
        nextStep: "Confirm the product, total exposure, and plan with a qualified professional before use.",
        ruleId: PARACETAMOL_DAILY_RULE.ruleId,
        sourceUrl: PARACETAMOL_DAILY_RULE.sourceUrl,
      });
    }
    if (limit.status === "blocked") {
      blockedChecks.push("Patient-specific paracetamol dose-limit screen");
      findings.push({
        id: "patient-dose-context-blocked",
        title: "Patient-specific dose screening is incomplete",
        priority: "medium",
        summary: limit.reason,
        evidence: `${PARACETAMOL_DAILY_RULE.sourceLabel}. ${PARACETAMOL_DAILY_RULE.limitations[0]}`,
        nextStep: "Add the missing patient context or ask a qualified professional to review the dose.",
        ruleId: PARACETAMOL_DAILY_RULE.ruleId,
        sourceUrl: PARACETAMOL_DAILY_RULE.sourceUrl,
      });
    } else if (paracetamolExposure > limit.limitMg) {
      findings.push({
        id: "paracetamol-exposure-review",
        title: "Potentially excessive paracetamol exposure",
        priority: "high",
        summary: `${paracetamolExposure} mg/day was calculated against a prototype screening limit of ${limit.limitMg} mg/day.`,
        evidence: `${PARACETAMOL_DAILY_RULE.sourceLabel}. ${limit.basis}`,
        nextStep: "Do not change the prescription yourself; confirm the total exposure urgently with a qualified professional.",
        ruleId: PARACETAMOL_DAILY_RULE.ruleId,
        sourceUrl: PARACETAMOL_DAILY_RULE.sourceUrl,
      });
    } else {
      checksCompleted.push("Patient-context paracetamol dose screen");
    }
  }

  const ingredientMap = new Map<string, string[]>();
  for (const medicine of verified) {
    for (const ingredient of medicine.record!.ingredients) {
      const key = ingredient.name.toLowerCase();
      ingredientMap.set(key, [...(ingredientMap.get(key) ?? []), medicine.record!.brand]);
    }
  }

  for (const [ingredient, brands] of ingredientMap.entries()) {
    if (brands.length > 1) {
      findings.push({
        id: `duplicate-${ingredient}`,
        title: `Duplicate ingredient: ${ingredient.replace(/\b\w/g, (letter) => letter.toUpperCase())}`,
        priority: "high",
        summary: `${brands.join(" and ")} both contain this active ingredient, even though their brand names differ.`,
        evidence: "Ingredient-level expansion of the verified product snapshots.",
        nextStep: "Pause and confirm the intended total exposure with a qualified professional.",
      });
    }
  }
  if (verified.length > 0) checksCompleted.push("Ingredient duplication across brands and combinations");

  const hasIbuprofen = [...ingredientMap.keys()].some((ingredient) => ingredient === "ibuprofen");
  const hasAspirin = [...ingredientMap.keys()].some((ingredient) => ingredient === "aspirin");
  if (hasIbuprofen && hasAspirin) {
    findings.push({
      id: "nsaid-review",
      title: "NSAID combination needs professional review",
      priority: "medium",
      summary: "The entered products include ibuprofen and aspirin; the prototype does not infer whether the combination is appropriate.",
      evidence: "Conservative rule: concurrent NSAID exposure is escalated for pharmacist/clinician review rather than auto-cleared.",
      nextStep: "Confirm the indication, timing, patient history, and prescriber instructions.",
    });
  }

  if (verified.length === 0) {
    return { findings, checksCompleted: [], blockedChecks: ["All safety checks until at least one formulation is verified"], doseCalculations, patientContext, status: "unable-to-complete" };
  }

  if (findings.length === 0) {
    findings.push({
      id: "no-supported-issue",
      title: "No supported issue detected in completed checks",
      priority: "info",
      summary: "This is not a guarantee of safety. It means the limited, evidence-linked checks completed without a flagged issue.",
      evidence: `${checksCompleted.length} checks completed against ${verified.length} verified formulation${verified.length > 1 ? "s" : ""}.`,
      nextStep: "Review the original prescription and confirm missing patient context with a professional.",
    });
  }

  const hasHigh = findings.some((finding) => finding.priority === "high");
  return { findings, checksCompleted, blockedChecks, doseCalculations, patientContext, status: hasHigh ? "review-needed" : findings.some((finding) => finding.priority === "medium") ? "review-needed" : "no-supported-issue" };
};
