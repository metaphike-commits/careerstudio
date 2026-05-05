import type { Application, ApplicationEvent, MemoryItem } from "@/types"
import { buildMemoryIntelligence } from "@/lib/memory-intelligence"
import { uniqueStrings } from "@/lib/utils"

export type LearningTone = "emerald" | "amber" | "violet" | "blue" | "rose"
export type LearningSource = "pipeline" | "memory" | "network" | "interview"

export interface LearningInsight {
  id: string
  title: string
  description: string
  tone: LearningTone
  source: LearningSource
}

export interface LearningDashboardInput {
  applications: Application[]
  applicationEvents: ApplicationEvent[]
  memoryItems: MemoryItem[]
}

export interface LearningDashboard {
  responseRate: number
  interviewRate: number
  memoryCoverage: number
  manualActionCount: number
  conversion: {
    applied: number
    responses: number
    interviews: number
    offers: number
    rejected: number
  }
  strongestSignals: LearningInsight[]
  improvementAreas: LearningInsight[]
  recommendedActions: string[]
}

const appliedStatuses = new Set([
  "applied",
  "contacted",
  "follow_up_needed",
  "waiting",
  "response_received",
  "recruiter_interview",
  "hiring_manager_interview",
  "case_study",
  "offer",
  "rejected",
  "probably_ghosted",
  "ghosted",
  "archived",
])

const responseStatuses = new Set([
  "response_received",
  "recruiter_interview",
  "hiring_manager_interview",
  "case_study",
  "offer",
  "rejected",
])

const interviewStatuses = new Set(["recruiter_interview", "hiring_manager_interview", "case_study", "offer"])

function rate(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100)
}


export function buildLearningDashboard(input: LearningDashboardInput): LearningDashboard {
  const applied = input.applications.filter(
    (application) => application.appliedAt || appliedStatuses.has(application.status)
  ).length
  const responses = input.applications.filter((application) => responseStatuses.has(application.status)).length
  const interviews = input.applications.filter((application) => interviewStatuses.has(application.status)).length
  const offers = input.applications.filter((application) => application.status === "offer").length
  const rejected = input.applications.filter((application) => application.status === "rejected").length
  const manualActionCount = input.applicationEvents.filter((event) => event.source === "manual").length
  const memoryIntelligence = buildMemoryIntelligence(input.memoryItems)

  const strongestSignals: LearningInsight[] = []
  if (rate(responses, applied) >= 30) {
    strongestSignals.push({
      id: "learning-response-rate",
      title: "Les candidatures suivies generent des reponses",
      description:
        "Le taux de reponse est solide quand les dossiers passent par une action confirmee et une trace dans le pipeline.",
      tone: "emerald",
      source: "pipeline",
    })
  }

  if (rate(interviews, applied) > 0) {
    strongestSignals.push({
      id: "learning-interview-rate",
      title: "Les dossiers qui avancent doivent nourrir la preparation",
      description:
        "Chaque entretien obtenu est une source d'exemples, d'objections et de questions a reutiliser dans les prochains dossiers.",
      tone: "violet",
      source: "interview",
    })
  }

  for (const pattern of memoryIntelligence.positivePatterns.slice(0, 2)) {
    strongestSignals.push({
      id: `learning-positive-${strongestSignals.length}`,
      title: "Angle positif detecte",
      description: pattern,
      tone: "emerald",
      source: "memory",
    })
  }

  if (strongestSignals.length === 0) {
    strongestSignals.push({
      id: "learning-start",
      title: "Base d'apprentissage en construction",
      description:
        "Continue a confirmer les actions et a relier les notes. Les patterns fiables apparaitront avec plus d'historique.",
      tone: "blue",
      source: "pipeline",
    })
  }

  const improvementAreas: LearningInsight[] = []
  if (memoryIntelligence.recurringObjections.length > 0) {
    improvementAreas.push({
      id: "learning-objections",
      title: "Objection a traiter en amont",
      description: memoryIntelligence.recurringObjections[0],
      tone: "amber",
      source: "memory",
    })
  }

  if (memoryIntelligence.linkedCoverage.total > 0 && memoryIntelligence.linkedCoverage.ratio < 75) {
    improvementAreas.push({
      id: "learning-memory-linkage",
      title: "Memoire encore trop peu reliee",
      description:
        "Relie davantage les notes aux candidatures ou contacts pour rendre les prochains apprentissages plus precis.",
      tone: "blue",
      source: "memory",
    })
  }

  if (applied > 0 && rate(responses, applied) < 30) {
    improvementAreas.push({
      id: "learning-low-response",
      title: "Taux de reponse a renforcer",
      description:
        "Priorise les dossiers avec contact humain, CV cible et message court avant d'augmenter le volume.",
      tone: "rose",
      source: "pipeline",
    })
  }

  const recommendedActions = uniqueStrings(
    [
      memoryIntelligence.followUpOpportunities[0],
      memoryIntelligence.recurringObjections.length > 0
        ? "Transformer l'objection principale en reponse prete pour CV, message et entretien."
        : "",
      memoryIntelligence.positivePatterns.length > 0
        ? "Reutiliser le meilleur angle positif dans le prochain pack candidature."
        : "",
      memoryIntelligence.linkedCoverage.ratio < 75
        ? "Relier les notes orphelines a une candidature ou un contact cette semaine."
        : "",
      manualActionCount === 0
        ? "Confirmer au moins une action manuelle pour rendre le dashboard apprenant."
        : "",
    ],
    4
  )

  if (recommendedActions.length === 0) {
    recommendedActions.push("Ajouter une note apres le prochain entretien ou refus pour enrichir la memoire.")
  }

  return {
    responseRate: rate(responses, applied),
    interviewRate: rate(interviews, applied),
    memoryCoverage: memoryIntelligence.linkedCoverage.ratio,
    manualActionCount,
    conversion: {
      applied,
      responses,
      interviews,
      offers,
      rejected,
    },
    strongestSignals: strongestSignals.slice(0, 4),
    improvementAreas: improvementAreas.slice(0, 4),
    recommendedActions,
  }
}
