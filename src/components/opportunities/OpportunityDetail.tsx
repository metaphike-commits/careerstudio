"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Bookmark,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  History,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Mic,
  Send,
  Target,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ApplicationPack, JobOffer } from "@/types"
import { ScoreBar } from "@/components/shared/ScoreBar"
import { CompanyLogo } from "@/components/shared/CompanyLogo"
import { RadarChart } from "@/components/shared/RadarChart"
import { useAppStore } from "@/stores/app-store"
import { mockCVVersions } from "@/data/mock-cv"
import { generateLocalTargetedCV } from "@/lib/local-cv-targeting"
import { generateLocalApplicationPack } from "@/lib/local-pack"
import { ApplicationPackPanel } from "@/components/cv/ApplicationPackPanel"

interface OpportunityDetailProps {
  opportunity: JobOffer
}

type DetailTab = "analysis" | "preparation" | "company" | "history"
type CVTargetState = "idle" | "loading" | "done" | "error" | "config" | "fallback" | "disabled"
type PackGenerationState = "idle" | "loading" | "preview" | "error" | "config" | "done" | "disabled"

interface GeneratedCVTarget {
  experiences: { id: string; bullets: string[] }[]
  angle: string
  keywords: string[]
}

const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
  { id: "analysis", label: "Analyse", icon: Target },
  { id: "preparation", label: "Préparation", icon: Mic },
  { id: "company", label: "Entreprise", icon: Building2 },
  { id: "history", label: "Historique", icon: History },
]

function fitLabel(score: number) {
  if (score >= 80) return "Excellent fit"
  if (score >= 60) return "Bon fit"
  return "Fit moyen"
}

function metricLabel(value: number, good = "Bon", medium = "Moyen", low = "Faible") {
  if (value >= 75) return good
  if (value >= 50) return medium
  return low
}

function timingLabel(value: number) {
  if (value >= 75) return "Récent"
  if (value >= 50) return "Acceptable"
  return "Ancien"
}

function MetricCard({
  label,
  value,
  suffix = "/100",
  hint,
  tone = "violet",
}: {
  label: string
  value: string | number
  suffix?: string
  hint: string
  tone?: "violet" | "emerald" | "amber"
}) {
  const tones = {
    violet: "text-violet-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("text-2xl font-black", tones[tone])}>{value}</span>
        {suffix && <span className="text-sm font-bold text-slate-500">{suffix}</span>}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>
    </div>
  )
}

function AtsDonut({ score }: { score: number }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative h-24 w-24">
      <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-emerald-600">{score}</span>
        <span className="text-xs font-bold text-slate-500">/100</span>
      </div>
    </div>
  )
}

function PackCard({
  icon: Icon,
  title,
  status,
  detail,
  action,
  href,
  onClick,
}: {
  icon: React.ElementType
  title: string
  status: string
  detail: string
  action?: string
  href?: string
  onClick?: () => void
}) {
  const content = (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-violet-200 hover:bg-violet-50/40">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-950">{title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{status}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{detail}</p>
          {action && <p className="mt-2 text-xs font-bold text-violet-600">{action}</p>}
        </div>
      </div>
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return (
    <button type="button" onClick={onClick} className="text-left">
      {content}
    </button>
  )
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm text-slate-500">Bientôt disponible dans ce prototype.</p>
    </div>
  )
}

export function OpportunityDetail({ opportunity }: OpportunityDetailProps) {
  const {
    aiEnabled,
    archiveOpportunity,
    applicationPacks,
    confirmOpportunityApplied,
    networkContacts,
    opportunities,
    profile,
    saveApplicationPack,
    saveTargetedCVDraft,
    selectedOpportunityId,
    setSelectedOpportunity,
  } = useAppStore()
  const [activeTab, setActiveTab] = useState<DetailTab>("analysis")
  const [cvTargetState, setCvTargetState] = useState<CVTargetState>("idle")
  const [generatedCVTarget, setGeneratedCVTarget] = useState<GeneratedCVTarget | null>(null)
  const [isGeneratedExpanded, setIsGeneratedExpanded] = useState(true)
  const [savedCVId, setSavedCVId] = useState<string | null>(null)
  const [packGenerationState, setPackGenerationState] = useState<PackGenerationState>("idle")
  const [pendingPackResult, setPendingPackResult] = useState<ApplicationPack | null>(null)
  const { score } = opportunity
  const linkedCV = mockCVVersions.find((cv) => cv.jobOfferId === opportunity.id)
  const pack = applicationPacks[opportunity.id] ?? null
  const contact = networkContacts.find((item) => item.linkedJobOfferId === opportunity.id)

  const sortedOpportunities = useMemo(
    () =>
      [...opportunities]
        .filter((item) => item.status !== "archived")
        .sort((a, b) => b.score.globalFit - a.score.globalFit),
    [opportunities]
  )
  const currentIndex = sortedOpportunities.findIndex(
    (item) => item.id === (selectedOpportunityId ?? opportunity.id)
  )
  const previousOpportunity = currentIndex > 0 ? sortedOpportunities[currentIndex - 1] : null
  const nextOpportunity =
    currentIndex >= 0 && currentIndex < sortedOpportunities.length - 1
      ? sortedOpportunities[currentIndex + 1]
      : null

  const firstBullet = linkedCV?.bulletImprovements[0]
  const cvKeywords = linkedCV?.includedKeywords.slice(0, 8) ?? opportunity.keywords.slice(0, 8)
  const missingKeywords = linkedCV?.missingKeywords ?? []

  const navigateToOpportunity = (id: string | null) => {
    if (id) setSelectedOpportunity(id)
  }

  const generateTargetedCV = async () => {
    if (!profile || profile.experiences.length === 0) return
    if (!aiEnabled) {
      setCvTargetState("disabled")
      setGeneratedCVTarget(null)
      return
    }

    setCvTargetState("loading")
    setGeneratedCVTarget(null)

    try {
      const response = await fetch("/api/cv-target", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          profile,
          jobDescription: opportunity.description,
          jobTitle: opportunity.title,
          company: opportunity.company,
        }),
      })

      if (response.status === 503) {
        setCvTargetState("config")
        return
      }

      if (!response.ok) {
        setCvTargetState("error")
        return
      }

      const result = (await response.json()) as GeneratedCVTarget
      setGeneratedCVTarget(result)
      setSavedCVId(null)
      setIsGeneratedExpanded(true)
      setCvTargetState("done")
    } catch {
      setCvTargetState("error")
    }
  }

  const generateLocalCVFallback = () => {
    if (!profile || profile.experiences.length === 0) return

    setGeneratedCVTarget(
      generateLocalTargetedCV({
        profile,
        jobDescription: opportunity.description,
        jobTitle: opportunity.title,
        company: opportunity.company,
      })
    )
    setSavedCVId(null)
    setIsGeneratedExpanded(true)
    setCvTargetState("fallback")
  }

  const generateApplicationPackWithAI = async () => {
    if (!profile) return
    if (!aiEnabled) {
      setPackGenerationState("disabled")
      return
    }

    setPackGenerationState("loading")

    try {
      const response = await fetch("/api/application-pack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, opportunity }),
      })

      if (response.status === 503) {
        setPackGenerationState("config")
        return
      }

      if (!response.ok) {
        setPackGenerationState("error")
        return
      }

      const body = (await response.json()) as { applicationPack?: ApplicationPack }
      if (!body.applicationPack) {
        setPackGenerationState("error")
        return
      }

      setPendingPackResult(body.applicationPack)
      setPackGenerationState("preview")
    } catch {
      setPackGenerationState("error")
    }
  }

  const generateLocalPackFallback = () => {
    if (!profile) return
    saveApplicationPack(generateLocalApplicationPack(profile, opportunity))
    setPackGenerationState("done")
  }

  const saveGeneratedCV = () => {
    if (!generatedCVTarget) return
    const saved = saveTargetedCVDraft(opportunity.id, generatedCVTarget)
    if (saved) setSavedCVId(saved.id)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50/80">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="px-6 py-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setSelectedOpportunity(null)}
              className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour à la liste
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigateToOpportunity(previousOpportunity?.id ?? null)}
                disabled={!previousOpportunity}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédente
              </button>
              <button
                onClick={() => navigateToOpportunity(nextOpportunity?.id ?? null)}
                disabled={!nextOpportunity}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivante
                <ChevronRight className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <CompanyLogo
                company={opportunity.company}
                logoUrl={opportunity.logoUrl}
                size="lg"
                className="h-16 w-16 rounded-2xl"
              />
              <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">{opportunity.title}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                  <span className="font-bold text-slate-700">{opportunity.company}</span>
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {opportunity.location}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{opportunity.source}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => confirmOpportunityApplied(opportunity.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              Postuler maintenant
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-bold transition-colors",
                  activeTab === tab.id
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-5 p-6">
        {activeTab === "analysis" && (
          <>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_148px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Score estime</p>
                    <div className="mt-4 flex justify-center">
                      <RadarChart
                        axes={[
                          { label: "Compétences", value: score.skills },
                          { label: "Séniorité", value: score.seniority },
                          { label: "Narratif", value: score.narrative },
                          { label: "ATS", value: score.ats },
                          { label: "Motivation", value: score.motivation },
                          { label: "Accès", value: score.access },
                          { label: "Entretien", value: score.interviewProbability },
                        ]}
                        size={180}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-5 flex items-end gap-2">
                      <span className="text-4xl font-black text-emerald-600">{score.globalFit}</span>
                      <span className="pb-1 text-lg font-bold text-slate-500">/100</span>
                      <span className="pb-1 text-sm font-bold text-emerald-600">{fitLabel(score.globalFit)}</span>
                    </div>
                    <div className="grid gap-3">
                      <ScoreBar label="Compétences" score={score.skills} />
                      <ScoreBar label="Séniorité" score={score.seniority} />
                      <ScoreBar label="Narratif" score={score.narrative} />
                      <ScoreBar label="ATS" score={score.ats} />
                      <ScoreBar label="Motivation" score={score.motivation} />
                      <ScoreBar label="Accès réseau" score={score.access} />
                      <ScoreBar label="Probabilité entretien" score={score.interviewProbability} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                <MetricCard
                  label="Confiance"
                  value={score.confidence}
                  hint={metricLabel(score.confidence)}
                  tone="violet"
                />
                <MetricCard
                  label="Accès"
                  value={score.access}
                  hint={metricLabel(score.access)}
                  tone="emerald"
                />
                <MetricCard
                  label="Effort estimé"
                  value={score.effort}
                  suffix="min"
                  hint={score.effort <= 45 ? "Moyen" : "Élevé"}
                  tone="amber"
                />
                <MetricCard
                  label="Timing"
                  value={timingLabel(score.timing)}
                  suffix=""
                  hint={metricLabel(score.timing, "Très bon", "Correct", "Tardif")}
                  tone="emerald"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-violet-300 bg-white p-5 shadow-sm shadow-violet-100/70">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-950">CV ciblé & ATS</h3>
                <Link
                  href={`/cv?job=${opportunity.id}`}
                  className="text-sm font-bold text-violet-600 hover:text-violet-700"
                >
                  Ouvrir le CV
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[190px_minmax(0,1fr)_minmax(220px,1fr)]">
                <div>
                  <p className="text-xs font-bold text-slate-500">Score ATS estimé</p>
                  <div className="mt-4 flex items-center gap-4">
                    <AtsDonut score={linkedCV?.atsScore ?? score.ats} />
                  </div>
                  <div className="mt-4 space-y-2 text-xs font-medium">
                    <p className="text-emerald-600">✓ Mots-clés critiques intégrés {linkedCV ? linkedCV.includedKeywords.length : 7}/18</p>
                    <p className="text-amber-600">✓ Bullet points renforcés {linkedCV?.bulletImprovements.length ?? 2}</p>
                    <p className="text-rose-600">✕ Risques de formulation vague {missingKeywords.length}</p>
                  </div>
                </div>

                <div className="border-y border-slate-100 py-4 xl:border-x xl:border-y-0 xl:px-5 xl:py-0">
                  <p className="text-xs font-bold text-slate-500">Mots-clés principaux de l&apos;offre</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cvKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600"
                      >
                        {keyword}
                      </span>
                    ))}
                    {missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-500"
                      >
                        + {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500">Extrait de comparaison</p>
                  <div className="mt-4 space-y-4 text-sm leading-relaxed">
                    <div>
                      <p className="mb-1 text-xs font-bold text-slate-500">Avant (CV maître)</p>
                      <p className="text-slate-700">{firstBullet?.original ?? "Responsable de la roadmap produit."}</p>
                      <span className="mt-2 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500">
                        Peu impactant
                      </span>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold text-slate-500">Après (CV ciblé)</p>
                      <p className="text-slate-900">{firstBullet?.improved ?? score.recommendedAngle}</p>
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                        Impact fort
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <div
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-sm font-semibold leading-relaxed",
                    aiEnabled
                      ? "border-violet-200 bg-violet-50 text-violet-900"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  )}
                >
                  <span className="mb-1 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    {aiEnabled ? "Recommande: IA" : "IA desactivee"}
                  </span>
                  <p>
                    {aiEnabled
                      ? "Genere une adaptation semantique du CV depuis ton profil et cette offre. Appel explicite uniquement; la candidature ne sera pas marquee comme envoyee."
                      : "Active l'IA dans la sidebar pour generer une adaptation semantique. Tu peux aussi creer un brouillon local limite."}
                  </p>
                </div>
                {profile && profile.experiences.length > 0 && (
                  <button
                    type="button"
                    onClick={generateTargetedCV}
                    disabled={cvTargetState === "loading"}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cvTargetState === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {cvTargetState === "loading"
                      ? "Génération en cours..."
                      : aiEnabled
                        ? "Générer CV ciblé avec IA"
                        : "IA désactivée"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={generateLocalCVFallback}
                  disabled={!profile || cvTargetState === "loading"}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Créer un brouillon local
                </button>
                <Link
                  href={`/cv?job=${opportunity.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  Ouvrir CV local
                </Link>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <Link2 className="h-4 w-4" />
                  Comparer
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <Download className="h-4 w-4" />
                  Exporter PDF
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <Download className="h-4 w-4" />
                  Exporter DOCX
                </button>
              </div>

              {(cvTargetState === "disabled" || cvTargetState === "config" || cvTargetState === "error") && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  <p>
                    {cvTargetState === "disabled"
                      ? "IA désactivée. Active l'IA dans la sidebar ou utilise le fallback local sans API."
                      : cvTargetState === "config"
                        ? "Clé API manquante. Ajoute une clé dans .env.local pour activer la génération IA."
                        : "Erreur de génération -- vérifie ta clé API"}
                  </p>
                  <button
                    type="button"
                    onClick={generateLocalCVFallback}
                    className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                  >
                    Créer un brouillon local sans IA
                  </button>
                </div>
              )}

              {(cvTargetState === "done" || cvTargetState === "fallback") && generatedCVTarget && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50">
                  <button
                    type="button"
                    onClick={() => setIsGeneratedExpanded((value) => !value)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-emerald-900">
                            {cvTargetState === "fallback" ? "Brouillon local généré" : "Suggestions IA générées"}
                          </p>
                          {savedCVId && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Sauvegarde locale
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-emerald-700">
                          {cvTargetState === "fallback"
                            ? "Fallback local non-IA. Estimation limitée, non sauvegardée."
                          : "Sortie IA non sauvegardée. Relis et valide avant usage."}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-emerald-700 transition-transform",
                        isGeneratedExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  {isGeneratedExpanded && (
                    <div className="space-y-4 border-t border-emerald-200 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={saveGeneratedCV}
                          disabled={Boolean(savedCVId)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savedCVId ? "CV sauvegardé" : "Sauvegarder comme CV local"}
                        </button>
                        {savedCVId && (
                          <Link
                            href={`/cv?job=${opportunity.id}`}
                            className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            Voir dans CV
                          </Link>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Angle</p>
                        <p className="mt-1 text-sm leading-relaxed text-emerald-950">{generatedCVTarget.angle}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Mots-clés</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {generatedCVTarget.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {generatedCVTarget.experiences.map((generatedExperience) => {
                          const sourceExperience = profile?.experiences.find(
                            (experience) => experience.id === generatedExperience.id
                          )
                          return (
                            <div key={generatedExperience.id} className="rounded-xl bg-white p-3">
                              <p className="text-sm font-bold text-slate-950">
                                {sourceExperience
                                  ? `${sourceExperience.title} - ${sourceExperience.company}`
                                  : generatedExperience.id}
                              </p>
                              <ul className="mt-2 space-y-1.5">
                                {generatedExperience.bullets.map((bullet) => (
                                  <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                                    <span className="text-emerald-600">-&gt;</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-lg font-bold text-slate-950">Pack candidature</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <PackCard
                  icon={Mail}
                  title="Message LinkedIn"
                  status={pack ? "À relire" : "À générer"}
                  detail={contact ? `${contact.name} identifie chez ${contact.company}` : "Contact a identifier avant envoi"}
                  onClick={() => setActiveTab("preparation")}
                />
                <PackCard
                  icon={Mic}
                  title="Pitch oral"
                  status={pack ? "À relire" : "À générer"}
                  detail="30s et 60s"
                  onClick={() => setActiveTab("preparation")}
                />
                <PackCard
                  icon={HelpCircle}
                  title="Questions probables"
                  status={pack ? `${pack.probableQuestions.length} questions` : "À générer"}
                  detail={pack ? `${pack.probableObjections.length} objections à relire` : "Brouillon local depuis ton profil"}
                  onClick={() => setActiveTab("preparation")}
                />
                <PackCard
                  icon={FileText}
                  title="Lettre de motivation"
                  status={pack ? "À relire" : "À générer"}
                  detail={pack ? "Base préparée, non envoyée" : "Générer maintenant"}
                  action="Générer maintenant"
                  href={`/cv?job=${opportunity.id}`}
                />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Pourquoi postuler
                  </h4>
                </div>
                <ul className="space-y-2">
                  {score.reasonsFor.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-sm text-emerald-800">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    Pourquoi ne pas postuler
                  </h4>
                </div>
                <ul className="space-y-2">
                  {score.reasonsAgainst.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-sm text-rose-800">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {score.redFlags.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700">Red flags</h4>
                  </div>
                  <ul className="space-y-2">
                    {score.redFlags.map((flag) => (
                      <li key={flag} className="flex items-start gap-2 text-sm text-amber-800">
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700">Angle recommandé</h4>
              </div>
              <p className="text-sm leading-relaxed text-violet-900">{score.recommendedAngle}</p>
            </section>

            <section className="pb-6">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("preparation")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-700"
                >
                  <Send className="h-4 w-4" />
                  {pack ? "Voir le pack candidature" : "Générer le pack candidature"}
                </button>
                <button
                  onClick={() => archiveOpportunity(opportunity.id)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50"
                >
                  Archiver cette offre
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "preparation" && (
          pack ? (
            <ApplicationPackPanel pack={pack} profile={profile} opportunity={opportunity} />
          ) : packGenerationState === "preview" && pendingPackResult ? (
            <div className="flex flex-col gap-5 px-6 py-8">
              <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                <Target className="h-4 w-4 shrink-0 text-violet-600" />
                <p className="text-sm font-semibold text-violet-900">
                  Pack généré par IA — A relire avant de sauvegarder
                </p>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Message LinkedIn</p>
                  <p className="text-sm leading-relaxed text-slate-700">{pendingPackResult.linkedInMessage}</p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Pitch 30s</p>
                  <p className="text-sm leading-relaxed text-slate-700">{pendingPackResult.pitch30s}</p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Pourquoi toi</p>
                  <p className="text-sm leading-relaxed text-slate-700">{pendingPackResult.whyYou}</p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Pourquoi cette entreprise</p>
                  <p className="text-sm leading-relaxed text-slate-700">{pendingPackResult.whyCompany}</p>
                </div>
                {pendingPackResult.probableQuestions.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Questions probables</p>
                    <ul className="flex flex-col gap-1">
                      {pendingPackResult.probableQuestions.slice(0, 3).map((q, i) => (
                        <li key={i} className="text-sm leading-relaxed text-slate-700">• {q}</li>
                      ))}
                      {pendingPackResult.probableQuestions.length > 3 && (
                        <li className="text-xs text-slate-400">+ {pendingPackResult.probableQuestions.length - 3} autres</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    saveApplicationPack(pendingPackResult)
                    setPendingPackResult(null)
                    setPackGenerationState("done")
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-violet-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmer et sauvegarder
                </button>
                <button
                  onClick={() => {
                    setPendingPackResult(null)
                    setPackGenerationState("idle")
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Ce pack sera sauvegardé uniquement après ta confirmation. Il ne marque pas la candidature comme envoyée.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-5 px-8">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Send className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground mb-1">Aucun pack généré</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Le chemin recommandé est l&apos;IA pour personnaliser le message LinkedIn, les pitchs,
                  les objections, les questions probables et le plan de prep. Le fallback local reste disponible.
                </p>
              </div>
              <div
                className={cn(
                  "max-w-md rounded-xl border px-4 py-3 text-sm font-semibold leading-relaxed",
                  aiEnabled
                    ? "border-violet-200 bg-violet-50 text-violet-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                )}
              >
                {aiEnabled
                  ? "Recommande: generation IA explicite, puis relecture avant sauvegarde."
                  : "IA desactivee: active-la dans la sidebar ou continue avec le brouillon local limite."}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={generateApplicationPackWithAI}
                  disabled={!profile || packGenerationState === "loading"}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {packGenerationState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {packGenerationState === "loading"
                    ? "Génération IA..."
                    : aiEnabled
                      ? "Générer pack candidature avec IA"
                      : "IA désactivée"}
                </button>
                <button
                  onClick={generateLocalPackFallback}
                  disabled={!profile || packGenerationState === "loading"}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Créer un brouillon local
                </button>
              </div>
              {(packGenerationState === "disabled" || packGenerationState === "config" || packGenerationState === "error") && (
                <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-800">
                  {packGenerationState === "disabled"
                    ? "IA désactivée. Active l'IA dans la sidebar ou utilise le fallback local."
                    : packGenerationState === "config"
                      ? "Clé API manquante. Ajoute une clé dans .env.local pour activer la génération IA."
                      : "Erreur de génération -- vérifie ta clé API."}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Le pack est une préparation. Il ne marque jamais la candidature comme envoyée.
              </p>
            </div>
          )
        )}
        {activeTab === "company" && <PlaceholderTab title="Analyse entreprise" />}
        {activeTab === "history" && <PlaceholderTab title="Historique de candidature" />}
      </div>
    </div>
  )
}





