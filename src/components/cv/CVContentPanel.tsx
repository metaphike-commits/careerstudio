"use client"

import { Download, Copy, Check, Pencil, X } from "lucide-react"
import { useState } from "react"
import type { CVVersion } from "@/types"
import { useAppStore } from "@/stores/app-store"

interface CVContentPanelProps {
  cv: CVVersion
}

export function CVContentPanel({ cv }: CVContentPanelProps) {
  const { updateCVContent } = useAppStore()
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(cv.content)

  const handleCopy = () => {
    navigator.clipboard.writeText(cv.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEdit = () => {
    setDraft(cv.content)
    setIsEditing(true)
  }

  const handleSave = () => {
    updateCVContent(cv.id, draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(cv.content)
    setIsEditing(false)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{cv.title}</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Brouillon · non envoye
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Genere le {new Date(cv.createdAt).toLocaleDateString("fr-FR")} · A relire avant envoi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Enregistrer
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copie" : "Copier"}
              </button>
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium cursor-not-allowed"
                title="Export PDF non disponible dans le prototype local"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 bg-white min-h-[500px]">
        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-full min-h-[480px] text-sm text-foreground font-sans leading-relaxed resize-none outline-none border border-violet-200 rounded-lg p-3 focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
            spellCheck={false}
          />
        ) : (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {cv.content}
          </pre>
        )}
      </div>
    </div>
  )
}
