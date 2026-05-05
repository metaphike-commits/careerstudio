"use client"

import { useState, type ElementType } from "react"
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Ghost,
  History,
  PackageCheck,
  ShieldCheck,
  UserRoundCheck,
  Users,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useAppStore } from "@/stores/app-store"
import { mockPipelineJobs } from "@/data/mock-applications"
import { buildInterviewHandoff } from "@/lib/interview-handoff"
import { getPipelineSuggestion, daysBetween } from "@/lib/pipeline-rules"
import { cn } from "@/lib/utils"
import type { Application, ApplicationStatus } from "@/types"
import { MetricTile, PageHeader, PageShell, PremiumCard } from "@/components/shared/PageShell"

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: ElementType }> = {
  new: { label: "Nouveau", color: "bg-slate-100 text-slate-600", icon: Clock },
  shortlisted: { label: "Shortlist", color: "bg-violet-100 text-violet-700", icon: Clock },
  pack_generated: { label: "Pack prepare", color: "bg-violet-100 text-violet-700", icon: Clock },
  ready_to_apply: { label: "Pret a postuler", color: "bg-violet-100 text-violet-700", icon: Clock },
  applied: { label: "Postule", color: "bg-blue-100 text-blue-700", icon: Clock },
  contacted: { label: "Contacte", color: "bg-blue-100 text-blue-700", icon: Clock },
  follow_up_needed: { label: "Relance a faire", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  waiting: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  response_received: { label: "Reponse recue", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  recruiter_interview: { label: "Entretien RH", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  hiring_manager_interview: { label: "Entretien manager", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  case_study: { label: "Business case", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  offer: { label: "Offre recue", color: "bg-emerald-500 text-white", icon: CheckCircle2 },
  rejected: { label: "Refus", color: "bg-rose-100 text-rose-700", icon: XCircle },
  probably_ghosted: { label: "Probablement ghoste", color: "bg-slate-100 text-slate-500", icon: Ghost },
  ghosted: { label: "Ghoste", color: "bg-slate-100 text-slate-400", icon: Ghost },
  archived: { label: "Archive", color: "bg-slate-50 text-slate-400", icon: Clock },
}

const actionButtons: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: "applied", label: "J'ai postule", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" },
  { status: "contacted", label: "J'ai contacte", color: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200" },
  { status: "follow_up_needed", label: "J'ai relance", color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" },
  { status: "response_received", label: "Reponse recue", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
  { status: "recruiter_interview", label: "Entretien obtenu", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
  { status: "rejected", label: "Refus recu", color: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200" },
  { status: "ghosted", label: "Classer ghoste", color: "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200" },
  { status: "archived", label: "Archiver", color: "bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-200" },
]

const suggestionColor = {
  none: "border-border bg-card text-muted-foreground",
  info: "border-violet-200 bg-violet-50 text-violet-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-rose-200 bg-rose-50 text-rose-800",
}

const stageLabels = ["Prepare", "Envoye", "Reponse", "Entretien", "Issue"]

function getStageIndex(status: ApplicationStatus): number {
  if (["rejected", "ghosted", "archived", "offer"].includes(status)) return 4
  if (["recruiter_interview", "hiring_manager_interview", "case_study"].includes(status)) return 3
  if (status === "response_received") return 2
  if (["applied", "contacted", "follow_up_needed", "waiting", "probably_ghosted"].includes(status)) return 1
  return 0
}

function getNextAction(app: Application, suggestion: ReturnType<typeof getPipelineSuggestion>, hasContact: boolean) {
  if (suggestion.suggestedStatus) {
    return {
      title: suggestion.label,
      description: suggestion.description,
      tone: suggestion.level,
    }
  }

  if (["recruiter_interview", "hiring_manager_interview", "case_study"].includes(app.status)) {
    return {
      title: "Preparer l'entretien",
      description: "Regrouper les preuves STAR, objections probables et questions a poser avant l'echange.",
      tone: "info" as const,
    }
  }

  if (["applied", "waiting"].includes(app.status) && !hasContact) {
    return {
      title: "Ajouter un contact humain",
      description: "Le dossier est envoye, mais aucun contact lie n'est encore visible. C'est le meilleur levier de reponse.",
      tone: "info" as const,
    }
  }

  if (app.nextAction) {
    return {
      title: app.nextAction,
      description: app.nextActionDate
        ? `A traiter avant le ${new Date(app.nextActionDate).toLocaleDateString("fr-FR")}.`
        : "Prochaine action declaree dans le pipeline.",
      tone: "none" as const,
    }
  }

  return {
    title: "Suivi normal",
    description: "Aucune action urgente. Attendre un signal ou documenter une nouvelle information.",
    tone: "none" as const,
  }
}

export default function CandidaturesPage() {
  const {
    applications,
    applicationEvents,
    opportunities,
    recordUserAction,
    cvVersions,
    applicationPacks,
    networkContacts,
    memoryItems,
  } = useAppStore()
  const [now] = useState(() => new Date())
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null)

  const activeCount = applications.filter((app) =>
    !["rejected", "ghosted", "archived"].includes(app.status)
  ).length
  const suggestionCount = applications.filter((app) => {
    const suggestion = getPipelineSuggestion(app, applicationEvents, now)
    return suggestion.suggestedStatus !== null
  }).length
  const interviewCount = applications.filter((app) =>
    ["recruiter_interview", "hiring_manager_interview", "case_study", "offer"].includes(app.status)
  ).length
  const manualEventCount = applicationEvents.filter((event) => event.source === "manual").length

  return (
    <PageShell size="xl">
      <PageHeader
        title="Candidatures"
        subtitle={`${activeCount} dossiers actifs. Chaque changement de statut reste confirme manuellement.`}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Dossiers actifs" value={activeCount} subtitle="hors refus, archives et ghostes" tone="violet" icon={BriefcaseBusiness} />
        <MetricTile label="Relances" value={suggestionCount} subtitle="suggestions a verifier" tone={suggestionCount > 0 ? "amber" : "emerald"} icon={BellRing} />
        <MetricTile label="Entretiens" value={interviewCount} subtitle="pipeline avance" tone="emerald" icon={Users} />
        <MetricTile label="Actions reelles" value={manualEventCount} subtitle="confirmees par toi" tone="blue" icon={CheckCircle2} />
      </div>

      <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-4 shadow-[0_12px_34px_rgba(124,58,237,0.08)]">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-violet-700 uppercase tracking-[0.12em]">
              Regle de confiance
            </p>
            <p className="text-sm font-bold text-violet-950 mt-1 leading-relaxed">
              Les CV, packs et messages prepares ne changent jamais le pipeline. Seuls les boutons de confirmation manuelle creent une action faite.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {applications.map((app) => {
          const opportunity = opportunities.find((item) => item.id === app.jobOfferId)
          const job = mockPipelineJobs[app.jobOfferId] ?? opportunity
          const status = statusConfig[app.status]
          const StatusIcon = status.icon
          const days = daysBetween(app.appliedAt, now)
          const suggestion = getPipelineSuggestion(app, applicationEvents, now)
          const allEvents = applicationEvents
            .filter((event) => event.applicationId === app.id)
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          const isExpanded = expandedApplicationId === app.id
          const events = isExpanded ? allEvents : allEvents.slice(0, 4)
          const hasTargetedCV = Boolean(app.cvVersionId || cvVersions.some((cv) => cv.jobOfferId === app.jobOfferId))
          const hasPack = Boolean(applicationPacks[app.jobOfferId])
          const linkedContact = networkContacts.find((contact) =>
            contact.linkedApplicationId === app.id || contact.linkedJobOfferId === app.jobOfferId || contact.id === app.contactId
          )
          const hasInterviewNote = memoryItems.some(
            (item) => item.linkedApplicationId === app.id && item.type === "interview_note"
          )
          const interviewHandoff = buildInterviewHandoff({
            status: app.status,
            interviewDateIso: app.nextActionDate,
            hasTargetedCV,
            hasApplicationPack: hasPack,
            hasLinkedContact: Boolean(linkedContact),
            hasInterviewNote,
          })
          const nextAction = getNextAction(app, suggestion, Boolean(linkedContact))
          const currentStage = getStageIndex(app.status)

          const preparedAssets = [
            {
              label: "CV cible",
              ready: hasTargetedCV,
              detail: hasTargetedCV ? "Prepare, non envoye" : "A preparer",
              icon: FileText,
            },
            {
              label: "Pack",
              ready: hasPack,
              detail: hasPack ? "Message et pitch prets" : "A generer",
              icon: PackageCheck,
            },
            {
              label: "Contact",
              ready: Boolean(linkedContact),
              detail: linkedContact ? `${linkedContact.name} - ${linkedContact.status}` : "A identifier",
              icon: UserRoundCheck,
            },
          ]

          return (
            <PremiumCard
              as="article"
              key={app.id}
              className={cn(
                "p-0 overflow-hidden",
                suggestion.level === "critical" && "border-rose-200",
                suggestion.level === "warning" && "border-amber-200"
              )}
            >
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="p-5 lg:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black leading-tight tracking-[-0.025em] text-slate-950">
                          {job?.title ?? "Offre inconnue"}
                        </h3>
                        <span className="text-sm font-bold text-slate-300">-</span>
                        <span className="text-base font-black text-slate-600">{job?.company}</span>
                      </div>

                      {app.feedback && (
                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500 italic">
                          &quot;{app.feedback}&quot;
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full", status.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                        {days !== null && (
                          <span className="text-xs font-bold text-slate-500">
                            Postule il y a {days} jour{days > 1 ? "s" : ""}
                          </span>
                        )}
                        {suggestion.daysSinceAnchor !== null && (
                          <span className="text-xs font-bold text-slate-500">
                            Derniere action il y a {suggestion.daysSinceAnchor} jour{suggestion.daysSinceAnchor > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {stageLabels.map((stage, index) => {
                        const isDone = index < currentStage
                        const isCurrent = index === currentStage
                        return (
                          <div key={stage} className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex h-8 items-center rounded-full px-3 text-xs font-black transition-colors",
                                isDone && "bg-emerald-100 text-emerald-700",
                                isCurrent && "bg-violet-600 text-white shadow-[0_10px_20px_rgba(124,58,237,0.18)]",
                                !isDone && !isCurrent && "bg-white text-slate-400 border border-slate-200"
                              )}
                            >
                              {stage}
                            </span>
                            {index < stageLabels.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {preparedAssets.map((asset) => {
                      const Icon = asset.icon
                      return (
                        <div
                          key={asset.label}
                          className={cn(
                            "rounded-2xl border p-3",
                            asset.ready ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                asset.ready ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className={cn("text-sm font-black", asset.ready ? "text-emerald-900" : "text-slate-700")}>
                                {asset.label}
                              </p>
                              <p className={cn("mt-0.5 text-xs font-bold leading-snug", asset.ready ? "text-emerald-700" : "text-slate-500")}>
                                {asset.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {interviewHandoff && (
                    <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 shadow-[0_12px_28px_rgba(16,185,129,0.08)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {interviewHandoff.dueLabel}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                              {interviewHandoff.readinessScore}% pret
                            </span>
                          </div>
                          <h4 className="mt-3 text-lg font-black leading-tight tracking-[-0.02em] text-emerald-950">
                            {interviewHandoff.title}
                          </h4>
                          <p className="mt-1 max-w-3xl text-sm font-semibold leading-relaxed text-emerald-800">
                            {interviewHandoff.description}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-3 text-sm font-black text-emerald-900 border border-emerald-100">
                          Focus : {interviewHandoff.nextFocus}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {interviewHandoff.steps.map((step) => (
                          <div
                            key={step.id}
                            className={cn(
                              "rounded-2xl border p-3",
                              step.ready ? "border-emerald-200 bg-white" : "border-amber-200 bg-amber-50"
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={cn(
                                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                  step.ready ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                )}
                              >
                                {step.ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              </span>
                              <div>
                                <p className="text-sm font-black text-slate-950">{step.label}</p>
                                <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-600">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href="/memoire"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)] hover:bg-emerald-700 transition-colors"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          Ajouter une note
                        </Link>
                        {opportunity && (
                          <Link
                            href="/opportunites"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            Voir l&apos;offre
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-slate-500" />
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Confirmer une action reelle
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {actionButtons.map((btn) => (
                        <button
                          key={btn.status}
                          onClick={() => recordUserAction(app.id, btn.status)}
                          className={cn(
                            "text-xs px-3 py-2 rounded-xl border font-black transition-colors",
                            btn.color
                          )}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="border-t border-slate-100 bg-slate-50/80 p-5 lg:p-6 xl:border-l xl:border-t-0">
                  <div className={cn("rounded-2xl border p-4", suggestionColor[nextAction.tone])}>
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">
                          Prochaine action
                        </p>
                        <p className="mt-1 text-base font-black leading-snug">
                          {nextAction.title}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed opacity-85">
                          {nextAction.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {events.length > 0 && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-[0.14em]">
                          <History className="w-3.5 h-3.5" />
                          {isExpanded ? "Timeline complete" : "Historique recent"}
                        </div>
                        {allEvents.length > 4 && (
                          <button
                            onClick={() => setExpandedApplicationId(isExpanded ? null : app.id)}
                            className="text-xs font-black text-violet-600 hover:text-violet-700"
                          >
                            {isExpanded ? "Reduire" : `Voir ${allEvents.length}`}
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {events.map((event) => (
                          <div key={event.id} className="relative pl-5">
                            <span
                              className={cn(
                                "absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full",
                                event.source === "manual" && "bg-emerald-500",
                                event.source === "prepared" && "bg-violet-500",
                                event.source === "rule_suggestion" && "bg-amber-500"
                              )}
                            />
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-sm font-black text-slate-900">
                                    {event.label}
                                  </span>
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]",
                                      event.source === "manual" && "bg-emerald-100 text-emerald-700",
                                      event.source === "prepared" && "bg-violet-100 text-violet-700",
                                      event.source === "rule_suggestion" && "bg-amber-100 text-amber-700"
                                    )}
                                  >
                                    {event.source === "manual" ? "fait" : event.source === "prepared" ? "prepare" : "suggere"}
                                  </span>
                                </div>
                                {event.note && (
                                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                                    {event.note}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-xs font-bold text-slate-400">
                                {new Date(event.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {events.length === 0 && (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                      Aucun evenement encore documente pour ce dossier.
                    </div>
                  )}
                </aside>
              </div>
            </PremiumCard>
          )
        })}
      </div>
    </PageShell>
  )
}
