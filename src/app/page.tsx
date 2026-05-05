"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Search,
  Square,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react"
import type { Application, JobOffer } from "@/types"
import { mockPipelineJobs } from "@/data/mock-applications"
import { useAppStore } from "@/stores/app-store"
import { computeDailyActions } from "@/lib/daily-actions"
import { CompanyLogo } from "@/components/shared/CompanyLogo"
import { DashboardOpportunityPanel } from "@/components/dashboard/DashboardOpportunityPanel"
import { cn } from "@/lib/utils"

type PipelineRange = "month" | "week"

const interviewStatuses = [
  "recruiter_interview",
  "hiring_manager_interview",
  "case_study",
  "offer",
] as const

const closedResponseStatuses = [
  "response_received",
  "recruiter_interview",
  "hiring_manager_interview",
  "case_study",
  "offer",
  "rejected",
] as const

function formatToday(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function daysSince(dateIso: string, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - new Date(dateIso).getTime()) / 86_400_000))
}

function fitLabel(score: number) {
  if (score >= 80) return "Excellent fit"
  if (score >= 60) return "Bon fit"
  return "Fit moyen"
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700"
  if (score >= 60) return "bg-amber-50 text-amber-700"
  return "bg-slate-100 text-slate-600"
}

function priorityLabel(score: number) {
  if (score >= 80) return "Haute priorité"
  if (score >= 60) return "Priorité moyenne"
  return "Priorité faible"
}

function priorityTone(score: number) {
  if (score >= 80) return "bg-rose-50 text-rose-600"
  if (score >= 60) return "bg-amber-50 text-amber-700"
  return "bg-slate-100 text-slate-500"
}

function percent(part: number, total: number) {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

function oneDecimal(value: number) {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`
}

function getApplicationCount(applications: Application[]) {
  return applications.filter((app) => app.appliedAt || app.status !== "new").length
}

function lowestScoreInsight(topOpportunity: JobOffer | undefined) {
  if (!topOpportunity) return "Ajoutez une opportunité prioritaire pour détecter le prochain point faible."

  const axes = [
    { label: "accès réseau", value: topOpportunity.score.access },
    { label: "ATS", value: topOpportunity.score.ats },
    { label: "narratif", value: topOpportunity.score.narrative },
    { label: "motivation", value: topOpportunity.score.motivation },
    { label: "timing", value: topOpportunity.score.timing },
  ].sort((a, b) => a.value - b.value)

  const weakest = axes[0]
  return `Le point le plus faible sur ${topOpportunity.company} reste ${weakest.label} (${weakest.value}/100).`
}

function dominantTrend(opportunities: JobOffer[]) {
  const strategyOpsCount = opportunities.filter((opp) =>
    /operations|program|chief of staff|strategy/i.test(`${opp.title} ${opp.keywords.join(" ")}`)
  ).length

  if (strategyOpsCount >= 3) {
    return "Les rôles Strategy & Operations dominent vos meilleurs scores cette semaine."
  }

  return "Les postes en scale-up tech répondent le mieux à votre profil hybride."
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  tone: "violet" | "blue" | "amber" | "emerald"
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }

  return (
    <div className="premium-surface rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="premium-text-soft text-base font-black leading-tight">{title}</p>
          <p className="premium-text mt-6 text-[38px] font-black leading-none tracking-[-0.045em]">{value}</p>
          <p className="premium-text-muted mt-2 text-[15px] font-bold leading-relaxed">{subtitle}</p>
        </div>
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", tones[tone])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function TopOpportunityRow({
  opportunity,
  rank,
  now,
  isSelected,
  onSelect,
}: {
  opportunity: JobOffer
  rank: number
  now: Date
  isSelected: boolean
  onSelect: () => void
}) {
  const score = opportunity.score.globalFit

  return (
    <button
      onClick={onSelect}
      className={cn(
        "premium-divider w-full border-t px-5 py-4 text-left transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10",
        isSelected && "premium-selected"
      )}
    >
      <div className="grid grid-cols-[2.25rem_3.25rem_minmax(0,1fr)] items-center gap-4 lg:grid-cols-[2.25rem_3.25rem_minmax(0,1fr)_7.5rem_8.5rem_7.5rem_1.5rem]">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-base font-black",
            rank === 1
              ? "bg-emerald-50 text-emerald-700"
              : rank === 2
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-700"
          )}
        >
          {rank}
        </span>

        <CompanyLogo
          company={opportunity.company}
          logoUrl={opportunity.logoUrl}
          size="lg"
          className="h-12 w-12 rounded-xl text-lg shadow-sm"
        />

        <div className="min-w-0">
          <p className="premium-text truncate text-[17px] font-black leading-tight">{opportunity.title}</p>
          <p className="premium-text-muted mt-1 truncate text-[15px] font-bold">
            {opportunity.company} <span className="px-1.5 text-slate-300">·</span> {opportunity.location}
          </p>
        </div>

        <div className="hidden justify-self-start lg:block">
          <span className={cn("inline-flex rounded-xl px-3 py-1 text-2xl font-black tracking-tight", scoreTone(score))}>
            {score}
          </span>
          <p className={cn("mt-1 text-sm font-black", score >= 80 ? "text-emerald-600" : "text-amber-600")}>
            {fitLabel(score)}
          </p>
        </div>

        <span className={cn("hidden justify-self-start rounded-xl px-3 py-2 text-sm font-black lg:inline-flex", priorityTone(score))}>
          {priorityLabel(score)}
        </span>

        <span className="premium-text-muted hidden text-sm font-bold lg:block">
          Publié il y a {daysSince(opportunity.postedAt, now)}j
        </span>

        <ChevronRight className={cn("hidden h-5 w-5 lg:block", isSelected ? "text-violet-500" : "text-slate-400")} />
      </div>
    </button>
  )
}

function PipelineRow({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: number | string
  suffix?: string
  accent?: "emerald" | "violet"
}) {
  return (
    <div className="premium-divider flex items-center justify-between border-t py-3">
      <span className="premium-text-soft text-[17px] font-extrabold">{label}</span>
      <div className="flex items-center gap-3">
        <span className="premium-text text-[17px] font-black">{value}</span>
        {suffix && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-sm font-black",
              accent === "violet" ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"
            )}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function InsightCard({
  title,
  description,
  icon: Icon,
  tone,
}: {
  title: string
  description: string
  icon: React.ElementType
  tone: "emerald" | "amber" | "blue"
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    blue: "border-blue-100 bg-blue-50 text-blue-600",
  }

  return (
    <div className={cn("rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:bg-[var(--app-surface-muted)]", tones[tone])}>
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/75 shadow-sm dark:bg-white/10">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-black leading-snug">{title}</p>
          <p className="premium-text-soft mt-1 text-sm font-bold leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const {
    profile,
    applications,
    applicationEvents,
    networkContacts,
    opportunities,
    actions,
    selectedOpportunityId,
    setSelectedOpportunity,
    appMode,
  } = useAppStore()
  const [now] = useState(() => new Date())
  const [pipelineRange, setPipelineRange] = useState<PipelineRange>("month")
  const [isOpportunityPanelCollapsed, setIsOpportunityPanelCollapsed] = useState(false)

  const computedActions = useMemo(
    () => computeDailyActions(applications, applicationEvents, networkContacts, opportunities, mockPipelineJobs, now),
    [applications, applicationEvents, networkContacts, opportunities, now]
  )

  const rankedOpportunities = useMemo(
    () =>
      [...opportunities]
        .filter((opportunity) => opportunity.status !== "archived")
        .sort((a, b) => b.score.globalFit - a.score.globalFit),
    [opportunities]
  )

  const topOpportunities = rankedOpportunities.slice(0, 3)
  const selectedOpportunity =
    rankedOpportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ?? topOpportunities[0]

  const periodDays = pipelineRange === "week" ? 7 : 31
  const periodStart = new Date(now.getTime() - periodDays * 86_400_000)
  const periodEvents = applicationEvents.filter(
    (event) => event.source === "manual" && new Date(event.createdAt) >= periodStart
  )

  const offersAnalysed = opportunities.length
  const relevantOpportunities = opportunities.filter(
    (opportunity) => opportunity.status !== "archived" && opportunity.score.globalFit >= 60
  ).length
  const interviewCount = applications.filter((application) =>
    (interviewStatuses as readonly string[]).includes(application.status)
  ).length
  const applicationsSent = getApplicationCount(applications)
  const periodApplicationsSent =
    periodEvents.filter((event) => event.type === "applied").length ||
    applications.filter((application) => application.appliedAt && new Date(application.appliedAt) >= periodStart).length
  const responsesReceived =
    periodEvents.filter((event) =>
      ["response_received", "interview_obtained", "rejected"].includes(event.type)
    ).length ||
    applications.filter((application) =>
      (closedResponseStatuses as readonly string[]).includes(application.status)
    ).length
  const recruiterInterviews =
    periodEvents.filter((event) => event.type === "interview_obtained").length ||
    applications.filter((application) =>
      ["recruiter_interview", "hiring_manager_interview", "case_study", "offer"].includes(application.status)
    ).length
  const managerInterviews = applications.filter((application) =>
    ["hiring_manager_interview", "case_study", "offer"].includes(application.status)
  ).length
  const conversionRate =
    periodApplicationsSent > 0
      ? Math.round((recruiterInterviews / periodApplicationsSent) * 1000) / 10
      : 0

  const doneActions = actions.filter((action) => action.status === "done").slice(0, 2)
  const visibleComputedActions = computedActions.slice(0, Math.max(3, 4 - doneActions.length))

  const selectOpportunity = (id: string) => {
    setSelectedOpportunity(id)
  }

  return (
    <div className="app-premium-bg min-h-full">
      {appMode === "demo" && (
        <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-6 py-3 dark:border-amber-800/40 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Mode démo actif — vous naviguez sur des données fictives.
          </p>
          <Link
            href="/parametres"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Démarrer avec mes données →
          </Link>
        </div>
      )}
      <div
        className={cn(
          "grid min-h-full gap-6 px-6 py-6 transition-[grid-template-columns] duration-300 ease-out",
          isOpportunityPanelCollapsed
            ? "2xl:grid-cols-[minmax(720px,1fr)_112px]"
            : "2xl:grid-cols-[minmax(640px,0.58fr)_minmax(540px,0.42fr)]"
        )}
      >
        <main className="min-w-0 space-y-6">
          <section>
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="premium-text text-[34px] font-black leading-tight tracking-[-0.035em]">
                  Bonjour {profile?.name ?? "Hamza"} ! <span aria-hidden="true">👋</span>
                </h1>
                <p className="premium-text-muted mt-2 text-lg font-bold">
                  Voici votre briefing du {formatToday(now)}
                </p>
              </div>

              <button className="premium-surface inline-flex h-12 items-center gap-3 rounded-xl border px-4 text-base font-black premium-text-soft transition-colors">
                <CalendarCheck className="h-5 w-5 text-slate-500" />
                Résumé quotidien
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Offres analysées"
                value={offersAnalysed}
                subtitle="+12 vs hier"
                icon={Search}
                tone="violet"
              />
              <KpiCard
                title="Opportunités pertinentes"
                value={relevantOpportunities}
                subtitle={`${percent(relevantOpportunities, Math.max(offersAnalysed, 1))}% du total`}
                icon={Target}
                tone="blue"
              />
              <KpiCard
                title="Actions prioritaires"
                value={computedActions.length}
                subtitle="À traiter aujourd'hui"
                icon={Zap}
                tone="amber"
              />
              <KpiCard
                title="Entretiens obtenus"
                value={interviewCount}
                subtitle="Ce mois-ci"
                icon={CalendarCheck}
                tone="emerald"
              />
            </div>
          </section>

          <section id="dashboard-opportunities" className="premium-surface rounded-[26px] border">
            <div className="flex items-center justify-between px-5 py-5">
              <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-950">Top opportunités du jour</h2>
              <Link href="/opportunites" className="text-base font-black text-violet-600 hover:text-violet-700">
                Voir toutes
              </Link>
            </div>
            <div>
              {topOpportunities.map((opportunity, index) => (
                <TopOpportunityRow
                  key={opportunity.id}
                  opportunity={opportunity}
                  rank={index + 1}
                  now={now}
                  isSelected={opportunity.id === selectedOpportunity?.id}
                  onSelect={() => selectOpportunity(opportunity.id)}
                />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
            <div className="premium-surface rounded-[26px] border p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-950">Vos actions d&apos;aujourd&apos;hui</h2>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-black text-violet-600">
                  Préparé ≠ fait
                </span>
              </div>

              <div className="space-y-4">
                {visibleComputedActions.length === 0 && doneActions.length === 0 ? (
                  <div className="premium-surface-muted rounded-2xl border border-dashed p-8 text-center">
                    <p className="text-base font-semibold text-slate-500">Aucune action prioritaire détectée.</p>
                  </div>
                ) : (
                  <>
                    {visibleComputedActions.map((action) => (
                      <Link
                        key={action.id}
                        href={action.href}
                        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10"
                      >
                        <Square className="h-5 w-5 shrink-0 text-slate-300" />
                        <span className="premium-text-soft min-w-0 flex-1 truncate text-base font-extrabold">
                          {action.title}
                        </span>
                        <span className="shrink-0 rounded-xl bg-violet-50 px-3 py-1.5 text-sm font-black text-violet-600">
                          {action.estimatedMinutes} min
                        </span>
                      </Link>
                    ))}

                    {doneActions.map((action) => (
                      <div key={action.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 opacity-75">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-600">
                          <span className="h-2 w-2 rounded-sm bg-white" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-base font-bold text-slate-500 line-through">
                          {action.title}
                        </span>
                        <span className="shrink-0 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-600">
                          Fait
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="premium-divider mt-6 border-t pt-5">
                <Link href="/candidatures" className="text-base font-black text-violet-600 hover:text-violet-700">
                  Voir toutes mes actions
                </Link>
              </div>
            </div>

            <div className="premium-surface rounded-[26px] border p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-950">Votre pipeline</h2>
                <div className="premium-surface-muted rounded-xl border p-1">
                  {([
                    ["month", "Ce mois-ci"],
                    ["week", "Semaine"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setPipelineRange(value)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-black transition-colors",
                        pipelineRange === value ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <PipelineRow label="Offres analysées" value={offersAnalysed} />
              <PipelineRow label="Candidatures envoyées" value={periodApplicationsSent || applicationsSent} />
              <PipelineRow
                label="Réponses reçues"
                value={responsesReceived}
                suffix={`${percent(responsesReceived, periodApplicationsSent || applicationsSent)}%`}
              />
              <PipelineRow
                label="Entretiens recruteur"
                value={recruiterInterviews}
                suffix={`${percent(recruiterInterviews, periodApplicationsSent || applicationsSent)}%`}
              />
              <PipelineRow
                label="Entretiens manager"
                value={managerInterviews}
                suffix={`${percent(managerInterviews, Math.max(recruiterInterviews, 1))}%`}
              />

              <div className="mt-5 rounded-2xl bg-violet-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-black text-violet-700">Taux de conversion global</span>
                  <span className="text-2xl font-black tracking-tight text-violet-600">{oneDecimal(conversionRate)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="premium-surface rounded-[26px] border p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">Signaux rapides</h2>
              <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Analyse locale limitee
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <InsightCard
                title="Vos meilleurs resultats"
                description="Signal local: les candidatures avec contact reseau semblent obtenir plus de reponses."
                icon={TrendingUp}
                tone="emerald"
              />
              <InsightCard
                title="A ameliorer"
                description={lowestScoreInsight(topOpportunities[0])}
                icon={CircleAlert}
                tone="amber"
              />
              <InsightCard
                title="Tendance"
                description={dominantTrend(topOpportunities)}
                icon={BarChart3}
                tone="blue"
              />
            </div>
          </section>

          <section className="rounded-[26px] border border-violet-100 bg-violet-950 p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] 2xl:hidden">
            <div className="flex items-start gap-3">
              <BriefcaseBusiness className="mt-1 h-5 w-5 text-violet-200" />
              <p className="text-base font-semibold leading-relaxed text-violet-50">
                Le panneau opportunite passe sous le dashboard sur les ecrans plus etroits pour garder une lecture confortable.
              </p>
            </div>
          </section>
        </main>

        {selectedOpportunity && (
          <DashboardOpportunityPanel
            opportunity={selectedOpportunity}
            opportunities={rankedOpportunities}
            onSelectOpportunity={selectOpportunity}
            collapsed={isOpportunityPanelCollapsed}
            onToggleCollapsed={() => setIsOpportunityPanelCollapsed((value) => !value)}
          />
        )}
      </div>
    </div>
  )
}
