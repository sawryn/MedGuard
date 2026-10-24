# Evaluation and research plan

## 1. Research contribution

The prototype evaluates whether confidence-gated brand resolution can reduce incorrect automatic formulation mappings while preserving ingredient-level safety findings and making uncertainty visible.

This is a testable engineering contribution, not a claim that the system is clinically validated.

## 2. Research questions

- **RQ1:** How accurately does the resolver identify verified Indian brand formulations, aliases, spelling variants, and combinations?
- **RQ2:** Does a confidence gate reduce incorrect automatic acceptance compared with ordinary fuzzy matching?
- **RQ3:** Does evidence-linked prioritization keep important findings visible without presenting every low-confidence possibility as an alert?
- **RQ4:** Does the system abstain predictably when instructions or formulation evidence are incomplete?

## 3. Baselines

Keep the same medicine snapshot and safety rules across approaches.

| Approach | Resolution | Uncertainty behavior | Use |
|---|---|---|---|
| A | exact alias match | unresolved if no exact alias | conservative baseline |
| B | best fuzzy candidate | automatically accepts top match | measures fuzzy-risk tradeoff |
| C | fuzzy candidate + confidence margin + abstention | candidate/unresolved when evidence is weak | proposed method |

## 4. Minimum locked test set

For a 12-hour hackathon, target at least 25 hand-labeled cases:

- 5 exact brand matches;
- 5 spelling/OCR variants;
- 5 unknown or deliberately ambiguous names;
- 5 duplicate-ingredient cases;
- 3 combination-product cases;
- 2 missing-instruction cases.

The current engineering regression suite also covers abbreviation parsing, SOS blocking, patient-context dose screening, potentially excessive paracetamol exposure, and missing-context abstention. These checks demonstrate software behavior; they do not establish clinical validation.

Keep the final cases separate from examples used while tuning thresholds. Avoid putting near-identical aliases in both development and test data.

## 5. Metrics

### Resolution

- exact formulation accuracy;
- top-1 candidate accuracy;
- incorrect automatic acceptance rate;
- candidate/abstention rate;
- unresolved-case recall.

### Safety engine

- duplicate-ingredient precision and recall;
- missed critical designated cases;
- dose-check completion rate when inputs are sufficient;
- blocked-check correctness.

### Alert quality

- findings per prescription;
- proportion labeled actionable by a reviewer, if available;
- high-priority finding visibility;
- time to identify the main issue in the demo flow.

## 6. Success criteria agreed before final demo

- Zero incorrect automatic acceptance among deliberately ambiguous test cases, or clear abstention.
- Every designated duplicate-ingredient case is detected or explicitly blocked because its formulation is unresolved.
- No critical finding is removed merely to reduce alert count.
- The report exposes the number of completed and blocked checks.
- Any numerical result includes the number of test cases behind it.

## 7. What we may claim

Allowed:

- “On our curated test set, the confidence gate reduced incorrect automatic acceptance.”
- “The prototype surfaced duplicate active ingredients in the tested combinations.”
- “The system abstains on the tested ambiguous cases.”

Not allowed:

- “The system prevents medication harm.”
- “The system is clinically validated.”
- “The system covers all Indian medicines or interactions.”
- “The method is the first of its kind” without a systematic literature review.

## 8. Error analysis template

For every failure, record:

1. original input;
2. expected formulation;
3. system state and confidence;
4. whether the failure came from parsing, alias coverage, thresholding, evidence, or rule logic;
5. whether abstention was safer than automatic acceptance;
6. proposed correction and whether it changes the locked test set.
