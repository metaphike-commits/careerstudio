"use client"

import { AlertTriangle, CheckCircle2, Lock, Server, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DataBoundary } from "@/lib/privacy-boundaries"

interface ConsentDialogProps {
  boundary: DataBoundary
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  isLoading?: boolean
}

function ListBlock({
  title,
  items,
  tone,
  icon: Icon,
}: {
  title: string
  items: string[]
  tone: "local" | "sent" | "blocked"
  icon: React.ElementType
}) {
  const styles = {
    local: "border-emerald-200 bg-emerald-50 text-emerald-800",
    sent: "border-violet-200 bg-violet-50 text-violet-800",
    blocked: "border-slate-200 bg-slate-50 text-slate-700",
  }

  return (
    <div className={cn("rounded-2xl border p-4", styles[tone])}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-sm font-black">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ConsentDialog({
  boundary,
  open,
  onCancel,
  onConfirm,
  isLoading = false,
}: ConsentDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
              <Lock className="h-3.5 w-3.5" />
              Consentement requis
            </div>
            <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">{boundary.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              Cette action peut envoyer un payload limité à un provider IA configuré. Rien n&apos;est
              persisté côté serveur par CareerStudio.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3">
          <ListBlock title="Reste local" items={boundary.localData} tone="local" icon={CheckCircle2} />
          <ListBlock title="Envoyé au provider IA si tu confirmes" items={boundary.apiSentData} tone="sent" icon={Server} />
          <ListBlock title="Non envoyé dans cet appel" items={boundary.notSentData} tone="blocked" icon={Lock} />
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-black text-amber-900">Provider et crédits requis</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-800">
                Si aucune clé API ou aucun crédit n&apos;est disponible, l&apos;app affichera une erreur claire
                et gardera le fallback local quand il existe.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            J&apos;accepte et je lance l&apos;IA
          </button>
        </div>
      </div>
    </div>
  )
}



