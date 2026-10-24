import { NextResponse } from "next/server";
import { analyzeSafety } from "@/lib/safety";
import { parsePrescription } from "@/lib/resolver";
import { RULE_VERSION } from "@/lib/rules";
import { validateAnalyzePayload } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validation = validateAnalyzePayload(body);
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });

  const medicines = parsePrescription(validation.value.prescription);
  const report = analyzeSafety(medicines, validation.value.context);

  return NextResponse.json({
    dataVersion: "medguard-demo-2026-10-25",
    ruleVersion: RULE_VERSION,
    medicines,
    report,
  });
}
