"use client"

import { MapPin, ArrowRight } from "lucide-react"
import type { JobOffer } from "@/types"
import { VerdictBadge } from "@/components/shared/VerdictBadge"
import { ScoreRing } from "@/components/shared/ScoreRing"
import { CompanyLogo } from "@/components/shared/CompanyLogo"
import { useAppStore } from "@/stores/app-store"
import { useRouter } from "next/navigation"

interface OpportunityMiniCardProps {
  opportunity: JobOffer
  rank: number
}

const remoteLabel = {
  remote: "100% Remote",
  hybrid: "Hybride",
  onsite: "Presentiel",
}

export function OpportunityMiniCard({ opportunity, rank }: OpportunityMiniCardProps) {
  const { setSelectedOpportunity } = useAppStore()
  const router = useRouter()

  const handleClick = () => {
    setSelectedOpportunity(opportunity.id)
    router.push("/opportunites")
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-violet-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[11px] font-bold text-violet-600">#{rank}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate leading-snug">
                {opportunity.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CompanyLogo company={opportunity.company} logoUrl={opportunity.logoUrl} size="sm" />
                  {opportunity.company}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {remoteLabel[opportunity.remoteType]}
                </span>
              </div>
            </div>
            <ScoreRing score={opportunity.score.globalFit} size="sm" />
          </div>

          <div className="flex items-center justify-between mt-3">
            <VerdictBadge verdict={opportunity.score.verdict} />
            <span className="text-xs text-muted-foreground group-hover:text-violet-600 flex items-center gap-0.5 transition-colors">
              Voir <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
