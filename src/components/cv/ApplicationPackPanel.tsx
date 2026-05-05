"use client"

import { useState } from "react"
import { Copy, Check, Mic, MessageCircle, HelpCircle, ShieldAlert, ListChecks, BadgeCheck, AlertTriangle } from "lucide-react"
import type { ApplicationPack, JobOffer, UserProfile } from "@/types"
import { cn } from "@/lib/utils"
import { evaluateApplicationPackQuality, type PackQualityResult, type PackQualitySection } from "@/lib/application-pack-quality"

interface ApplicationPackPanelProps {
  pack: ApplicationPack
  profile?: UserProfile | null
  opportunity?: JobOffer | null
}

type Tab = "linkedin" | "pitches" | "whyyou" | "qa" | "objections" | "prep"

const tabSections: Record<Tab, PackQualitySection[]> = {
  linkedin: ["linkedin"],
  pitches: ["pitch"],
  whyyou: ["whyYou", "whyCompany"],
  qa: ["questions"],
  objections: ["objections"],
  prep: ["prep"],
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "linkedin", label: "Message LinkedIn", icon: MessageCircle },
  { id: "pitches", label: "Pitches", icon: Mic },
  { id: "whyyou", label: "Pourquoi moi ?", icon: MessageCircle },
  { id: "qa", label: "Questions", icon: HelpCircle },
  { id: "objections", label: "Objections", icon: ShieldAlert },
  { id: "prep", label: "Plan de prep", icon: ListChecks },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copié" : "Copier"}
    </button>
  )
}

function TextBlock({ content, label }: { content: string; label?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {label && (
        <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          <CopyButton text={content} />
        </div>
      )}
      <div className="p-4">
        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
      </div>
      {!label && (
        <div className="px-4 py-2 border-t border-border flex justify-end">
          <CopyButton text={content} />
        </div>
      )}
    </div>
  )
}

function BulletList({ items, color = "violet" }: { items: string[]; color?: "violet" | "rose" | "emerald" | "amber" }) {
  const colors = {
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className={cn("rounded-lg border p-3 text-sm leading-relaxed", colors[color])}>
          {item}
        </div>
      ))}
    </div>
  )
}

function QualitySummary({ quality }: { quality: PackQualityResult }) {
  const tone = quality.level === "good" ? "emerald" : quality.level === "warning" ? "amber" : "rose"
  const classes = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  }
  const Icon = quality.level === "good" ? BadgeCheck : AlertTriangle

  return (
    <div className={cn("rounded-xl border p-4", classes[tone])}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Qualite estimee du brouillon : {quality.score}/100</p>
            <p className="mt-1 text-xs leading-relaxed">
              {quality.level === "good"
                ? "Brouillon exploitable apres relecture humaine."
                : "Relis les alertes avant d'utiliser ce pack dans une vraie candidature."}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase">
          {quality.warnings.length} alerte{quality.warnings.length > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}

function SectionWarnings({
  quality,
  sections,
}: {
  quality: PackQualityResult
  sections: PackQualitySection[]
}) {
  const warnings = quality.warnings.filter((warning) => sections.includes(warning.section))
  if (warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        Aucun warning critique pour cette section. Relis quand meme avant envoi.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm leading-relaxed",
            warning.level === "critical"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          )}
        >
          <span className="font-semibold">
            {warning.level === "critical" ? "Critique" : "A verifier"} :
          </span>{" "}
          {warning.message}
        </div>
      ))}
    </div>
  )
}

export function ApplicationPackPanel({ pack, profile, opportunity }: ApplicationPackPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("linkedin")
  const quality = evaluateApplicationPackQuality(pack, { profile, opportunity })

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-border px-4 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors shrink-0",
                activeTab === tab.id
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="px-5 pt-4 shrink-0">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">Brouillon de candidature a relire</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Ces elements peuvent venir d&apos;un fallback local ou d&apos;une IA sauvegardee. Ils restent a relire.
                La candidature, le contact et la relance restent a confirmer manuellement dans le pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-full">
                A relire
              </span>
              <span className="text-[10px] font-bold bg-card text-muted-foreground border border-border px-2 py-1 rounded-full">
                Pas envoye
              </span>
              <span className="text-[10px] font-bold bg-card text-muted-foreground border border-border px-2 py-1 rounded-full">
                Source a verifier
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <QualitySummary quality={quality} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <SectionWarnings quality={quality} sections={tabSections[activeTab]} />

        {activeTab === "linkedin" && (
          <TextBlock content={pack.linkedInMessage} />
        )}

        {activeTab === "pitches" && (
          <>
            <TextBlock content={pack.pitch30s} label="Pitch 30 secondes" />
            <TextBlock content={pack.pitch60s} label="Pitch 60 secondes" />
          </>
        )}

        {activeTab === "whyyou" && (
          <>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-2">Pourquoi vous ?</p>
              <pre className="text-sm text-violet-900 whitespace-pre-wrap font-sans leading-relaxed">{pack.whyYou}</pre>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pourquoi cette entreprise ?</p>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{pack.whyCompany}</pre>
            </div>
          </>
        )}

        {activeTab === "qa" && (
          <div className="space-y-2">
            {pack.probableQuestions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "objections" && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Ces objections sont probables en entretien. Prépare une réponse honnête et confiante pour chacune.
            </p>
            <BulletList items={pack.probableObjections} color="rose" />
          </>
        )}

        {activeTab === "prep" && (
          <div className="space-y-2">
            {pack.miniPrepPlan.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-violet-200 transition-colors group">
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-violet-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-violet-600">{i + 1}</span>
                </div>
                <span className="text-sm text-foreground leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
