import type {
  Application,
  ApplicationPack,
  CVVersion,
  JobOffer,
  MemoryItem,
  NetworkContact,
  StarExample,
  UserProfile,
} from "@/types"
import { isInterviewStatus } from "@/lib/interview-handoff"
import { hasAnySubstring } from "@/lib/utils"

export interface InterviewWorkspaceInput {
  application: Application
  profile: UserProfile
  opportunity: JobOffer | null
  applicationPack: ApplicationPack | null
  cvVersion: CVVersion | null
  linkedContact: NetworkContact | null
  memoryItems: MemoryItem[]
  fallbackTitle?: string
  fallbackCompany?: string
}

export interface InterviewChecklistItem {
  id: "targeted_cv" | "application_pack" | "linked_contact" | "interview_note"
  label: string
  ready: boolean
  detail: string
}

export interface InterviewStarExample {
  title: string
  evidence: string
  skills: string[]
}

export interface InterviewAnswerDraft {
  id: "intro" | "why_role" | "repositioning" | "conflict" | "risk"
  prompt: string
  angle: string
  talkingPoints: string[]
}

export interface InterviewResearchPrompt {
  label: string
  question: string
  sourceHint: string
}

export interface PostInterviewLearning {
  sentiment: "positive" | "neutral" | "negative" | "mixed"
  signals: string[]
  objections: string[]
  followUpSuggestions: string[]
  tags: string[]
}

export interface InterviewWorkspace {
  title: string
  company: string
  interviewDateLabel: string
  readinessScore: number
  nextFocus: string
  stakes: string[]
  likelyQuestions: string[]
  objections: string[]
  starExamples: InterviewStarExample[]
  questionsToAsk: string[]
  prepChecklist: InterviewChecklistItem[]
  answerDrafts: InterviewAnswerDraft[]
  companyResearch: InterviewResearchPrompt[]
  interviewerContext: string[]
  postInterviewPrompts: string[]
}

function limit(items: string[], count: number): string[] {
  return items.filter((item) => item.trim().length > 0).slice(0, count)
}


function formatInterviewDate(value: string | null): string {
  if (!value) return "Date a renseigner"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date a verifier"
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function buildChecklist(input: InterviewWorkspaceInput): InterviewChecklistItem[] {
  const hasInterviewNote = input.memoryItems.some(
    (item) => item.linkedApplicationId === input.application.id && item.type === "interview_note"
  )

  return [
    {
      id: "targeted_cv",
      label: "CV cible relu",
      ready: Boolean(input.cvVersion),
      detail: input.cvVersion
        ? `CV disponible: ${input.cvVersion.title}`
        : "Creer ou relire le CV cible avant l'entretien.",
    },
    {
      id: "application_pack",
      label: "Pack candidature relu",
      ready: Boolean(input.applicationPack),
      detail: input.applicationPack
        ? "Pitch, objections et questions probables disponibles."
        : "Generer ou completer le pack avant la preparation.",
    },
    {
      id: "linked_contact",
      label: "Contexte humain",
      ready: Boolean(input.linkedContact),
      detail: input.linkedContact
        ? `${input.linkedContact.name} - ${input.linkedContact.role}`
        : "Relier un recruteur, contact interne ou source si disponible.",
    },
    {
      id: "interview_note",
      label: "Note d'entretien",
      ready: hasInterviewNote,
      detail: hasInterviewNote
        ? "Une note liee existe dans la memoire."
        : "Ajouter une note avant ou apres l'entretien dans la memoire.",
    },
  ]
}

function mapStarExamples(starExamples: StarExample[] | undefined): InterviewStarExample[] {
  if (!starExamples || starExamples.length === 0) return []

  return starExamples.slice(0, 4).map((item) => ({
    title: item.title,
    evidence: [item.situation, item.action, item.result].filter(Boolean).join(" -> "),
    skills: item.linkedSkills,
  }))
}

function fallbackStarExamples(profile: UserProfile): InterviewStarExample[] {
  const proofExamples = profile.proofPoints
    .filter((item) => item.evidence.trim().length > 0)
    .slice(0, 4)
    .map((item) => ({
      title: item.skill || "Preuve d'impact",
      evidence: item.evidence,
      skills: item.skill ? [item.skill] : [],
    }))

  if (proofExamples.length > 0) return proofExamples

  return profile.experiences.slice(0, 3).map((experience) => ({
    title: `${experience.title} - ${experience.company}`,
    evidence: experience.achievements[0] ?? experience.description,
    skills: experience.keywords.slice(0, 4),
  }))
}

function buildAnswerDrafts(input: InterviewWorkspaceInput, company: string, title: string): InterviewAnswerDraft[] {
  const intelligence = input.profile.profileIntelligence
  const shortPitch =
    intelligence?.pitch.interview ||
    intelligence?.pitch.recruiter ||
    intelligence?.pitch.short ||
    input.profile.positioningStatement
  const strongestProof =
    intelligence?.impactProofs[0] ||
    input.profile.achievements[0] ||
    input.profile.proofPoints[0]?.evidence ||
    "une preuve d'impact transverse a formuler avec un exemple concret"
  const roleAngle =
    input.opportunity?.score.recommendedAngle ||
    input.applicationPack?.whyCompany ||
    `relier ton experience Strategy & Operations aux enjeux de ${company}`
  const topStrengths = limit(
    [
      ...(intelligence?.coreStrengths ?? []),
      ...input.profile.strengths,
      ...input.profile.skills,
    ],
    4
  )

  return [
    {
      id: "intro",
      prompt: "Parle-moi de toi.",
      angle: "Ouvrir sur le positionnement, pas sur une chronologie complete.",
      talkingPoints: limit([shortPitch, strongestProof, ...topStrengths], 4),
    },
    {
      id: "why_role",
      prompt: `Pourquoi ce poste chez ${company} ?`,
      angle: "Relier le besoin business du poste a tes preuves operationnelles.",
      talkingPoints: limit([roleAngle, `Role cible: ${title}`, input.applicationPack?.whyCompany ?? ""], 4),
    },
    {
      id: "repositioning",
      prompt: "Pourquoi ce repositionnement vers Strategy & Operations ?",
      angle: "Assumer le fil rouge: coordination transverse, execution, reporting, impact.",
      talkingPoints: limit(
        [
          "Mon impact venait deja de l'alignement entre equipes, pas seulement du produit.",
          "Je veux etre mesure sur la qualite d'execution et la clarte operationnelle.",
          strongestProof,
        ],
        4
      ),
    },
    {
      id: "conflict",
      prompt: "Donne un exemple de conflit ou d'alignement difficile.",
      angle: "Utiliser un exemple STAR court, avec tension, action, resultat.",
      talkingPoints: limit(
        [
          input.profile.profileIntelligence?.starExamples[0]?.title ?? "",
          input.profile.profileIntelligence?.starExamples[0]?.result ?? "",
          fallbackStarExamples(input.profile)[0]?.evidence ?? "",
        ],
        4
      ),
    },
    {
      id: "risk",
      prompt: "Quel risque vois-tu dans ce role ?",
      angle: "Montrer de la lucidite sans te devaloriser.",
      talkingPoints: limit(
        [
          "Le risque principal est de vouloir tout structurer trop vite.",
          "Je commencerais par identifier les 2-3 goulots d'etranglement mesurables.",
          "Je proposerais un plan 30/60/90 jours avec un rituel de feedback.",
        ],
        4
      ),
    },
  ]
}

function buildCompanyResearch(company: string, title: string): InterviewResearchPrompt[] {
  return [
    {
      label: "Priorites business",
      question: `Quels signaux recents expliquent pourquoi ${company} recrute ce role maintenant ?`,
      sourceHint: "Site carriere, communiques, LinkedIn, articles recents",
    },
    {
      label: "Organisation",
      question: `A quelle equipe ${title} semble rattache et avec qui le role devra-t-il travailler ?`,
      sourceHint: "Offre, profils LinkedIn, organigramme public",
    },
    {
      label: "Enjeux operationnels",
      question: "Quels process, KPIs ou tensions cross-fonctionnelles sont probablement critiques ?",
      sourceHint: "Description de poste, interviews fondateurs, pages produit",
    },
  ]
}

function buildInterviewerContext(input: InterviewWorkspaceInput): string[] {
  const contact = input.linkedContact
  return [
    contact
      ? `Contact lie: ${contact.name}, ${contact.role} chez ${contact.company}.`
      : "Aucun interviewer/contact lie pour le moment: ajouter le recruteur ou l'interviewer dans Reseau si possible.",
    input.application.feedback
      ? `Signal deja recu: ${input.application.feedback}`
      : "Aucun feedback formel encore capture dans le pipeline.",
    input.application.notes
      ? `Note dossier: ${input.application.notes}`
      : "Ajouter le contexte de l'echange des qu'il est connu.",
  ]
}

export function buildInterviewWorkspace(input: InterviewWorkspaceInput): InterviewWorkspace | null {
  if (!isInterviewStatus(input.application.status)) return null

  const title =
    input.opportunity?.title ??
    input.fallbackTitle ??
    input.cvVersion?.title ??
    input.application.notes.split(".")[0] ??
    "Entretien"
  const company =
    input.opportunity?.company ??
    input.fallbackCompany ??
    input.linkedContact?.company ??
    input.memoryItems.find((item) => item.linkedApplicationId === input.application.id)?.company ??
    "Entreprise"

  const checklist = buildChecklist(input)
  const readyCount = checklist.filter((item) => item.ready).length
  const nextFocus = checklist.find((item) => !item.ready)?.label ?? "Relire calmement le dossier"
  const packQuestions = input.applicationPack?.probableQuestions ?? []
  const packObjections = input.applicationPack?.probableObjections ?? []
  const intelligence = input.profile.profileIntelligence

  const stakes = limit(
    [
      input.opportunity?.score.recommendedAngle ?? "",
      ...(input.opportunity?.responsibilities ?? []),
      ...(input.opportunity?.requirements ?? []),
      input.applicationPack?.whyCompany ?? "",
    ],
    5
  )

  const likelyQuestions = limit(
    packQuestions.length > 0
      ? packQuestions
      : [
          "Pourquoi ce role et pourquoi maintenant ?",
          "Comment expliques-tu ton repositionnement vers Strategy & Operations ?",
          "Donne un exemple d'alignement cross-fonctionnel difficile.",
          "Comment mesures-tu ton impact dans un role transverse ?",
          "Quel risque vois-tu dans ce poste ?",
        ],
    6
  )

  const objections = limit(
    [
      ...packObjections,
      ...(intelligence?.likelyObjections ?? []),
      ...input.profile.objections,
    ],
    6
  )

  const starExamples = mapStarExamples(intelligence?.starExamples)
  const questionsToAsk = [
    `Quels sont les 2 chantiers les plus critiques pour ${company} dans les 90 prochains jours ?`,
    "Comment l'equipe mesure-t-elle le succes de ce role ?",
    "Quelles tensions cross-fonctionnelles ce role doit-il aider a resoudre ?",
    "A quoi ressemble une excellente premiere mission sur ce poste ?",
  ]
  const answerDrafts = buildAnswerDrafts(input, company, title)

  return {
    title,
    company,
    interviewDateLabel: formatInterviewDate(input.application.nextActionDate),
    readinessScore: Math.round((readyCount / checklist.length) * 100),
    nextFocus,
    stakes:
      stakes.length > 0
        ? stakes
        : ["Clarifier les enjeux du role a partir de l'offre et du pack candidature."],
    likelyQuestions,
    objections:
      objections.length > 0
        ? objections
        : ["Preparer une objection sur la clarte du repositionnement et les preuves d'impact."],
    starExamples: starExamples.length > 0 ? starExamples : fallbackStarExamples(input.profile),
    questionsToAsk,
    prepChecklist: checklist,
    answerDrafts,
    companyResearch: buildCompanyResearch(company, title),
    interviewerContext: buildInterviewerContext(input),
    postInterviewPrompts: [
      "Quelles questions sont revenues le plus souvent ?",
      "Quelle objection a semble la plus forte ?",
      "Quel exemple STAR a le mieux fonctionne ?",
      "Quelle action de suivi faut-il confirmer manuellement ?",
    ],
  }
}

export function buildPostInterviewLearning(note: string, company = "Entreprise"): PostInterviewLearning {
  const normalized = note.toLowerCase()
  const signals: string[] = []
  const objections: string[] = []
  const followUpSuggestions: string[] = []
  const tags = ["interview", "post-interview"]

  if (hasAnySubstring(normalized, ["positif", "bon signal", "interesse", "suite", "prochain tour", "convaincu"])) {
    signals.push("Signal positif detecte: il faut capitaliser rapidement avec un suivi clair.")
    tags.push("positive-signal")
  }

  if (hasAnySubstring(normalized, ["doute", "objection", "manque", "risque", "inquiet", "pas assez"])) {
    objections.push("Objection ou doute detecte: ajouter une preuve concrete dans le suivi.")
    tags.push("objection")
  }

  if (hasAnySubstring(normalized, ["salaire", "remuneration", "budget", "pretention"])) {
    objections.push("Sujet remuneration detecte: preparer une fourchette et une justification factuelle.")
    tags.push("compensation")
  }

  if (hasAnySubstring(normalized, ["product", "repositionnement", "operations", "strategie", "strategy"])) {
    signals.push("Le positionnement Strategy & Operations reste un theme a suivre.")
    tags.push("positioning")
  }

  if (hasAnySubstring(normalized, ["relance", "envoyer", "email", "message", "merci", "follow"])) {
    followUpSuggestions.push(`Envoyer un message de suivi court a ${company} avec le point le plus fort de l'echange.`)
  } else {
    followUpSuggestions.push(`Envoyer un message de remerciement a ${company} sous 24h.`)
  }

  if (objections.length > 0) {
    followUpSuggestions.push("Joindre ou mentionner une preuve d'impact qui repond directement a l'objection.")
  }

  if (signals.length === 0) {
    signals.push("Aucun signal fort detecte automatiquement: relire la note et taguer manuellement si besoin.")
  }

  const sentiment =
    objections.length > 0 && signals.some((signal) => signal.includes("positif"))
      ? "mixed"
      : objections.length > 0
        ? "negative"
        : signals.some((signal) => signal.includes("positif"))
          ? "positive"
          : "neutral"

  return {
    sentiment,
    signals: limit(signals, 4),
    objections: limit(objections, 4),
    followUpSuggestions: limit(followUpSuggestions, 4),
    tags: Array.from(new Set(tags)),
  }
}
