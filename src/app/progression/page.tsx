"use client"

import { useMemo } from "react"
import { useAppStore } from "@/stores/app-store"
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Info,
  Lightbulb,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ApplicationStatus } from "@/types"
import { buildLearningDashboard, type LearningInsight, type LearningTone } from "@/lib/learning-dashboard"
import { PageHeader, PageShell, PremiumCard } from "@/components/shared/PageShell"

const PRE_APPLY: ApplicationStatus[] = ["new", "shortlisted", "pack_generated", "ready_to_apply"]
const APPLIED: ApplicationStatus[] = ["applied", "waiting"]
const IN_CONTACT: ApplicationStatus[] = ["contacted", "follow_up_needed"]
const GOT_RESPONSE: ApplicationStatus[] = ["response_received"]
const INTERVIEWING: ApplicationStatus[] = ["recruiter_interview", "hiring_manager_interview", "case_study"]
const OFFER: ApplicationStatus[] = ["offer"]
const CLOSED: ApplicationStatus[] = ["rejected", "probably_ghosted", "ghosted", "archived"]

const funnelStages: {
  label: string
  sublabel: string
  statuses: ApplicationStatus[]
  color: string
  textColor: string
}[] = [
  {
    label: "Envoyées",
    sublabel: "applied / en attente",
    statuses: APPLIED,
    color: "bg-violet-500",
    textColor: "text-violet-700",
  },
  {
    label: "Contact établi",
    sublabel: "contacté / relance",
    statuses: IN_CONTACT,
    color: "bg-blue-500",
    textColor: "text-blue-700",
  },
  {
    label: "Réponse reçue",
    sublabel: "retour positif",
    statuses: GOT_RESPONSE,
    color: "bg-sky-500",
    textColor: "text-sky-700",
  },
  {
    label: "Entretien",
    sublabel: "RH / manager / case",
    statuses: INTERVIEWING,
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
  },
  {
    label: "Offre",
    sublabel: "proposition reçue",
    statuses: OFFER,
    color: "bg-emerald-600",
    textColor: "text-emerald-800",
  },
]

const toneClasses: Record<LearningTone, { card: string; icon: string; title: string }> = {
  emerald: {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-900",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    icon: "bg-amber-100 text-amber-700",
    title: "text-amber-900",
  },
  violet: {
    card: "border-violet-200 bg-violet-50",
    icon: "bg-violet-100 text-violet-700",
    title: "text-violet-900",
  },
  blue: {
    card: "border-blue-200 bg-blue-50",
    icon: "bg-blue-100 text-blue-700",
    title: "text-blue-900",
  },
  rose: {
    card: "border-rose-200 bg-rose-50",
    icon: "bg-rose-100 text-rose-700",
    title: "text-rose-900",
  },
}

function getMondayKey(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() + diff)
  return monday.toISOString().slice(0, 10)
}

function formatWeekLabel(mondayKey: string): string {
  const date = new Date(mondayKey)
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function KpiCard({
  label,
  value,
  sub,
  benchmark,
  icon: Icon,
  valueColor,
}: {
  label: string
  value: string | number
  sub: string
  benchmark?: string
  icon: React.ElementType
  valueColor?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.045)]">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      </div>
      <p className={cn("text-3xl font-black tracking-[-0.04em]", valueColor ?? "text-slate-950")}>{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{sub}</p>
      {benchmark && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium leading-snug text-slate-400">
          <Info className="h-3 w-3 shrink-0" />
          {benchmark}
        </p>
      )}
    </div>
  )
}

function LearningCard({
  insight,
  icon: Icon,
}: {
  insight: LearningInsight
  icon: React.ElementType
}) {
  const tone = toneClasses[insight.tone]

  return (
    <div className={cn("rounded-2xl border p-4", tone.card)}>
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className={cn("text-sm font-black leading-snug", tone.title)}>{insight.title}</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">{insight.description}</p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{insight.source}</p>
        </div>
      </div>
    </div>
  )
}

export default function ProgressionPage() {
  const { applications, applicationEvents, memoryItems } = useAppStore()

  const learning = useMemo(
    () => buildLearningDashboard({ applications, applicationEvents, memoryItems }),
    [applications, applicationEvents, memoryItems]
  )

  const preApplyCount = applications.filter((a) => PRE_APPLY.includes(a.status)).length
  const sentCount = applications.filter((a) => !PRE_APPLY.includes(a.status)).length
  const closedCount = applications.filter((a) => CLOSED.includes(a.status)).length
  const activeCount = applications.length - closedCount

  const responseCount = applications.filter((a) =>
    [...GOT_RESPONSE, ...INTERVIEWING, ...OFFER].includes(a.status)
  ).length
  const interviewCount = applications.filter((a) =>
    [...INTERVIEWING, ...OFFER].includes(a.status)
  ).length
  const offerCount = applications.filter((a) => OFFER.includes(a.status)).length

  const responseRate = sentCount > 0 ? Math.round((responseCount / sentCount) * 100) : 0
  const interviewRate = sentCount > 0 ? Math.round((interviewCount / sentCount) * 100) : 0

  const rejectedCount = applications.filter((a) => a.status === "rejected").length
  const ghostedCount = applications.filter((a) =>
    (["probably_ghosted", "ghosted"] as ApplicationStatus[]).includes(a.status)
  ).length
  const archivedCount = applications.filter((a) => a.status === "archived").length

  const funnelData = funnelStages.map((stage) => ({
    ...stage,
    count: applications.filter((a) => stage.statuses.includes(a.status)).length,
  }))
  const maxFunnelCount = Math.max(...funnelData.map((s) => s.count), 1, sentCount)

  const weeklyActivity = useMemo(() => {
    const now = new Date()
    const weeks: { key: string; label: string; count: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const monday = new Date(now)
      const day = monday.getUTCDay()
      const diff = day === 0 ? -6 : 1 - day
      monday.setUTCDate(monday.getUTCDate() + diff - i * 7)
      weeks.push({
        key: monday.toISOString().slice(0, 10),
        label: formatWeekLabel(monday.toISOString().slice(0, 10)),
        count: 0,
      })
    }

    for (const event of applicationEvents) {
      if (event.source !== "manual") continue
      const key = getMondayKey(event.createdAt)
      const week = weeks.find((w) => w.key === key)
      if (week) week.count++
    }

    return weeks
  }, [applicationEvents])

  const maxWeekCount = Math.max(...weeklyActivity.map((w) => w.count), 1)
  const totalManualActions = weeklyActivity.reduce((sum, w) => sum + w.count, 0)

  return (
    <PageShell size="lg">
      <PageHeader
        title="Progression"
        subtitle="Metriques calculees depuis tes actions confirmees et signaux locaux issus de ta memoire."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Dossiers"
          value={applications.length}
          sub={`${activeCount} actifs · ${closedCount} clôturés`}
          icon={Users}
        />
        <KpiCard
          label="Envoyées"
          value={sentCount}
          sub={preApplyCount > 0 ? `${preApplyCount} en préparation` : "toutes confirmées"}
          icon={Target}
          valueColor="text-violet-600"
        />
        <KpiCard
          label="Taux réponse"
          value={`${responseRate}%`}
          sub={`${responseCount} réponse${responseCount > 1 ? "s" : ""} reçue${responseCount > 1 ? "s" : ""}`}
          benchmark="Marché : environ 20-25% en candidature ciblée"
          icon={CheckCircle2}
          valueColor={
            responseRate >= 25
              ? "text-emerald-600"
              : responseRate >= 15
              ? "text-amber-600"
              : "text-rose-600"
          }
        />
        <KpiCard
          label="Taux entretien"
          value={`${interviewRate}%`}
          sub={`${interviewCount} entretien${interviewCount > 1 ? "s" : ""} obtenu${interviewCount > 1 ? "s" : ""}`}
          benchmark="Marché : environ 10-20% avec réseau actif"
          icon={TrendingUp}
          valueColor={
            interviewRate >= 20
              ? "text-emerald-600"
              : interviewRate >= 10
              ? "text-amber-600"
              : "text-rose-600"
          }
        />
      </div>

      <PremiumCard className="border-violet-200 bg-gradient-to-br from-white to-violet-50/45">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-black tracking-[-0.02em] text-slate-950">Signaux de progression locaux</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
              Lecture locale limitee de ton pipeline et de ta memoire : utile pour suivre les tendances,
              pas une analyse IA. Les conclusions restent a confirmer avec plus de donnees.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:min-w-[360px]">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Réponses</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{learning.responseRate}%</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Entretiens</p>
              <p className="mt-1 text-2xl font-black text-violet-600">{learning.interviewRate}%</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Mémoire liée</p>
              <p className="mt-1 text-2xl font-black text-blue-600">{learning.memoryCoverage}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Ce qui marche
            </h3>
            <div className="space-y-3">
              {learning.strongestSignals.map((insight) => (
                <LearningCard key={insight.id} insight={insight} icon={Lightbulb} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              À améliorer
            </h3>
            <div className="space-y-3">
              {learning.improvementAreas.map((insight) => (
                <LearningCard key={insight.id} insight={insight} icon={AlertTriangle} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
            <Target className="h-4 w-4 text-violet-600" />
            Actions recommandées
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {learning.recommendedActions.map((action, index) => (
              <div key={action} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-relaxed text-slate-700">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </PremiumCard>

      <PremiumCard>
        <h2 className="mb-1 text-base font-black tracking-[-0.02em] text-slate-950">Funnel de pipeline</h2>
        <p className="mb-4 text-sm font-semibold text-slate-500">État actuel des dossiers par étape confirmée.</p>
        <div className="space-y-2.5">
          {funnelData.map((stage) => (
            <div key={stage.label} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-right">
                <p className="text-sm font-bold text-slate-900">{stage.label}</p>
                <p className="text-xs font-semibold text-slate-400">{stage.sublabel}</p>
              </div>
              <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-slate-100">
                <div
                  className={cn("h-full rounded-lg transition-all", stage.color)}
                  style={{
                    width: `${Math.max(
                      stage.count > 0 ? (stage.count / maxFunnelCount) * 100 : 0,
                      stage.count > 0 ? 5 : 0
                    )}%`,
                  }}
                />
              </div>
              <div className="w-7 shrink-0 text-right">
                <span className={cn("text-sm font-black", stage.count > 0 ? stage.textColor : "text-slate-400")}>
                  {stage.count}
                </span>
              </div>
            </div>
          ))}

          <div className="mt-1 flex items-center gap-3 border-t border-slate-200 pt-2">
            <div className="w-32 shrink-0 text-right">
              <p className="text-sm font-bold text-slate-500">Clôturés</p>
              <p className="text-xs font-semibold text-slate-400">refus / ghosté / archivé</p>
            </div>
            <div className="h-8 flex-1 overflow-hidden rounded-lg bg-slate-100">
              <div
                className="h-full rounded-lg bg-slate-300 transition-all"
                style={{
                  width: `${Math.max(
                    closedCount > 0 ? (closedCount / maxFunnelCount) * 100 : 0,
                    closedCount > 0 ? 5 : 0
                  )}%`,
                }}
              />
            </div>
            <div className="w-7 shrink-0 text-right">
              <span className="text-sm font-black text-slate-400">{closedCount}</span>
            </div>
          </div>
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <PremiumCard>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">Activité hebdomadaire</h2>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">Actions manuelles confirmées sur 6 semaines.</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-black text-violet-600">{totalManualActions}</p>
              <p className="text-xs font-semibold text-slate-400">actions</p>
            </div>
          </div>

          <div className="flex h-28 items-end gap-2">
            {weeklyActivity.map((week) => (
              <div key={week.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="min-h-[18px] text-xs font-black text-slate-900">
                  {week.count > 0 ? week.count : ""}
                </span>
                <div className="flex h-16 w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      week.count > 0 ? "bg-violet-500" : "bg-slate-100"
                    )}
                    style={{
                      height: week.count > 0 ? `${Math.max((week.count / maxWeekCount) * 100, 12)}%` : "8%",
                    }}
                  />
                </div>
                <span className="whitespace-nowrap text-center text-[11px] font-semibold leading-tight text-slate-400">
                  {week.label}
                </span>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-500" />
            <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">Conversion actuelle</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Envoyées</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{learning.conversion.applied}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-emerald-600">Réponses</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{learning.conversion.responses}</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-violet-600">Entretiens</p>
              <p className="mt-1 text-2xl font-black text-violet-700">{learning.conversion.interviews}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-rose-600">Refus</p>
              <p className="mt-1 text-2xl font-black text-rose-700">{learning.conversion.rejected}</p>
            </div>
          </div>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PremiumCard>
          <h2 className="mb-3 text-base font-black tracking-[-0.02em] text-slate-950">Dossiers clôturés</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-center">
              <p className="text-xl font-black text-rose-600">{rejectedCount}</p>
              <p className="mt-0.5 text-xs font-bold text-rose-700">Refus</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xl font-black text-slate-500">{ghostedCount}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-600">Ghosté</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
              <p className="text-xl font-black text-slate-400">{archivedCount}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">Archivé</p>
            </div>
          </div>
          {closedCount === 0 && (
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">Aucun dossier clôturé pour l&apos;instant.</p>
          )}
        </PremiumCard>

        <section
          className={cn(
            "rounded-[26px] border p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]",
            offerCount > 0 ? "border-emerald-300 bg-emerald-50" : "border-dashed border-slate-200 bg-white"
          )}
        >
          <h2 className="mb-1 text-base font-black tracking-[-0.02em] text-slate-950">Offres reçues</h2>
          <p className="mb-3 text-sm font-semibold text-slate-500">Propositions formelles.</p>
          {offerCount > 0 ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
              <div>
                <p className="text-2xl font-black text-emerald-700">{offerCount}</p>
                <p className="text-sm font-bold text-emerald-800">offre{offerCount > 1 ? "s" : ""} en cours</p>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center">
              <p className="text-3xl font-black text-slate-200">0</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {interviewCount > 0
                  ? `${interviewCount} entretien${interviewCount > 1 ? "s" : ""} en cours. Continue.`
                  : "Pas encore d'offre. Le pipeline progresse."}
              </p>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  )
}
