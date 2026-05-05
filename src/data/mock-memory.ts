import type { MemoryInsight, MemoryItem } from "@/types"

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

export const mockMemoryItems: MemoryItem[] = [
  {
    id: "memory-1",
    type: "interview_note",
    title: "Entretien RH Spendesk",
    company: "Spendesk",
    content:
      "La recruteuse a insiste sur la capacite a structurer des operations transverses sans autorite directe. Bon signal sur FinScale. A preparer : exemple concret de conflit entre Sales et Engineering.",
    linkedApplicationId: "app-2",
    linkedContactId: "contact-1",
    tags: ["interview", "stakeholders", "operations"],
    sentiment: "positive",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "memory-2",
    type: "rejection",
    title: "Refus Doctolib",
    company: "Doctolib",
    content:
      "Feedback : profil interessant mais manque d'experience grand groupe et de programmes a tres grande echelle. Ils ont prefere un profil ex-consulting avec transformation enterprise.",
    linkedApplicationId: "app-3",
    linkedContactId: null,
    tags: ["rejection", "scale", "enterprise"],
    sentiment: "negative",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: "memory-3",
    type: "outreach_message",
    title: "Message Pennylane prepare",
    company: "Pennylane",
    content:
      "Angle : ne pas ouvrir avec Product. Ouvrir avec Strategy & Operations, OKRs, reporting board, coordination cross-equipes. Mentionner FinScale et croissance ARR seulement comme contexte.",
    linkedApplicationId: null,
    linkedContactId: "contact-3",
    tags: ["outreach", "positioning", "pennylane"],
    sentiment: "neutral",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "memory-4",
    type: "feedback",
    title: "Pattern feedback reseau",
    company: "Multiple",
    content:
      "Les contacts comprennent mieux le positionnement quand j'utilise 'operations transverses' plutot que 'product operations'. Le mot Product semble brouiller le message.",
    linkedApplicationId: null,
    linkedContactId: null,
    tags: ["positioning", "network", "language"],
    sentiment: "mixed",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
]

export const mockMemoryInsights: MemoryInsight[] = [
  {
    id: "insight-1",
    title: "Le repositionnement doit rester sans ambiguite",
    description:
      "Plusieurs notes montrent que le signal Product brouille le positionnement Strategy & Operations. Les messages et CV doivent ouvrir sur operations transverses, OKRs et reporting.",
    level: "warning",
    linkedMemoryItemIds: ["memory-3", "memory-4"],
  },
  {
    id: "insight-2",
    title: "Preuve a renforcer : influence sans autorite",
    description:
      "Spendesk et Doctolib pointent tous deux vers le meme besoin : un exemple STAR clair sur l'alignement de parties prenantes sans lien hierarchique.",
    level: "opportunity",
    linkedMemoryItemIds: ["memory-1", "memory-2"],
  },
]
