import type { ApplicationStatus } from "@/types"

export const interviewStatuses: ApplicationStatus[] = [
  "recruiter_interview",
  "hiring_manager_interview",
  "case_study",
  "offer",
]

export interface InterviewHandoffInput {
  status: ApplicationStatus
  interviewDateIso?: string | null
  hasTargetedCV: boolean
  hasApplicationPack: boolean
  hasLinkedContact: boolean
  hasInterviewNote: boolean
}

export interface InterviewPrepStep {
  id: "targeted_cv" | "application_pack" | "linked_contact" | "interview_note"
  label: string
  description: string
  ready: boolean
}

export interface InterviewHandoff {
  title: string
  description: string
  dueLabel: string
  readinessScore: number
  nextFocus: string
  steps: InterviewPrepStep[]
}

export function isInterviewStatus(status: ApplicationStatus): boolean {
  return interviewStatuses.includes(status)
}

function formatDueLabel(interviewDateIso?: string | null): string {
  if (!interviewDateIso) return "Date a renseigner"

  const date = new Date(interviewDateIso)
  if (Number.isNaN(date.getTime())) return "Date a verifier"

  return `Entretien le ${date.toLocaleDateString("fr-FR")}`
}

export function buildInterviewHandoff(input: InterviewHandoffInput): InterviewHandoff | null {
  if (!isInterviewStatus(input.status)) return null

  const steps: InterviewPrepStep[] = [
    {
      id: "targeted_cv",
      label: "CV cible relu",
      description: "Verifier que les preuves fortes du CV correspondent au poste.",
      ready: input.hasTargetedCV,
    },
    {
      id: "application_pack",
      label: "Pack candidature pret",
      description: "Relire pitch, objections, questions probables et plan de preparation.",
      ready: input.hasApplicationPack,
    },
    {
      id: "linked_contact",
      label: "Contexte humain",
      description: "Relier un contact, un recruteur ou une personne source si disponible.",
      ready: input.hasLinkedContact,
    },
    {
      id: "interview_note",
      label: "Note d'entretien",
      description: "Capturer les informations avant/apres entretien dans la memoire.",
      ready: input.hasInterviewNote,
    },
  ]

  const readyCount = steps.filter((step) => step.ready).length
  const nextStep = steps.find((step) => !step.ready)

  return {
    title: "Preparation entretien",
    description:
      "Le dossier est passe en mode entretien. Les elements ci-dessous preparent l'echange, sans marquer l'entretien comme termine.",
    dueLabel: formatDueLabel(input.interviewDateIso),
    readinessScore: Math.round((readyCount / steps.length) * 100),
    nextFocus: nextStep ? nextStep.label : "Relire et respirer avant l'entretien",
    steps,
  }
}
