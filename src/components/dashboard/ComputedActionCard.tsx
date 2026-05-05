"use client"

import Link from "next/link"
import { Clock, Zap, TrendingUp, ArrowRight, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ComputedAction } from "@/lib/daily-actions"

const energyLabel: Record<string, string> = {
  low: "Énergie faible",
  medium: "Énergie moyenne",
  high: "Énergie élevée",
}

const impactLabel: Record<string, string> = {
  very_high: "Impact très élevé",
  high: "Impact élevé",
  medium: "Impact moyen",
  low: "Impact faible",
}

const impactColor: Record<string, string> = {
  very_high: "text-emerald-600 bg-emerald-50",
  high: "text-violet-600 bg-violet-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-slate-500 bg-slate-50",
}

const priorityRing: Record<string, string> = {
  critical: "border-rose-200 ring-1 ring-rose-100 shadow-sm",
  high: "border-violet-200 ring-1 ring-violet-100 shadow-sm",
  medium: "border-border",
  low: "border-border",
}

interface ComputedActionCardProps {
  action: ComputedAction
  variant?: "primary" | "secondary"
}

export function ComputedActionCard({ action, variant = "secondary" }: ComputedActionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-all",
        variant === "primary" ? priorityRing[action.priority] : "border-border"
      )}
    >
      {variant === "primary" && (
        <div className="flex items-center gap-2 mb-3">
          {action.priority === "critical" ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                Action urgente
              </span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
                Action prioritaire
              </span>
            </>
          )}
          {action.urgencyLabel && (
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
              {action.urgencyLabel}
            </span>
          )}
        </div>
      )}

      {variant === "secondary" && action.urgencyLabel && (
        <div className="mb-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            {action.urgencyLabel}
          </span>
        </div>
      )}

      <h3
        className={cn(
          "font-semibold text-foreground leading-snug",
          variant === "primary" ? "text-base" : "text-sm"
        )}
      >
        {action.title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{action.description}</p>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {action.estimatedMinutes} min
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          {energyLabel[action.energyLevel]}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
            impactColor[action.expectedImpact]
          )}
        >
          <TrendingUp className="w-3 h-3" />
          {impactLabel[action.expectedImpact]}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors"
        >
          Ouvrir
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
