"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Lightbulb,
  Mic,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import { computeDailyActions, computeDailyInsight } from "@/lib/daily-actions"
import { mockPipelineJobs } from "@/data/mock-applications"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  disabled?: boolean
  badge?: string | number
}

function getInitials(name: string | undefined) {
  if (!name) return "HB"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "HB"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function Sidebar() {
  const pathname = usePathname()
  const {
    applications,
    applicationEvents,
    aiConsentAcceptedAt,
    aiEnabled,
    disableAI,
    enableAI,
    networkContacts,
    opportunities,
    profile,
    sidebarCollapsed,
    theme,
    toggleTheme,
    toggleSidebar,
  } = useAppStore()
  const [now] = useState(() => new Date())
  const [showAIConsent, setShowAIConsent] = useState(false)

  const dailyActions = useMemo(
    () =>
      computeDailyActions(
        applications,
        applicationEvents,
        networkContacts,
        opportunities,
        mockPipelineJobs,
        now
      ),
    [applications, applicationEvents, networkContacts, opportunities, now]
  )

  const dailyTip = useMemo(
    () => computeDailyInsight(applications, applicationEvents, networkContacts, now),
    [applications, applicationEvents, networkContacts, now]
  )

  const pendingActionCount = dailyActions.length
  const displayName = profile?.name || "Hamza"
  const initials = getInitials(displayName)
  const isDark = theme === "dark"

  const handleAIToggle = () => {
    if (aiEnabled) {
      disableAI()
      return
    }

    if (!aiConsentAcceptedAt) {
      setShowAIConsent(true)
      return
    }

    enableAI()
  }

  const confirmAI = () => {
    enableAI()
    setShowAIConsent(false)
  }

  const navItems: NavItem[] = [
    { href: "/", label: "Tableau de bord", icon: BarChart3, badge: pendingActionCount },
    { href: "/#daily-brief", label: "Daily Brief", icon: CalendarCheck },
    { href: "/opportunites", label: "Opportunites", icon: Briefcase },
    { href: "/candidatures", label: "Candidatures", icon: ClipboardList },
    { href: "/cv", label: "CV Builder ATS", icon: FileText },
    { href: "/entretiens", label: "Entretiens & Coaching", icon: Mic },
    { href: "/reseau", label: "Reseau & Contacts", icon: Users },
    { href: "/memoire", label: "Memoire", icon: FileText },
    { href: "/progression", label: "Analyse & Stats", icon: BarChart3 },
    { href: "/profil", label: "Profil", icon: User },
    { href: "/onboarding", label: "Importer mon CV", icon: FileText },
  ]

  return (
    <aside
      className={cn(
        "relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#071024] text-slate-200 shadow-2xl transition-[width] duration-300 ease-in-out dark:bg-[#070b18]",
        sidebarCollapsed ? "w-20" : "w-[264px]"
      )}
    >
      <div
        className={cn(
          "flex items-center",
          sidebarCollapsed ? "flex-col justify-center gap-2 px-2 py-4" : "justify-between px-4 py-6"
        )}
      >
        <Link href="/" className={cn("flex items-center gap-3 min-w-0", sidebarCollapsed && "mx-auto")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-950/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight text-white">JobPilot AI</p>
              <p className="truncate text-xs font-medium text-slate-400">Votre copilote carriere</p>
            </div>
          )}
        </Link>

        <button
          onClick={toggleSidebar}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 shadow-sm transition-colors hover:bg-white/10 hover:text-white",
            "h-8 w-8"
          )}
          aria-label={sidebarCollapsed ? "Agrandir le menu" : "Reduire le menu"}
          title={sidebarCollapsed ? "Agrandir le menu" : "Reduire le menu"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            !item.disabled &&
            (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 opacity-75",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.label : undefined}
                aria-disabled="true"
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          }

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-violet-600/35 text-white shadow-lg shadow-violet-950/20 ring-1 ring-violet-400/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-violet-200" : "text-slate-400")} />
              {!sidebarCollapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && Number(item.badge) > 0 && (
                    <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 px-4 py-4">
        {!sidebarCollapsed && (
          <>
            <div className="rounded-2xl border border-indigo-300/15 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Controles
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAIToggle}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    aiEnabled
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15"
                      : "border-indigo-300/15 bg-white/[0.035] text-slate-300 hover:bg-white/[0.08]"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ShieldCheck className={cn("h-4 w-4 shrink-0", aiEnabled ? "text-emerald-300" : "text-slate-400")} />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold">
                        {aiEnabled ? "IA activee" : "IA desactivee"}
                      </span>
                      <span className="block truncate text-[10px] font-semibold text-slate-500">
                        {aiEnabled ? "Cle serveur requise" : "Fallback local"}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      aiEnabled ? "bg-emerald-500" : "bg-slate-700"
                    )}
                    aria-hidden="true"
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        aiEnabled ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-300/15 bg-white/[0.035] px-3 py-2.5 text-left text-slate-300 transition-colors hover:bg-white/[0.08]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {isDark ? (
                      <Moon className="h-4 w-4 shrink-0 text-violet-300" />
                    ) : (
                      <Sun className="h-4 w-4 shrink-0 text-amber-300" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold">
                        {isDark ? "Mode nuit" : "Mode clair"}
                      </span>
                      <span className="block truncate text-[10px] font-semibold text-slate-500">
                        Theme global
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      isDark ? "bg-violet-500" : "bg-slate-700"
                    )}
                    aria-hidden="true"
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        isDark ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </span>
                </button>
              </div>
            </div>

            <Link
              href="/profil"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-sm font-bold text-slate-950">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-xs text-slate-400">Voir mon profil</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </Link>

            <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-violet-700/25 to-amber-500/15 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-300/15">
                  <Lightbulb className="h-4 w-4 text-amber-300" />
                </div>
                <p className="text-sm font-bold text-white">Conseil du jour</p>
              </div>
              <p className="line-clamp-5 text-xs leading-relaxed text-slate-200">
                {dailyTip}
              </p>
            </div>
          </>
        )}

        {sidebarCollapsed && (
          <div className="grid gap-2">
            <button
              type="button"
              onClick={handleAIToggle}
              className={cn(
                "flex h-11 w-full items-center justify-center rounded-xl border transition-colors",
                aiEnabled
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white"
              )}
              title={aiEnabled ? "IA activee" : "Activer l'IA"}
              aria-label={aiEnabled ? "IA activee" : "Activer l'IA"}
            >
              <ShieldCheck className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              title={isDark ? "Mode clair" : "Mode nuit"}
              aria-label={isDark ? "Mode clair" : "Mode nuit"}
            >
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        )}

        <Link
          href="/parametres"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
            sidebarCollapsed && "justify-center px-2"
          )}
          title={sidebarCollapsed ? "Parametres" : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span>Parametres</span>}
        </Link>

        {!sidebarCollapsed && (
          <div className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Local-first workspace
          </div>
        )}
      </div>

      {showAIConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-950">Activer l&apos;IA</p>
                  <p className="text-sm font-semibold text-slate-500">Consentement local</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAIConsent(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm font-semibold leading-relaxed text-slate-700">
              En activant l&apos;IA, certaines donnees peuvent etre envoyees au provider configure
              dans .env.local, par exemple OpenAI ou Anthropic. Cela peut inclure ton CV, ton
              profil, l&apos;offre selectionnee ou des elements de preparation. Tu peux desactiver
              l&apos;IA a tout moment.
            </p>
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-800">
              Aucune cle API n&apos;est stockee cote client, et aucun appel IA automatique n&apos;est lance.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowAIConsent(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmAI}
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700"
              >
                Activer l&apos;IA
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
