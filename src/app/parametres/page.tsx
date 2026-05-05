"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eye,
  PlayCircle,
  RotateCcw,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { cn } from "@/lib/utils"
import { createOpportunitySnapshot } from "@/lib/opportunity-snapshot"
import { PageHeader, PageShell, PremiumCard } from "@/components/shared/PageShell"
import { getDataBoundary } from "@/lib/privacy-boundaries"

function SettingCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <PremiumCard>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      {children}
    </PremiumCard>
  )
}

export default function ParametresPage() {
  const store = useAppStore()
  const router = useRouter()
  const [exported, setExported] = useState(false)
  const [snapshotExported, setSnapshotExported] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [freshConfirm, setFreshConfirm] = useState(false)
  const cvBoundary = getDataBoundary("cv-targeting")
  const profileBoundary = getDataBoundary("profile-intelligence")

  const downloadJson = (payload: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportLocalData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      appMode: store.appMode,
      onboardingDone: store.onboardingDone,
      profile: store.profile,
      masterCV: store.masterCV,
      opportunities: store.opportunities,
      applications: store.applications,
      applicationEvents: store.applicationEvents,
      networkContacts: store.networkContacts,
      memoryItems: store.memoryItems,
      actions: store.actions,
    }
    downloadJson(payload, `careerstudio-export-${new Date().toISOString().slice(0, 10)}.json`)
    setExported(true)
    setTimeout(() => setExported(false), 1800)
  }

  const exportOpportunitySnapshot = () => {
    const snapshot = createOpportunitySnapshot({
      opportunities: store.opportunities,
      profile: store.profile,
    })
    downloadJson(snapshot, `careerstudio-opportunity-snapshot-${new Date().toISOString().slice(0, 10)}.json`)
    setSnapshotExported(true)
    setTimeout(() => setSnapshotExported(false), 1800)
  }

  const resetDemo = () => {
    store.resetDemoData()
    setResetDone(true)
    setTimeout(() => setResetDone(false), 1800)
  }

  const handleStartFresh = () => {
    if (!freshConfirm) {
      setFreshConfirm(true)
      return
    }
    store.startFresh()
    router.push("/onboarding")
  }

  const clearLocalStorage = () => {
    const confirmed = window.confirm(
      "Supprimer toutes les données locales CareerStudio dans ce navigateur ? Cette action est irreversible."
    )
    if (!confirmed) return

    localStorage.removeItem("careerstudio-store")
    window.location.reload()
  }

  return (
    <PageShell size="md">
      <PageHeader
        title="Paramètres"
        subtitle="Contrôle local, confidentialité et mode de démonstration."
      />

      <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 shadow-[0_12px_34px_rgba(16,185,129,0.08)]">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Confidentialité locale
            </p>
            <p className="text-sm text-emerald-900 mt-1 leading-relaxed">
              Cette version stocke les données dans le navigateur via localStorage.
              Aucun backend, Gmail, calendrier, ATS ou LLM réel n&apos;est connecté.
            </p>
          </div>
        </div>
      </div>

      <SettingCard
        title="Démarrer avec mes vraies données"
        description="Efface toutes les données de démonstration et repart d'une ardoise vierge. Vous serez redirigé vers l'import de votre CV."
        icon={PlayCircle}
      >
        {store.appMode === "real" ? (
          <p className="text-xs text-emerald-700 font-medium">Vous êtes déjà en mode réel.</p>
        ) : (
          <div className="space-y-2">
            {freshConfirm && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Toutes les données demo seront supprimées. Cliquez à nouveau pour confirmer.
              </p>
            )}
            <button
              onClick={handleStartFresh}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                freshConfirm
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
              )}
            >
              <PlayCircle className="w-4 h-4" />
              {freshConfirm ? "Confirmer et démarrer" : "Démarrer avec mes données"}
            </button>
          </div>
        )}
      </SettingCard>

      <SettingCard
        title="Mode d'utilisation"
        description="Le mode démo utilise les données exemples. Le mode réel indique que tu travailles avec tes propres données locales."
        icon={Eye}
      >
        <div className="grid grid-cols-2 gap-2">
          {(["demo", "real"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => store.setAppMode(mode)}
              className={cn(
                "px-4 py-3 rounded-lg border text-sm font-semibold transition-colors",
                store.appMode === mode
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {mode === "demo" ? "Mode démo" : "Mode réel local"}
            </button>
          ))}
        </div>
      </SettingCard>

      <SettingCard
        title="IA et consentement"
        description="Les appels IA sont toujours déclenchés par action utilisateur, avec confirmation avant envoi."
        icon={Server}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[profileBoundary, cvBoundary].map((boundary) => (
            <div key={boundary.id} className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm font-black text-violet-950">{boundary.title}</p>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-violet-800">
                Clé API et crédits requis. Le statut provider est vérifié au moment de l&apos;appel.
              </p>
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-violet-600">
                  Envoyé si confirmé
                </p>
                {boundary.apiSentData.slice(0, 2).map((item) => (
                  <p key={item} className="text-xs font-semibold text-violet-800">
                    - {item}
                  </p>
                ))}
              </div>
              {boundary.fallbackAvailable && (
                <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-bold text-violet-700">
                  Fallback local disponible si l&apos;API est absente ou sans crédits.
                </p>
              )}
            </div>
          ))}
        </div>
      </SettingCard>

      <SettingCard
        title="Données locales"
        description="Exporte une sauvegarde JSON ou remets les données démo à zéro avant un nouveau test."
        icon={Database}
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportLocalData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            {exported ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4" />}
            {exported ? "Export prêt" : "Exporter JSON"}
          </button>
          <button
            onClick={resetDemo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
          >
            {resetDone ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            {resetDone ? "Démo restaurée" : "Reset démo"}
          </button>
          <button
            onClick={clearLocalStorage}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer localStorage
          </button>
        </div>
      </SettingCard>

      <SettingCard
        title="Snapshot opportunites scorees"
        description="Exporte uniquement le profil de scoring, les opportunites triees par fit, les scores detailles et les compteurs de verdict."
        icon={Download}
      >
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Opportunites</p>
              <p className="font-bold text-foreground">{store.opportunities.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">A candidater</p>
              <p className="font-bold text-emerald-600">
                {store.opportunities.filter((opportunity) => opportunity.score.verdict === "apply_now").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fit moyen</p>
              <p className="font-bold text-violet-600">
                {store.opportunities.length === 0
                  ? 0
                  : Math.round(
                      store.opportunities.reduce(
                        (sum, opportunity) => sum + opportunity.score.globalFit,
                        0
                      ) / store.opportunities.length
                    )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mode</p>
              <p className="font-bold text-foreground">{store.appMode === "real" ? "Réel" : "Démo"}</p>
            </div>
          </div>
          <button
            onClick={exportOpportunitySnapshot}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
          >
            {snapshotExported ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {snapshotExported ? "Snapshot exporte" : "Exporter snapshot"}
          </button>
        </div>
      </SettingCard>

      <SettingCard
        title="Onboarding"
        description="Controle si le prototype doit afficher l'import CV au prochain passage ou rester en iteration rapide."
        icon={RotateCcw}
      >
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Onboarding {store.onboardingDone ? "terminé" : "à afficher"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Désactive pour simuler une premiere utilisation.
            </p>
          </div>
          <button
            onClick={() => store.setOnboardingDone(!store.onboardingDone)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              store.onboardingDone
                ? "bg-violet-100 text-violet-700"
                : "bg-amber-100 text-amber-800"
            )}
          >
            {store.onboardingDone ? "Forcer onboarding" : "Marquer terminé"}
          </button>
        </div>
      </SettingCard>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Limite prototype
            </p>
            <p className="text-sm text-amber-900 mt-1 leading-relaxed">
              Les générations de CV, packs et réponses copilote restent mockées.
              Elles aident à valider le workflow, pas à envoyer des données vers un service externe.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}


