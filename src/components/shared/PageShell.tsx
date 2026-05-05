import { cn } from "@/lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  size?: "md" | "lg" | "xl" | "full"
}

const sizeClass = {
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  full: "max-w-none",
}

export function PageShell({
  children,
  className,
  contentClassName,
  size = "xl",
}: PageShellProps) {
  return (
    <div className={cn("app-premium-bg min-h-full px-6 py-6", className)}>
      <div className={cn("mx-auto w-full space-y-6", sizeClass[size], contentClassName)}>
        {children}
      </div>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  eyebrow?: string
  className?: string
}

export function PageHeader({ title, subtitle, children, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            {eyebrow}
          </p>
        )}
        <h1 className="premium-text text-[32px] font-black leading-tight tracking-[-0.035em]">
          {title}
        </h1>
        {subtitle && (
          <p className="premium-text-muted mt-2 max-w-3xl text-base font-bold leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

interface PremiumCardProps {
  children: React.ReactNode
  className?: string
  as?: "div" | "section" | "article" | "aside"
}

export function PremiumCard({ children, className, as: Component = "section" }: PremiumCardProps) {
  return (
    <Component
      className={cn(
        "premium-surface rounded-[26px] border p-5",
        className
      )}
    >
      {children}
    </Component>
  )
}

interface MetricTileProps {
  label: string
  value: string | number
  subtitle?: string
  tone?: "slate" | "violet" | "emerald" | "amber" | "rose" | "blue"
  icon?: React.ElementType
}

export function MetricTile({ label, value, subtitle, tone = "slate", icon: Icon }: MetricTileProps) {
  const toneClass = {
    slate: "text-slate-950 bg-slate-50",
    violet: "text-violet-700 bg-violet-50",
    emerald: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    rose: "text-rose-700 bg-rose-50",
    blue: "text-blue-700 bg-blue-50",
  }

  return (
    <div className="premium-surface rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="premium-text-muted text-sm font-black uppercase tracking-[0.08em]">{label}</p>
          <p className={cn("mt-3 text-3xl font-black leading-none tracking-[-0.04em]", toneClass[tone].split(" ")[0])}>
            {value}
          </p>
          {subtitle && <p className="premium-text-muted mt-2 text-sm font-bold">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", toneClass[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}

export const premiumButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"

export const secondaryButton =
  "premium-surface inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold premium-text-soft transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
