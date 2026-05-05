import type { UserProfile } from "@/types"

export interface RawScoutedJob {
  title: string
  company: string
  location: string
  url: string
  description: string
  postedAt: string
  source: string
}

export interface ScoutStats {
  fetched: number
  dedupedLocally: number
  imported: number
  errors: string[]
}

export function buildSearchQueries(profile: UserProfile): Array<{ q: string; l: string }> {
  const locations = profile.preferredLocations.filter(
    (loc) => !loc.toLowerCase().includes("remote")
  )
  const location = locations[0] ?? "France"

  return profile.targetTitles.slice(0, 5).map((title) => ({ q: title, l: location }))
}

export function buildIndeedRSSUrl(q: string, l: string): string {
  const params = new URLSearchParams({ q, l, sort: "date", fromage: "7", limit: "15" })
  return `https://fr.indeed.com/rss?${params}`
}

function extractCDATA(raw: string): string {
  const m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  if (m) return m[1].trim()
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))
  return m ? extractCDATA(m[1]) : ""
}

export function parseIndeedRSS(xml: string, sourceLabel = "Indeed"): RawScoutedJob[] {
  const jobs: RawScoutedJob[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null

  while ((m = itemRegex.exec(xml)) !== null) {
    const item = m[1]
    const title = extractTag(item, "title")
    const url = extractTag(item, "link") || extractTag(item, "guid")
    if (!title || !url) continue

    const company = extractTag(item, "source")
    const description = extractTag(item, "description")
    const pubDate = extractTag(item, "pubDate")
    const location = extractTag(item, "location")

    let postedAt = new Date().toISOString()
    if (pubDate) {
      const parsed = new Date(pubDate)
      if (!isNaN(parsed.getTime())) postedAt = parsed.toISOString()
    }

    jobs.push({
      title: title.replace(/\s+/g, " ").trim(),
      company: company.trim(),
      location: location.trim(),
      url,
      description: description.replace(/\s+/g, " ").trim(),
      postedAt,
      source: sourceLabel,
    })
  }

  return jobs
}
