import type { ParsedInstructions } from "./types";

const FREQUENCIES: Array<{ pattern: RegExp; label: string; timesPerDay?: number; asNeeded?: boolean }> = [
  { pattern: /\b(?:od|o\.d\.?|once\s+(?:a|per)\s+day|once\s+daily)\b/i, label: "OD", timesPerDay: 1 },
  { pattern: /\b(?:bd|b\.d\.?|twice\s+(?:a|per)\s+day|twice\s+daily)\b/i, label: "BD", timesPerDay: 2 },
  { pattern: /\b(?:tds|t\.d\.s\.?|three\s+times\s+(?:a|per)\s+day|three\s+times\s+daily)\b/i, label: "TDS", timesPerDay: 3 },
  { pattern: /\b(?:qid|q\.i\.d\.?|four\s+times\s+(?:a|per)\s+day|four\s+times\s+daily)\b/i, label: "QID", timesPerDay: 4 },
  { pattern: /\b(?:hs|h\.s\.?|at\s+bedtime|nightly)\b/i, label: "HS", timesPerDay: 1 },
  { pattern: /\b(?:sos|s\.o\.s\.?|prn|p\.r\.n\.?|as\s+needed|when\s+required|if\s+needed)\b/i, label: "SOS", asNeeded: true },
];

const UNIT_PATTERN = /\b(tablets?|tabs?|capsules?|caps?|ml|millilit(?:er|re)s?|drops?|puffs?|pieces?)\b/i;
const NUMBER_PATTERN = /(?:^|\s)(\d+(?:\.\d+)?|half|½)(?=\s|$)/i;

const parseNumber = (value: string | undefined) => {
  if (!value) return undefined;
  if (value.toLowerCase() === "half" || value === "½") return 0.5;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const normalizeUnit = (value: string | undefined): ParsedInstructions["unit"] => {
  if (!value) return undefined;
  const unit = value.toLowerCase();
  if (unit.startsWith("tablet") || unit.startsWith("tab")) return "tablet";
  if (unit.startsWith("capsule") || unit.startsWith("cap")) return "capsule";
  if (unit === "ml" || unit.startsWith("millil")) return "ml";
  if (unit.startsWith("drop")) return "drop";
  if (unit.startsWith("puff")) return "puff";
  return "unknown";
};

const parseDuration = (text: string) => {
  const match = text.match(/\b(?:for|x|×)\s*(\d+)\s*(day|days|week|weeks)\b/i);
  if (!match) return {};
  return { duration: Number(match[1]), durationUnit: match[2].toLowerCase() as ParsedInstructions["durationUnit"] };
};

const parseTiming = (text: string) => {
  const match = text.match(/\b(before|after)\s+(breakfast|lunch|dinner|food|meals?)\b|\b(at\s+bedtime|nightly)\b/i);
  return match?.[0]?.trim();
};

export const parseInstructions = (raw: string): ParsedInstructions => {
  const text = raw.trim();
  const numberMatch = text.match(NUMBER_PATTERN);
  const unitMatch = text.match(UNIT_PATTERN);
  const frequency = FREQUENCIES.find((candidate) => candidate.pattern.test(text));
  const duration = parseDuration(text);
  const timing = parseTiming(text);
  const quantity = parseNumber(numberMatch?.[1]);
  const unit = normalizeUnit(unitMatch?.[1]);
  const asNeeded = Boolean(frequency?.asNeeded);
  const missingFields: string[] = [];

  if (!quantity) missingFields.push("quantity");
  if (!unit) missingFields.push("unit");
  if (!frequency) missingFields.push("frequency");
  if (!duration.duration) missingFields.push("duration");

  const hasDoseInputs = Boolean(quantity && unit && frequency && !asNeeded && frequency.timesPerDay);
  const status: ParsedInstructions["status"] = !text
    ? "uninterpretable"
    : hasDoseInputs
      ? "complete"
      : quantity || unit || frequency || timing
        ? "partial"
        : "uninterpretable";

  const parsed: ParsedInstructions = {
    raw: text,
    quantity,
    unit,
    frequencyText: frequency?.label,
    timesPerDay: frequency?.timesPerDay,
    duration: duration.duration,
    durationUnit: duration.durationUnit,
    asNeeded,
    timing,
    missingFields,
    status,
    confidence: status === "complete" ? 1 : status === "partial" ? 0.7 : 0,
  };

  return parsed;
};
