"use client"

import { useState } from "react"
import { ChevronRight, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { JobOffer } from "@/types"
import { CompanyLogo } from "@/components/shared/CompanyLogo"

interface OpportunityListItemProps {
  opportunity: JobOffer
  isSelected: boolean
  onClick: () => void
}

const remoteLabel = {
  remote: "Remote",
  hybrid: "Hybride",
  onsite: "Presentiel",
}

const remoteClass = {
  remote: "bg-emerald-50 text-emerald-700",
  hybrid: "bg-violet-50 text-violet-700",
  onsite: "bg-slate-100 text-slate-600",
}

function fitLabel(score: number) {
  if (score >= 80) return "Excellent fit"
  if (score >= 60) return "Bon fit"
  return "Fit moyen"
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700"
  if (score >= 60) return "bg-amber-50 text-amber-700"
  return "bg-slate-100 text-slate-600"
}

function fitTone(score: number) {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-slate-500"
}

function priorityLabel(score: number) {
  if (score >= 80) return "Haute priorite"
  if (score >= 60) return "Priorite moyenne"
  return "Faible priorite"
}

function priorityTone(score: number) {
  if (score >= 80) return "bg-rose-50 text-rose-600"
  if (score >= 60) return "bg-amber-50 text-amber-700"
  return "bg-slate-100 text-slate-500"
}

export function OpportunityListItem({ opportunity, isSelected, onClick }: OpportunityListItemProps) {
  const [now] = useState(() => new Date())
  const score = opportunity.score.globalFit
  const postedDaysAgo = Math.max(
    0,
    Math.floor((now.getTime() - new Date(opportunity.postedAt).getTime()) / 86_400_000)
  )

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full border-b border-slate-100 bg-white px-4 py-4 text-left transition-all hover:bg-slate-50",
        isSelected && "border-l-2 border-l-violet-600 bg-violet-50/70"
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo
          company={opportunity.company}
          logoUrl={opportunity.logoUrl}
          size="lg"
          className="h-12 w-12 rounded-xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold leading-snug text-slate-950">
                {opportunity.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="truncate">{opportunity.company}</span>
                <span className="text-slate-300">•</span>
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{opportunity.location}</span>
                </span>
              </div>
            </div>

            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", priorityTone(score))}>
                  {priorityLabel(score)}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", remoteClass[opportunity.remoteType])}>
                  {remoteLabel[opportunity.remoteType]}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-500">
                Publie il y a {postedDaysAgo}j
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className={cn("inline-flex rounded-lg px-3 py-1 text-lg font-black leading-none", scoreTone(score))}>
                {score}
              </span>
              <p className={cn("mt-1 text-[11px] font-bold", fitTone(score))}>
                {fitLabel(score)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
