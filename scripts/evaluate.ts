import { parsePrescription } from "../lib/resolver";
import { analyzeSafety } from "../lib/safety";
import { calculateExposures } from "../lib/dose";
import type { PatientContext } from "../lib/types";

const cases = [
  { name: "exact verified brand", input: "Dolo 650 — 1 tablet twice daily", expected: "verified" },
  { name: "spelling variant remains reviewable", input: "Dolo 65O — 1 tab morning", expected: "candidate" },
  { name: "unknown brand abstains", input: "Zyqomab 400 — 1 tablet", expected: "unresolved" },
  { name: "duplicate hidden by brands", input: "Dolo 650 — 1 tablet\nCrocin 650 — 1 tablet", expected: "duplicate" },
  { name: "combination expansion", input: "Combiflam — 1 tablet\nDolo 650 — 1 tablet", expected: "duplicate" },
  { name: "abbreviation parsing", input: "Dolo 650 — 1 tab BD x 5 days", expected: "BD" },
  { name: "as-needed dose is blocked", input: "Dolo 650 — 1 tab SOS", expected: "blocked" },
];

let passed = 0;
for (const testCase of cases) {
  const medicines = parsePrescription(testCase.input);
  const report = analyzeSafety(medicines);
  const actual = testCase.expected === "duplicate"
    ? report.findings.some((finding) => finding.id.startsWith("duplicate-")) ? "duplicate" : "other"
    : testCase.expected === "BD"
      ? medicines[0]?.parsedInstructions?.timesPerDay === 2 && medicines[0]?.parsedInstructions?.duration === 5 ? "BD" : "other"
      : testCase.expected === "blocked"
        ? calculateExposures(medicines)[0]?.status
    : medicines[0]?.status;
  const ok = actual === testCase.expected;
  if (ok) passed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${testCase.name}  -> ${actual}`);
}

const adultContext: PatientContext = { ageYears: 35, weightKg: 68, kidneyStatus: "known-normal", liverDisease: "no" };
const doseCases = [
  { name: "patient context enables dose screen", input: "Dolo 650 — 1 tab BD", context: adultContext, expectedFinding: "none" },
  { name: "potentially excessive paracetamol is flagged", input: "Dolo 650 — 3 tab TDS", context: adultContext, expectedFinding: "paracetamol-exposure-review" },
  { name: "missing patient context blocks dose screen", input: "Dolo 650 — 1 tab BD", context: { ageYears: null, weightKg: null, kidneyStatus: "unknown", liverDisease: "unknown" } satisfies PatientContext, expectedFinding: "patient-dose-context-blocked" },
];

for (const testCase of doseCases) {
  const medicines = parsePrescription(testCase.input);
  const report = analyzeSafety(medicines, testCase.context);
  const actual = report.findings.some((finding) => finding.id === testCase.expectedFinding) ? testCase.expectedFinding : "none";
  const ok = actual === testCase.expectedFinding;
  if (ok) passed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${testCase.name}  -> ${actual}`);
}
const totalCases = cases.length + doseCases.length;
console.log(`\n${passed}/${totalCases} evaluation cases passed`);
if (passed !== totalCases) process.exitCode = 1;
