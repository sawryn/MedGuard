# Three-minute hackathon demo

## Demo story

“A conventional lookup can fail before the interaction checker even starts. MedGuard India first asks: did we identify the actual formulation? If not, it pauses.”

## 0:00–0:25 — Set the problem

Say:

> Indian prescriptions often use brand names, combination products, spelling variants, and incomplete directions. Two different brands can hide the same active ingredient. A confident lookup on the wrong formulation is worse than a visible request for confirmation.

Show the input screen and the disclaimer.

## 0:25–1:15 — Show hidden ingredient duplication

Load the duplicate scenario:

```text
Dolo 650 — 1 tablet twice daily
Crocin 650 — 1 tablet once daily
Pantop 40 — 1 tablet before breakfast
```

Point out:

1. each brand is resolved to a formulation;
2. the active ingredients are shown, not hidden;
3. Dolo 650 and Crocin 650 resolve to the same ingredient;
4. the report raises a high-priority duplicate finding;
5. the next step is professional confirmation, not an automatic prescription change.

## 1:15–2:05 — Show the trust differentiator

Load the uncertainty scenario:

```text
Dolo 65O — 1 tab morning
Augmentin 625 — 1 tab twice daily
```

Say:

> The O/0 ambiguity looks small, but it can change what product is selected. MedGuard shows a candidate and requires confirmation. It does not run brand-dependent safety checks against an unverified guess.

Show:

- candidate state;
- confidence percentage;
- blocked checks;
- exact next verification step.

## 2:05–2:35 — Show combination expansion

Load the combination scenario:

```text
Combiflam — 1 tablet after food
Dolo 650 — 1 tablet if needed
```

Point out that the combination product expands into ibuprofen and paracetamol before duplicate scanning.

## 2:35–2:50 — Show patient-context guardrails

Enter an age and weight in the patient context panel and apply the review.

Say:

> A dose screen is not allowed to run just because a medicine was recognized. It also needs the required patient context. When that context is missing or outside the prototype rule, MedGuard shows the blocked check instead of inventing a personalized conclusion.

Point out:

- the patient context is visible and editable;
- the limited paracetamol screen is versioned and source-linked;
- the rule remains explicitly prototype-level.

## 2:50–3:00 — Close with research

Say:

> Our research contribution is confidence-gated safety analysis: exact matching, fuzzy matching, and the proposed abstaining resolver can be evaluated on the same labeled cases. We measure not only how many findings appear, but also incorrect automatic acceptance, abstention behavior, and whether important findings remain visible.

End on the research lens panel and the source-verification link.

## If OCR is unreliable during judging

Do not risk the core story. Say:

> OCR is an optional input path; its output is always editable and must be confirmed. We will use typed text for the deterministic safety demonstration.

Then run the typed scenarios.

## Judge questions and short answers

### “Is this a medical device?”

No. This is a prototype decision-support demonstration, not a clinically validated product. It does not diagnose, prescribe, or replace a qualified professional.

### “Why not use an LLM for everything?”

The LLM-style language problem is limited to extraction or explanation. Formulation identity, arithmetic, ingredient duplication, and confidence gates are deterministic and evidence-linked.

### “Why not call a live database?”

The judging flow uses a documented snapshot so an API outage or undocumented change cannot silently change the result. Source links remain available for verification.

### “What makes this research?”

The method is testable: compare exact matching, ordinary fuzzy matching, and confidence-gated matching on the same labeled set, then report incorrect acceptance, abstention, safety recall, and alert burden.
