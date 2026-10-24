import { MEDICINES } from "./medicines";
import { parseInstructions } from "./instructions";
import type { MedicineRecord, ResolvedMedicine } from "./types";

const normalize = (value: string) =>
  value.toLowerCase().replace(/[®™]/g, "").replace(/[^a-z0-9]+/g, "").trim();

const distance = (a: string, b: string) => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return matrix[a.length][b.length];
};

const similarity = (a: string, b: string) => {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const maxLength = Math.max(left.length, right.length);
  return 1 - distance(left, right) / maxLength;
};

export const extractNameAndInstructions = (line: string) => {
  const clean = line.replace(/^[-•*\d.)\s]+/, "").trim();
  const split = clean.split(/\s(?:—|–|-|:|,|\|)\s|\s{2,}/);
  if (split.length === 1) {
    const matchingAlias = ["brand", ...MEDICINES.flatMap((medicine) => [medicine.brand, ...medicine.aliases])]
      .slice(1)
      .sort((left, right) => right.length - left.length)
      .find((alias) => normalize(clean).startsWith(normalize(alias)) && normalize(clean) !== normalize(alias));
    if (matchingAlias) {
      const instructions = clean.slice(matchingAlias.length).trim();
      return { name: clean.slice(0, matchingAlias.length).trim(), instructions };
    }
  }
  const name = split[0]?.trim() || clean;
  const instructions = split.slice(1).join(" ").trim();
  return { name, instructions };
};

export const resolveMedicine = (input: string): ResolvedMedicine => {
  const { name, instructions } = extractNameAndInstructions(input);
  const normalizedName = normalize(name);
  const exact = MEDICINES.find((medicine) =>
    [medicine.brand, ...medicine.aliases].some((alias) => normalize(alias) === normalizedName),
  );

  if (exact) {
    return { input: name, record: exact, confidence: 1, status: "verified", candidates: [exact], extractedInstructions: instructions, parsedInstructions: parseInstructions(instructions) };
  }

  const scored = MEDICINES
    .map((medicine) => ({ medicine, score: Math.max(...[medicine.brand, ...medicine.aliases].map((alias) => similarity(name, alias))) }))
    .sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 3).filter(({ score }) => score >= 0.5).map(({ medicine }) => medicine);
  const best = scored[0];

  if (!best || best.score < 0.5) {
    return { input: name, confidence: 0, status: "unresolved", candidates: [], extractedInstructions: instructions, parsedInstructions: parseInstructions(instructions) };
  }

  const hasSafeMargin = best.score >= 0.88 && (!scored[1] || best.score - scored[1].score >= 0.08);
  return {
    input: name,
    record: hasSafeMargin ? best.medicine : undefined,
    confidence: best.score,
    status: hasSafeMargin ? "verified" : "candidate",
    candidates,
    extractedInstructions: instructions,
    parsedInstructions: parseInstructions(instructions),
  };
};

export const parsePrescription = (text: string) =>
  text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(resolveMedicine);

export const formatStrength = (record: MedicineRecord) =>
  record.ingredients.map((ingredient) => `${ingredient.name}${ingredient.strengthMg ? ` ${ingredient.strengthMg}${ingredient.unit ?? "mg"}` : ""}`).join(" + ");
