import type { CVVersion, JobOffer, UserProfile } from "@/types"
import type { TargetedCVResponse } from "@/lib/local-cv-targeting"
import { normalizeAccents } from "@/lib/utils"

function keywordCoverage(offerKeywords: string[], includedKeywords: string[]) {
  if (offerKeywords.length === 0) return 70
  const included = new Set(includedKeywords.map(normalizeAccents))
  const matches = offerKeywords.filter((keyword) => included.has(normalizeAccents(keyword))).length
  return Math.round((matches / offerKeywords.length) * 100)
}

export function createCVVersionFromTarget({
  target,
  profile,
  opportunity,
  now = new Date(),
}: {
  target: TargetedCVResponse
  profile: UserProfile
  opportunity: JobOffer
  now?: Date
}): CVVersion {
  const coverage = keywordCoverage(opportunity.keywords, target.keywords)
  const missingKeywords = opportunity.keywords
    .filter((keyword) => !target.keywords.map(normalizeAccents).includes(normalizeAccents(keyword)))
    .slice(0, 10)
  const bulletImprovements = target.experiences.flatMap((targetExperience) => {
    const sourceExperience = profile.experiences.find((experience) => experience.id === targetExperience.id)
    const original = sourceExperience?.achievements[0] ?? sourceExperience?.description ?? "Experience a renforcer"

    return targetExperience.bullets.map((bullet) => ({
      original,
      improved: bullet,
      reason: "Brouillon cible cree depuis le profil et l'offre. Relire avant envoi.",
    }))
  })
  const bulletCount = bulletImprovements.length

  const content = [
    `${profile.name.toUpperCase()} - ${opportunity.title}`,
    "",
    "POSITIONNEMENT",
    target.angle,
    "",
    "MOTS-CLES CIBLES",
    target.keywords.join(" · "),
    "",
    "EXPERIENCES",
    ...target.experiences.flatMap((targetExperience) => {
      const sourceExperience = profile.experiences.find((experience) => experience.id === targetExperience.id)
      return [
        "",
        sourceExperience
          ? `${sourceExperience.title} - ${sourceExperience.company}`
          : targetExperience.id,
        ...targetExperience.bullets.map((bullet) => `-> ${bullet}`),
      ]
    }),
  ].join("\n")

  return {
    id: `cv-local-${opportunity.id}-${now.getTime()}`,
    masterCvId: "cv-master-local",
    jobOfferId: opportunity.id,
    title: `${opportunity.title} (${opportunity.company}) - brouillon local`,
    atsScore: Math.min(92, Math.max(55, coverage + 12)),
    recruiterReadability: 78,
    narrativeCoherence: target.angle.length > 40 ? 82 : 68,
    substanceScore: Math.min(88, 55 + bulletCount * 5),
    keywordCoverage: coverage,
    missingKeywords,
    includedKeywords: target.keywords,
    bulletImprovements,
    content,
    createdAt: now.toISOString(),
    atsRedFlags: target.atsRedFlags,
    gapAnalysis: target.gapAnalysis,
  }
}
