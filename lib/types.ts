export type Ingredient = {
  name: string;
  strengthMg?: number;
  unit?: string;
};

export type MedicineRecord = {
  id: string;
  brand: string;
  aliases: string[];
  form: string;
  manufacturer: string;
  ingredients: Ingredient[];
  sourceLabel: string;
  sourceUrl: string;
  accessedOn: string;
  verification: "curated-demo" | "synthetic";
};

export type PatientContext = {
  ageYears: number | null;
  weightKg: number | null;
  kidneyStatus: "unknown" | "known-normal" | "impaired";
  liverDisease: "unknown" | "no" | "yes";
};

export type ResolvedMedicine = {
  input: string;
  record?: MedicineRecord;
  confidence: number;
  status: "verified" | "candidate" | "unresolved";
  candidates: MedicineRecord[];
  extractedInstructions: string;
  parsedInstructions?: ParsedInstructions;
};

export type ParsedInstructions = {
  raw: string;
  quantity?: number;
  unit?: "tablet" | "capsule" | "ml" | "drop" | "puff" | "unknown";
  frequencyText?: string;
  timesPerDay?: number;
  duration?: number;
  durationUnit?: "day" | "days" | "week" | "weeks";
  asNeeded: boolean;
  timing?: string;
  missingFields: string[];
  status: "complete" | "partial" | "uninterpretable";
  confidence: number;
};

export type DoseCalculation = {
  medicine: string;
  ingredient: string;
  status: "calculated" | "blocked";
  dailyAmountMg?: number;
  reason?: string;
};

export type Finding = {
  id: string;
  title: string;
  priority: "high" | "medium" | "info";
  summary: string;
  evidence: string;
  nextStep: string;
  ruleId?: string;
  sourceUrl?: string;
};

export type SafetyReport = {
  findings: Finding[];
  checksCompleted: string[];
  blockedChecks: string[];
  doseCalculations: DoseCalculation[];
  patientContext: PatientContext;
  status: "review-needed" | "no-supported-issue" | "unable-to-complete";
};
