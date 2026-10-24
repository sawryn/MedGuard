# MedGuard India — project documents

MedGuard India is a 12-hour hackathon prototype for explainable, uncertainty-aware medication safety checking of Indian brand-name prescriptions.

## Document order

1. [`PRD.md`](./PRD.md) — what we are building, for whom, and what must work in the demo.
2. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the product is structured and how data moves through it.
3. [`DATA_AND_SAFETY.md`](./DATA_AND_SAFETY.md) — medicine records, evidence provenance, confidence gates, and the deliberately narrow safety rules.
4. [`EVALUATION.md`](./EVALUATION.md) — research questions, baselines, test design, metrics, and allowed claims.
5. [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — the judge-facing three-minute story and fallback plan.

## Agreed constraints

- Time available: approximately 12 hours.
- Team: 2 members, mixed experience.
- Primary objective: winning demo first, with a defensible research story.
- Input: typed prescription plus optional browser-local OCR.
- Audience: patient-friendly language, with enough technical detail for pharmacists and judges.
- Deployment: public web app through GitHub and Vercel.
- Runtime data strategy: small cached, documented snapshot; no dependency on a live registry API during the demo.
- Core differentiator: confidence-gated brand resolution and ingredient-level safety analysis.
- Safety boundary: no binary “safe” claim, no diagnosis, no prescription changes, and no unsupported clinical inference.

## Current implementation status

The initial Next.js scaffold and a draft interaction flow already exist in `app/`, `lib/`, and `scripts/`. The UI is now considered a draft only. Further frontend work should follow the wireframes agreed after reviewing these documents.

## Product sentence

> MedGuard India does not merely look up drug interactions; it shows what was identified, what was checked, what remains uncertain, and when it is safer to stop and ask for confirmation.
