import { NextResponse } from "next/server";
import { analyzeSafety } from "@/lib/safety";
import { parsePrescription } from "@/lib/resolver";
import { RULE_VERSION } from "@/lib/rules";
import type { PatientContext } from "@/lib/types";

export const runtime = "nodejs";

type AnalyzeRequest = {
  prescription?: string | string[];
  context?: Partial<PatientContext>;
};

const DEFAULT_CONTEXT: PatientContext = { ageYears: null, weightKg: null, kidneyStatus: "unknown", liverDisease: "unknown" };

export async function POST(request: Request) {
  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const text = Array.isArray(body.prescription) ? body.prescription.join("\n") : body.prescription;
  if (!text?.trim()) {
    return NextResponse.json({ error: "At least one prescription line is required." }, { status: 400 });
  }

  const medicines = parsePrescription(text);
  const context: PatientContext = {
    ageYears: typeof body.context?.ageYears === "number" ? body.context.ageYears : DEFAULT_CONTEXT.ageYears,
    weightKg: typeof body.context?.weightKg === "number" ? body.context.weightKg : DEFAULT_CONTEXT.weightKg,
    kidneyStatus: body.context?.kidneyStatus === "known-normal" || body.context?.kidneyStatus === "impaired" ? body.context.kidneyStatus : "unknown",
    liverDisease: body.context?.liverDisease === "yes" || body.context?.liverDisease === "no" ? body.context.liverDisease : "unknown",
  };
  const report = analyzeSafety(medicines, context);

  return NextResponse.json({
    dataVersion: "medguard-demo-2026-10-25",
    ruleVersion: RULE_VERSION,
    medicines,
    report,
  });
}
