import type { JobOffer, UserProfile } from "@/types"

export interface OpportunitySnapshot {
  schemaVersion: 1
  createdAt: string
  profile: {
    name: string
    positioningStatement: string
    targetTitles: string[]
    targetIndustries: string[]
    skills: string[]
  } | null
  summary: {
    total: number
    applyNow: number
    investigate: number
    watch: number
    ignore: number
    averageFit: number
    topOpportunityId: string | null
  }
  opportunities: Array<{
    id: string
    title: string
    company: string
    location: string
    remoteType: JobOffer["remoteType"]
    source: string
    url?: string
    status: JobOffer["status"]
    score: JobOffer["score"]
    keywords: string[]
    foundAt: string
  }>
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function createOpportunitySnapshot({
  opportunities,
  profile,
  createdAt = new Date().toISOString(),
}: {
  opportunities: JobOffer[]
  profile: UserProfile | null
  createdAt?: string
}): OpportunitySnapshot {
  const sortedOpportunities = [...opportunities].sort(
    (a, b) => b.score.globalFit - a.score.globalFit || a.company.localeCompare(b.company)
  )
  const verdicts = sortedOpportunities.map((opportunity) => opportunity.score.verdict)

  return {
    schemaVersion: 1,
    createdAt,
    profile: profile
      ? {
          name: profile.name,
          positioningStatement: profile.positioningStatement,
          targetTitles: profile.targetTitles,
          targetIndustries: profile.targetIndustries,
          skills: profile.skills,
        }
      : null,
    summary: {
      total: sortedOpportunities.length,
      applyNow: verdicts.filter((verdict) => verdict === "apply_now").length,
      investigate: verdicts.filter((verdict) => verdict === "investigate").length,
      watch: verdicts.filter((verdict) => verdict === "watch").length,
      ignore: verdicts.filter((verdict) => verdict === "ignore").length,
      averageFit: average(sortedOpportunities.map((opportunity) => opportunity.score.globalFit)),
      topOpportunityId: sortedOpportunities[0]?.id ?? null,
    },
    opportunities: sortedOpportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      company: opportunity.company,
      location: opportunity.location,
      remoteType: opportunity.remoteType,
      source: opportunity.source,
      url: opportunity.url,
      status: opportunity.status,
      score: opportunity.score,
      keywords: opportunity.keywords,
      foundAt: opportunity.foundAt,
    })),
  }
}
