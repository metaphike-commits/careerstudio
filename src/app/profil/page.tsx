"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  Edit3,
  Lightbulb,
  Link2,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Target,
  User,
  X,
  XCircle,
} from "lucide-react"
import type { LinkedInAboutResult } from "@/types"
import { buildLocalIntelligence } from "@/lib/local-intelligence"
import { useAppStore } from "@/stores/app-store"
import { cn } from "@/lib/utils"
import { calibrateProfileIntelligence, createProfileIntelligence } from "@/lib/profile-intelligence"
import type { CalibrationResult, ProfileIntelligence, ProofPoint, UserProfile } from "@/types"
import { PageHeader, PageShell, PremiumCard, premiumButton, secondaryButton } from "@/components/shared/PageShell"

function ImportBanner({ opportunityCount }: { opportunityCount: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const importedFromCV = searchParams.get("imported") === "1"
  const [show, setShow] = useState(importedFromCV)

  useEffect(() => {
    if (!importedFromCV) return
    router.replace("/profil")
    const timer = setTimeout(() => setShow(false), 5000)
    return () => clearTimeout(timer)
  }, [importedFromCV, router])

  if (!show) return null

  return (
    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-800">
          Profil mis à jour depuis votre CV.{" "}
          {opportunityCount > 0
            ? `${opportunityCount} offre(s) re-scorée(s).`
            : "Les scores ont été recalcules."}
        </p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-emerald-600 hover:text-emerald-800 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

type ProfileDraft = Pick<
  UserProfile,
  | "name"
  | "positioningStatement"
  | "targetTitles"
  | "targetIndustries"
  | "preferredLocations"
  | "skills"
  | "strengths"
  | "avoidRoles"
  | "missingCriticalInfo"
> & {
  profileIntelligence: ProfileIntelligence
}

const strengthColors: Record<
  ProofPoint["strength"],
  { badge: string; icon: React.ElementType; label: string }
> = {
  strong: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Forte" },
  moderate: { badge: "bg-violet-50 text-violet-700 border-violet-200", icon: CheckCircle2, label: "Moderee" },
  weak: { badge: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle, label: "Faible" },
  missing: { badge: "bg-rose-50 text-rose-600 border-rose-200", icon: XCircle, label: "Manquante" },
}

function toDraft(profile: UserProfile): ProfileDraft {
  return {
    name: profile.name,
    positioningStatement: profile.positioningStatement,
    targetTitles: profile.targetTitles,
    targetIndustries: profile.targetIndustries,
    preferredLocations: profile.preferredLocations,
    skills: profile.skills,
    strengths: profile.strengths,
    avoidRoles: profile.avoidRoles,
    missingCriticalInfo: profile.missingCriticalInfo,
    profileIntelligence: createProfileIntelligence(profile),
  }
}

function listToText(items: string[]) {
  return items.join("\n")
}

function textToList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function CalibrationPanel({ result }: { result: CalibrationResult }) {
  const scoreConfig = {
    strong: { label: "Profil calibre", cls: "border-emerald-200 bg-emerald-50", textCls: "text-emerald-800", dotCls: "bg-emerald-500" },
    partial: { label: "Calibration partielle", cls: "border-amber-200 bg-amber-50", textCls: "text-amber-800", dotCls: "bg-amber-500" },
    weak: { label: "Calibration insuffisante", cls: "border-rose-200 bg-rose-50", textCls: "text-rose-800", dotCls: "bg-rose-500" },
  }
  const cfg = scoreConfig[result.score]
  const blocking = result.warnings.filter((w) => w.level === "blocking")
  const weak = result.warnings.filter((w) => w.level === "weak")

  return (
    <div className={`rounded-xl border p-4 ${cfg.cls}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block h-2 w-2 rounded-full ${cfg.dotCls}`} />
        <p className={`text-xs font-bold uppercase tracking-wider ${cfg.textCls}`}>{cfg.label}</p>
        {result.warnings.length > 0 && (
          <span className={`ml-auto text-xs font-semibold ${cfg.textCls}`}>
            {result.warnings.length} point{result.warnings.length > 1 ? "s" : ""} a corriger
          </span>
        )}
      </div>
      {result.warnings.length === 0 ? (
        <p className="text-xs text-emerald-700">Toutes les sections clés sont renseignees. Le profil est prêt pour les candidatures.</p>
      ) : (
        <div className="space-y-1.5">
          {blocking.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
              <p className="text-xs text-rose-800">{w.message}</p>
            </div>
          ))}
          {weak.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-800">{w.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <PremiumCard>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-500" />
        <h2 className="text-base font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </PremiumCard>
  )
}

function TagList({
  items,
  color = "default",
}: {
  items: string[]
  color?: "default" | "violet" | "rose"
}) {
  const colors = {
    default: "bg-muted text-muted-foreground border-border",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", colors[color])}>
          {item}
        </span>
      ))}
    </div>
  )
}

function DraftTextarea({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-violet-400"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

export default function ProfilPage() {
  const { aiEnabled, profile, masterCV, saveProfileAndRescore, opportunities } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [savedMessage, setSavedMessage] = useState("")
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [aiError, setAiError] = useState("")
  const [aiResult, setAiResult] = useState<ProfileIntelligence | null>(null)
  const [aiCalibration, setAiCalibration] = useState<CalibrationResult | null>(null)
  const [aiProvider, setAiProvider] = useState("")
  const [liStatus, setLiStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [liError, setLiError] = useState("")
  const [liResult, setLiResult] = useState<LinkedInAboutResult | null>(null)
  const [liTab, setLiTab] = useState<"formal" | "conversational" | "bold">("conversational")
  const [liCopied, setLiCopied] = useState(false)

  const initialDraft = useMemo(() => (profile ? toDraft(profile) : null), [profile])
  const [draft, setDraft] = useState<ProfileDraft | null>(initialDraft)
  const localIntel = useMemo(() => (profile ? buildLocalIntelligence(profile) : null), [profile])

  if (!profile || !draft || !localIntel) return null

  const strongProofs = profile.proofPoints.filter((pp) => pp.strength === "strong")
  const weakProofs = profile.proofPoints.filter((pp) => pp.strength === "weak" || pp.strength === "missing")
  const topProofs = strongProofs.slice(0, 2).map((pp) => pp.skill).join(" / ")
  const profileIntelligence = createProfileIntelligence(profile)
  const calibration = calibrateProfileIntelligence(profileIntelligence)
  const canRunAI = Boolean(masterCV?.rawText && masterCV.rawText.trim().length >= 80)

  const updateDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setSavedMessage("")
  }

  const resetDraft = () => {
    setDraft(toDraft(profile))
    setSavedMessage("")
  }

  const saveDraft = () => {
    const nextProfile: UserProfile = {
      ...profile,
      ...draft,
      profileSource: "manual",
      name: draft.name.trim() || profile.name,
      positioningStatement: draft.positioningStatement.trim(),
      targetTitles: draft.targetTitles.length > 0 ? draft.targetTitles : profile.targetTitles,
      targetIndustries: draft.targetIndustries.length > 0 ? draft.targetIndustries : profile.targetIndustries,
      skills: draft.skills.length > 0 ? draft.skills : profile.skills,
      profileIntelligence: {
        ...draft.profileIntelligence,
        source: "manual",
      },
    }

    saveProfileAndRescore(nextProfile)
    setDraft(toDraft(nextProfile))
    setIsEditing(false)
    setSavedMessage("Profil sauvegardé. Les opportunités ont été re-scorées localement.")
  }

  const runAIProfileIntelligence = async () => {
    if (!aiEnabled) {
      setAiStatus("error")
      setAiError("IA desactivee. Active l'IA dans la sidebar pour lancer cette analyse.")
      return
    }

    if (!canRunAI || !masterCV?.rawText) {
      setAiStatus("error")
      setAiError("Ajoute d'abord un CV maître depuis l'onboarding pour lancer l'analyse IA.")
      return
    }

    setAiStatus("loading")
    setAiError("")
    setAiResult(null)
    setAiCalibration(null)
    setAiProvider("")

    try {
      const response = await fetch("/api/profile-intelligence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cvText: masterCV.rawText,
          currentProfile: profile,
        }),
      })
      const body = (await response.json()) as {
        profileIntelligence?: ProfileIntelligence
        calibration?: CalibrationResult
        provider?: string
        error?: string
      }

      if (!response.ok || !body.profileIntelligence) {
        throw new Error(body.error || "Analyse IA indisponible.")
      }

      setAiResult(body.profileIntelligence)
      setAiCalibration(body.calibration ?? calibrateProfileIntelligence(body.profileIntelligence))
      setAiProvider(body.provider ?? "")
      setAiStatus("done")
    } catch (error) {
      setAiStatus("error")
      setAiError(error instanceof Error ? error.message : "Analyse IA indisponible.")
    }
  }

  const saveAIProfileIntelligence = () => {
    if (!aiResult) return
    const nextProfile: UserProfile = {
      ...profile,
      profileIntelligence: {
        ...aiResult,
        source: "llm_reviewed",
      },
    }

    saveProfileAndRescore(nextProfile)
    setDraft(toDraft(nextProfile))
    setSavedMessage("Profile Intelligence IA sauvegardée. Les opportunités ont été re-scorées localement.")
    setAiStatus("idle")
    setAiResult(null)
    setAiCalibration(null)
    setAiProvider("")
  }

  const updateIntelligence = <K extends keyof ProfileDraft["profileIntelligence"]>(
    key: K,
    value: ProfileDraft["profileIntelligence"][K]
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            profileIntelligence: {
              ...current.profileIntelligence,
              [key]: value,
            },
          }
        : current
    )
    setSavedMessage("")
  }

  const updatePitch = <K extends keyof ProfileDraft["profileIntelligence"]["pitch"]>(
    key: K,
    value: ProfileDraft["profileIntelligence"]["pitch"][K]
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            profileIntelligence: {
              ...current.profileIntelligence,
              pitch: {
                ...current.profileIntelligence.pitch,
                [key]: value,
              },
            },
          }
        : current
    )
    setSavedMessage("")
  }

  const runLinkedInAbout = async () => {
    if (!aiEnabled) {
      setLiStatus("error")
      setLiError("IA desactivee. Active l'IA dans la sidebar.")
      return
    }
    setLiStatus("loading")
    setLiError("")
    setLiResult(null)
    try {
      const res = await fetch("/api/linkedin-about", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, cvText: masterCV?.rawText ?? "" }),
      })
      const body = await res.json() as { linkedInAbout?: LinkedInAboutResult; error?: string }
      if (!res.ok || !body.linkedInAbout) throw new Error(body.error ?? "Erreur generation LinkedIn About")
      setLiResult(body.linkedInAbout)
      setLiStatus("done")
    } catch (err) {
      setLiError(err instanceof Error ? err.message : "Erreur inconnue")
      setLiStatus("error")
    }
  }

  const copyLinkedInVariant = () => {
    if (!liResult) return
    navigator.clipboard.writeText(liResult[liTab]).then(() => {
      setLiCopied(true)
      setTimeout(() => setLiCopied(false), 2000)
    })
  }

  return (
    <PageShell size="lg">
      <Suspense>
        <ImportBanner opportunityCount={opportunities.length} />
      </Suspense>

      <PageHeader
        title="Profil"
        subtitle="Source de vérité locale utilisée par le scoring des opportunités."
      >
          {savedMessage && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {savedMessage}
            </span>
          )}
          {isEditing ? (
            <>
              <button
                onClick={resetDraft}
                className={secondaryButton}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Annuler
              </button>
              <button
                onClick={saveDraft}
                className={premiumButton}
              >
                <Save className="h-3.5 w-3.5" />
                Sauvegarder et re-scorer
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setDraft(toDraft(profile))
                setIsEditing(true)
                setSavedMessage("")
              }}
              className={premiumButton}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Modifier le profil de scoring
            </button>
          )}
      </PageHeader>

      {/* Source badge + completeness score */}
      <div className="flex flex-wrap items-center gap-3">
        {profile.profileSource === "demo" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Demo — donnees fictives
          </span>
        )}
        {profile.profileSource === "imported" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Profil importe depuis CV
          </span>
        )}
        {profile.profileSource === "manual" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Profil edite manuellement
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                localIntel.completenessScore >= 80
                  ? "bg-emerald-500"
                  : localIntel.completenessScore >= 50
                    ? "bg-amber-500"
                    : "bg-rose-400"
              )}
              style={{ width: `${localIntel.completenessScore}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Completude {localIntel.completenessScore}%
          </span>
        </div>
      </div>

      {isEditing && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Edition locale</p>
          <p className="mt-1 text-sm leading-relaxed text-violet-900">
            Ces champs influencent les scores et estimations locales: titres cibles, secteurs,
            compétences, forces et positionnement. Rien n&apos;est envoyé à un serveur.
          </p>
        </div>
      )}

      <div
        className={cn(
          "rounded-2xl border p-5 shadow-sm",
          aiEnabled
            ? "border-violet-300 bg-gradient-to-br from-violet-50 to-white"
            : "border-amber-200 bg-amber-50"
        )}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className={cn("h-4 w-4", aiEnabled ? "text-violet-600" : "text-amber-600")} />
              <p
                className={cn(
                  "text-xs font-black uppercase tracking-wider",
                  aiEnabled ? "text-violet-700" : "text-amber-700"
                )}
              >
                {aiEnabled ? "Recommande - Analyse IA" : "IA desactivee"}
              </p>
            </div>
            <h2 className={cn("mt-2 text-xl font-black tracking-tight", aiEnabled ? "text-violet-950" : "text-amber-950")}>
              Analyser mon profil avec IA
            </h2>
            <p className={cn("mt-1 text-sm font-semibold leading-relaxed", aiEnabled ? "text-violet-900" : "text-amber-900")}>
              Meilleure synthese du parcours, pitchs, objections recruteur, preuves, exemples STAR,
              mots-cles ATS et axes de progression. Rien n&apos;est sauvegarde sans validation.
            </p>
            <p
              className={cn(
                "mt-3 rounded-xl border bg-white/70 px-3 py-2 text-xs font-semibold leading-relaxed",
                aiEnabled ? "border-violet-200 text-violet-800" : "border-amber-200 text-amber-800"
              )}
            >
              {aiEnabled
                ? "Appel explicite uniquement: seul le CV maitre et le profil courant sont transmis au provider configure. Pipeline, memoire et contacts restent locaux."
                : "Active l'IA dans la sidebar pour utiliser le provider configure. L'analyse locale limitee reste disponible plus bas."}
            </p>
            {!aiEnabled && (
              <p className="mt-2 text-xs font-bold text-amber-700">
                Alternative disponible: continuer avec l&apos;analyse locale limitee et les champs manuels.
              </p>
            )}
            {!canRunAI && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                CV maitre requis: importe ou colle un CV complet depuis /onboarding avant l&apos;analyse IA.
              </p>
            )}
          </div>
          <button
            onClick={runAIProfileIntelligence}
            disabled={aiStatus === "loading" || !canRunAI}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              aiEnabled ? "bg-violet-600 hover:bg-violet-700" : "bg-amber-500 hover:bg-amber-600"
            )}
          >
            {aiStatus === "loading" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {aiEnabled ? "Analyser avec IA" : "IA desactivee"}
              </>
            )}
          </button>
        </div>

        {aiStatus === "error" && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {aiError}
          </div>
        )}

        {aiStatus === "done" && aiResult && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-white p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Résultat IA prêt pour review</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Provider: {aiProvider || "configuré"} - rien n&apos;est sauvegardé tant que tu ne confirmes pas.
                </p>
              </div>
              <button
                onClick={saveAIProfileIntelligence}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Save className="h-3.5 w-3.5" />
                Sauvegarder cette analyse
              </button>
            </div>

            {aiCalibration && (
              <div className="mt-4">
                <CalibrationPanel result={aiCalibration} />
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Seniorite</p>
                <p className="mt-1 text-sm text-foreground">{aiResult.seniority}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Roles cibles</p>
                <TagList items={aiResult.targetRoleFamilies.slice(0, 6)} color="violet" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Pitch court</p>
                <p className="text-sm leading-relaxed text-foreground">{aiResult.pitch.short}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Objections probables</p>
                <ul className="space-y-1">
                  {aiResult.likelyObjections.slice(0, 3).map((objection, index) => (
                    <li key={index} className="text-sm text-foreground">
                      - {objection}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <CalibrationPanel result={calibration} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-violet-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Positionnement</p>
          </div>
          <p className="text-sm font-semibold leading-snug text-violet-950">{profile.targetTitles[0]}</p>
          <p className="mt-1 text-xs text-violet-700">Angle principal pour les offres ciblees.</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Preuves fortes</p>
          </div>
          <p className="text-sm font-semibold leading-snug text-emerald-950">{strongProofs.length} preuves solides</p>
          <p className="mt-1 text-xs text-emerald-700">{topProofs || "A consolider dans le CV maître."}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">A clarifier</p>
          </div>
          <p className="text-sm font-semibold leading-snug text-amber-950">
            {weakProofs.length + profile.missingCriticalInfo.length} points sensibles
          </p>
          <p className="mt-1 text-xs text-amber-700">A traiter avant les candidatures prioritaires.</p>
        </div>
      </div>

      {isEditing ? (
        <>
          <Section title="Profil de scoring editable" icon={Target}>
            <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Nom affiche</span>
              <input
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-violet-400"
              />
            </label>
            <DraftTextarea
              label="Positionnement"
              value={draft.positioningStatement}
              onChange={(value) => updateDraft("positioningStatement", value)}
              rows={4}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DraftTextarea
                label="Titres cibles"
                value={listToText(draft.targetTitles)}
                onChange={(value) => updateDraft("targetTitles", textToList(value))}
                hint="Un titre par ligne, ou separe par virgules."
              />
              <DraftTextarea
                label="Secteurs cibles"
                value={listToText(draft.targetIndustries)}
                onChange={(value) => updateDraft("targetIndustries", textToList(value))}
              />
              <DraftTextarea
                label="Compéténces"
                value={listToText(draft.skills)}
                onChange={(value) => updateDraft("skills", textToList(value))}
                rows={6}
              />
              <DraftTextarea
                label="Forces vendables"
                value={listToText(draft.strengths)}
                onChange={(value) => updateDraft("strengths", textToList(value))}
                rows={6}
              />
              <DraftTextarea
                label="Localisations preferees"
                value={listToText(draft.preferredLocations)}
                onChange={(value) => updateDraft("preferredLocations", textToList(value))}
              />
              <DraftTextarea
                label="Roles a eviter"
                value={listToText(draft.avoidRoles)}
                onChange={(value) => updateDraft("avoidRoles", textToList(value))}
              />
            </div>
            <DraftTextarea
              label="Informations critiques manquantes"
              value={listToText(draft.missingCriticalInfo)}
              onChange={(value) => updateDraft("missingCriticalInfo", textToList(value))}
              rows={4}
            />
            </div>
          </Section>

          <Section title="Profile Intelligence a valider" icon={Lightbulb}>
            <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Seniorite</span>
                <input
                  value={draft.profileIntelligence.seniority}
                  onChange={(event) => updateIntelligence("seniority", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-violet-400"
                />
              </label>
              <DraftTextarea
                label="Familles de rôles cibles"
                value={listToText(draft.profileIntelligence.targetRoleFamilies)}
                onChange={(value) => updateIntelligence("targetRoleFamilies", textToList(value))}
              />
              <DraftTextarea
                label="Familles de rôles a eviter"
                value={listToText(draft.profileIntelligence.avoidRoleFamilies)}
                onChange={(value) => updateIntelligence("avoidRoleFamilies", textToList(value))}
              />
              <DraftTextarea
                label="Secteurs credibles"
                value={listToText(draft.profileIntelligence.sectorFit)}
                onChange={(value) => updateIntelligence("sectorFit", textToList(value))}
              />
              <DraftTextarea
                label="Mots-clés ATS"
                value={listToText(draft.profileIntelligence.atsKeywords)}
                onChange={(value) => updateIntelligence("atsKeywords", textToList(value))}
                rows={5}
              />
              <DraftTextarea
                label="Axes de progression"
                value={listToText(draft.profileIntelligence.progressionAxes)}
                onChange={(value) => updateIntelligence("progressionAxes", textToList(value))}
                rows={5}
              />
            </div>
            <DraftTextarea
              label="Pitch court"
              value={draft.profileIntelligence.pitch.short}
              onChange={(value) => updatePitch("short", value)}
              rows={3}
            />
            <DraftTextarea
              label="Pitch recruteur"
              value={draft.profileIntelligence.pitch.recruiter}
              onChange={(value) => updatePitch("recruiter", value)}
              rows={4}
            />
            <DraftTextarea
              label="Pitch entretien"
              value={draft.profileIntelligence.pitch.interview}
              onChange={(value) => updatePitch("interview", value)}
              rows={4}
            />
            </div>
          </Section>
        </>
      ) : (
        <>
          {profile.missingCriticalInfo.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                    Informations manquantes critiques ({profile.missingCriticalInfo.length})
                  </p>
                  <ul className="space-y-1">
                    {profile.missingCriticalInfo.map((info, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        {info}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <Section title="Positionnement principal" icon={Target}>
            <p className="text-sm leading-relaxed text-foreground">{profile.positioningStatement}</p>
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">Titres cibles</p>
              <TagList items={profile.targetTitles} color="violet" />
            </div>
          </Section>

          <Section title="Profile Intelligence locale limitee" icon={Lightbulb}>
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Analyse locale limitee</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-amber-800">
                Cette vue est deduite par heuristiques locales ou par champs valides manuellement.
                Lance l&apos;analyse IA pour une synthese qualitative plus fiable, puis relis avant sauvegarde.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Seniorite</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{profileIntelligence.seniority}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Confiance: {profileIntelligence.seniorityConfidence}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Source</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {profileIntelligence.source === "manual" ? "Validee manuellement" : "Deduite localement"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {profileIntelligence.source === "manual" ? "Source utilisateur." : "Confiance limitee. Aucun appel API."}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Mots-clés ATS</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{profileIntelligence.atsKeywords.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Utilises par les futurs packs.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Familles de rôles cibles</p>
                <TagList items={profileIntelligence.targetRoleFamilies} color="violet" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Roles a eviter</p>
                <TagList items={profileIntelligence.avoidRoleFamilies} color="rose" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Secteurs credibles</p>
                <TagList items={profileIntelligence.sectorFit} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Mots-clés ATS</p>
                <TagList items={profileIntelligence.atsKeywords.slice(0, 12)} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                  Pitch court - a relire
                </p>
                <p className="mt-1 text-sm leading-relaxed text-violet-950">{profileIntelligence.pitch.short}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Exemples STAR deduits - a confirmer
                </p>
                <div className="mt-3 space-y-3">
                  {profileIntelligence.starExamples.slice(0, 2).map((example) => (
                    <div key={example.id} className="rounded-lg bg-background p-3">
                      <p className="text-sm font-semibold text-foreground">{example.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Action/resultat: {example.result}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {profileIntelligence.progressionAxes.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Axes de progression</p>
                  <ul className="mt-2 space-y-1">
                    {profileIntelligence.progressionAxes.map((axis, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        {axis}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Section title="Cibles de recherche" icon={Briefcase}>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Secteurs</p>
                  <TagList items={profile.targetIndustries} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Localisations</p>
                  <TagList items={profile.preferredLocations} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Roles a eviter</p>
                  <TagList items={profile.avoidRoles} color="rose" />
                </div>
              </div>
            </Section>

            <Section title="Forces" icon={Star}>
              <ul className="space-y-2">
                {profile.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="Competences par categorie" icon={Star}>
            {localIntel.categorizedSkills.length > 0 ? (
              <div className="space-y-4">
                {localIntel.categorizedSkills.map((cat) => (
                  <div key={cat.label}>
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{cat.label}</p>
                    <TagList items={cat.skills} />
                  </div>
                ))}
              </div>
            ) : (
              <TagList items={profile.skills} />
            )}
          </Section>

          <Section title="Preuves par compéténce" icon={Lightbulb}>
            <div className="space-y-3">
              {profile.proofPoints.map((proofPoint, index) => {
                const config = strengthColors[proofPoint.strength]
                const Icon = config.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        proofPoint.strength === "strong"
                          ? "text-emerald-500"
                          : proofPoint.strength === "moderate"
                            ? "text-violet-500"
                            : proofPoint.strength === "weak"
                              ? "text-amber-500"
                              : "text-rose-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{proofPoint.skill}</span>
                        <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-bold", config.badge)}>
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{proofPoint.evidence}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title="Experiences professionnelles" icon={Briefcase}>
            <div className="space-y-5">
              {profile.experiences.map((experience) => (
                <div key={experience.id} className="border-l-2 border-violet-200 pl-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{experience.title}</p>
                      <p className="text-xs text-muted-foreground">{experience.company}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {experience.startDate} - {experience.endDate ?? "Present"}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {experience.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="mt-0.5 text-violet-400">-&gt;</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {localIntel.developmentAxes.length > 0 && (
            <Section title="Axes de developpement" icon={Target}>
              <div className="space-y-2">
                {localIntel.developmentAxes.map((axis, index) => (
                  <div key={index} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span className="text-sm text-amber-800">{axis}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Objections probables - source a verifier" icon={AlertTriangle}>
            <div className="space-y-2">
              {(profile.objections.length > 0 ? profile.objections : localIntel.localObjections).map((objection, index) => (
                <div key={index} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <span className="text-sm text-rose-800">{objection}</span>
                </div>
              ))}
              {profile.objections.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Objections derivees localement — lance l&apos;analyse IA pour des objections personnalisees.
                </p>
              )}
            </div>
          </Section>
        </>
      )}

      {/* LinkedIn About */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Section About LinkedIn
              </p>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-blue-900">
              Génère 3 variantes de section About : formelle, conversationnelle, audacieuse.
              Première personne, sans buzzwords, centrée sur les problèmes que tu résous.
            </p>
            {!aiEnabled && (
              <p className="mt-2 text-xs font-bold text-blue-700">
                IA desactivee : active-la dans la sidebar.
              </p>
            )}
          </div>
          <button
            onClick={runLinkedInAbout}
            disabled={liStatus === "loading" || !aiEnabled}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {liStatus === "loading" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generation...
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                {aiEnabled ? "Generer 3 variantes" : "IA desactivee"}
              </>
            )}
          </button>
        </div>

        {liStatus === "error" && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {liError}
          </div>
        )}

        {liStatus === "done" && liResult && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-1">
                {(["formal", "conversational", "bold"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLiTab(tab)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      liTab === tab
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    )}
                  >
                    {tab === "formal" ? "Formel" : tab === "conversational" ? "Conversationnel" : "Audacieux"}
                  </button>
                ))}
              </div>
              <button
                onClick={copyLinkedInVariant}
                className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                {liCopied ? (
                  <><ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" /> Copie</>
                ) : (
                  <><Clipboard className="h-3.5 w-3.5" /> Copier</>
                )}
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {liResult[liTab]}
            </p>
            <p className="mt-2 text-right text-xs text-muted-foreground">
              {liResult[liTab].split(/\s+/).length} mots · brouillon IA non sauvegardé
            </p>
          </div>
        )}
      </div>
    </PageShell>
  )
}
