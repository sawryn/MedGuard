# Technical architecture

## 1. Chosen stack

- **Frontend and runtime:** Next.js App Router + React + TypeScript.
- **Styling:** local CSS, responsive layout, no dependency on a design system during the 12-hour build.
- **OCR:** Tesseract.js in the browser; OCR output remains editable and untrusted until confirmed.
- **Data:** versioned TypeScript/JSON snapshot bundled with the app for reliable judging.
- **Safety engine:** deterministic TypeScript rules.
- **Deployment:** Vercel from GitHub.
- **AI APIs:** none required for the core safety workflow.

## 2. Module boundaries

```text
Input UI
  ├── typed text
  └── image upload → local OCR → editable text
          ↓
Prescription parser
  ├── medicine name
  ├── structured instructions
  ├── OD/BD/TDS/QID/SOS normalization
  └── missing-field flags
          ↓
Patient context gate
  ├── age
  ├── weight
  ├── kidney status
  └── liver history
          ↓
Brand resolver
  ├── exact aliases
  ├── fuzzy candidates
  ├── confidence score
  └── verified / candidate / unresolved state
          ↓
Ingredient expansion
  └── all active ingredients + strengths
          ↓
Confidence gate
  ├── verified → allowed rules
  └── uncertain → confirmation or abstention
          ↓
Deterministic safety engine
  ├── duplicate active ingredients
  ├── daily exposure arithmetic
  ├── supported exposure checks
  ├── narrow interaction rules
  └── missing information
          ↓
Evidence-linked report
  ├── finding priority
  ├── evidence/provenance
  ├── checks completed
  ├── checks blocked
  └── next verification step
```

## 3. Frontend state model

```text
idle
  → extracting
  → needs-confirmation
  → ready-to-check
  → analyzing
  → report
```

Any `candidate` or `unresolved` medicine keeps the flow in `needs-confirmation` for rules that depend on its formulation. The product may still show partial results, but it must label blocked checks.

## 4. Important implementation files

- `app/page.tsx`: current draft product flow; should be revised only after wireframe review.
- `lib/types.ts`: shared domain types.
- `lib/medicines.ts`: curated demo snapshot and demo scenarios.
- `lib/resolver.ts`: normalization, matching, parsing, and abstention logic.
- `lib/instructions.ts`: structured quantity, frequency, duration, as-needed, and timing parsing.
- `lib/dose.ts`: deterministic daily-exposure calculations with blocked states for incomplete instructions.
- `lib/rules.ts`: versioned evidence metadata and the narrow patient-context paracetamol exposure screen.
- `lib/safety.ts`: deterministic safety rules and report generation.
- `app/api/analyze/route.ts`: server-side analysis endpoint with dataset and rule version metadata.
- `scripts/evaluate.ts`: small reproducible baseline smoke evaluation.

## 5. Deployment and reliability choices

- The app should render and evaluate without secrets.
- The demo data is bundled, so a temporary registry outage cannot break the judging flow.
- Every source link is an external verification path, not a claim that the source is a complete interaction database.
- OCR failure must be recoverable by typing.
- The interface must remain usable on a laptop and a mobile-width viewport.

## 6. Future backend boundary

The current prototype exposes a server-side analysis endpoint:

- `POST /api/analyze`

The browser keeps camera capture and local OCR, then sends the editable prescription text to the endpoint. If the endpoint is unavailable, the frontend falls back to the local deterministic engine and visibly labels the fallback.

If the prototype evolves beyond the hackathon, the bundled snapshot can move behind:

- `POST /prescriptions/parse`
- `POST /medicines/resolve`
- `POST /safety/check`
- `GET /medicines/search`
- `GET /rules/:ruleId`

The resolver and rule schemas should remain deterministic and testable outside the UI.
