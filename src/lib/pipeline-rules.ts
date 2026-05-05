import type { Application, ApplicationEvent, ApplicationStatus } from "@/types"

const DAY_MS = 24 * 60 * 60 * 1000

const terminalStatuses: ApplicationStatus[] = [
  "response_received",
  "recruiter_interview",
  "hiring_manager_interview",
  "case_study",
  "offer",
  "rejected",
  "ghosted",
  "archived",
]

const activeFollowUpStatuses: ApplicationStatus[] = [
  "applied",
  "contacted",
  "waiting",
  "follow_up_needed",
]

export interface PipelineSuggestion {
  level: "none" | "info" | "warning" | "critical"
  label: string
  description: string
  suggestedStatus: ApplicationStatus | null
  daysSinceAnchor: number | null
}

export const pipelineRuleExamples = [
  {
    day: "J+7",
    behavior: "Suggest follow-up",
    note: "The app suggests a follow-up, but does not confirm that the user followed up.",
  },
  {
    day: "J+21",
    behavior: "Recommend follow-up",
    note: "The reminder becomes more urgent, but the status remains user-confirmed.",
  },
  {
    day: "J+30",
    behavior: "Probably ghosted suggestion",
    note: "Probably ghosted is a suggestion. Final ghosted classification requires a manual click.",
  },
]

export function daysBetween(fromIso: string | null, now: Date): number | null {
  if (!fromIso) return null
  return Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / DAY_MS))
}

export function getLastManualEvent(
  applicationId: string,
  events: ApplicationEvent[]
): ApplicationEvent | null {
  const matching = events
    .filter((event) => event.applicationId === applicationId && event.source === "manual")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return matching[0] ?? null
}

export function getPipelineSuggestion(
  application: Application,
  events: ApplicationEvent[],
  now: Date
): PipelineSuggestion {
  if (terminalStatuses.includes(application.status)) {
    return {
      level: "none",
      label: "Timer arrete",
      description: "Cette candidature a deja une issue ou un statut final.",
      suggestedStatus: null,
      daysSinceAnchor: null,
    }
  }

  if (!activeFollowUpStatuses.includes(application.status)) {
    return {
      level: "info",
      label: "Aucune relance",
      description: "Cette candidature n'est pas encore dans une phase de suivi.",
      suggestedStatus: null,
      daysSinceAnchor: null,
    }
  }

  const lastManualEvent = getLastManualEvent(application.id, events)
  const anchor = lastManualEvent?.createdAt ?? application.lastUserActionAt ?? application.appliedAt
  const days = daysBetween(anchor, now)

  if (days === null) {
    return {
      level: "info",
      label: "Action non datee",
      description: "Aucune date fiable pour calculer une relance.",
      suggestedStatus: null,
      daysSinceAnchor: null,
    }
  }

  if (days >= 30) {
    return {
      level: "critical",
      label: "Probablement ghoste",
      description: "Aucune reponse depuis 30 jours ou plus. Tu peux classer comme ghoste, mais la confirmation reste manuelle.",
      suggestedStatus: "probably_ghosted",
      daysSinceAnchor: days,
    }
  }

  if (days >= 21) {
    return {
      level: "warning",
      label: "Relance recommandee",
      description: "Plus de 21 jours sans reponse. Une relance courte est prioritaire avant de classer le dossier.",
      suggestedStatus: "follow_up_needed",
      daysSinceAnchor: days,
    }
  }

  if (days >= 7) {
    return {
      level: "info",
      label: "Relance suggeree",
      description: "Sept jours sans nouvelle. Tu peux relancer si la candidature est importante.",
      suggestedStatus: "follow_up_needed",
      daysSinceAnchor: days,
    }
  }

  return {
    level: "none",
    label: "Suivi normal",
    description: "Pas de relance necessaire pour l'instant.",
    suggestedStatus: null,
    daysSinceAnchor: days,
  }
}
