import { cn } from "@/lib/utils"
import type { Verdict } from "@/types"

interface VerdictBadgeProps {
  verdict: Verdict
  className?: string
}

const verdictConfig: Record<Verdict, { label: string; className: string; dot: string }> = {
  apply_now: {
    label: "Candidater maintenant",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  investigate: {
    label: "Investiguer d'abord",
    className: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  watch: {
    label: "Garder en veille",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  ignore: {
    label: "Passer",
    className: "bg-slate-50 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  const config = verdictConfig[verdict]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  )
}
