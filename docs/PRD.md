# Product requirements document

## 1. Product goal

Build a memorable, trustworthy medication-safety demonstration for Indian brand-name prescriptions. The system should transform messy prescription input into a transparent review rather than presenting a confident but unsupported answer.

## 2. Primary user and user promise

### Primary user

Patient/caregiver first, with a pharmacist- or clinician-readable evidence view.

### User promise

“I can see which medicines were identified, which active ingredients they contain, which safety checks ran, which findings matter most, and exactly what needs confirmation.”

## 3. The winning product thesis

The strongest differentiator is not “AI checks medicines.” It is:

> When a brand, formulation, OCR result, or instruction is uncertain, MedGuard India visibly reduces its confidence and can refuse to complete a brand-dependent safety check.

The product therefore separates:

- **Match confidence:** confidence that a typed/OCR name maps to the correct formulation.
- **Clinical priority:** the potential importance of a finding once the relevant ingredients are verified.
- **Evidence completeness:** whether the data required for a specific rule is present.

These are never collapsed into one “safe/unsafe” score.

## 4. Core experience

### Flow A — typed prescription

1. User enters one medicine per line, optionally with strength, frequency, duration, and notes.
2. System extracts medicine names and instructions.
3. System displays each proposed brand/formulation match and confidence.
4. User confirms candidate matches when required.
5. Only verified formulations enter brand-dependent safety checks.
6. System shows prioritized findings, evidence, blocked checks, and next steps.

### Flow B — OCR prescription from upload or camera

1. User uploads a clear image or opens the laptop/phone camera.
2. OCR runs locally in the browser.
3. Extracted text is displayed as editable text.
4. OCR uncertainty is treated as a reason for confirmation, not as evidence.
5. The rest of the flow is identical to typed input.

The camera path supports both `getUserMedia` live preview/capture and the mobile `capture="environment"` fallback. Camera permission failure must leave the user with a normal image-upload option.

## 5. Must-have acceptance criteria for the hackathon

- A public page loads without authentication or paid API keys.
- A user can load or type a multi-medicine prescription.
- A user can upload an image or capture one from a laptop/phone camera before OCR.
- At least one brand pair with the same active ingredient is detected after ingredient expansion.
- At least one combination product is expanded into multiple ingredients.
- Common prescription frequency abbreviations are normalized into structured instructions.
- Daily exposure is calculated only when verified strength, quantity, and fixed frequency are present.
- Patient context fields (age, weight, kidney status, and liver history) are visible and missing context blocks unsupported dose conclusions.
- A narrow, versioned paracetamol exposure screen can flag potentially excessive daily exposure without claiming a personalized prescription decision.
- A misspelled or OCR-like brand returns a candidate or unresolved state instead of silently becoming a verified match.
- The safety report distinguishes high-priority findings, review-needed findings, informational results, and blocked checks.
- Each finding contains a reason, evidence/provenance label, and next verification step.
- The report never uses a binary “SAFE” result.
- The UI prominently says the prototype is not medical advice.
- A judge can understand the confidence-gate contribution in less than one minute.

## 6. Nice-to-have only if time remains

- Downloadable report.
- Separate pharmacist detail mode.
- Patient-context fields such as age or pregnancy status.
- A research metrics drawer with a small test-set table.
- A polished OCR demo image.

## 7. Explicit non-goals

- Replacing a doctor or pharmacist.
- Diagnosing a condition or recommending a treatment.
- Claiming complete interaction coverage.
- Treating a brand-name registry as a complete clinical knowledge base.
- Running a live scrape or undocumented API dependency in the judging flow.
- Accepting real patient-identifiable information.
- Giving a green “all clear” when a required check was blocked.

## 8. Required empty and failure states

- **No input:** ask for at least one medicine line.
- **Unknown brand:** show “No safe match” and the exact missing fields needed.
- **Ambiguous brand:** show candidates and require confirmation.
- **Missing instructions:** show that dose/exposure checks were not completed.
- **OCR failure:** allow typed fallback without losing the safety disclaimer.
- **No finding:** say “No supported issue detected in completed checks,” list the checks completed, and show limitations.

## 9. UI principles

- Calm, clinical, and approachable; not alarmist.
- Use plain language first, with expandable technical detail.
- Make “why we know” visible beside each result.
- Keep uncertainty visually distinct from danger.
- Keep critical findings visible regardless of ranking or filtering.
