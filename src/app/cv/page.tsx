"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Sparkles, Calendar } from "lucide-react"
import { CVScorePanel } from "@/components/cv/CVScorePanel"
import { CVContentPanel } from "@/components/cv/CVContentPanel"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"

function CVPageContent() {
  const searchParams = useSearchParams()
  const { cvVersions } = useAppStore()
  const jobId = searchParams.get("job")
  const defaultCV = cvVersions.find((cv) => cv.jobOfferId === jobId) ?? cvVersions[0]
  const [selectedCVId, setSelectedCVId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"content" | "scores">("scores")
  const selectedCV = cvVersions.find((cv) => cv.id === selectedCVId) ?? defaultCV

  return (
    <div className="flex h-full app-premium-bg p-6">
      <div className="w-80 shrink-0 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950">CV ciblés & ATS</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {cvVersions.length} CV generes
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {cvVersions.map((cv) => (
            <button
              key={cv.id}
              onClick={() => setSelectedCVId(cv.id)}
              className={cn(
                "w-full text-left p-3 rounded-2xl transition-all",
                selectedCV.id === cv.id
                  ? "bg-violet-50 border border-violet-200 shadow-sm"
                  : "hover:bg-slate-50 border border-transparent"
              )}
            >
              <div className="flex items-start gap-2.5">
                <FileText
                  className={cn(
                    "w-4 h-4 mt-0.5 shrink-0",
                    selectedCV.id === cv.id ? "text-violet-600" : "text-muted-foreground"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950 leading-snug truncate">
                    {cv.title}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(cv.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded">
                      ATS {cv.atsScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {cv.keywordCoverage}% kw
                    </span>
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      Brouillon
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          <button
            disabled
            className="w-full mt-2 p-3 rounded-lg border border-dashed border-border bg-muted/30 cursor-not-allowed opacity-80"
            title="Generation non connectee dans le prototype local"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Generation mockee
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="ml-6 min-w-0 flex-1 overflow-y-auto rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        {selectedCV ? (
          <div>
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-6 z-10">
              <div className="flex gap-0">
                {[
                  { id: "scores", label: "Analyse & Scores" },
                  { id: "content", label: "Contenu du CV" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as "content" | "scores")}
                    className={cn(
                      "px-4 py-4 text-sm font-black border-b-[3px] transition-colors",
                      activeTab === tab.id
                        ? "border-violet-600 text-violet-600"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === "scores" ? (
                <CVScorePanel cv={selectedCV} />
              ) : (
                <CVContentPanel cv={selectedCV} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Selectionne un CV</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CVPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Chargement du CV...</div>}>
      <CVPageContent />
    </Suspense>
  )
}
