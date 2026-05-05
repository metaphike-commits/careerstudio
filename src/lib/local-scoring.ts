import type { JobOffer, NetworkContact, OpportunityScore, RemoteType, UserProfile, Verdict } from "@/types"
import { clamp, normalizeAccents, uniqueItems, includesAllWords } from "@/lib/utils"
import { OPS_SCORING_KEYWORDS } from "@/lib/constants"

export interface ManualOpportunityInput {
  title: string
  company: string
  location: string
  remoteType: RemoteType
  source: string
  url?: string
  description: string
}

interface ScoringContext {
  networkContacts?: NetworkContact[]
  jobOfferId?: string
  postedAt?: string
  now?: Date
}

function scoreFromMatches(matches: number, total: number, floor = 35, ceiling = 92) {
  if (total === 0) return floor
  return clamp(floor + (matches / total) * (ceiling - floor))
}

function getVerdict(globalFit: number): Verdict {
  if (globalFit >= 75) return "apply_now"
  if (globalFit >= 55) return "investigate"
  if (globalFit >= 40) return "watch"
  return "ignore"
}

function splitLines(description: string) {
  return description
    .split(/\n+/)
    .map((line) => line.replace(/^(?:[-*]|\u2022)\s*/, "").trim())
    .filter(Boolean)
}

function extractKeywords(input: ManualOpportunityInput, profile: UserProfile) {
  const searchable = normalizeAccents(`${input.title} ${input.company} ${input.location} ${input.description}`)
  const profileTerms = [
    ...profile.targetTitles,
    ...profile.targetIndustries,
    ...profile.skills,
    ...profile.strengths,
    ...OPS_SCORING_KEYWORDS,
  ]

  return uniqueItems(profileTerms.filter((term) => includesAllWords(searchable, term))).slice(0, 16)
}

function matchesOpportunityContact(contact: NetworkContact, input: ManualOpportunityInput, jobOfferId?: string) {
  if (jobOfferId && contact.linkedJobOfferId === jobOfferId) return true
  return normalizeAccents(contact.company) === normalizeAccents(input.company)
}

export function scoreOpportunityAccess(input: ManualOpportunityInput, context: ScoringContext = {}) {
  const matchingContacts = (context.networkContacts ?? []).filter((contact) =>
    matchesOpportunityContact(contact, input, context.jobOfferId)
  )

  if (matchingContacts.some((contact) => contact.status === "replied")) return 85
  if (matchingContacts.length > 0) return 65
  return 30
}

export function scoreOpportunityTiming(postedAt: string | undefined, now = new Date()) {
  if (!postedAt) return 50

  const postedTime = new Date(postedAt).getTime()
  if (Number.isNaN(postedTime)) return 50

  const ageDays = Math.max(0, Math.floor((now.getTime() - postedTime) / (24 * 60 * 60 * 1000)))
  if (ageDays <= 7) return 90
  if (ageDays <= 14) return 75
  if (ageDays <= 30) return 60
  return 35
}

export function scoreManualOpportunity(
  input: ManualOpportunityInput,
  profile: UserProfile,
  context: ScoringContext = {}
): OpportunityScore {
  const text = normalizeAccents(`${input.title} ${input.company} ${input.location} ${input.description}`)
  const keywords = extractKeywords(input, profile)
  const titleTerms = profile.targetTitles.filter((term) => includesAllWords(text, term))
  const skillTerms = profile.skills.filter((term) => includesAllWords(text, term))
  const industryTerms = profile.targetIndustries.filter((term) => includesAllWords(text, term))
  const opsTerms = OPS_SCORING_KEYWORDS.filter((term) => includesAllWords(text, term))
  const descriptionLength = input.description.trim().length

  const skills = scoreFromMatches(skillTerms.length + opsTerms.length, profile.skills.length + OPS_SCORING_KEYWORDS.length)
  const seniority = clamp(
    48 +
      (/(manager|lead|head|director|chief|senior|staff|principal)/i.test(input.title) ? 28 : 0) +
      (titleTerms.length > 0 ? 18 : 0)
  )
  const narrative = clamp(
    42 +
      Math.min(34, opsTerms.length * 5) +
      Math.min(16, industryTerms.length * 8) +
      (/(product owner|designer|developer|engineer)/i.test(input.title) ? -18 : 0)
  )
  const ats = clamp(45 + Math.min(38, keywords.length * 4) + (descriptionLength > 700 ? 10 : 0))
  const motivation = clamp(50 + Math.min(24, industryTerms.length * 8) + Math.min(18, titleTerms.length * 9))
  const access = scoreOpportunityAccess(input, context)
  const timing = scoreOpportunityTiming(context.postedAt, context.now)
  const effort = clamp(70 - Math.min(22, keywords.length * 2) + (descriptionLength < 500 ? 10 : 0))
  const confidence = clamp(45 + Math.min(35, keywords.length * 3) + (descriptionLength > 900 ? 12 : 0))

  const globalFit = clamp(
    skills * 0.21 +
      seniority * 0.16 +
      narrative * 0.2 +
      ats * 0.14 +
      motivation * 0.12 +
      access * 0.07 +
      timing * 0.06 +
      (100 - effort) * 0.04
  )
  const interviewProbability = clamp(globalFit * 0.58 + access * 0.22 + confidence * 0.2)
  const verdict = getVerdict(globalFit)

  const reasonsFor = [
    titleTerms.length > 0
      ? `Titre proche de ta cible: ${titleTerms.slice(0, 2).join(", ")}.`
      : null,
    opsTerms.length > 0
      ? `Signaux Strategy/Ops detectes: ${opsTerms.slice(0, 4).join(", ")}.`
      : null,
    skillTerms.length > 0
      ? `Competences deja presentes dans ton profil: ${skillTerms.slice(0, 4).join(", ")}.`
      : null,
    industryTerms.length > 0
      ? `Secteur coherent avec tes cibles: ${industryTerms.slice(0, 2).join(", ")}.`
      : null,
  ].filter(Boolean) as string[]

  const reasonsAgainst = [
    access < 55 ? "Aucun contact interne n'est encore identifie pour cette entreprise." : null,
    descriptionLength < 500 ? "Description courte: le score est moins fiable et doit etre relu manuellement." : null,
    titleTerms.length === 0 ? "Le titre ne reprend pas explicitement tes intitules cibles." : null,
    skillTerms.length < 3 ? "Peu de competences du profil sont retrouvees mot pour mot dans l'offre." : null,
  ].filter(Boolean) as string[]

  const redFlags = [
    input.url ? null : "Aucune URL source ajoutee: garde une trace manuelle de l'offre.",
    /(product owner|designer|developer|engineer)/i.test(input.title)
      ? "Le titre peut t'eloigner du repositionnement Strategy & Operations."
      : null,
  ].filter(Boolean) as string[]

  return {
    globalFit,
    confidence,
    skills,
    seniority,
    narrative,
    ats,
    motivation,
    access,
    timing,
    effort,
    interviewProbability,
    verdict,
    reasonsFor:
      reasonsFor.length > 0
        ? reasonsFor
        : ["Quelques signaux utiles existent, mais l'offre doit etre qualifiee manuellement."],
    reasonsAgainst,
    redFlags,
    recommendedAngle:
      "Repositionner ton parcours comme Strategy & Operations: coordination transverse, reporting, process design, KPIs et impact business mesurable.",
    recommendedActions: [
      "Relire l'offre importee et corriger les champs si besoin.",
      "Identifier un contact interne avant toute candidature.",
      "Adapter le CV cible autour des mots-cles detectes.",
      "Ne cliquer sur 'J'ai postule' qu'apres envoi manuel reel.",
    ],
  }
}

export function createManualOpportunity(
  input: ManualOpportunityInput,
  profile: UserProfile,
  now = new Date(),
  networkContacts: NetworkContact[] = []
): JobOffer {
  const lines = splitLines(input.description)
  const id = crypto.randomUUID()
  const postedAt = now.toISOString()
  const score = scoreManualOpportunity(input, profile, {
    networkContacts,
    jobOfferId: id,
    postedAt,
    now,
  })
  const keywords = extractKeywords(input, profile)

  return {
    id,
    title: input.title.trim(),
    company: input.company.trim(),
    location: input.location.trim() || "Non renseigne",
    remoteType: input.remoteType,
    source: input.source.trim() || "Import manuel",
    url: input.url?.trim() || undefined,
    description: input.description.trim(),
    responsibilities: lines.slice(0, 5),
    requirements: lines
      .filter((line) => /(experience|ans|maitrise|requis|souhaite|required|preferred)/i.test(line))
      .slice(0, 5),
    keywords,
    seniority: /(chief|director|head)/i.test(input.title)
      ? "Senior leadership"
      : /(manager|lead|senior)/i.test(input.title)
        ? "Manager / Senior IC"
        : "IC / Associate",
    postedAt,
    foundAt: postedAt,
    status: "new",
    score,
  }
}
