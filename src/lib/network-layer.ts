import type { NetworkContact } from "@/types"
import { daysBetween } from "@/lib/pipeline-rules"

export type NetworkSignalLevel =
  | "ready_to_send"
  | "follow_up_due"
  | "waiting"
  | "replied"
  | "identified"
  | "archived"

export interface NetworkSignal {
  level: NetworkSignalLevel
  label: string
  description: string
  actionLabel: string
  priorityScore: number
  isActionable: boolean
  daysSinceContact: number | null
  hasPipelineLink: boolean
}

export interface NetworkDraftSuggestion {
  title: string
  body: string
  intent: "send_first_message" | "follow_up" | "document_reply" | "prepare_context" | "none"
}

export function getNetworkSignal(contact: NetworkContact, now: Date): NetworkSignal {
  const hasPipelineLink = Boolean(contact.linkedApplicationId || contact.linkedJobOfferId)
  const daysSinceContact = daysBetween(contact.lastContactedAt, now)
  const followUpDue =
    contact.nextFollowUpAt !== null && new Date(contact.nextFollowUpAt).getTime() <= now.getTime()

  if (contact.status === "archived") {
    return {
      level: "archived",
      label: "Archive",
      description: "Contact sorti du suivi actif.",
      actionLabel: "Aucune action",
      priorityScore: 0,
      isActionable: false,
      daysSinceContact,
      hasPipelineLink,
    }
  }

  if (contact.status === "replied") {
    return {
      level: "replied",
      label: "Reponse recue",
      description: "Reponse obtenue. Capitaliser dans la candidature ou la memoire.",
      actionLabel: "Documenter le signal",
      priorityScore: 55 + (hasPipelineLink ? 10 : 0),
      isActionable: true,
      daysSinceContact,
      hasPipelineLink,
    }
  }

  if (contact.status === "contacted" && followUpDue) {
    return {
      level: "follow_up_due",
      label: "Relance reseau",
      description: "La date de relance est arrivee. Relancer seulement si le dossier reste prioritaire.",
      actionLabel: "Relancer manuellement",
      priorityScore: 90 + (hasPipelineLink ? 10 : 0),
      isActionable: true,
      daysSinceContact,
      hasPipelineLink,
    }
  }

  if (contact.status === "contacted") {
    return {
      level: "waiting",
      label: "En attente",
      description: "Message envoye. Attendre la fenetre de relance avant d'agir.",
      actionLabel: "Attendre",
      priorityScore: 35 + (hasPipelineLink ? 10 : 0),
      isActionable: false,
      daysSinceContact,
      hasPipelineLink,
    }
  }

  if (contact.status === "message_prepared") {
    return {
      level: "ready_to_send",
      label: "Message pret",
      description: "Le message est prepare, mais il n'est pas encore envoye.",
      actionLabel: "Confirmer l'envoi",
      priorityScore: 80 + (hasPipelineLink ? 10 : 0),
      isActionable: true,
      daysSinceContact,
      hasPipelineLink,
    }
  }

  return {
    level: "identified",
    label: "Contact identifie",
    description: "Contact repere. Preparer un message avant toute confirmation d'envoi.",
    actionLabel: "Preparer le message",
    priorityScore: 60 + (hasPipelineLink ? 10 : 0),
    isActionable: true,
    daysSinceContact,
    hasPipelineLink,
  }
}

export function sortContactsByNetworkPriority(contacts: NetworkContact[], now: Date): NetworkContact[] {
  return contacts
    .slice()
    .sort((a, b) => {
      const signalA = getNetworkSignal(a, now)
      const signalB = getNetworkSignal(b, now)

      if (signalA.priorityScore !== signalB.priorityScore) {
        return signalB.priorityScore - signalA.priorityScore
      }

      return a.name.localeCompare(b.name)
    })
}

export function buildNetworkDraftSuggestion(
  contact: NetworkContact,
  signal: NetworkSignal,
  linkedLabel?: string | null
): NetworkDraftSuggestion {
  const context = linkedLabel ? ` au sujet de ${linkedLabel}` : ""

  if (signal.level === "ready_to_send") {
    return {
      title: "Message pret a envoyer",
      intent: "send_first_message",
      body:
        contact.messageDraft.trim() ||
        `Bonjour ${contact.name}, je me permets de vous contacter${context}. J'aimerais beaucoup echanger quelques minutes sur votre experience et le contexte de l'equipe.`,
    }
  }

  if (signal.level === "follow_up_due") {
    return {
      title: "Relance courte suggeree",
      intent: "follow_up",
      body: `Bonjour ${contact.name}, je me permets de revenir vers vous${context}. Si vous avez quelques minutes cette semaine, je serais ravi d'echanger. Merci encore.`,
    }
  }

  if (signal.level === "replied") {
    return {
      title: "Capitaliser la reponse",
      intent: "document_reply",
      body: `Documenter dans la memoire ce que ${contact.name} a partage : contexte, objections, prochaine action, et eventuel contact a mentionner dans la candidature.`,
    }
  }

  if (signal.level === "identified") {
    return {
      title: "Message a preparer",
      intent: "prepare_context",
      body: `Bonjour ${contact.name}, j'ai repere votre parcours chez ${contact.company}${context}. J'aimerais beaucoup vous poser 2 ou 3 questions sur le role et le contexte de l'equipe.`,
    }
  }

  return {
    title: "Aucune suggestion",
    intent: "none",
    body: "Aucune action reseau prioritaire pour ce contact.",
  }
}
