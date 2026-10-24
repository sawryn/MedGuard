"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileImage,
  Info,
  Leaf,
  ListChecks,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { DEMO_PRESCRIPTIONS } from "@/lib/medicines";
import { calculateExposures } from "@/lib/dose";
import { formatStrength, parsePrescription } from "@/lib/resolver";
import { analyzeSafety } from "@/lib/safety";
import type { Finding, PatientContext, ResolvedMedicine, SafetyReport } from "@/lib/types";
import { MAX_PRESCRIPTION_CHARACTERS } from "@/lib/validation";

type InputMode = "text" | "ocr";
type ViewMode = "review" | "method";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const DEFAULT_CONTEXT: PatientContext = { ageYears: null, weightKg: null, kidneyStatus: "unknown", liverDisease: "unknown" };

const getPatientContextError = (context: PatientContext) => {
  if (context.ageYears !== null && (!Number.isFinite(context.ageYears) || context.ageYears < 0 || context.ageYears > 120)) return "Enter an age from 0 to 120 years.";
  if (context.weightKg !== null && (!Number.isFinite(context.weightKg) || context.weightKg <= 0 || context.weightKg > 300)) return "Enter a weight greater than 0 and no more than 300 kg.";
  return "";
};

export default function Home() {
  const [view, setView] = useState<ViewMode>("review");
  const [mode, setMode] = useState<InputMode>("text");
  const [prescription, setPrescription] = useState(DEMO_PRESCRIPTIONS.duplicate);
  const [medicines, setMedicines] = useState<ResolvedMedicine[]>(() => parsePrescription(DEMO_PRESCRIPTIONS.duplicate));
  const [ocrStatus, setOcrStatus] = useState("");
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(true);
  const [serverReport, setServerReport] = useState<SafetyReport | null>(null);
  const [analysisSource, setAnalysisSource] = useState("Local demo engine");
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [patientContext, setPatientContext] = useState<PatientContext>(DEFAULT_CONTEXT);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const report = useMemo(() => serverReport ?? analyzeSafety(medicines, patientContext), [medicines, patientContext, serverReport]);
  const unresolvedCount = medicines.filter((medicine) => medicine.status !== "verified").length;
  const highPriorityCount = report.findings.filter((finding) => finding.priority === "high").length;

  const analyzePrescription = async (value: string, closeInput = false) => {
    setPrescription(value);
    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prescription: value, context: patientContext }) });
      if (!response.ok) throw new Error("Backend analysis failed");
      const data = (await response.json()) as { medicines: ResolvedMedicine[]; report: SafetyReport; dataVersion: string };
      setMedicines(data.medicines);
      setServerReport(data.report);
      setAnalysisSource(`Server analysis · ${data.dataVersion}`);
    } catch {
      setMedicines(parsePrescription(value));
      setServerReport(null);
      setAnalysisSource("Local fallback engine");
      setAnalysisError("Server analysis was unavailable, so the local deterministic engine was used.");
    } finally {
      setHasAnalyzed(true);
      setIsAnalyzing(false);
      if (closeInput) setShowInput(false);
    }
  };

  const loadScenario = (scenario: keyof typeof DEMO_PRESCRIPTIONS) => { void analyzePrescription(DEMO_PRESCRIPTIONS[scenario], true); };

  const confirmCandidate = (index: number, candidateId: string) => {
    const next = medicines.map((medicine, medicineIndex) => {
      if (medicineIndex !== index) return medicine;
      const record = medicine.candidates.find((candidate) => candidate.id === candidateId);
      if (!record) return medicine;
      return { ...medicine, record, status: "verified" as const, confidence: Math.max(medicine.confidence, 0.9), candidates: [record] };
    });
    setMedicines(next);
    setServerReport(null);
    setAnalysisSource("Local candidate confirmation");
    setHasAnalyzed(true);
  };

  const updatePatientContext = (next: PatientContext) => {
    setPatientContext(next);
    setServerReport(null);
    setAnalysisSource("Patient context changed");
    setHasAnalyzed(false);
  };

  const runOcr = async (file: File) => {
    setIsOcrRunning(true);
    setOcrStatus("Reading the image locally…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(file);
      await worker.terminate();
      const text = result.data.text.trim();
      if (!text) {
        setOcrStatus("No readable text found. Try a brighter, closer image or type the prescription.");
        return;
      }
      setPrescription(text);
      setMedicines(parsePrescription(text));
      setServerReport(null);
      setAnalysisSource("OCR draft not analyzed");
      setHasAnalyzed(false);
      setShowInput(true);
      setOcrStatus("OCR complete. Confirm every highlighted formulation before analysis.");
    } catch {
      setOcrStatus("OCR could not complete in this browser. You can continue with typed text.");
    } finally {
      setIsOcrRunning(false);
    }
  };

  useEffect(() => {
    setCameraSupported(Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  const status = getStatusCopy(report, hasAnalyzed, unresolvedCount);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="app-header">
        <button className="brand" onClick={() => { setView("review"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Go to safety overview">
          <span className="brand-mark"><Leaf size={19} /></span>
          <span><b>MedGuard</b><small>India</small></span>
        </button>
        <nav className="app-nav" aria-label="Main navigation">
          <button className={view === "review" ? "nav-item active" : "nav-item"} onClick={() => setView("review")}><ShieldCheck size={15} />Safety overview</button>
          <button className={view === "method" ? "nav-item active" : "nav-item"} onClick={() => setView("method")}><BookOpen size={15} />How MedGuard works</button>
        </nav>
        <div className="header-note"><LockKeyhole size={14} /> Images stay in your browser</div>
      </header>

      <main className="app-main" id="main-content" tabIndex={-1}>
        {view === "method" ? <MethodView onBack={() => setView("review")} /> : <>
          <section className="welcome-row">
            <div><p className="eyebrow">Your medication safety companion</p><h1>Here&apos;s what we found<br />in your prescription.</h1><p className="welcome-copy">A simple, transparent review of the medicines you entered. We show what we know — and where a professional should take a closer look.</p></div>
            <div className="date-chip"><span className="status-dot" />Prototype review<br /><b>Evidence-first · v0.1</b></div>
          </section>

          <section className={`status-card ${status.tone}`} aria-live="polite">
            <div className="status-icon">{status.tone === "green" ? <CheckCircle2 size={30} /> : status.tone === "amber" ? <Info size={30} /> : <AlertCircle size={30} />}</div>
            <div className="status-content"><div className="status-kicker">{status.kicker}</div><h2>{status.title}</h2><p>{status.summary}</p><div className="status-actions"><button className="primary-action" onClick={() => document.getElementById("attention-list")?.scrollIntoView({ behavior: "smooth", block: "start" })}>{status.actionLabel}<ArrowRight size={16} /></button><button className="quiet-action" onClick={() => setShowInput((current) => !current)}>{showInput ? "Hide prescription" : "Edit prescription"}</button></div></div>
            <div className="status-illustration"><div className="leaf-orbit orbit-one" /><div className="leaf-orbit orbit-two" /><Leaf size={88} strokeWidth={1.2} /></div>
          </section>

          <div className="review-meta"><span><Check size={15} />{report.checksCompleted.length} checks completed</span><span><LockKeyhole size={15} />{report.blockedChecks.length} checks blocked</span><span><ShieldCheck size={15} />{highPriorityCount} high-priority {highPriorityCount === 1 ? "item" : "items"}</span><span className="analysis-source">{isAnalyzing ? "Analyzing…" : analysisSource}</span></div>
          {analysisError && <div className="analysis-fallback" role="status" aria-live="polite"><Info size={14} />{analysisError}</div>}

          {showInput && <InputPanel mode={mode} setMode={setMode} close={() => setShowInput(false)} prescription={prescription} setPrescription={(value) => { setPrescription(value); setServerReport(null); setAnalysisSource("Draft not analyzed"); setHasAnalyzed(false); }} ocrStatus={ocrStatus} isOcrRunning={isOcrRunning} cameraSupported={cameraSupported} fileRef={fileRef} runOcr={runOcr} resolve={() => { void analyzePrescription(prescription, true); }} loadScenario={loadScenario} isAnalyzing={isAnalyzing} />}

          <section className="content-grid">
            <div className="main-column">
              <section className="section-block" id="attention-list"><div className="section-heading"><div><p className="eyebrow">First, what needs attention</p><h2>Worth a closer look</h2></div><span className="count-badge">{report.findings.length} {report.findings.length === 1 ? "item" : "items"}</span></div><p className="section-intro">These findings are prioritized so the most important information is easiest to see. Nothing is silently hidden.</p><div className="finding-stack">{hasAnalyzed ? report.findings.map((finding) => <FindingCard key={finding.id} finding={finding} expanded={expandedFinding === finding.id} onToggle={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)} />) : <div className="draft-card"><Sparkles size={19} /><span><b>Your prescription changed.</b> Resolve it to refresh the safety review.</span><button onClick={() => { void analyzePrescription(prescription, true); }}>Resolve now <ArrowRight size={14} /></button></div>}</div></section>

              <section className="section-block medicines-section"><div className="section-heading"><div><p className="eyebrow">Ingredient-level view</p><h2>Your medicines</h2></div><button className="text-action" onClick={() => setShowInput((current) => !current)}>{showInput ? "Close" : "Edit list"} <ArrowRight size={14} /></button></div><p className="section-intro">Different brand names can still share the same active ingredient. That is why we check what&apos;s inside each product.</p><div className="medicine-stack">{medicines.length ? medicines.map((medicine, index) => <MedicineCard key={`${medicine.input}-${index}`} medicine={medicine} index={index} onConfirm={confirmCandidate} />) : <div className="empty-card"><ClipboardCheck size={22} /><span>Add a medicine to start your review.</span></div>}</div></section>
            </div>

            <aside className="side-column">
              <PatientContextCard context={patientContext} onChange={updatePatientContext} onApply={() => { void analyzePrescription(prescription); }} isAnalyzing={isAnalyzing} />
              <div className="soft-card confidence-card"><div className="soft-card-icon"><ShieldCheck size={20} /></div><p className="eyebrow">Our safety promise</p><h3>We don&apos;t guess.</h3><p>We only run a safety check when the medicine match is verified. If something is unclear, we pause and show you why.</p><div className="confidence-line"><span>Verification coverage</span><b>{medicines.length ? `${medicines.filter((medicine) => medicine.status === "verified").length}/${medicines.length}` : "0/0"}</b></div></div>
              <div className="soft-card evidence-card"><div className="evidence-heading"><Database size={18} /><div><p className="eyebrow">How we know</p><h3>Every finding has a trail.</h3></div></div><p>Ingredients are expanded from a curated, source-linked snapshot. You can inspect the evidence instead of trusting a black box.</p><button className="secondary-action" onClick={() => setView("method")}>Open evidence &amp; method <ArrowRight size={15} /></button><a className="source-link" href="https://cdscoonline.gov.in/CDSCO/brandNames" target="_blank" rel="noreferrer">Verify source on CDSCO <ExternalLink size={13} /></a></div>
              <div className="soft-card demo-card"><p className="eyebrow">Try the story</p><h3>See the difference</h3><p>Load a prepared example for the live demo.</p><div className="demo-links"><button onClick={() => loadScenario("duplicate")}>Duplicate brands <ArrowRight size={14} /></button><button onClick={() => loadScenario("ambiguous")}>Uncertain match <ArrowRight size={14} /></button><button onClick={() => loadScenario("combo")}>Combination product <ArrowRight size={14} /></button></div></div>
            </aside>
          </section>

          <footer className="app-footer"><Info size={15} /><span><b>Prototype decision support — not medical advice.</b> This review does not diagnose, prescribe, or tell you to start, stop, or change medication. Please confirm the original pack and findings with a qualified professional.</span></footer>
        </>}
      </main>
    </div>
  );
}

function getStatusCopy(report: SafetyReport, hasAnalyzed: boolean, unresolvedCount: number) {
  if (!hasAnalyzed) return { tone: "amber", kicker: "Ready for a fresh review", title: "Your draft is waiting", summary: "Resolve the updated prescription to refresh the findings and see which checks can be completed.", actionLabel: "Resolve prescription" };
  if (report.status === "no-supported-issue") return { tone: "green", kicker: "Checks completed", title: "Nothing supported was flagged", summary: "The limited checks we could complete did not find a supported issue. That is not a guarantee of safety.", actionLabel: "See completed checks" };
  if (unresolvedCount) return { tone: "amber", kicker: "Confirmation needed", title: "We need to verify part of this prescription", summary: "We found a possible medicine match, but we will not guess its formulation. Confirm it before relying on checks that depend on it.", actionLabel: "See what needs confirmation" };
  return { tone: "coral", kicker: "Review needed", title: "We found something worth checking", summary: "Two medicines may share an active ingredient or an instruction may need clarification. Review the details below before taking action.", actionLabel: "See what needs attention" };
}

function InputPanel({ mode, setMode, close, prescription, setPrescription, ocrStatus, isOcrRunning, cameraSupported, fileRef, runOcr, resolve, loadScenario, isAnalyzing }: { mode: InputMode; setMode: (mode: InputMode) => void; close: () => void; prescription: string; setPrescription: (value: string) => void; ocrStatus: string; isOcrRunning: boolean; cameraSupported: boolean; fileRef: React.RefObject<HTMLInputElement | null>; runOcr: (file: File) => void; resolve: () => void; loadScenario: (scenario: keyof typeof DEMO_PRESCRIPTIONS) => void; isAnalyzing: boolean }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Live camera access is not available here. Use the device camera picker or choose an image instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOpen(false);
      setCameraError("Camera permission was unavailable. Allow camera access or choose an image instead.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("The camera is still starting. Try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("We could not capture that image. Try again or choose an existing image.");
        return;
      }
      stopCamera();
      void runOcr(new File([blob], `medguard-camera-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOpen(false);
      setCameraError("The camera preview could not be started. Use the device camera picker or choose an image instead.");
    });
  }, [cameraOpen]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  return <section className="input-panel">
    <div className="input-panel-heading"><div><p className="eyebrow">Update your prescription</p><h2>What should we review?</h2></div><button className="close-input" onClick={() => { stopCamera(); close(); }} aria-label="Close prescription editor">×</button></div>
    <div className="input-tabs"><button className={mode === "text" ? "active" : ""} onClick={() => { stopCamera(); setMode("text"); }}>Type it</button><button className={mode === "ocr" ? "active" : ""} onClick={() => setMode("ocr")}>Add image</button></div>
     {mode === "text" ? <><textarea className="warm-text-input" value={prescription} maxLength={MAX_PRESCRIPTION_CHARACTERS} onChange={(event) => setPrescription(event.target.value)} aria-label="Prescription text" /><div className="input-meta"><span>Use one medicine per line when possible.</span><span>{prescription.length.toLocaleString()} / {MAX_PRESCRIPTION_CHARACTERS.toLocaleString()}</span></div></> : <div className="warm-dropzone">
      {cameraOpen ? <div className="camera-preview"><video ref={videoRef} className="camera-video" aria-label="Live camera preview" autoPlay playsInline muted /><div className="camera-toolbar"><button className="secondary-action" onClick={stopCamera}>Cancel</button><button className="capture-action" onClick={capturePhoto}><Camera size={16} />Take photo</button></div></div> : <><FileImage size={26} /><b>Add a prescription image</b><span>Choose a file or use the camera on this device. OCR runs locally.</span><div className="camera-actions"><button className="secondary-action" onClick={() => fileRef.current?.click()} disabled={isOcrRunning}><Upload size={15} />{isOcrRunning ? "Reading…" : "Choose image"}</button><button className="secondary-action camera-button" onClick={() => { if (cameraSupported) void startCamera(); else cameraFileRef.current?.click(); }} disabled={isOcrRunning}><Camera size={15} />Use camera</button></div><span className="camera-hint">{cameraSupported ? "Live preview available on this device" : "Opens the device camera picker when supported"}</span></>}
    </div>}
    <input ref={fileRef} className="file-input" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void runOcr(file); }} />
    <input ref={cameraFileRef} className="file-input" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) void runOcr(file); }} />
    {cameraError && <div className="camera-error"><AlertCircle size={14} />{cameraError}<button onClick={() => cameraFileRef.current?.click()}>Use phone camera / choose image</button></div>}
    {ocrStatus && <div className="ocr-status"><ScanLine size={14} />{ocrStatus}</div>}
    <div className="input-actions"><button className="primary-action" onClick={resolve} disabled={isAnalyzing}><Sparkles size={15} />{isAnalyzing ? "Analyzing…" : "Resolve prescription"} {!isAnalyzing && <ArrowRight size={15} />}</button><button className="text-action" onClick={() => loadScenario("duplicate")} disabled={isAnalyzing}>Load a demo example</button></div>
  </section>;
}

function FindingCard({ finding, expanded, onToggle }: { finding: Finding; expanded: boolean; onToggle: () => void }) {
  const isHigh = finding.priority === "high";
  return <article className={`patient-finding ${finding.priority} ${expanded ? "expanded" : ""}`}><button className="finding-header" onClick={onToggle} aria-expanded={expanded}><span className="finding-bullet">{isHigh ? <AlertCircle size={18} /> : finding.priority === "medium" ? <Info size={18} /> : <CheckCircle2 size={18} />}</span><span className="finding-copy"><span className="finding-level">{finding.priority === "high" ? "High priority" : finding.priority === "medium" ? "Worth checking" : "Informational"}</span><strong>{finding.title}</strong><span>{finding.summary}</span></span><ChevronDown size={18} className={expanded ? "finding-chevron open" : "finding-chevron"} /></button>{expanded && <div className="finding-expanded"><div><b>How we know</b><span>{finding.evidence}</span>{finding.sourceUrl && <a className="finding-source" href={finding.sourceUrl} target="_blank" rel="noreferrer">Open source evidence <ExternalLink size={12} /></a>}</div><div><b>Next step</b><span>{finding.nextStep}</span></div></div>}</article>;
}

function MedicineCard({ medicine, index, onConfirm }: { medicine: ResolvedMedicine; index: number; onConfirm: (index: number, candidateId: string) => void }) {
  const record = medicine.record;
  const exposure = calculateExposures([medicine]);
  const instructions = medicine.parsedInstructions;
  return <article className={`medicine-card ${medicine.status}`}><div className="medicine-card-top"><div><span className="medicine-input">{medicine.input}</span><span className={`medicine-status ${medicine.status}`}>{medicine.status === "verified" ? <><CheckCircle2 size={13} />Verified</> : medicine.status === "candidate" ? <><Info size={13} />Candidate</> : <><AlertCircle size={13} />Unresolved</>}</span></div><div className="medicine-confidence"><b>{percent(medicine.confidence)}</b><span>match</span></div></div>{record ? <><p className="medicine-meta">{record.form} · {record.manufacturer} · {formatStrength(record)}</p><div className="ingredient-chips">{record.ingredients.map((ingredient) => <span className="ingredient-chip" key={`${record.id}-${ingredient.name}`}>{ingredient.name}{ingredient.strengthMg ? ` · ${ingredient.strengthMg}${ingredient.unit ?? "mg"}` : ""}</span>)}</div><div className="dose-summary"><div><b>Instructions</b><span>{instructions?.raw || "Not provided"}</span></div><div><b>Daily exposure</b><span>{exposure.length && exposure.every((item) => item.status === "calculated") ? exposure.map((item) => `${item.dailyAmountMg} mg ${item.ingredient}/day`).join(" · ") : exposure[0]?.reason || "Not calculated"}</span></div></div><a className="medicine-source" href={record.sourceUrl} target="_blank" rel="noreferrer">Source snapshot · {record.accessedOn} <ExternalLink size={12} /></a></> : <p className="medicine-meta">No verified formulation attached yet.</p>}{medicine.status === "candidate" && <div className="candidate-prompt"><b>Possible match found.</b><span>Confirm before brand-dependent checks run.</span><div>{medicine.candidates.map((candidate) => <button key={candidate.id} onClick={() => onConfirm(index, candidate.id)}>Use {candidate.brand} <ArrowRight size={13} /></button>)}</div></div>}{medicine.status === "unresolved" && <div className="candidate-prompt"><b>No safe match yet.</b><span>Add the exact brand, strength, and dosage form from the pack.</span></div>}</article>;
}

function PatientContextCard({ context, onChange, onApply, isAnalyzing }: { context: PatientContext; onChange: (context: PatientContext) => void; onApply: () => void; isAnalyzing: boolean }) {
  const update = (patch: Partial<PatientContext>) => onChange({ ...context, ...patch });
  const contextError = getPatientContextError(context);
  const contextReady = context.ageYears !== null && context.weightKg !== null && !contextError;
  return <section className="soft-card context-card" aria-labelledby="patient-context-title">
    <div className="context-heading"><div className="soft-card-icon"><Info size={19} /></div><div><p className="eyebrow">Patient context</p><h3 id="patient-context-title">Make the dose screen personal</h3></div></div>
    <p>Age and weight help the prototype decide whether its limited dose rule can run. Missing context keeps the check blocked.</p>
    <div className="context-fields">
      <label><span>Age <small>years</small></span><input name="ageYears" type="number" min="0" max="120" inputMode="numeric" placeholder="e.g. 35" value={context.ageYears ?? ""} aria-invalid={Boolean(contextError && context.ageYears !== null)} onChange={(event) => update({ ageYears: event.target.value ? Number(event.target.value) : null })} /></label>
      <label><span>Weight <small>kg</small></span><input name="weightKg" type="number" min="0" max="300" step="0.1" inputMode="decimal" placeholder="e.g. 68" value={context.weightKg ?? ""} aria-invalid={Boolean(contextError && context.weightKg !== null)} onChange={(event) => update({ weightKg: event.target.value ? Number(event.target.value) : null })} /></label>
      <label className="context-wide"><span>Kidney function</span><select name="kidneyStatus" value={context.kidneyStatus} onChange={(event) => update({ kidneyStatus: event.target.value as PatientContext["kidneyStatus"] })}><option value="unknown">Unknown</option><option value="known-normal">Known normal</option><option value="impaired">Impaired / concern</option></select></label>
      <label className="context-wide"><span>Liver disease</span><select name="liverDisease" value={context.liverDisease} onChange={(event) => update({ liverDisease: event.target.value as PatientContext["liverDisease"] })}><option value="unknown">Unknown</option><option value="no">No known disease</option><option value="yes">Yes / concern</option></select></label>
    </div>
    {contextError && <div className="context-error" role="alert">{contextError}</div>}
    <button className="secondary-action context-apply" onClick={onApply} disabled={isAnalyzing || !contextReady}>{isAnalyzing ? "Refreshing…" : "Apply to review"}<ArrowRight size={14} /></button>
    <small className="context-note">Prototype rule coverage: paracetamol daily exposure only. This is not a diagnosis or a personalized prescription.</small>
  </section>;
}

function MethodView({ onBack }: { onBack: () => void }) {
  return <section className="method-view"><div className="method-intro"><div><p className="eyebrow">How MedGuard works</p><h1>Trust is built<br />one careful step at a time.</h1><p className="welcome-copy">We separate what we know about a medicine from what a safety rule means. That lets the system be useful without pretending to be certain.</p></div><div className="method-quote"><Leaf size={22} /><span>“A visible pause is safer than a confident guess.”</span></div></div><div className="method-panels"><div className="method-panel"><div className="method-panel-icon"><Database size={19} /></div><p className="eyebrow">The checks</p><h2>What we look at</h2><p>Deterministic checks run only against verified formulations.</p><MethodRow label="Brand resolution" value="Exact + fuzzy candidates" /><MethodRow label="Ingredient expansion" value="Combinations included" /><MethodRow label="Duplicate scan" value="Active ingredient level" /><MethodRow label="Dose arithmetic" value="Blocked when incomplete" /><MethodRow label="Patient-context screen" value="Versioned prototype rule" /><MethodRow label="Interaction rules" value="Narrow reviewed set" /></div><div className="method-panel"><div className="method-panel-icon"><ShieldCheck size={19} /></div><p className="eyebrow">The guardrails</p><h2>When we pause</h2><p>A useful result can still be incomplete without pretending otherwise.</p><MethodRow label="Candidate match" value="Confirmation required" /><MethodRow label="Unknown brand" value="Abstain" /><MethodRow label="Missing schedule" value="Flag, do not infer" /><MethodRow label="Missing age or weight" value="Dose screen blocked" /><MethodRow label="High-priority finding" value="Never hidden" /><MethodRow label="No finding" value="Scope stays explicit" /></div></div><div className="evaluation-panel"><p className="eyebrow">Research contribution</p><h2>Same rules. Three ways to resolve a brand.</h2><p>We compare exact matching, ordinary fuzzy matching, and the confidence-gated resolver on the same labeled cases. The goal is not more alerts; it is fewer wrong automatic accepts while keeping important findings visible.</p><div className="strategy-row"><div><span>A</span><b>Exact baseline</b><small>Conservative aliases</small></div><div><span>B</span><b>Fuzzy baseline</b><small>Top candidate accepted</small></div><div className="strategy-featured"><span>C</span><b>Proposed method</b><small>Confidence margin + abstention</small></div></div></div><button className="primary-action" onClick={onBack}><ClipboardCheck size={15} />Back to safety overview <ArrowRight size={15} /></button></section>;
}

function MethodRow({ label, value }: { label: string; value: string }) {
  return <div className="method-row"><span>{label}</span><b>{value}</b></div>;
}
