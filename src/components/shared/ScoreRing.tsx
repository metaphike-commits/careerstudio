"use client"

import { cn } from "@/lib/utils"

interface ScoreRingProps {
  score: number
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

const sizeConfig = {
  sm: { container: 44, stroke: 4, fontSize: "text-xs", labelSize: "text-[9px]" },
  md: { container: 60, stroke: 5, fontSize: "text-sm", labelSize: "text-[10px]" },
  lg: { container: 80, stroke: 6, fontSize: "text-base", labelSize: "text-xs" },
}

function getScoreColor(score: number): string {
  if (score >= 75) return "oklch(0.696 0.170 162)"   // emerald
  if (score >= 55) return "oklch(0.558 0.215 281)"   // violet
  if (score >= 35) return "oklch(0.769 0.170 70)"    // amber
  return "oklch(0.645 0.210 16)"                       // rose
}

function getTextColorClass(score: number): string {
  if (score >= 75) return "text-emerald-600"
  if (score >= 55) return "text-violet-600"
  if (score >= 35) return "text-amber-600"
  return "text-rose-600"
}

export function ScoreRing({ score, size = "md", label, className }: ScoreRingProps) {
  const cfg = sizeConfig[size]
  const radius = (cfg.container - cfg.stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = cfg.container / 2

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: cfg.container, height: cfg.container }}>
        <svg
          width={cfg.container}
          height={cfg.container}
          viewBox={`0 0 ${cfg.container} ${cfg.container}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={cfg.stroke}
            className="text-muted/40"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth={cfg.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold leading-none", cfg.fontSize, getTextColorClass(score))}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className={cn("text-muted-foreground text-center leading-tight", cfg.labelSize)}>
          {label}
        </span>
      )}
    </div>
  )
}
