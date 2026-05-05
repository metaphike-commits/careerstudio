"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileText,
  Plus,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { parseCVToProfile, type CandidateProofPoint, type Confidence, type ParsedCV } from "@/lib/cv-parser"
import { extractPDFText, isPDFFile, PDFExtractError } from "@/lib/pdf-extract"
import type { MasterCV } from "@/types"

type Step = "paste" | "review"

interface ExperienceRow {
  company: string
  title: string
  startYear: string
  endYear: string
  isCurrent: boolean
  description: string
  achievements: string[]
}

interface ProofPointDraft {
  text: string
  linkedSkill: string
  keep: boolean
}

interface ReviewDraft {
  name: string
  targetTitles: string
  skills: string
  positioningStatement: string
  experiences: ExperienceRow[]
  proofPoints: ProofPointDraft[]
}

// ─── Confidence badge ──────────────────────────────────────────────────────────

function confidenceLabel(confidence: Confidence): string {
  if (confidence === "high") return "Extrait du CV"
  if (confidence === "medium") return "Deduit du CV"
  if (confidence === "inferred") return "A verifier"
  return "Manquant"
}

function confidenceCls(confidence: Confidence): string {
  if (confidence === "high") return "bg-emerald-100 text-emerald-700"
  if (confidence === "medium") return "bg-amber-100 text-amber-700"
  if (confidence === "inferred") return "bg-yellow-100 text-yellow-700"
  return "bg-gray-100 text-gray-500"
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${confidenceCls(confidence)}`}>
      {confidenceLabel(confidence)}
    </span>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function skillsConfidence(parsed: ParsedCV): Confidence {
  if (parsed.skills.length >= 5) return "high"
  if (parsed.skills.length >= 1) return "medium"
  return "missing"
}

function experiencesConfidence(parsed: ParsedCV): Confidence {
  if (parsed.experiences.length >= 2) return "high"
  if (parsed.experiences.length === 1) return "medium"
  return "missing"
}

function proofPointsConfidence(pp: CandidateProofPoint[]): Confidence {
  if (pp.some((p) => p.confidence === "high")) return "high"
  if (pp.length > 0) return "medium"
  return "missing"
}

function parsedToReviewDraft(parsed: ParsedCV): ReviewDraft {
  return {
    name: parsed.name.value ?? "",
    targetTitles: (parsed.targetTitles.value ?? []).join(", "),
    skills: parsed.skills.join(", "),
    positioningStatement: parsed.positioningStatement.value ?? "",
    experiences: parsed.experiences.map((exp) => ({
      company: exp.company,
      title: exp.title,
      startYear: exp.startYear ? String(exp.startYear) : "",
      endYear: exp.endYear ? String(exp.endYear) : "",
      isCurrent: exp.isCurrent,
      description: exp.description,
      achievements: exp.achievements,
    })),
    proofPoints: parsed.proofPoints.map((pp) => ({
      text: pp.text,
      linkedSkill: pp.linkedSkill ?? "",
      keep: true,
    })),
  }
}

function missingFields(parsed: ParsedCV): string[] {
  const missing: string[] = []
  if (!parsed.name.value) missing.push("Nom")
  if (!parsed.targetTitles.value || parsed.targetTitles.value.length === 0) missing.push("Titres cibles")
  if (parsed.skills.length === 0) missing.push("Competences")
  if (!parsed.positioningStatement.value) missing.push("Positionnement")
  if (parsed.experiences.length === 0) missing.push("Experiences")
  return missing
}

// ─── Summary card ──────────────────────────────────────────────────────────────

function ExtractionSummary({ parsed }: { parsed: ParsedCV }) {
  const qualityConfig = {
    strong: { label: "Extraction reussie", cls: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2, iconCls: "text-emerald-600" },
    partial: { label: "Extraction partielle", cls: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle, iconCls: "text-amber-600" },
    weak: { label: "Extraction insuffisante", cls: "border-rose-200 bg-rose-50 text-rose-800", icon: AlertTriangle, iconCls: "text-rose-500" },
  }
  const q = qualityConfig[parsed.extractionQuality]
  const Icon = q.icon
  const missing = missingFields(parsed)

  return (
    <div className={`rounded-xl border ${q.cls} p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 shrink-0 ${q.iconCls}`} />
        <span className="text-sm font-semibold">{q.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <span>
          <strong>{parsed.experiences.length}</strong> experience(s) detectee(s)
        </span>
        <span>
          <strong>{parsed.skills.length}</strong> competence(s) detectee(s)
        </span>
        <span>
          <strong>{parsed.proofPoints.length}</strong> preuve(s) chiffree(s)
        </span>
        {missing.length > 0 && (
          <span className="col-span-2 mt-1">
            Champs manquants: {missing.join(", ")}
          </span>
        )}
        {parsed.hasExperienceSection && parsed.experiences.length === 0 && (
          <span className="col-span-2 mt-1 text-amber-700">
            Section Experience detectee, mais aucune experience n&apos;a pu etre structuree. Verifie le format ou corrige manuellement.
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("paste")
  const [cvText, setCvText] = useState("")
  const [parsed, setParsed] = useState<ParsedCV | null>(null)
  const [draft, setDraft] = useState<ReviewDraft | null>(null)
  const [weakConfirmed, setWeakConfirmed] = useState(false)
  const [pdfSource, setPdfSource] = useState<{ fileName: string; pageCount: number } | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { saveProfileAndRescore, setMasterCV, profile } = useAppStore()
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isPDFFile(file)) {
      setPdfError("Veuillez selectionner un fichier PDF.")
      return
    }
    setPdfError(null)
    setPdfSource(null)
    setIsExtracting(true)
    try {
      const { text, pageCount } = await extractPDFText(file)
      setCvText(text)
      setPdfSource({ fileName: file.name, pageCount })
      setPdfFileName(file.name)
    } catch (err) {
      if (err instanceof PDFExtractError) {
        setPdfError(err.message)
      } else {
        setPdfError("Une erreur inattendue s'est produite lors de la lecture du PDF.")
      }
    } finally {
      setIsExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleAnalyze = () => {
    if (!cvText.trim()) return
    const result = parseCVToProfile(cvText)
    setParsed(result)
    setDraft(parsedToReviewDraft(result))
    setWeakConfirmed(false)
    setStep("review")
  }

  const handleConfirm = () => {
    if (!draft || !parsed || !profile) return

    const skills = draft.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const targetTitles = draft.targetTitles
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const keptProofPoints = draft.proofPoints
      .filter((pp) => pp.keep)
      .map((pp) => ({
        skill: pp.linkedSkill,
        evidence: pp.text,
        strength: "moderate" as const,
      }))

    saveProfileAndRescore({
      ...profile,
      profileSource: "imported",
      name: draft.name.trim() || profile.name,
      targetTitles: targetTitles.length > 0 ? targetTitles : profile.targetTitles,
      skills: skills.length > 0 ? skills : profile.skills,
      positioningStatement: draft.positioningStatement.trim() || profile.positioningStatement,
      experiences:
        draft.experiences.length > 0
          ? draft.experiences.map((exp, i) => ({
              id: `exp-parsed-${i}`,
              title: exp.title,
              company: exp.company,
              startDate: exp.startYear ? `${exp.startYear}-01-01` : "",
              endDate: exp.isCurrent ? null : exp.endYear ? `${exp.endYear}-12-31` : null,
              description: exp.description,
              achievements: exp.achievements,
              keywords: [],
            }))
          : profile.experiences,
      // Only save explicitly kept proof points from CV; never reuse mock proof points
      proofPoints: keptProofPoints,
      objections: [],
    })

    const masterCV: MasterCV = {
      id: `master-cv-${Date.now()}`,
      rawText: cvText,
      fileName: pdfFileName ?? "pasted_cv",
      uploadedAt: new Date().toISOString(),
      parsedStatus: "done",
      extractedProfileId: null,
    }
    setMasterCV(masterCV)

    router.push("/profil?imported=1")
  }

  const updateExperience = (index: number, field: keyof ExperienceRow, value: string | boolean) => {
    if (!draft) return
    const updated = draft.experiences.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    setDraft({ ...draft, experiences: updated })
  }

  const addExperience = () => {
    if (!draft) return
    setDraft({
      ...draft,
      experiences: [
        ...draft.experiences,
        { company: "", title: "", startYear: "", endYear: "", isCurrent: false, description: "", achievements: [] },
      ],
    })
  }

  const removeExperience = (index: number) => {
    if (!draft) return
    setDraft({ ...draft, experiences: draft.experiences.filter((_, i) => i !== index) })
  }

  const toggleProofPoint = (index: number) => {
    if (!draft) return
    const updated = draft.proofPoints.map((pp, i) => (i === index ? { ...pp, keep: !pp.keep } : pp))
    setDraft({ ...draft, proofPoints: updated })
  }

  const updateProofPointSkill = (index: number, skill: string) => {
    if (!draft) return
    const updated = draft.proofPoints.map((pp, i) => (i === index ? { ...pp, linkedSkill: skill } : pp))
    setDraft({ ...draft, proofPoints: updated })
  }

  const isWeak = parsed?.extractionQuality === "weak"

  return (
    <div className="min-h-full app-premium-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground leading-none">CareerStudio</p>
            <p className="text-xs text-muted-foreground">Import du CV maitre</p>
          </div>
        </div>

        {/* Step 1: Paste */}
        {step === "paste" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[32px] font-black tracking-[-0.035em] text-slate-950">Importez votre CV</h1>
              <p className="text-base font-semibold text-slate-500 mt-2 leading-relaxed">
                Importez un PDF ou collez le texte brut de votre CV. Le systeme extraira votre
                nom, vos competences, vos experiences et vos preuves d&apos;impact.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Traitement 100% local</p>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  L&apos;analyse est faite dans votre navigateur. Aucune donnee n&apos;est envoyee
                  a un serveur.
                </p>
              </div>
            </div>

            {/* PDF upload zone */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-600 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                {isExtracting ? "Lecture du PDF en cours..." : "Importer un PDF"}
              </button>

              {pdfSource && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-medium text-emerald-800">
                    PDF analyse localement — {pdfSource.fileName} ({pdfSource.pageCount} page{pdfSource.pageCount > 1 ? "s" : ""})
                  </p>
                </div>
              )}

              {pdfError && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-xs font-medium text-rose-700">{pdfError}</p>
                </div>
              )}
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">ou collez le texte</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-inner">
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder={`Collez votre CV ici (texte brut, pas de PDF)

Exemple :
Hamza Benali
Strategy & Operations Manager

EXPERIENCES
Operations Lead · FinScale · 2021-2023
- Reduit le time-to-market de 40% via la mise en place de sprints cross-fonctionnels
- Gere une equipe de 8 personnes sur 3 pays

COMPETENCES
OKRs, Program Management, SQL, Cross-functional...`}
                rows={18}
                className="w-full p-4 text-sm font-mono text-foreground bg-card resize-none focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {cvText.length > 0 ? `${cvText.length} caracteres` : "Texte brut uniquement — minimum 100 caracteres"}
              </p>
              <button
                onClick={handleAnalyze}
                disabled={cvText.trim().length < 50}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Analyser
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === "review" && parsed && draft && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[32px] font-black tracking-[-0.035em] text-slate-950">Vérifiez le profil extrait</h1>
              <p className="text-base font-semibold text-slate-500 mt-2">
                Corrigez ou completez les champs avant de valider. Seules les valeurs validees ici
                seront sauvegardees.
              </p>
            </div>

            {/* Extraction summary */}
            <ExtractionSummary parsed={parsed} />

            {/* Weak extraction confirmation */}
            {isWeak && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Extraction insuffisante</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Tres peu d&apos;informations ont pu etre extraites. Completez les champs
                      manuellement ou recollez un texte plus complet. Le profil actuel ne sera
                      pas ecrase si les champs restent vides.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weakConfirmed}
                    onChange={(e) => setWeakConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs text-amber-800 font-medium">
                    Je comprends et je veux quand meme valider
                  </span>
                </label>
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Nom</label>
                  <ConfidenceBadge confidence={parsed.name.confidence} />
                </div>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Votre nom complet"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Target titles */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Titres cibles</label>
                  <ConfidenceBadge
                    confidence={
                      (parsed.targetTitles.value?.length ?? 0) > 0
                        ? parsed.targetTitles.confidence
                        : "missing"
                    }
                  />
                </div>
                <input
                  type="text"
                  value={draft.targetTitles}
                  onChange={(e) => setDraft({ ...draft, targetTitles: e.target.value })}
                  placeholder="Ex: Strategy Manager, Operations Lead, Chief of Staff"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-xs text-muted-foreground">Separez par des virgules</p>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Competences cles</label>
                  <ConfidenceBadge confidence={skillsConfidence(parsed)} />
                </div>
                <textarea
                  value={draft.skills}
                  onChange={(e) => setDraft({ ...draft, skills: e.target.value })}
                  placeholder="Ex: OKRs, SQL, Program Management, Stakeholder Management"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {parsed.skills.length > 0
                    ? `${parsed.skills.length} competence(s) detectee(s) — separez par des virgules`
                    : "Aucune competence detectee — saisissez manuellement"}
                </p>
              </div>

              {/* Positioning */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Positionnement</label>
                  <ConfidenceBadge confidence={parsed.positioningStatement.confidence} />
                </div>
                <textarea
                  value={draft.positioningStatement}
                  onChange={(e) => setDraft({ ...draft, positioningStatement: e.target.value })}
                  placeholder="Decrivez votre positionnement en 2-3 phrases"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Experiences */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Experiences</label>
                  <ConfidenceBadge confidence={experiencesConfidence(parsed)} />
                </div>
                {draft.experiences.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aucune experience detectee — ajoutez-les manuellement.
                  </p>
                )}
                <div className="space-y-2">
                  {draft.experiences.map((exp, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Experience {i + 1}
                        </span>
                        <button
                          onClick={() => removeExperience(i)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateExperience(i, "title", e.target.value)}
                          placeholder="Titre du poste"
                          className="px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(i, "company", e.target.value)}
                          placeholder="Entreprise"
                          className="px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <input
                          type="text"
                          value={exp.startYear}
                          onChange={(e) => updateExperience(i, "startYear", e.target.value)}
                          placeholder="Debut (2021)"
                          className="px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        <input
                          type="text"
                          value={exp.endYear}
                          onChange={(e) => updateExperience(i, "endYear", e.target.value)}
                          placeholder="Fin (2023)"
                          disabled={exp.isCurrent}
                          className="px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-40"
                        />
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent}
                            onChange={(e) => updateExperience(i, "isCurrent", e.target.checked)}
                            className="w-3 h-3 rounded"
                          />
                          <span className="text-xs text-muted-foreground">En cours</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addExperience}
                  className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une experience
                </button>
              </div>

              {/* Proof points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Preuves d&apos;impact detectees
                  </label>
                  <ConfidenceBadge confidence={proofPointsConfidence(parsed.proofPoints)} />
                </div>
                {parsed.proofPoints.length === 0 ? (
                  <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
                    Aucune preuve chiffree claire detectee. Tu pourras en ajouter plus tard depuis
                    la page Profil.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {draft.proofPoints.map((pp, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 space-y-1.5 transition-colors ${
                          pp.keep
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-border bg-muted/20 opacity-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => toggleProofPoint(i)}
                            className={`mt-0.5 shrink-0 ${pp.keep ? "text-emerald-600" : "text-muted-foreground"}`}
                          >
                            {pp.keep ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <CircleDot className="w-4 h-4" />
                            )}
                          </button>
                          <p className="text-xs text-foreground leading-relaxed flex-1">{pp.text}</p>
                        </div>
                        {pp.keep && (
                          <div className="ml-6">
                            <input
                              type="text"
                              value={pp.linkedSkill}
                              onChange={(e) => updateProofPointSkill(i, e.target.value)}
                              placeholder="Competence liee (optionnel)"
                              className="w-full px-2 py-1 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Cliquez pour inclure ou exclure chaque preuve. Seules les preuves cochees seront sauvegardees.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("paste")}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleConfirm}
                disabled={isWeak && !weakConfirmed}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Valider mon profil
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
