"use client"

import { BookOpen, CheckCircle2, XCircle, AlertTriangle, Tag, GraduationCap } from "lucide-react"
import type { CVVersion } from "@/types"
import { ScoreRing } from "@/components/shared/ScoreRing"
import { ScoreBar } from "@/components/shared/ScoreBar"

interface CVScorePanelProps {
  cv: CVVersion
}

export function CVScorePanel({ cv }: CVScorePanelProps) {
  return (
    <div className="space-y-6">
      {/* Draft status */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-amber-800">Brouillon local/IA - non envoye</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Verifie chaque bullet avant de partager ce CV. Le contenu est editable dans l&apos;onglet Contenu.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
          Brouillon
        </span>
      </div>

      {/* Score overview */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Scores estimes du CV cible
        </h3>
        <div className="flex items-center gap-4 mb-5">
          <ScoreRing score={cv.atsScore} size="lg" label="ATS" />
          <div className="flex-1 space-y-3">
            <ScoreBar label="Lisibilite recruteur" score={cv.recruiterReadability} />
            <ScoreBar label="Coherence narrative" score={cv.narrativeCoherence} />
            <ScoreBar label="Substance / preuves" score={cv.substanceScore} />
            <ScoreBar label="Couverture mots-clés" score={cv.keywordCoverage} />
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Mots-cles estimes
        </h3>

        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">Integres ({cv.includedKeywords.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cv.includedKeywords.map((kw) => (
              <span key={kw} className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {cv.missingKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-medium text-rose-600">
                Manquants ({cv.missingKeywords.length}) - a integrer dans tes bullets
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cv.missingKeywords.map((kw) => (
                <span key={kw} className="text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ATS red flags */}
      {cv.atsRedFlags && cv.atsRedFlags.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Signaux ATS a corriger ({cv.atsRedFlags.length})
            </h3>
          </div>
          <ul className="space-y-1.5">
            {cv.atsRedFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-rose-800">
                <span className="mt-0.5 shrink-0 text-rose-400">-&gt;</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gap analysis */}
      {cv.gapAnalysis && (cv.gapAnalysis.reframe.length > 0 || cv.gapAnalysis.learn.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ecarts a relire
          </h3>
          {cv.gapAnalysis.reframe.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-violet-700">A mieux valoriser (quick wins)</span>
              </div>
              <ul className="space-y-1">
                {cv.gapAnalysis.reframe.map((item, i) => (
                  <li key={i} className="text-xs text-violet-800 bg-violet-50 border border-violet-100 rounded-lg px-3 py-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cv.gapAnalysis.learn.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">Vraies lacunes a combler</span>
              </div>
              <ul className="space-y-1">
                {cv.gapAnalysis.learn.map((item, i) => (
                  <li key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bullet improvements */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Bullets a renforcer ({cv.bulletImprovements.length})
          </h3>
        </div>
        <div className="space-y-4">
          {cv.bulletImprovements.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="rounded-lg bg-rose-50 border border-rose-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Tag className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">Avant</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">{item.original}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Apres</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">{item.improved}</p>
              </div>
              <p className="text-[11px] text-muted-foreground italic pl-1">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
