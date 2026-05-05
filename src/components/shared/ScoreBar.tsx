import { cn } from "@/lib/utils"

interface ScoreBarProps {
  label: string
  score: number
  className?: string
}

function getBarColor(score: number): string {
  if (score >= 75) return "bg-emerald-500"
  if (score >= 55) return "bg-violet-500"
  if (score >= 35) return "bg-amber-500"
  return "bg-rose-500"
}

function getTextColor(score: number): string {
  if (score >= 75) return "text-emerald-600"
  if (score >= 55) return "text-violet-600"
  if (score >= 35) return "text-amber-600"
  return "text-rose-600"
}

export function ScoreBar({ label, score, className }: ScoreBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-semibold tabular-nums", getTextColor(score))}>
          {score}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", getBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
