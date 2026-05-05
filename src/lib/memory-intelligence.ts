import type { MemoryInsight, MemoryItem } from "@/types"
import { hasAnySubstring, uniqueStrings } from "@/lib/utils"

export interface MemoryIntelligence {
  insights: MemoryInsight[]
  recurringObjections: string[]
  positivePatterns: string[]
  followUpOpportunities: string[]
  linkedCoverage: {
    total: number
    linked: number
    ratio: number
  }
}

const objectionSignals = [
  "objection",
  "manque",
  "doute",
  "risque",
  "refus",
  "pas assez",
  "grand groupe",
  "enterprise",
  "scale",
]

const positiveSignals = [
  "bon signal",
  "positif",
  "apprecie",
  "prochain tour",
  "reponse",
  "transmis",
  "interess",
]

const followUpSignals = ["relance", "suivi", "merci", "envoyer", "email", "message", "follow"]

function sourceIds(items: MemoryItem[]): string[] {
  return items.map((item) => item.id)
}

export function buildMemoryIntelligence(items: MemoryItem[]): MemoryIntelligence {
  const linked = items.filter((item) => item.linkedApplicationId || item.linkedContactId)
  const objectionItems = items.filter(
    (item) =>
      item.type === "rejection" ||
      item.sentiment === "negative" ||
      hasAnySubstring(`${item.title} ${item.content} ${item.tags.join(" ")}`, objectionSignals)
  )
  const positiveItems = items.filter(
    (item) =>
      item.sentiment === "positive" ||
      hasAnySubstring(`${item.title} ${item.content} ${item.tags.join(" ")}`, positiveSignals)
  )
  const followUpItems = items.filter((item) =>
    hasAnySubstring(`${item.title} ${item.content} ${item.tags.join(" ")}`, followUpSignals)
  )
  const positioningItems = items.filter((item) =>
    hasAnySubstring(`${item.title} ${item.content} ${item.tags.join(" ")}`, [
      "positioning",
      "positionnement",
      "product",
      "operations",
      "strategy",
      "strategie",
    ])
  )

  const recurringObjections = uniqueStrings(
    objectionItems.map((item) => {
      if (hasAnySubstring(item.content, ["grand groupe", "enterprise", "scale"])) {
        return "Prouver la capacite a operer dans des environnements plus grands ou plus complexes."
      }
      if (hasAnySubstring(item.content, ["product", "positionnement"])) {
        return "Clarifier le repositionnement pour eviter que le signal Product brouille le message."
      }
      return "Renforcer la preuve concrete derriere l'objection mentionnee."
    }),
    4
  )

  const positivePatterns = uniqueStrings(
    positiveItems.map((item) => {
      if (hasAnySubstring(item.content, ["operations transverses", "stakeholder", "sans autorite"])) {
        return "Les preuves d'influence transverse et de coordination sans autorite semblent bien fonctionner."
      }
      if (hasAnySubstring(item.content, ["finScale", "arr", "croissance"])) {
        return "Les exemples FinScale et croissance restent des preuves fortes a reutiliser."
      }
      return "Les notes positives meritent d'etre reutilisees dans les prochains packs et entretiens."
    }),
    4
  )

  const followUpOpportunities = uniqueStrings(
    followUpItems.map((item) => {
      if (item.linkedApplicationId) return `Relire et suivre le dossier lie a ${item.company}.`
      if (item.linkedContactId) return `Verifier si un suivi reseau est utile pour ${item.company}.`
      return `Transformer la note "${item.title}" en prochaine action si elle reste pertinente.`
    }),
    4
  )

  const insights: MemoryInsight[] = []

  if (positioningItems.length > 0) {
    insights.push({
      id: "memory-intelligence-positioning",
      title: "Positionnement a verrouiller",
      description:
        "Plusieurs notes parlent du repositionnement. Ouvre les messages et entretiens sur Strategy & Operations, puis utilise Product uniquement comme contexte.",
      level: "warning",
      linkedMemoryItemIds: sourceIds(positioningItems),
    })
  }

  if (objectionItems.length > 0) {
    insights.push({
      id: "memory-intelligence-objections",
      title: "Objections recurrentes",
      description:
        recurringObjections[0] ??
        "Des objections reviennent dans les notes. Elles doivent etre traitees dans les prochains CV, messages et entretiens.",
      level: "warning",
      linkedMemoryItemIds: sourceIds(objectionItems),
    })
  }

  if (positiveItems.length > 0) {
    insights.push({
      id: "memory-intelligence-patterns",
      title: "Angles qui fonctionnent",
      description:
        positivePatterns[0] ??
        "Certaines notes indiquent des signaux positifs. Reutilise ces angles dans les prochains dossiers.",
      level: "opportunity",
      linkedMemoryItemIds: sourceIds(positiveItems),
    })
  }

  if (linked.length < items.length) {
    insights.push({
      id: "memory-intelligence-linkage",
      title: "Memoire a relier davantage",
      description:
        "Certaines notes ne sont pas encore liees a une candidature ou un contact. Les relier rendra les prochains apprentissages plus utiles.",
      level: "info",
      linkedMemoryItemIds: sourceIds(items.filter((item) => !item.linkedApplicationId && !item.linkedContactId)),
    })
  }

  return {
    insights,
    recurringObjections,
    positivePatterns,
    followUpOpportunities,
    linkedCoverage: {
      total: items.length,
      linked: linked.length,
      ratio: items.length === 0 ? 0 : Math.round((linked.length / items.length) * 100),
    },
  }
}
