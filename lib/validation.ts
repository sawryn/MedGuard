import type { PatientContext } from "./types";

export const MAX_PRESCRIPTION_CHARACTERS = 10_000;
export const MAX_PRESCRIPTION_LINES = 50;

export const DEFAULT_CONTEXT: PatientContext = {
  ageYears: null,
  weightKg: null,
  kidneyStatus: "unknown",
  liverDisease: "unknown",
};

export type AnalyzePayload = {
  prescription: string;
  context: PatientContext;
};

export type ValidationResult =
  | { ok: true; value: AnalyzePayload }
  | { ok: false; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const readPrescription = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((line) => typeof line === "string")) return value.join("\n");
  return null;
};

export const validateAnalyzePayload = (input: unknown): ValidationResult => {
  if (!isRecord(input)) return { ok: false, message: "Request body must be a JSON object." };

  const prescription = readPrescription(input.prescription);
  if (prescription === null) return { ok: false, message: "Prescription must be text or an array of text lines." };
  if (!prescription.trim()) return { ok: false, message: "At least one prescription line is required." };
  if (prescription.length > MAX_PRESCRIPTION_CHARACTERS) return { ok: false, message: `Prescription text must be ${MAX_PRESCRIPTION_CHARACTERS.toLocaleString()} characters or fewer.` };
  if (prescription.split(/\r?\n/).length > MAX_PRESCRIPTION_LINES) return { ok: false, message: `Prescription must contain ${MAX_PRESCRIPTION_LINES} lines or fewer.` };

  const rawContext = input.context;
  if (rawContext !== undefined && !isRecord(rawContext)) return { ok: false, message: "Patient context must be a JSON object." };
  const context = rawContext ?? {};

  const ageYears = context.ageYears === undefined || context.ageYears === null ? null : context.ageYears;
  if (ageYears !== null && (!isFiniteNumber(ageYears) || ageYears < 0 || ageYears > 120)) return { ok: false, message: "Patient age must be between 0 and 120 years." };

  const weightKg = context.weightKg === undefined || context.weightKg === null ? null : context.weightKg;
  if (weightKg !== null && (!isFiniteNumber(weightKg) || weightKg <= 0 || weightKg > 300)) return { ok: false, message: "Patient weight must be greater than 0 and no more than 300 kg." };

  const kidneyStatus = context.kidneyStatus ?? DEFAULT_CONTEXT.kidneyStatus;
  if (kidneyStatus !== "unknown" && kidneyStatus !== "known-normal" && kidneyStatus !== "impaired") return { ok: false, message: "Kidney status is not supported." };

  const liverDisease = context.liverDisease ?? DEFAULT_CONTEXT.liverDisease;
  if (liverDisease !== "unknown" && liverDisease !== "no" && liverDisease !== "yes") return { ok: false, message: "Liver-disease status is not supported." };

  return {
    ok: true,
    value: {
      prescription,
      context: { ageYears, weightKg, kidneyStatus, liverDisease },
    },
  };
};
