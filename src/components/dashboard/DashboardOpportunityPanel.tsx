"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Link2,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Sparkles,
} from "lucide-react"
import type { JobOffer } from "@/types"
import { CompanyLogo } from "@/components/shared/CompanyLogo"
import { RadarChart } from "@/components/shared/RadarChart"
import { ApplicationPackPanel } from "@/components/cv/ApplicationPackPanel"
import { useAppStore } from "@/stores/app-store"
import { cn } from "@/lib/utils"

type PanelTab = "analysis" | "preparation" | "company" | "history"

interface DashboardOpportunityPanelProps {
  opportunity: JobOffer
  opportunities: JobOffer[]
  onSelectOpportunity: (id: string) => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

function daysSince(dateIso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / 86_400_000))
}

function fitLabel(score: number) {
  if (score >= 80) return "Excellent fit"
  if (score >= 65) return "Bon fit"
  return "À renforcer"
}

function timingLabel(score: number) {
  if (score >= 75) return "Récent"
  if (score >= 55) return "Correct"
  return "À surveiller"
}

function DonutScore({ score }: { score: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative h-[76px] w-[76px]">
      <svg className="-rotate-90" width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="#edf2f7" strokeWidth="10" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-black text-emerald-700">{score}</span>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  suffix,
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
    violet: "text-violet-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  }

  return (
    <div className="premium-surface rounded-2xl border p-4">
      <p className="premium-text-muted text-sm font-bold">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className={cn("text-2xl font-black tracking-tight", tones[tone])}>{value}</span>
        {suffix && <span className="premium-text-muted pb-1 text-sm font-bold">{suffix}</span>}
      </div>
      <p className="premium-text-muted mt-1 text-sm font-bold">{hint}</p>
    </div>
  )
}

function ScoreLine({ label, value, tone = "emerald" }: { label: string; value: number; tone?: "emerald" | "amber" }) {
  return (
    <div className="grid grid-cols-[128px_minmax(0,1fr)_54px] items-center gap-3">
      <span className="premium-text-soft text-[15px] font-extrabold">{label}</span>
      <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/70">
        <div
          className={cn("h-2 rounded-full", tone === "emerald" ? "bg-emerald-600" : "bg-amber-400")}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="premium-text-soft text-right text-[15px] font-black">{value}/100</span>
    </div>
  )
}

function PackStatusCard({
  title,
  subtitle,
  icon: Icon,
  status,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  status: "ready" | "review" | "generate"
}) {
  const statusConfig = {
    ready: { label: "A relire", className: "text-amber-700 bg-amber-50" },
    review: { label: "A verifier", className: "text-amber-700 bg-amber-50" },
    generate: { label: "À générer", className: "text-violet-700 bg-violet-50" },
  }

  return (
    <div className="premium-surface rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          <span className={cn("mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold", statusConfig[status].className)}>
            {statusConfig[status].label}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DashboardOpportunityPanel({
  opportunity,
  opportunities,
  onSelectOpportunity,
  collapsed = false,
  onToggleCollapsed,
}: DashboardOpportunityPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("analysis")
  const {
    applicationEvents,
    applicationPacks,
    applications,
    confirmOpportunityApplied,
    cvVersions,
    profile,
  } = useAppStore()

  const index = Math.max(0, opportunities.findIndex((item) => item.id === opportunity.id))
  const previous = opportunities[(index - 1 + opportunities.length) % opportunities.length]
  const next = opportunities[(index + 1) % opportunities.length]
  const linkedCV = cvVersions.find((cv) => cv.jobOfferId === opportunity.id)
  const pack = applicationPacks[opportunity.id]
  const application = applications.find((item) => item.jobOfferId === opportunity.id)
  const historyEvents = application
    ? applicationEvents.filter((event) => event.applicationId === application.id).slice(0, 4)
    : []

  const radarAxes = useMemo(
    () => [
      { label: "Comp.", value: opportunity.score.skills },
      { label: "Sen.", value: opportunity.score.seniority },
      { label: "Narr.", value: opportunity.score.narrative },
      { label: "ATS", value: opportunity.score.ats },
      { label: "Mot.", value: opportunity.score.motivation },
      { label: "Accès", value: opportunity.score.access },
    ],
    [opportunity]
  )

  const atsScore = linkedCV?.atsScore ?? opportunity.score.ats
  const topKeywords = linkedCV?.includedKeywords?.slice(0, 8) ?? opportunity.keywords.slice(0, 8)
  const firstImprovement = linkedCV?.bulletImprovements?.[0]

  const scrollToList = () => {
    document.getElementById("dashboard-opportunities")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  if (collapsed) {
    return (
      <aside className="premium-surface-strong min-w-0 rounded-[28px] border p-3 transition-all duration-300 xl:sticky xl:top-6 xl:h-[calc(100vh-48px)]">
        <div className="flex h-full flex-col items-center gap-4">
          <button
            onClick={onToggleCollapsed}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-[0_12px_24px_rgba(124,58,237,0.24)] transition-colors hover:bg-violet-700"
            aria-label="Ouvrir le détail de l'opportunité"
            title="Voir détail"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="premium-surface-muted flex w-full flex-1 flex-col items-center gap-5 rounded-3xl border px-3 py-4 text-center">
            <CompanyLogo
              company={opportunity.company}
              logoUrl={opportunity.logoUrl}
              size="lg"
              className="h-14 w-14 rounded-2xl text-xl shadow-sm"
            />
            <div className="flex flex-col items-center gap-2">
              <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-3xl font-black leading-none tracking-tight text-emerald-700">
                {opportunity.score.globalFit}
              </span>
              <span className="text-[11px] font-black uppercase tracking-wide text-emerald-700">
                {fitLabel(opportunity.score.globalFit)}
              </span>
            </div>
            <div className="min-h-0 flex-1 [writing-mode:vertical-rl]">
              <p className="premium-text max-h-[360px] truncate text-[15px] font-black tracking-[-0.01em]">
                {opportunity.title}
              </p>
            </div>
            <p className="premium-text-muted max-w-[72px] truncate text-xs font-black">
              {opportunity.company}
            </p>
            <button
              onClick={onToggleCollapsed}
              className="premium-surface flex h-10 w-10 items-center justify-center rounded-xl border text-violet-700 transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10"
              aria-label="Voir détail"
              title="Voir détail"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="premium-surface-strong min-w-0 rounded-[28px] border xl:sticky xl:top-6 xl:max-h-[calc(100vh-48px)] xl:overflow-y-auto">
      <div className="premium-divider border-b px-6 py-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={scrollToList}
            className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 transition-colors hover:text-violet-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à la liste
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapsed}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-black text-violet-700 shadow-sm transition-colors hover:bg-violet-100"
            >
              Réduire
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => previous && onSelectOpportunity(previous.id)}
              className="premium-surface inline-flex h-10 items-center gap-1 rounded-xl border px-3 text-sm font-bold premium-text-soft transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédente
            </button>
            <button
              onClick={() => next && onSelectOpportunity(next.id)}
              className="premium-surface inline-flex h-10 items-center gap-1 rounded-xl border px-3 text-sm font-bold premium-text-soft transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10"
            >
              Suivante
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <CompanyLogo
            company={opportunity.company}
            logoUrl={opportunity.logoUrl}
            size="lg"
            className="h-20 w-20 rounded-2xl text-3xl shadow-[0_18px_35px_rgba(15,23,42,0.16)]"
          />
          <div className="min-w-0 flex-1">
            <h2 className="premium-text text-2xl font-black leading-tight tracking-[-0.02em]">
              {opportunity.title}
            </h2>
            <div className="premium-text-soft mt-2 flex flex-wrap items-center gap-2 text-base font-bold">
              <span>{opportunity.company}</span>
              <span className="text-violet-500">●</span>
              <span>{opportunity.location}</span>
              <span className="text-slate-300">·</span>
              <span>Publié il y a {daysSince(opportunity.postedAt)}j</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => confirmOpportunityApplied(opportunity.id)}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-violet-600 px-5 text-base font-black text-white shadow-[0_12px_24px_rgba(124,58,237,0.28)] transition-colors hover:bg-violet-700"
              >
                Postuler maintenant
                <ExternalLink className="h-4 w-4" />
              </button>
              <button className="premium-surface flex h-12 w-12 items-center justify-center rounded-xl border premium-text-muted transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="premium-divider mt-6 flex gap-8 border-b">
          {([
            ["analysis", "Analyse"],
            ["preparation", "Préparation"],
            ["company", "Entreprise"],
            ["history", "Historique"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "-mb-px border-b-[3px] px-1 pb-4 text-base font-bold transition-colors",
                activeTab === id
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "analysis" && (
        <div className="space-y-5 p-6">
          <section className="grid gap-4">
            <div className="premium-surface rounded-3xl border p-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-center">
                <div className="min-w-0">
                  <div>
                    <p className="premium-text text-lg font-black tracking-[-0.01em]">Score estime</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-6xl font-black tracking-[-0.055em] text-emerald-700">
                        {opportunity.score.globalFit}
                      </span>
                      <span className="premium-text-muted pb-2 text-2xl font-black">/100</span>
                    </div>
                    <p className="mt-1 text-base font-black text-emerald-600">{fitLabel(opportunity.score.globalFit)}</p>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    <ScoreLine label="Compétences" value={opportunity.score.skills} />
                    <ScoreLine label="Séniorité" value={opportunity.score.seniority} />
                    <ScoreLine label="Narratif" value={opportunity.score.narrative} />
                    <ScoreLine label="ATS" value={opportunity.score.ats} />
                    <ScoreLine label="Motivation" value={opportunity.score.motivation} />
                    <ScoreLine label="Accès réseau" value={opportunity.score.access} tone="amber" />
                    <ScoreLine label="Probabilité entretien" value={opportunity.score.interviewProbability} tone="amber" />
                  </div>
                </div>

                <div className="premium-radar-shell hidden justify-self-center rounded-[28px] border p-3 sm:block">
                  <RadarChart axes={radarAxes} size={280} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Confidence" value={`${opportunity.score.confidence}%`} hint="Moyenne" />
              <MetricCard label="Accès" value={opportunity.score.access} suffix="/100" hint="Bon" tone="emerald" />
              <MetricCard label="Effort estimé" value="45 min" hint="Moyen" tone="amber" />
              <MetricCard label="Timing" value={timingLabel(opportunity.score.timing)} hint="Très bon" tone="emerald" />
            </div>
          </section>

          <section className="premium-surface-strong rounded-2xl border-2 border-violet-300 p-6 shadow-[0_18px_45px_rgba(124,58,237,0.12)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="premium-text text-xl font-black tracking-tight">CV ciblé & ATS</h3>
                <p className="premium-text-muted mt-1 text-sm font-bold">
                  Estimation locale/IA a relire. CV genere ne veut pas dire candidature envoyee.
                </p>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                Prepare != fait
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="premium-surface-muted rounded-2xl border p-5">
                <p className="text-sm font-bold text-slate-600">Score ATS estime</p>
                <div className="mt-3 flex items-center gap-3">
                  <div>
                    <span className="text-4xl font-black tracking-tight text-emerald-700">{atsScore}</span>
                    <span className="text-lg font-bold text-slate-500">/100</span>
                    <p className="mt-1 text-sm font-black text-emerald-600">{atsScore >= 80 ? "Bon" : "À renforcer"}</p>
                  </div>
                  <DonutScore score={atsScore} />
                </div>
                <div className="mt-5 space-y-2.5 text-sm font-bold leading-relaxed">
                  <p className="text-emerald-700">✓ Mots-clés intégrés {linkedCV?.includedKeywords.length ?? 14}/18</p>
                  <p className="text-emerald-700">✓ Expériences pertinentes 4/5</p>
                  <p className="text-amber-700">✓ Bullets renforcés {linkedCV?.bulletImprovements.length ?? 3}</p>
                  <p className="text-rose-600">✓ Risques de formulation vague {linkedCV?.missingKeywords.length ?? 3}</p>
                </div>
              </div>

              <div className="premium-surface-muted rounded-2xl border p-5">
                <p className="text-sm font-bold text-slate-700">Mots-clés principaux de l&apos;offre</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {topKeywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-violet-300/30 bg-violet-100 px-3 py-1.5 text-sm font-black text-violet-700">
                      {keyword}
                    </span>
                  ))}
                  {opportunity.keywords.length > topKeywords.length && (
                    <span className="rounded-full border border-slate-300/30 bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-500">
                      +{opportunity.keywords.length - topKeywords.length} autres
                    </span>
                  )}
                </div>
              </div>

              <div className="premium-surface-muted rounded-2xl border p-5">
                <p className="text-sm font-bold text-slate-700">Extrait de comparaison</p>
                <div className="mt-4 space-y-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Avant</p>
                    <p className="premium-text-soft mt-1 text-sm font-bold leading-relaxed">
                      {firstImprovement?.original ?? "Responsable de la roadmap et des projets transverses."}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600">
                      Peu impactant
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Après</p>
                    <p className="premium-text mt-1 text-sm font-bold leading-relaxed">
                      {firstImprovement?.improved ??
                        "Piloté des initiatives cross-fonctionnelles avec impact mesurable sur la fiabilité opérationnelle."}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      Impact fort
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/cv"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)] transition-colors hover:bg-violet-700"
              >
                <Sparkles className="h-4 w-4" />
                Generer CV cible
              </Link>
              <button className="premium-surface inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold premium-text-soft transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10">
                <Link2 className="h-4 w-4" />
                Comparer
              </button>
              <button className="premium-surface inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold premium-text-soft transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10">
                <Download className="h-4 w-4" />
                Exporter PDF
              </button>
              <button className="premium-surface inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold premium-text-soft transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10">
                <Download className="h-4 w-4" />
                Exporter DOCX
              </button>
              <button className="premium-surface inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold premium-text-soft transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10">
                Plus
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="premium-surface rounded-2xl border p-5">
            <h3 className="premium-text text-xl font-black tracking-tight">Pack candidature</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <PackStatusCard
                title="Message LinkedIn"
                subtitle={pack ? "Brouillon a relire" : "A composer"}
                icon={MessageCircle}
                status={pack ? "ready" : "generate"}
              />
              <PackStatusCard
                title="Pitch oral"
                subtitle={pack ? "2 versions a relire" : "A generer"}
                icon={Mic}
                status={pack ? "ready" : "generate"}
              />
              <PackStatusCard
                title="Questions probables"
                subtitle={pack ? `${pack.probableQuestions.length} questions` : "À préparer"}
                icon={HelpCircle}
                status={pack ? "review" : "generate"}
              />
              <PackStatusCard
                title="Lettre / note"
                subtitle={pack ? "Base a relire" : "A generer"}
                icon={FileText}
                status={pack ? "ready" : "generate"}
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === "preparation" && (
        <div className="min-h-[520px]">
          {pack ? (
            <ApplicationPackPanel pack={pack} profile={profile} opportunity={opportunity} />
          ) : (
            <div className="p-6">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-900">Pack non généré</p>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
                  Le pack sera générable depuis le module Application Builder. Le dashboard garde ici l&apos;état préparé sans confirmer d&apos;action réelle.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "company" && (
        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-violet-600" />
              <h3 className="text-xl font-black text-slate-950">{opportunity.company}</h3>
            </div>
            <p className="mt-4 text-base font-medium leading-relaxed text-slate-600">{opportunity.description}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-black text-slate-900">Angle recommandé</h4>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{opportunity.score.recommendedAngle}</p>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4 p-6">
          {historyEvents.length > 0 ? (
            historyEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-black text-slate-900">{event.label}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{event.note}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black text-slate-900">Aucun historique confirmé</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Les actions réelles apparaîtront ici après confirmation manuelle.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
