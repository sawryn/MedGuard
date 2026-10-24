# Data, evidence, and safety specification

## 1. Medicine record schema

Each shipped medicine record must contain:

```ts
type MedicineRecord = {
  id: string;
  brand: string;
  aliases: string[];
  form: string;
  manufacturer: string;
  ingredients: Array<{
    name: string;
    strengthMg?: number;
    unit?: string;
  }>;
  sourceLabel: string;
  sourceUrl: string;
  accessedOn: string;
  verification: "curated-demo" | "synthetic";
};
```

A brand name without formulation, strength, dosage form, and provenance is not sufficient for a verified match.

## 2. Data strategy for the 12-hour prototype

Use a small curated snapshot rather than making the demo depend on a live database. The snapshot should be built from public/official references where available, record an access date, and expose a “verify source” link.

The CDSCO approved-brand-name search utility is a useful source-verification path, but it should not be treated as a complete ingredient, interaction, or dose database. The Indian Pharmacopoeia Commission / National Formulary references can inform professional review, but every individual rule still needs a traceable source and scope.

Do not copy large copyrighted reference texts into the repository. Store short provenance notes and links.

## 3. Resolver states

| State | Meaning | Allowed action |
|---|---|---|
| `verified` | Exact trusted alias or high-margin candidate accepted by the resolver | Run supported brand-dependent checks |
| `candidate` | Plausible match, but ambiguity is material | Show candidates and require user confirmation |
| `unresolved` | No acceptable formulation match | Abstain and request exact pack details |

The acceptance threshold is an engineering parameter to measure, not a clinical truth. It must be recorded in the evaluation output.

## 4. Safety rules in the MVP

### Rule S1 — duplicate active ingredient

Expand every verified product into ingredients. If the same normalized ingredient appears in more than one product, create a high-priority review finding.

This rule must catch duplicates hidden by:

- different brand names;
- aliases/spelling variants after confirmation;
- combination products.

### Rule S2 — instruction completeness

Normalize the supported frequency abbreviations into structured instructions. If a line has no interpretable frequency or quantity, report that dose/exposure checks were not completed. Duration is tracked separately because daily exposure can sometimes be calculated without a course duration, but the missing duration must remain visible. Do not infer a schedule from free text when the evidence is insufficient.

### Rule S3 — supported exposure arithmetic

Only calculate a daily exposure when strength, quantity per administration, and a fixed frequency are explicit enough for deterministic arithmetic. SOS/PRN/as-needed instructions are not converted into a fixed daily exposure. The output must show the assumptions. A missing input blocks the calculation rather than producing a guessed number.

### Rule S4 — narrow interaction escalation

Only include an interaction rule when its source and scope are documented. In the current draft, concurrent ibuprofen and aspirin is escalated for professional review; the prototype does not declare it safe or unsafe for a particular patient.

### Rule S5 — unresolved formulation gate

No brand-dependent rule may claim completion for a medicine in `candidate` or `unresolved` state. The report must list the blocked rule and what the user should confirm.

### Rule S6 — patient-context paracetamol exposure screen

The prototype can screen total calculated paracetamol exposure only when the relevant age, weight, and instruction inputs are present. It uses a versioned prototype rule with source metadata and may flag exposure above the configured screening limit. It does not determine whether paracetamol is appropriate for a patient, and it blocks the screen for unsupported age ranges, kidney impairment, missing required context, or other clinical factors outside the rule.

The current UI collects age, weight, kidney status, and liver-disease history so the report can show what is known and what remains outside scope.

## 5. Evidence record for each rule

```ts
type RuleEvidence = {
  ruleId: string;
  title: string;
  scope: string;
  sourceLabel: string;
  sourceUrl: string;
  reviewedBy?: string;
  reviewedOn?: string;
  limitations: string[];
};
```

If no clinical reviewer is available before judging, the UI must use “prototype rule” language and avoid clinical-effectiveness claims.

## 6. Patient context boundary

The first public demo should not invent age, pregnancy, allergy, kidney, or liver conclusions. It may show a missing-context reminder. Patient-context rules are deferred until each rule has a reviewed source, a defined input schema, and test cases.

## 7. Safety wording

Preferred:

> No supported issue detected in the checks completed.

Avoid:

- “Safe”
- “No interaction” without scope
- “Doctor approved”
- “This medicine is right for you”
