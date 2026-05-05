import type { CalibrationResult, CalibrationWarning, ProfileIntelligence, StarExample, UserProfile } from "@/types"
import { uniqueStrings } from "@/lib/utils"

function inferSeniority(profile: UserProfile) {
  const text = [
    ...profile.targetTitles,
    ...profile.experiences.map((experience) => experience.title),
  ].join(" ").toLowerCase()

  if (/\b(chief|vp|head|director)\b/.test(text)) return "Senior leadership"
  if (/\b(lead|senior|manager)\b/.test(text)) return "Senior IC / Manager"
  if (profile.experiences.length >= 3) return "Confirmed mid-senior"
  return "To clarify"
}

function inferSeniorityConfidence(profile: UserProfile) {
  if (profile.experiences.length >= 2 && profile.targetTitles.length >= 2) return "high"
  if (profile.experiences.length >= 1 || profile.targetTitles.length >= 1) return "medium"
  return "missing"
}

function buildPitch(profile: UserProfile) {
  const base = profile.positioningStatement.trim()
  const title = profile.targetTitles[0] ?? "Strategy & Operations"
  const sectors = profile.targetIndustries.slice(0, 2).join(" / ")

  return {
    short: base || `${title} profile targeting ${sectors || "tech scale-ups"}.`,
    recruiter:
      base ||
      `${title} profile with cross-functional execution, operational structuring, and stakeholder alignment experience.`,
    interview:
      base ||
      `My positioning is ${title}: I help growing teams turn strategy into clear operating systems, measurable priorities, and repeatable execution.`,
  }
}

function buildStarExamples(profile: UserProfile): StarExample[] {
  const fromProofs = profile.proofPoints.slice(0, 2).map((proofPoint, index) => ({
    id: `star-proof-${index + 1}`,
    title: proofPoint.skill,
    situation: "Context to clarify from the master CV or interview notes.",
    task: "Explain the business objective and your role.",
    action: proofPoint.evidence,
    result: proofPoint.evidence,
    linkedSkills: [proofPoint.skill].filter(Boolean),
  }))

  if (fromProofs.length > 0) return fromProofs

  return profile.achievements.slice(0, 2).map((achievement, index) => ({
    id: `star-achievement-${index + 1}`,
    title: `Impact example ${index + 1}`,
    situation: "Context to clarify.",
    task: "Objective to clarify.",
    action: achievement,
    result: achievement,
    linkedSkills: profile.skills.slice(0, 3),
  }))
}

export function createProfileIntelligence(profile: UserProfile): ProfileIntelligence {
  const existing = profile.profileIntelligence
  const derived: ProfileIntelligence = {
    seniority: inferSeniority(profile),
    seniorityConfidence: inferSeniorityConfidence(profile),
    targetRoleFamilies: uniqueStrings(profile.targetTitles),
    avoidRoleFamilies: uniqueStrings(profile.avoidRoles),
    sectorFit: uniqueStrings(profile.targetIndustries),
    coreStrengths: uniqueStrings(profile.strengths),
    impactProofs: uniqueStrings([
      ...profile.proofPoints.map((proofPoint) => proofPoint.evidence),
      ...profile.achievements,
    ]).slice(0, 8),
    likelyObjections: uniqueStrings(profile.objections),
    pitch: buildPitch(profile),
    starExamples: buildStarExamples(profile),
    atsKeywords: uniqueStrings([...profile.skills, ...profile.targetTitles, ...profile.targetIndustries]).slice(0, 24),
    progressionAxes: uniqueStrings(profile.missingCriticalInfo),
    source: "local_profile",
  }

  if (!existing) return derived

  return {
    ...derived,
    ...existing,
    targetRoleFamilies: existing.targetRoleFamilies?.length ? existing.targetRoleFamilies : derived.targetRoleFamilies,
    avoidRoleFamilies: existing.avoidRoleFamilies?.length ? existing.avoidRoleFamilies : derived.avoidRoleFamilies,
    sectorFit: existing.sectorFit?.length ? existing.sectorFit : derived.sectorFit,
    coreStrengths: existing.coreStrengths?.length ? existing.coreStrengths : derived.coreStrengths,
    impactProofs: existing.impactProofs?.length ? existing.impactProofs : derived.impactProofs,
    likelyObjections: existing.likelyObjections?.length ? existing.likelyObjections : derived.likelyObjections,
    pitch: {
      ...derived.pitch,
      ...existing.pitch,
    },
    starExamples: existing.starExamples?.length ? existing.starExamples : derived.starExamples,
    atsKeywords: existing.atsKeywords?.length ? existing.atsKeywords : derived.atsKeywords,
    progressionAxes: existing.progressionAxes?.length ? existing.progressionAxes : derived.progressionAxes,
    source: existing.source ?? derived.source,
  }
}

const GENERIC_PITCH_FRAGMENTS = [
  "profile targeting",
  "My positioning is",
  "cross-functional execution, operational structuring",
]

function pitchIsGeneric(short: string): boolean {
  if (short.trim().length < 40) return true
  return GENERIC_PITCH_FRAGMENTS.some((fragment) => short.includes(fragment))
}

export function calibrateProfileIntelligence(pi: ProfileIntelligence): CalibrationResult {
  const warnings: CalibrationWarning[] = []

  // Blocking: profile cannot be reliably used for applications
  if (pi.targetRoleFamilies.length === 0) {
    warnings.push({
      field: "targetRoleFamilies",
      level: "blocking",
      message: "Aucun role cible defini -- le scoring des offres sera imprecis.",
    })
  }
  if (pi.impactProofs.length === 0) {
    warnings.push({
      field: "impactProofs",
      level: "blocking",
      message: "Aucune preuve d'impact -- les candidatures seront peu convaincantes.",
    })
  }
  if (pi.seniority === "To clarify" || pi.seniorityConfidence === "missing") {
    warnings.push({
      field: "seniority",
      level: "blocking",
      message: "Seniorite non determinee -- a preciser pour les filtres recruteur.",
    })
  }

  // Weak: profile works but has calibration gaps
  if (pi.impactProofs.length > 0 && pi.impactProofs.length < 3) {
    warnings.push({
      field: "impactProofs",
      level: "weak",
      message: `${pi.impactProofs.length} preuve(s) d'impact -- vise au moins 3 pour etre credible.`,
    })
  }
  if (pi.atsKeywords.length < 8) {
    warnings.push({
      field: "atsKeywords",
      level: "weak",
      message: "Moins de 8 mots-cles ATS -- les scores d'adequation seront sous-estimes.",
    })
  }
  if (pi.likelyObjections.length === 0) {
    warnings.push({
      field: "likelyObjections",
      level: "weak",
      message: "Objections non identifiees -- difficile d'anticiper les blocages recruteur.",
    })
  }
  if (pitchIsGeneric(pi.pitch.short)) {
    warnings.push({
      field: "pitch",
      level: "weak",
      message: "Pitch generique ou trop court -- personnalise-le pour les candidatures.",
    })
  }

  const blockingCount = warnings.filter((w) => w.level === "blocking").length
  const isReady = blockingCount === 0
  const score: CalibrationResult["score"] =
    blockingCount > 0 ? "weak" : warnings.length > 2 ? "partial" : "strong"

  return { isReady, score, warnings }
}
