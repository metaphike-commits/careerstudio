"use client"

import { useMemo, useState, type ElementType } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardPenLine,
  HelpCircle,
  Loader2,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { mockPipelineJobs } from "@/data/mock-applications"
import { buildInterviewWorkspace, buildPostInterviewLearning } from "@/lib/interview-coach"
import { isInterviewStatus } from "@/lib/interview-handoff"
import { cn } from "@/lib/utils"
import type { ApplicationStatus } from "@/types"
import type { InterviewPrepResponse } from "@/lib/llm/interview-prep"
import { CompanyLogo } from "@/components/shared/CompanyLogo"
import {
  MetricTile,
  PageHeader,
  PageShell,
  PremiumCard,
  premiumButton,
  secondaryButton,
} from "@/components/shared/PageShell"

const statusLabel: Record<ApplicationStatus, string> = {
  new: "Nouveau",
  shortlisted: "Shortlist",
  pack_generated: "Pack prepare",
  ready_to_apply: "Pret a postuler",
  applied: "Postule",
  contacted: "Contacte",
  follow_up_needed: "Relance",
  waiting: "En attente",
  response_received: "Reponse recue",
  recruiter_interview: "Entretien RH",
  hiring_manager_interview: "Entretien manager",
  case_study: "Business case",
  offer: "Offre",
  rejected: "Refus",
  probably_ghosted: "Probablement ghoste",
  ghosted: "Ghoste",
  archived: "Archive",
}

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-700 bg-emerald-50 border-emerald-200"
  if (score >= 50) return "text-violet-700 bg-violet-50 border-violet-200"
  return "text-amber-700 bg-amber-50 border-amber-200"
}

export default function EntretiensPage() {
  const {
    aiEnabled,
    applications,
    applicationPacks,
    cvVersions,
    memoryItems,
    networkContacts,
    opportunities,
    profile,
    addMemoryItem,
    addApplicationEvent,
  } = useAppStore()
  const [postInterviewNote, setPostInterviewNote] = useState("")
  const [saveConfirmation, setSaveConfirmation] = useState("")
  const [aiPrepStatus, setAiPrepStatus] = useState<"idle" | "loading" | "done" | "error" | "config" | "disabled">("idle")
  const [aiPrep, setAiPrep] = useState<InterviewPrepResponse | null>(null)
  const interviewApplications = useMemo(
    () => applications.filter((application) => isInterviewStatus(application.status)),
    [applications]
  )
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(
    interviewApplications[0]?.id ?? null
  )

  const selectedApplication =
    interviewApplications.find((application) => application.id === selectedApplicationId) ??
    interviewApplications[0] ??
    null

  const selectedLinkedContact = useMemo(() => {
    if (!selectedApplication) return null
    return (
      networkContacts.find((contact) => contact.id === selectedApplication.contactId) ??
      networkContacts.find((contact) => contact.linkedApplicationId === selectedApplication.id) ??
      networkContacts.find((contact) => contact.linkedJobOfferId === selectedApplication.jobOfferId) ??
      null
    )
  }, [networkContacts, selectedApplication])

  const selectedOpportunity = useMemo(
    () => (selectedApplication ? opportunities.find((item) => item.id === selectedApplication.jobOfferId) ?? null : null),
    [opportunities, selectedApplication]
  )
  const selectedPipelineLabel = selectedApplication ? mockPipelineJobs[selectedApplication.jobOfferId] : undefined
  const selectedCVVersion = useMemo(
    () =>
      selectedApplication
        ? cvVersions.find((item) => item.id === selectedApplication.cvVersionId) ??
          cvVersions.find((item) => item.jobOfferId === selectedApplication.jobOfferId) ??
          null
        : null,
    [cvVersions, selectedApplication]
  )
  const selectedApplicationPack = selectedApplication
    ? applicationPacks[selectedApplication.jobOfferId] ?? null
    : null
  const selectedMemoryItems = useMemo(
    () =>
      selectedApplication
        ? memoryItems.filter(
            (item) =>
              item.linkedApplicationId === selectedApplication.id ||
              (selectedLinkedContact?.id && item.linkedContactId === selectedLinkedContact.id)
          )
        : [],
    [memoryItems, selectedApplication, selectedLinkedContact]
  )

  const workspace = useMemo(() => {
    if (!selectedApplication || !profile) return null

    return buildInterviewWorkspace({
      application: selectedApplication,
      profile,
      opportunity: selectedOpportunity,
      applicationPack: selectedApplicationPack,
      cvVersion: selectedCVVersion,
      linkedContact: selectedLinkedContact,
      memoryItems: selectedMemoryItems,
      fallbackTitle: selectedPipelineLabel?.title,
      fallbackCompany: selectedPipelineLabel?.company,
    })
  }, [
    profile,
    selectedApplication,
    selectedApplicationPack,
    selectedCVVersion,
    selectedLinkedContact,
    selectedMemoryItems,
    selectedOpportunity,
    selectedPipelineLabel?.company,
    selectedPipelineLabel?.title,
  ])

  const averageReadiness = useMemo(() => {
    if (!profile || interviewApplications.length === 0) return 0
    const scores = interviewApplications
      .map((application) => {
        const pipelineLabel = mockPipelineJobs[application.jobOfferId]
        const opportunity = opportunities.find((item) => item.id === application.jobOfferId) ?? null
        const workspace = buildInterviewWorkspace({
          application,
          profile,
          opportunity,
          applicationPack: applicationPacks[application.jobOfferId] ?? null,
          cvVersion:
            cvVersions.find((item) => item.id === application.cvVersionId) ??
            cvVersions.find((item) => item.jobOfferId === application.jobOfferId) ??
            null,
          linkedContact:
            networkContacts.find((contact) => contact.id === application.contactId) ??
            networkContacts.find((contact) => contact.linkedApplicationId === application.id) ??
            null,
          memoryItems,
          fallbackTitle: pipelineLabel?.title,
          fallbackCompany: pipelineLabel?.company,
        })
        return workspace?.readinessScore ?? 0
      })
      .filter((score) => score >= 0)

    if (scores.length === 0) return 0
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }, [
    applicationPacks,
    cvVersions,
    interviewApplications,
    memoryItems,
    networkContacts,
    opportunities,
    profile,
  ])

  const interviewNoteCount = memoryItems.filter((item) => item.type === "interview_note").length
  const postLearning = useMemo(
    () => buildPostInterviewLearning(postInterviewNote, workspace?.company),
    [postInterviewNote, workspace?.company]
  )

  const savePostInterviewNote = () => {
    if (!selectedApplication || !workspace || !postInterviewNote.trim()) return

    const title = `Post-entretien - ${workspace.company}`
    addMemoryItem({
      type: "interview_note",
      title,
      company: workspace.company,
      content: postInterviewNote.trim(),
      linkedApplicationId: selectedApplication.id,
      linkedContactId: selectedLinkedContact?.id ?? null,
      tags: postLearning.tags,
      sentiment: postLearning.sentiment,
    })
    addApplicationEvent({
      applicationId: selectedApplication.id,
      type: "note",
      statusAfter: null,
      label: "Note post-entretien ajoutee",
      note: title,
      source: "manual",
    })
    setPostInterviewNote("")
    setSaveConfirmation("Note sauvegardee dans la memoire. Aucun statut n'a ete modifie.")
  }

  const runAIInterviewPrep = async () => {
    if (!profile || !selectedApplication || !workspace) return
    if (!aiEnabled) {
      setAiPrepStatus("disabled")
      setAiPrep(null)
      return
    }

    setAiPrepStatus("loading")
    setAiPrep(null)

    try {
      const response = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile,
          application: selectedApplication,
          opportunity: selectedOpportunity,
          applicationPack: selectedApplicationPack,
          cvVersion: selectedCVVersion,
          linkedContact: selectedLinkedContact,
          memoryItems: selectedMemoryItems,
          workspace,
        }),
      })

      if (response.status === 503) {
        setAiPrepStatus("config")
        return
      }
      if (!response.ok) {
        setAiPrepStatus("error")
        return
      }

      const body = (await response.json()) as { interviewPrep?: InterviewPrepResponse }
      if (!body.interviewPrep) {
        setAiPrepStatus("error")
        return
      }

      setAiPrep(body.interviewPrep)
      setAiPrepStatus("done")
    } catch {
      setAiPrepStatus("error")
    }
  }

  return (
    <PageShell size="full">
      <PageHeader
        eyebrow="Interview Coach"
        title="Entretiens & Coaching"
        subtitle="Un espace local pour transformer un entretien obtenu en plan de preparation clair, sans changer les statuts ni envoyer quoi que ce soit automatiquement."
      >
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-black text-violet-700">
          Preparation locale
        </span>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Entretiens actifs" value={interviewApplications.length} subtitle="Dossiers en phase entretien" tone="emerald" icon={UserRoundCheck} />
        <MetricTile label="Readiness moyen" value={`${averageReadiness}%`} subtitle="CV, pack, contact, note" tone="violet" icon={BookOpenCheck} />
        <MetricTile label="Notes entretien" value={interviewNoteCount} subtitle="Dans la memoire" tone="blue" icon={MessageSquareText} />
        <MetricTile label="Actions auto" value="0" subtitle="Confirmation manuelle seulement" tone="amber" icon={ShieldAlert} />
      </div>

      {interviewApplications.length === 0 || !workspace || !selectedApplication ? (
        <PremiumCard className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
            Aucun entretien confirme pour le moment
          </h2>
          <p className="mt-3 max-w-xl text-base font-semibold leading-relaxed text-slate-500">
            Quand une candidature passera en entretien RH, manager ou business case, cet espace affichera la preparation liee au dossier.
          </p>
          <Link href="/candidatures" className={cn(premiumButton, "mt-6")}>
            Voir le pipeline
            <ArrowRight className="h-4 w-4" />
          </Link>
        </PremiumCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <PremiumCard className="p-0">
            <div className="border-b border-slate-200 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Dossiers entretien
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {interviewApplications.map((application) => {
                const job = mockPipelineJobs[application.jobOfferId]
                const isSelected = application.id === selectedApplication.id
                return (
                  <button
                    key={application.id}
                    onClick={() => setSelectedApplicationId(application.id)}
                    className={cn(
                      "flex w-full items-center gap-3 p-4 text-left transition-colors",
                      isSelected ? "bg-violet-50" : "hover:bg-slate-50"
                    )}
                  >
                    <CompanyLogo company={job?.company ?? "Entreprise"} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-slate-950">
                        {job?.title ?? "Entretien"}
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-500">
                        {job?.company ?? "Entreprise"} - {statusLabel[application.status]}
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-600" />}
                  </button>
                )
              })}
            </div>
          </PremiumCard>

          <div className="space-y-6">
            <PremiumCard>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <CompanyLogo company={workspace.company} size="lg" className="h-16 w-16 rounded-2xl text-xl" />
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                        {statusLabel[selectedApplication.status]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                        {workspace.interviewDateLabel}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950">
                      {workspace.title}
                    </h2>
                    <p className="mt-2 text-lg font-bold text-slate-500">{workspace.company}</p>
                  </div>
                </div>

                <div className={cn("rounded-3xl border px-5 py-4 text-center", scoreTone(workspace.readinessScore))}>
                  <p className="text-xs font-black uppercase tracking-[0.16em]">Readiness</p>
                  <p className="mt-1 text-4xl font-black tracking-[-0.05em]">{workspace.readinessScore}%</p>
                  <p className="mt-1 text-sm font-black">Focus: {workspace.nextFocus}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5">
                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed",
                    aiEnabled
                      ? "border-violet-200 bg-violet-50 text-violet-900"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  )}
                >
                  <span className="mb-1 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    {aiEnabled ? "Recommande: coaching IA" : "IA desactivee"}
                  </span>
                  <p>
                    {aiEnabled
                      ? "Genere une preparation personnalisee: enjeux du role, reponses adaptees, objections, STAR mapping, questions a poser. Rien ne change le pipeline."
                      : "La preparation locale reste disponible ci-dessous. Active l'IA dans la sidebar pour generer une fiche plus personnalisee."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={runAIInterviewPrep}
                  disabled={aiPrepStatus === "loading"}
                  className={cn(premiumButton, "disabled:cursor-not-allowed disabled:opacity-60")}
                >
                  {aiPrepStatus === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {aiPrepStatus === "loading"
                    ? "Preparation IA..."
                    : aiEnabled
                      ? "Generer preparation entretien avec IA"
                      : "IA desactivee"}
                </button>
                <p className="text-sm font-semibold leading-relaxed text-slate-500">
                  Alternative locale disponible dans les sections ci-dessous. Toute note ou action reste manuelle.
                </p>
                </div>
              </div>
              {(aiPrepStatus === "disabled" || aiPrepStatus === "config" || aiPrepStatus === "error") && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-relaxed text-amber-800">
                  {aiPrepStatus === "disabled"
                    ? "IA desactivee. Active l'IA dans la sidebar pour generer une fiche avec le provider configure."
                    : aiPrepStatus === "config"
                      ? "Cle API manquante. Ajoute une cle dans .env.local pour activer la preparation IA."
                      : "Erreur de generation -- verifie ta cle API."}
                </div>
              )}
            </PremiumCard>

            {aiPrep && (
              <PremiumCard className="border-violet-200 bg-violet-50/40">
                <SectionTitle icon={Sparkles} title="Fiche IA entretien" />
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-700">
                      Reponses adaptees
                    </p>
                    <div className="mt-4 space-y-4">
                      {aiPrep.tailoredAnswers.slice(0, 4).map((item) => (
                        <div key={item.prompt} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-black text-slate-950">{item.prompt}</p>
                          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-700">
                      Questions probables IA
                    </p>
                    <div className="mt-4 space-y-3">
                      {aiPrep.likelyQuestions.slice(0, 5).map((item) => (
                        <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-black text-slate-950">{item.question}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-600">Angle: {item.answerAngle}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                            Preuve: {item.proofToUse}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-amber-700">
                      Objections
                    </p>
                    <div className="mt-4 space-y-3">
                      {aiPrep.objections.slice(0, 5).map((item) => (
                        <p key={item.objection} className="rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-relaxed text-amber-900">
                          {item.objection} — {item.responseAngle}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-700">
                      Checklist IA
                    </p>
                    <div className="mt-4 space-y-2">
                      {aiPrep.prepChecklist.slice(0, 6).map((item) => (
                        <p key={item} className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold leading-relaxed text-emerald-900">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </PremiumCard>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <PremiumCard>
                  <SectionTitle icon={Target} title="Brief du role" />
                  <div className="mt-4 space-y-3">
                    {workspace.stakes.map((item, index) => (
                      <BulletLine key={`${item}-${index}`} index={index + 1} text={item} />
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={MessageSquareText} title="Reponses preparees" />
                  <div className="mt-4 grid gap-4">
                    {workspace.answerDrafts.map((draft) => (
                      <article key={draft.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-600">
                              Question piege
                            </p>
                            <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
                              {draft.prompt}
                            </h3>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                            Brouillon local
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-bold leading-relaxed text-slate-700">
                          Angle: {draft.angle}
                        </p>
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          {draft.talkingPoints.map((point) => (
                            <p key={point} className="rounded-2xl bg-white p-3 text-sm font-semibold leading-relaxed text-slate-600 shadow-sm">
                              {point}
                            </p>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={HelpCircle} title="Questions probables" />
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {workspace.likelyQuestions.map((question, index) => (
                      <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">
                          Question {index + 1}
                        </p>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-800">{question}</p>
                      </div>
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={ShieldAlert} title="Objections a preparer" />
                  <div className="mt-4 space-y-3">
                    {workspace.objections.map((objection, index) => (
                      <BulletLine key={`${objection}-${index}`} index={index + 1} text={objection} tone="amber" />
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={Sparkles} title="Exemples STAR a utiliser" />
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {workspace.starExamples.map((example) => (
                      <article key={example.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="text-base font-black text-slate-950">{example.title}</h3>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                          {example.evidence}
                        </p>
                        {example.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {example.skills.slice(0, 4).map((skill) => (
                              <span key={skill} className="rounded-full bg-violet-50 px-2 py-1 text-xs font-black text-violet-700">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </PremiumCard>
              </div>

              <aside className="space-y-6">
                <PremiumCard>
                  <SectionTitle icon={BookOpenCheck} title="Checklist preparation" />
                  <div className="mt-4 space-y-3">
                    {workspace.prepChecklist.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                              item.ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-950">{item.label}</p>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-2">
                    <Link href="/memoire" className={secondaryButton}>
                      Ajouter une note
                    </Link>
                    <Link href="/candidatures" className={secondaryButton}>
                      Retour pipeline
                    </Link>
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={Building2} title="Recherche entreprise" />
                  <div className="mt-4 space-y-3">
                    {workspace.companyResearch.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-black text-slate-950">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                          {item.question}
                        </p>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-violet-600">
                          {item.sourceHint}
                        </p>
                      </div>
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={UserRoundCheck} title="Contexte interviewer" />
                  <div className="mt-4 space-y-3">
                    {workspace.interviewerContext.map((item) => (
                      <p key={item} className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold leading-relaxed text-emerald-900">
                        {item}
                      </p>
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={MessageSquareText} title="Questions a poser" />
                  <div className="mt-4 space-y-3">
                    {workspace.questionsToAsk.map((question) => (
                      <p key={question} className="rounded-2xl bg-blue-50 p-3 text-sm font-bold leading-relaxed text-blue-900">
                        {question}
                      </p>
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle icon={ClipboardPenLine} title="Capture post-entretien" />
                  <div className="mt-4 space-y-2">
                    {workspace.postInterviewPrompts.map((prompt) => (
                      <p key={prompt} className="text-sm font-semibold leading-relaxed text-slate-600">
                        - {prompt}
                      </p>
                    ))}
                  </div>
                  <textarea
                    value={postInterviewNote}
                    onChange={(event) => {
                      setPostInterviewNote(event.target.value)
                      setSaveConfirmation("")
                    }}
                    rows={7}
                    placeholder="Apres l'entretien, colle ici tes notes: questions posees, objections, signaux, prochaine action..."
                    className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                  {postInterviewNote.trim() && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">
                        Apprentissage local
                      </p>
                      {postLearning.signals.map((signal) => (
                        <p key={signal} className="text-sm font-bold leading-relaxed text-violet-950">
                          {signal}
                        </p>
                      ))}
                      {postLearning.objections.map((objection) => (
                        <p key={objection} className="text-sm font-bold leading-relaxed text-amber-800">
                          {objection}
                        </p>
                      ))}
                      <div className="space-y-1">
                        {postLearning.followUpSuggestions.map((suggestion) => (
                          <p key={suggestion} className="text-sm font-semibold leading-relaxed text-slate-700">
                            - {suggestion}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {saveConfirmation && (
                    <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                      {saveConfirmation}
                    </p>
                  )}
                  <div className="mt-5 grid gap-2">
                    <button
                      onClick={savePostInterviewNote}
                      disabled={!postInterviewNote.trim()}
                      className={cn(premiumButton, "w-full")}
                    >
                      Sauvegarder dans la memoire
                    </button>
                    <Link href="/memoire" className={secondaryButton}>
                      Ouvrir la memoire
                    </Link>
                  </div>
                </PremiumCard>
              </aside>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">{title}</h2>
    </div>
  )
}

function BulletLine({
  index,
  text,
  tone = "violet",
}: {
  index: number
  text: string
  tone?: "violet" | "amber"
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black",
          tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
        )}
      >
        {index}
      </span>
      <p className="text-sm font-bold leading-relaxed text-slate-700">{text}</p>
    </div>
  )
}
