# MedGuard India — positioning and project answer

## One-line position

> MedGuard India is a confidence-gated medication review layer for Indian brand-name prescriptions: it shows what was verified, what was checked, what is blocked, and when a professional must confirm the result.

## The problem

Prescription safety checks can fail before an interaction checker even starts:

- the prescription may use a brand name rather than an ingredient;
- two different brands may contain the same active ingredient;
- a combination product may hide an ingredient duplication;
- abbreviations may omit quantity, frequency, or duration;
- OCR or fuzzy matching may create a plausible but wrong formulation;
- patient context may be missing.

A confident answer based on the wrong formulation is less safe than a visible request for confirmation.

## What the prototype does

MedGuard accepts typed prescription text or browser-local OCR and then:

1. parses supported instructions such as OD, BD, TDS, QID, SOS, timing, quantity, and duration;
2. resolves Indian brand names into verified, candidate, or unresolved states;
3. expands combination products into their active ingredients;
4. detects duplicate active ingredients across different brands;
5. calculates supported daily exposure when the arithmetic inputs are explicit;
6. applies a narrow, versioned patient-context screen when the required context is present;
7. explains completed checks, blocked checks, evidence, and the next verification step.

## What is viable now

The current build is viable as:

- a hackathon demonstration;
- a pharmacist-assistance or medication-reconciliation workflow;
- a prescription clarification tool;
- a patient-facing question-generation experience;
- a research testbed for uncertainty-aware medical NLP.

It is not yet viable as an autonomous clinical decision-maker or a substitute for a pharmacist, doctor, or official product label.

## Core differentiation

### 1. Confidence-gated analysis

The system does not treat every fuzzy match as truth:

| Resolver state | System behavior |
|---|---|
| Verified | Run supported brand-dependent checks |
| Candidate | Show possible formulations and require confirmation |
| Unresolved | Abstain and request exact pack details |

### 2. Ingredient-level reasoning

The product looks through brand names and combination products to compare active ingredients. This is more useful for duplicate-ingredient detection than a brand-name-only lookup.

### 3. Safe abstention

Missing age, weight, schedule, formulation, or source evidence blocks the relevant check instead of generating a guessed conclusion.

### 4. Explainability

Every finding is presented as:

- what was found;
- how it was found;
- what source or rule supports it;
- what remains outside scope;
- what the user should confirm next.

## Recommended project answer

> We are building MedGuard India to address a practical medication-safety problem in India: prescriptions often use brand names, shorthand, and combination products, while safety depends on the underlying ingredients, dose, frequency, and patient context. MedGuard converts the prescription into an ingredient-level, explainable review. It detects duplicate ingredients, parses instructions, calculates supported exposure, and refuses to overclaim when the medicine or patient information is uncertain. Our contribution is confidence-gated analysis: verified formulations can be checked, ambiguous formulations require confirmation, and unknown formulations are not treated as safe. The current product is a decision-support prototype for pharmacists and medication reconciliation, not an autonomous clinical device.

## What we can claim

- The prototype supports deterministic parsing for a documented set of instructions.
- It can resolve the curated demo records into confidence-gated states.
- It can expose duplicate active ingredients across the included examples.
- It can block unsupported exposure checks.
- The current evaluation suite has 10 passing cases.

## What we must not claim yet

- Complete Indian medicine coverage.
- Clinically validated dose or interaction advice.
- A guarantee that a prescription is safe.
- Diagnosis or prescription recommendation.
- Production-ready OCR accuracy.
- General clinical effectiveness from the current 10-case evaluation.

## Best judging narrative

1. Start with the hidden ingredient problem: Dolo 650 and Crocin 650.
2. Show the duplicate paracetamol finding.
3. Add patient context and show the limited dose screen become supported.
4. Load `Dolo 65O` and demonstrate candidate confirmation rather than a guess.
5. Load Combiflam plus Dolo 650 and show combination expansion.
6. Close with the research contribution: compare exact matching, ordinary fuzzy matching, and confidence-gated abstention on a locked labeled set.

## Strong closing sentence

> MedGuard does not try to replace clinical judgment; it makes uncertainty visible before a medication-safety check is trusted.
