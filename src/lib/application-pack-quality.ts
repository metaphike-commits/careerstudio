import type { ApplicationPack, JobOffer, UserProfile } from "@/types"
import { clamp } from "@/lib/utils"

export type PackQualitySection =
  | "linkedin"
  | "pitch"
  | "whyYou"
  | "whyCompany"
  | "questions"
  | "objections"
  | "prep"

export type PackQualityLevel = "good" | "warning" | "critical"

export interface PackQualityWarning {
  id: string
  section: PackQualitySection
  level: PackQualityLevel
  message: string
}

export interface PackQualityResult {
  score: number
  level: PackQualityLevel
  warnings: PackQualityWarning[]
  sectionScores: Record<PackQualitySection, number>
}

const SECTIONS: PackQualitySection[] = [
  "linkedin",
  "pitch",
  "whyYou",
  "whyCompany",
  "questions",
  "objections",
  "prep",
]

const VAGUE_TERMS = [
  "fort impact",
  "forte valeur",
  "environnement dynamique",
  "profil polyvalent",
  "motivation forte",
  "passionne",
  "rigueur operationnelle",
]


function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function addWarning(warnings: PackQualityWarning[], warning: PackQualityWarning) {
  warnings.push(warning)
}

function quantifiedClaims(text: string) {
  return Array.from(
    text.matchAll(/(?:^|[^\w])(\d+[\d\s]*(?:%|k|m|ans?|mois|jours?))(?=$|[^\w])/gi)
  ).map((match) =>
    match[1].toLowerCase().replace(/\s+/g, "")
  )
}

function evidenceCorpus(profile?: UserProfile) {
  if (!profile) return ""
  return [
    profile.positioningStatement,
    ...profile.achievements,
    ...profile.proofPoints.map((proof) => proof.evidence),
    ...profile.experiences.flatMap((experience) => [
      experience.description,
      ...experience.achievements,
      ...experience.keywords,
    ]),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, "")
}

function hasUnsupportedQuantifiedClaim(text: string, profile?: UserProfile) {
  const claims = quantifiedClaims(text)
  if (claims.length === 0 || !profile) return false
  const corpus = evidenceCorpus(profile)
  return claims.some((claim) => !corpus.includes(claim))
}

function hasAnyProof(pack: ApplicationPack, profile?: UserProfile) {
  const text = `${pack.whyYou} ${pack.pitch30s} ${pack.pitch60s}`.toLowerCase()
  if (/\d/.test(text)) return true
  if (!profile) return false
  return profile.proofPoints.some((proof) => proof.evidence && text.includes(proof.skill.toLowerCase()))
}

function companyMentioned(text: string, opportunity?: JobOffer) {
  if (!opportunity) return true
  return text.toLowerCase().includes(opportunity.company.toLowerCase())
}

function containsVagueTerm(text: string) {
  const lower = text.toLowerCase()
  return VAGUE_TERMS.some((term) => lower.includes(term))
}

export function evaluateApplicationPackQuality(
  pack: ApplicationPack,
  context: { profile?: UserProfile | null; opportunity?: JobOffer | null } = {}
): PackQualityResult {
  const profile = context.profile ?? undefined
  const opportunity = context.opportunity ?? undefined
  const warnings: PackQualityWarning[] = []
  const sectionScores = Object.fromEntries(SECTIONS.map((section) => [section, 100])) as Record<
    PackQualitySection,
    number
  >

  if (countWords(pack.linkedInMessage) < 35) {
    sectionScores.linkedin -= 25
    addWarning(warnings, {
      id: "linkedin-too-short",
      section: "linkedin",
      level: "warning",
      message: "Le message LinkedIn est court. Ajoute une preuve d'impact ou une personnalisation.",
    })
  }

  if (!companyMentioned(pack.linkedInMessage, opportunity)) {
    sectionScores.linkedin -= 20
    addWarning(warnings, {
      id: "linkedin-no-company",
      section: "linkedin",
      level: "warning",
      message: "Le message LinkedIn ne cite pas clairement l'entreprise cible.",
    })
  }

  if (containsVagueTerm(pack.pitch30s) || containsVagueTerm(pack.pitch60s)) {
    sectionScores.pitch -= 15
    addWarning(warnings, {
      id: "pitch-vague",
      section: "pitch",
      level: "warning",
      message: "Le pitch contient des formulations generiques. Remplace-les par une preuve concrete.",
    })
  }

  if (!hasAnyProof(pack, profile)) {
    sectionScores.whyYou -= 35
    sectionScores.pitch -= 20
    addWarning(warnings, {
      id: "missing-proof",
      section: "whyYou",
      level: "critical",
      message: "Le pack manque de preuves d'impact. Ajoute chiffres, resultats ou exemples STAR.",
    })
  }

  const allText = [
    pack.linkedInMessage,
    pack.pitch30s,
    pack.pitch60s,
    pack.whyYou,
    pack.whyCompany,
  ].join(" ")
  if (hasUnsupportedQuantifiedClaim(allText, profile)) {
    sectionScores.whyYou -= 30
    addWarning(warnings, {
      id: "unsupported-quantified-claim",
      section: "whyYou",
      level: "critical",
      message: "Le pack contient un chiffre qui n'apparait pas dans les preuves du profil.",
    })
  }

  if (!companyMentioned(pack.whyCompany, opportunity)) {
    sectionScores.whyCompany -= 25
    addWarning(warnings, {
      id: "why-company-generic",
      section: "whyCompany",
      level: "warning",
      message: "La section entreprise semble generique. Ajoute une raison specifique liee a l'entreprise.",
    })
  }

  if (pack.probableQuestions.length < 4) {
    sectionScores.questions -= 30
    addWarning(warnings, {
      id: "too-few-questions",
      section: "questions",
      level: "warning",
      message: "Ajoute au moins 4 questions probables pour preparer l'entretien.",
    })
  }

  if (pack.probableObjections.length < 2) {
    sectionScores.objections -= 35
    addWarning(warnings, {
      id: "too-few-objections",
      section: "objections",
      level: "critical",
      message: "Le pack anticipe trop peu d'objections. Ajoute les risques du profil et de l'offre.",
    })
  }

  if (pack.miniPrepPlan.length < 4) {
    sectionScores.prep -= 25
    addWarning(warnings, {
      id: "prep-too-light",
      section: "prep",
      level: "warning",
      message: "Le plan de preparation est trop leger. Ajoute recherche entreprise, exemples STAR et questions.",
    })
  }

  for (const section of SECTIONS) {
    sectionScores[section] = clamp(sectionScores[section])
  }

  const score = Math.round(
    SECTIONS.reduce((sum, section) => sum + sectionScores[section], 0) / SECTIONS.length
  )
  const level: PackQualityLevel = score >= 80 ? "good" : score >= 60 ? "warning" : "critical"

  return {
    score,
    level,
    warnings,
    sectionScores,
  }
}
