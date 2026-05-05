import type { Application, ApplicationEvent, NetworkContact, JobOffer } from "@/types"
import { getPipelineSuggestion } from "./pipeline-rules"

export interface ComputedAction {
  id: string
  title: string
  description: string
  priority: "critical" | "high" | "medium" | "low"
  estimatedMinutes: number
  energyLevel: "low" | "medium" | "high"
  expectedImpact: "very_high" | "high" | "medium" | "low"
  href: string
  urgencyLabel?: string
}

type JobInfo = { company: string; title: string }

function getJob(
  jobOfferId: string,
  opportunities: JobOffer[],
  pipelineJobs: Record<string, JobInfo>
): JobInfo {
  const opp = opportunities.find((o) => o.id === jobOfferId)
  if (opp) return { company: opp.company, title: opp.title }
  return pipelineJobs[jobOfferId] ?? { company: "Entreprise", title: "Poste" }
}

export function computeDailyActions(
  applications: Application[],
  events: ApplicationEvent[],
  contacts: NetworkContact[],
  opportunities: JobOffer[],
  pipelineJobs: Record<string, JobInfo>,
  now: Date
): ComputedAction[] {
  const actions: ComputedAction[] = []

  // 1. Interviews in progress — highest priority
  const interviewStatuses = ["recruiter_interview", "hiring_manager_interview", "case_study"] as const
  const interviewApps = applications.filter((a) =>
    (interviewStatuses as readonly string[]).includes(a.status)
  )
  for (const app of interviewApps) {
    const job = getJob(app.jobOfferId, opportunities, pipelineJobs)
    const stageLabel =
      app.status === "hiring_manager_interview"
        ? "entretien manager"
        : app.status === "case_study"
        ? "business case"
        : "entretien RH"
    actions.push({
      id: `interview-prep-${app.id}`,
      title: `Préparer le ${stageLabel} — ${job.company}`,
      description: `Tu as un ${stageLabel} en cours chez ${job.company} pour le poste ${job.title}. Prépare tes réponses STAR, l'objection repositionnement Product → Ops, et 3 questions à poser.`,
      priority: "critical",
      estimatedMinutes: 45,
      energyLevel: "high",
      expectedImpact: "very_high",
      href: "/candidatures",
      urgencyLabel: "Entretien en cours",
    })
  }

  // 2. Critical ghosting (30+ days)
  const criticalGhosting = applications.filter((a) => {
    if (["rejected", "ghosted", "archived"].includes(a.status)) return false
    return getPipelineSuggestion(a, events, now).level === "critical"
  })
  for (const app of criticalGhosting) {
    const job = getJob(app.jobOfferId, opportunities, pipelineJobs)
    const suggestion = getPipelineSuggestion(app, events, now)
    actions.push({
      id: `ghosting-${app.id}`,
      title: `Décider pour ${job.company} — ${suggestion.daysSinceAnchor}j sans réponse`,
      description: `Aucune réponse depuis ${suggestion.daysSinceAnchor} jours. Classer comme ghosté ou tenter une dernière relance. Laisser traîner coûte de l'énergie mentale.`,
      priority: "high",
      estimatedMinutes: 5,
      energyLevel: "low",
      expectedImpact: "medium",
      href: "/candidatures",
      urgencyLabel: `J+${suggestion.daysSinceAnchor}`,
    })
  }

  // 3. Warning follow-ups (21+ days)
  const warningFollowUps = applications.filter((a) => {
    if (["rejected", "ghosted", "archived", "probably_ghosted"].includes(a.status)) return false
    return getPipelineSuggestion(a, events, now).level === "warning"
  })
  for (const app of warningFollowUps) {
    const job = getJob(app.jobOfferId, opportunities, pipelineJobs)
    const suggestion = getPipelineSuggestion(app, events, now)
    actions.push({
      id: `follow-up-warning-${app.id}`,
      title: `Relancer ${job.company} — ${suggestion.daysSinceAnchor}j sans réponse`,
      description: `Plus de 21 jours sans réponse chez ${job.company}. Une relance courte et professionnelle est appropriée. 2 phrases, objet clair, ton neutre.`,
      priority: "high",
      estimatedMinutes: 10,
      energyLevel: "low",
      expectedImpact: "high",
      href: "/candidatures",
      urgencyLabel: `Relance recommandée`,
    })
  }

  // 4. Network messages ready to send
  const preparedContacts = contacts.filter((c) => c.status === "message_prepared")
  for (const contact of preparedContacts.slice(0, 2)) {
    actions.push({
      id: `network-send-${contact.id}`,
      title: `Envoyer le message à ${contact.name} — ${contact.company}`,
      description: `Message préparé et prêt. Copie-colle sur LinkedIn et confirme manuellement l'envoi dans Réseau. Le contact ne change de statut qu'après ta confirmation.`,
      priority: "high",
      estimatedMinutes: 5,
      energyLevel: "low",
      expectedImpact: "high",
      href: "/reseau",
    })
  }

  // 5. High-score opportunities not yet applied
  const applyNowOpps = opportunities
    .filter((o) => o.score.verdict === "apply_now" && o.status === "new")
    .sort((a, b) => b.score.globalFit - a.score.globalFit)
  for (const opp of applyNowOpps.slice(0, 2)) {
    actions.push({
      id: `apply-${opp.id}`,
      title: `Postuler à ${opp.company} — ${opp.title}`,
      description: `Score ${opp.score.globalFit}/100. ${opp.score.recommendedAngle} Vérifie le CV ciblé avant d'envoyer.`,
      priority: "high",
      estimatedMinutes: 30,
      energyLevel: "high",
      expectedImpact: "very_high",
      href: "/opportunites",
    })
  }

  // 6. Info follow-ups (7+ days) — lower priority
  const infoFollowUps = applications.filter((a) => {
    if (["rejected", "ghosted", "archived", "probably_ghosted"].includes(a.status)) return false
    const s = getPipelineSuggestion(a, events, now)
    return s.level === "info" && s.suggestedStatus !== null
  })
  for (const app of infoFollowUps.slice(0, 1)) {
    const job = getJob(app.jobOfferId, opportunities, pipelineJobs)
    const suggestion = getPipelineSuggestion(app, events, now)
    actions.push({
      id: `follow-up-info-${app.id}`,
      title: `Relance possible — ${job.company}`,
      description: `${suggestion.daysSinceAnchor} jours depuis ta dernière action. Pas urgent, mais une relance courte reste envisageable si le poste est prioritaire.`,
      priority: "medium",
      estimatedMinutes: 10,
      energyLevel: "low",
      expectedImpact: "medium",
      href: "/candidatures",
    })
  }

  return actions
}

export function computeDailyInsight(
  applications: Application[],
  events: ApplicationEvent[],
  contacts: NetworkContact[],
  now: Date
): string {
  const interviewCount = applications.filter((a) =>
    ["recruiter_interview", "hiring_manager_interview", "case_study"].includes(a.status)
  ).length

  if (interviewCount > 0) {
    return `Tu as ${interviewCount} entretien${interviewCount > 1 ? "s" : ""} en cours. La préparation est l'action la plus rentable maintenant — pas une nouvelle candidature.`
  }

  const criticalCount = applications.filter(
    (a) =>
      !["rejected", "ghosted", "archived"].includes(a.status) &&
      getPipelineSuggestion(a, events, now).level === "critical"
  ).length
  if (criticalCount > 0) {
    return `${criticalCount} dossier${criticalCount > 1 ? "s" : ""} sans réponse depuis 30+ jours. Décider de classer ou relancer libère de l'espace mental pour les dossiers actifs.`
  }

  const preparedContacts = contacts.filter((c) => c.status === "message_prepared").length
  if (preparedContacts > 0) {
    return `${preparedContacts} message${preparedContacts > 1 ? "s" : ""} réseau prêt${preparedContacts > 1 ? "s" : ""} à envoyer. Un contact interne multiplie tes chances par 3 sur ce type de poste.`
  }

  const warningCount = applications.filter(
    (a) =>
      !["rejected", "ghosted", "archived", "probably_ghosted"].includes(a.status) &&
      getPipelineSuggestion(a, events, now).level === "warning"
  ).length
  if (warningCount > 0) {
    return `${warningCount} relance${warningCount > 1 ? "s" : ""} recommandée${warningCount > 1 ? "s" : ""}. Une relance bien formulée à J+21 est perçue comme du professionnalisme, pas de l'insistance.`
  }

  return "Repositionnement en cours : chaque message, chaque CV, chaque note doit ouvrir sur Strategy & Operations — pas Product. La cohérence du signal est ce qui crée la confiance chez les recruteurs."
}

export function computeShortAction(actions: ComputedAction[]): string {
  const short = actions.find((a) => a.estimatedMinutes <= 15)
  if (!short) return "Consulte le pipeline et identifie la relance la plus urgente."
  return `${short.title} — ${short.estimatedMinutes} min. ${short.description.split(".")[0]}.`
}
