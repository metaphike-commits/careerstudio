import type { UserProfile } from "@/types"

export interface CVTargetRequestBody {
  profile?: UserProfile
  jobDescription?: string
  jobTitle?: string
  company?: string
}

export interface TargetedCVResponse {
  experiences: { id: string; bullets: string[] }[]
  angle: string
  keywords: string[]
  atsRedFlags?: string[]
  gapAnalysis?: { reframe: string[]; learn: string[] }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function isValidCVTargetBody(
  body: CVTargetRequestBody | null
): body is Required<CVTargetRequestBody> {
  return Boolean(
    body &&
      body.profile &&
      Array.isArray(body.profile.experiences) &&
      body.profile.experiences.length > 0 &&
      isNonEmptyString(body.jobDescription) &&
      isNonEmptyString(body.jobTitle) &&
      isNonEmptyString(body.company)
  )
}

export function generateLocalTargetedCV(body: Required<CVTargetRequestBody>): TargetedCVResponse {
  const searchable = `${body.jobTitle} ${body.company} ${body.jobDescription}`.toLowerCase()
  const keywords = [
    ...body.profile.skills,
    ...body.profile.targetTitles,
    ...body.profile.targetIndustries,
    "Strategy",
    "Operations",
    "KPIs",
    "Reporting",
    "Stakeholder Management",
    "Cross-functional",
  ]
    .filter((keyword, index, all) => all.indexOf(keyword) === index)
    .filter((keyword) => searchable.includes(keyword.toLowerCase()) || keyword.length > 8)
    .slice(0, 12)

  return {
    angle: `Positionner le profil sur ${body.jobTitle} chez ${body.company} avec un angle operations, impact business et coordination transverse.`,
    keywords,
    experiences: body.profile.experiences.map((experience) => ({
      id: experience.id,
      bullets: [
        `Reformuler ${experience.title} chez ${experience.company} autour des enjeux ${body.jobTitle}, avec focus impact, execution et parties prenantes.`,
        experience.achievements[0]
          ? `Mettre en avant cette preuve existante: ${experience.achievements[0]}`
          : `Ajouter une preuve concrete et mesuree reliant cette experience aux attentes de ${body.company}.`,
      ].slice(0, 3),
    })),
  }
}
