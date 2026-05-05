import type { JobOffer, Verdict } from "@/types"
import { normalizeSlug } from "@/lib/utils"
import { SO_SCOUT_SKILLS } from "@/lib/constants"

const VERDICT_ORDER: Record<Verdict, number> = {
  apply_now: 0,
  investigate: 1,
  watch: 2,
  ignore: 3,
}

export const SOURCE_PRESETS = [
  "LinkedIn",
  "Welcome to the Jungle",
  "Indeed",
  "JobTeaser",
  "Referral",
  "Direct",
] as const

export function detectDuplicate(
  input: { title: string; company: string; url?: string },
  existing: JobOffer[]
): JobOffer | null {
  if (!input.company.trim() && !input.title.trim()) return null

  if (input.url?.trim()) {
    const normalizedUrl = normalizeSlug(input.url)
    const byUrl = existing.find((o) => o.url && normalizeSlug(o.url) === normalizedUrl)
    if (byUrl) return byUrl
  }

  const company = normalizeSlug(input.company)
  const title = normalizeSlug(input.title)
  if (company && title) {
    const byTitle = existing.find(
      (o) => normalizeSlug(o.company) === company && normalizeSlug(o.title) === title
    )
    if (byTitle) return byTitle
  }

  return null
}

export function getScoutQueue(opportunities: JobOffer[], maxItems = 7): JobOffer[] {
  return opportunities
    .filter((o) => o.status === "new")
    .sort((a, b) => {
      const vDiff = VERDICT_ORDER[a.score.verdict] - VERDICT_ORDER[b.score.verdict]
      return vDiff !== 0 ? vDiff : b.score.globalFit - a.score.globalFit
    })
    .slice(0, maxItems)
}

export function parseJobDescriptionHead(text: string): { title: string; company: string } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 12)

  const skipPatterns = [
    /^https?:\/\//i,
    /@/,
    /^\d{2}\s*\d{3}/,          // salary like "42 000"
    /\d+\s*(candidat|applicant)/i,
    /il y a \d/i,
    /\d+\s*(jours?|heures?|semaines?)/i,
    /CDI|CDD|stage|alternance|freelance/i,
    /^(remote|hybrid|hybride|présentiel|onsite|full.remote)/i,
    /^(paris|lyon|bordeaux|toulouse|france|belgium|suisse)/i,
    /€|USD|\$/,
  ]

  const isClean = (line: string, maxLen: number) =>
    line.length >= 2 &&
    line.length <= maxLen &&
    !skipPatterns.some((re) => re.test(line))

  const title = lines.find((l) => isClean(l, 90)) ?? ""
  const company = lines
    .filter((l) => l !== title)
    .find((l) => isClean(l, 60)) ?? ""

  return { title, company }
}

export function previewJobKeywords(description: string): string[] {
  if (!description || description.trim().length < 30) return []
  const lower = description.toLowerCase()
  return SO_SCOUT_SKILLS.filter((skill) =>
    skill.toLowerCase().split(/\s+/).every((part: string) => lower.includes(part))
  )
}
