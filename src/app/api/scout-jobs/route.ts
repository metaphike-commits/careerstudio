import { NextRequest, NextResponse } from "next/server"
import type { UserProfile } from "@/types"
import { buildIndeedRSSUrl, buildSearchQueries, parseIndeedRSS, type RawScoutedJob } from "@/lib/scout-sources"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const profile = body.profile as UserProfile | undefined
    if (!profile) {
      return NextResponse.json({ error: "Profile required" }, { status: 400 })
    }

    const queries = buildSearchQueries(profile)
    const errors: string[] = []

    const results = await Promise.allSettled(
      queries.map(async ({ q, l }) => {
        const url = buildIndeedRSSUrl(q, l)
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) throw new Error(`Indeed RSS ${res.status} for "${q}"`)
        const xml = await res.text()
        return parseIndeedRSS(xml, "Indeed")
      })
    )

    const allJobs: RawScoutedJob[] = []
    const seenUrls = new Set<string>()

    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const job of result.value) {
          const key = job.url.replace(/[?#].*$/, "")
          if (!seenUrls.has(key)) {
            seenUrls.add(key)
            allJobs.push(job)
          }
        }
      } else {
        errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason))
      }
    }

    allJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())

    return NextResponse.json({ jobs: allJobs, total: allJobs.length, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
