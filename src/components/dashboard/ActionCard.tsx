"use client"

import { Clock, Zap, TrendingUp, CheckCircle2, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionItem } from "@/types"
import { useAppStore } from "@/stores/app-store"

const energyLabel: Record<string, string> = {
  low: "Energie faible",
  medium: "Energie moyenne",
  high: "Energie elevee",
}

const impactLabel: Record<string, string> = {
  very_high: "Impact tres eleve",
  high: "Impact eleve",
  medium: "Impact moyen",
  low: "Impact faible",
}

const impactColor: Record<string, string> = {
  very_high: "text-emerald-600 bg-emerald-50",
  high: "text-violet-600 bg-violet-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-slate-500 bg-slate-50",
}

interface ActionCardProps {
  action: ActionItem
  variant?: "primary" | "secondary"
}

export function ActionCard({ action, variant = "secondary" }: ActionCardProps) {
  const { completeAction, skipAction } = useAppStore()
  const isDone = action.status === "done"
  const isSkipped = action.status === "skipped"

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-all",
        variant === "primary" && "border-violet-200 ring-1 ring-violet-100 shadow-sm",
        variant === "secondary" && "border-border",
        (isDone || isSkipped) && "opacity-60"
      )}
    >
      {variant === "primary" && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
            Action prioritaire
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-foreground leading-snug", variant === "primary" ? "text-base" : "text-sm")}>
            {isDone ? <s className="text-muted-foreground">{action.title}</s> : action.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{action.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {action.estimatedMinutes} min
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          {energyLabel[action.energyLevel]}
        </span>
        <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", impactColor[action.expectedImpact])}>
          <TrendingUp className="w-3 h-3" />
          {impactLabel[action.expectedImpact]}
        </span>
      </div>

      {!isDone && !isSkipped && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <button
            onClick={() => completeAction(action.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fait
          </button>
          <button
            onClick={() => skipAction(action.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Passer
          </button>
        </div>
      )}

      {isDone && (
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-emerald-600 font-medium">Fait aujourd&apos;hui</span>
        </div>
      )}
    </div>
  )
}
