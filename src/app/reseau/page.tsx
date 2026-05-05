"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Link2,
  MessageSquare,
  Pencil,
  Plus,
  Reply,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { mockPipelineJobs } from "@/data/mock-applications"
import {
  buildNetworkDraftSuggestion,
  getNetworkSignal,
  sortContactsByNetworkPriority,
} from "@/lib/network-layer"
import { cn } from "@/lib/utils"
import type { NetworkContact, NetworkContactStatus } from "@/types"
import {
  MetricTile,
  PageHeader,
  PageShell,
  PremiumCard,
  premiumButton,
  secondaryButton,
} from "@/components/shared/PageShell"

const statusConfig: Record<NetworkContactStatus, { label: string; className: string }> = {
  identified: { label: "Identifie", className: "bg-slate-100 text-slate-600" },
  message_prepared: { label: "Message prepare", className: "bg-violet-100 text-violet-700" },
  contacted: { label: "Contacte", className: "bg-blue-100 text-blue-700" },
  replied: { label: "Reponse recue", className: "bg-emerald-100 text-emerald-700" },
  archived: { label: "Archive", className: "bg-slate-50 text-slate-400" },
}

const signalTone = {
  ready_to_send: "border-violet-200 bg-violet-50 text-violet-900",
  follow_up_due: "border-amber-200 bg-amber-50 text-amber-900",
  waiting: "border-blue-100 bg-blue-50 text-blue-900",
  replied: "border-emerald-200 bg-emerald-50 text-emerald-900",
  identified: "border-slate-200 bg-slate-50 text-slate-800",
  archived: "border-slate-100 bg-slate-50 text-slate-500",
}

function CopyDraftButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copie" : "Copier"}
    </button>
  )
}

type ContactFormState = Pick<
  NetworkContact,
  | "name"
  | "company"
  | "role"
  | "messageDraft"
  | "notes"
  | "status"
  | "linkedJobOfferId"
  | "linkedApplicationId"
>

const emptyContactForm: ContactFormState = {
  name: "",
  company: "",
  role: "",
  messageDraft: "",
  notes: "",
  status: "message_prepared",
  linkedJobOfferId: null,
  linkedApplicationId: null,
}

type StatusFilter = NetworkContactStatus | "all" | "actionable"

export default function ReseauPage() {
  const {
    networkContacts,
    addNetworkContact,
    updateNetworkContact,
    confirmContacted,
    markContactReplied,
    opportunities,
    applications,
  } = useAppStore()
  const [now] = useState(() => new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [form, setForm] = useState<ContactFormState>(emptyContactForm)

  const contactSignals = useMemo(
    () => networkContacts.map((contact) => ({ contact, signal: getNetworkSignal(contact, now) })),
    [networkContacts, now]
  )
  const preparedCount = networkContacts.filter((contact) => contact.status === "message_prepared").length
  const contactedCount = networkContacts.filter((contact) => contact.status === "contacted").length
  const repliedCount = networkContacts.filter((contact) => contact.status === "replied").length
  const actionableCount = contactSignals.filter(({ signal }) => signal.isActionable).length
  const linkedCount = contactSignals.filter(({ signal }) => signal.hasPipelineLink).length
  const sortedContacts = useMemo(
    () => sortContactsByNetworkPriority(networkContacts, now),
    [networkContacts, now]
  )
  const filteredContacts = sortedContacts.filter((contact) => {
    const signal = getNetworkSignal(contact, now)
    if (statusFilter === "all") return true
    if (statusFilter === "actionable") return signal.isActionable
    return contact.status === statusFilter
  })
  const topSignal = sortedContacts.length > 0 ? getNetworkSignal(sortedContacts[0], now) : null

  const getApplicationLabel = (applicationId: string) => {
    const application = applications.find((item) => item.id === applicationId)
    if (!application) return applicationId
    const opportunity = opportunities.find((item) => item.id === application.jobOfferId)
    const job = mockPipelineJobs[application.jobOfferId] ?? opportunity
    return job ? `${job.company} - ${job.title}` : application.jobOfferId
  }

  const getOpportunityLabel = (opportunityId: string) => {
    const opportunity = opportunities.find((item) => item.id === opportunityId)
    const fallback = mockPipelineJobs[opportunityId]
    if (opportunity) return `${opportunity.company} - ${opportunity.title}`
    if (fallback) return `${fallback.company} - ${fallback.title}`
    return opportunityId
  }

  const resetForm = () => {
    setForm(emptyContactForm)
    setEditingContactId(null)
    setIsFormOpen(false)
  }

  const startCreate = () => {
    setForm(emptyContactForm)
    setEditingContactId(null)
    setIsFormOpen(true)
  }

  const startEdit = (contact: NetworkContact) => {
    setForm({
      name: contact.name,
      company: contact.company,
      role: contact.role,
      messageDraft: contact.messageDraft,
      notes: contact.notes,
      status: contact.status,
      linkedJobOfferId: contact.linkedJobOfferId,
      linkedApplicationId: contact.linkedApplicationId,
    })
    setEditingContactId(contact.id)
    setIsFormOpen(true)
  }

  const submitForm = () => {
    if (!form.name.trim() || !form.company.trim()) return

    if (editingContactId) {
      updateNetworkContact(editingContactId, form)
    } else {
      addNetworkContact({
        ...form,
        linkedInUrl: null,
        lastContactedAt: null,
        nextFollowUpAt: null,
      })
    }

    resetForm()
  }

  return (
    <PageShell size="xl">
      <PageHeader
        title="Réseau"
        subtitle={`${actionableCount} action${actionableCount > 1 ? "s" : ""} réseau utile${actionableCount > 1 ? "s" : ""}. Les messages préparés restent séparés des messages envoyés.`}
      >
        <button onClick={startCreate} className={premiumButton}>
          <Plus className="h-4 w-4" />
          Ajouter un contact
        </button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Actions utiles" value={actionableCount} subtitle="a traiter ou documenter" tone="violet" icon={Send} />
        <MetricTile label="Messages prets" value={preparedCount} subtitle="non envoyes" tone="violet" icon={MessageSquare} />
        <MetricTile label="Contacts envoyes" value={contactedCount} subtitle="en attente de retour" tone="blue" icon={Users} />
        <MetricTile label="Reponses" value={repliedCount} subtitle={`${linkedCount} contacts lies au pipeline`} tone="emerald" icon={Reply} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-4 shadow-[0_12px_34px_rgba(124,58,237,0.08)]">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">
                Preparation vs action faite
              </p>
              <p className="mt-1 text-sm font-bold leading-relaxed text-violet-950">
                Un message prepare reste une suggestion. Le contact passe en &quot;contacte&quot; uniquement quand tu confirmes l&apos;envoi.
              </p>
            </div>
          </div>
        </div>

        <PremiumCard className="p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Priorite reseau
          </p>
          {sortedContacts[0] && topSignal ? (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-black text-slate-950">{sortedContacts[0].name}</p>
                  <p className="text-sm font-bold text-slate-500">{sortedContacts[0].company}</p>
                </div>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", signalTone[topSignal.level])}>
                  {topSignal.label}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
                {topSignal.description}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-500">Aucun contact pour le moment.</p>
          )}
        </PremiumCard>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "Tous" },
          { value: "actionable", label: "Actions utiles" },
          { value: "message_prepared", label: "Messages prets" },
          { value: "contacted", label: "En attente" },
          { value: "replied", label: "Reponses" },
          { value: "archived", label: "Archives" },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value as StatusFilter)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-black transition-colors",
              statusFilter === filter.value
                ? "bg-violet-600 text-white shadow-[0_10px_20px_rgba(124,58,237,0.18)]"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isFormOpen && (
        <PremiumCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-slate-950">
              {editingContactId ? "Modifier le contact" : "Nouveau contact"}
            </h2>
            <button
              onClick={resetForm}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nom"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            />
            <input
              value={form.company}
              onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
              placeholder="Entreprise"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            />
            <input
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              placeholder="Role"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr]">
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as NetworkContactStatus }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            >
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <input
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Note courte"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={form.linkedJobOfferId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  linkedJobOfferId: event.target.value || null,
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Aucune opportunite liee</option>
              {opportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.company} - {opportunity.title}
                </option>
              ))}
            </select>
            <select
              value={form.linkedApplicationId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  linkedApplicationId: event.target.value || null,
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Aucune candidature liee</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {getApplicationLabel(application.id)}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={form.messageDraft}
            onChange={(event) => setForm((current) => ({ ...current, messageDraft: event.target.value }))}
            placeholder="Message prepare"
            rows={4}
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={resetForm} className={secondaryButton}>
              Annuler
            </button>
            <button
              onClick={submitForm}
              disabled={!form.name.trim() || !form.company.trim()}
              className={premiumButton}
            >
              {editingContactId ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </PremiumCard>
      )}

      <div className="space-y-3">
        {filteredContacts.map((contact) => {
          const status = statusConfig[contact.status]
          const signal = getNetworkSignal(contact, now)
          const linkedLabel = contact.linkedApplicationId
            ? getApplicationLabel(contact.linkedApplicationId)
            : contact.linkedJobOfferId
              ? getOpportunityLabel(contact.linkedJobOfferId)
              : null
          const draftSuggestion = buildNetworkDraftSuggestion(contact, signal, linkedLabel)

          return (
            <PremiumCard
              as="article"
              key={contact.id}
              className={cn(
                "p-0 overflow-hidden",
                signal.level === "follow_up_due" && "border-amber-200",
                signal.level === "ready_to_send" && "border-violet-200"
              )}
            >
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_330px]">
                <div className="p-5 lg:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                          {contact.name.slice(0, 1)}
                        </div>
                        <div>
                          <h2 className="text-xl font-black leading-tight tracking-[-0.025em] text-slate-950">
                            {contact.name}
                          </h2>
                          <p className="text-sm font-bold text-slate-500">
                            {contact.role} - {contact.company}
                          </p>
                        </div>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", status.className)}>
                          {status.label}
                        </span>
                      </div>

                      {contact.notes && (
                        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-slate-600">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        <Link2 className="h-3.5 w-3.5" />
                        Lien pipeline
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {contact.linkedApplicationId && (
                          <p className="text-sm font-black text-slate-900">
                            {getApplicationLabel(contact.linkedApplicationId)}
                          </p>
                        )}
                        {!contact.linkedApplicationId && contact.linkedJobOfferId && (
                          <p className="text-sm font-black text-slate-900">
                            {getOpportunityLabel(contact.linkedJobOfferId)}
                          </p>
                        )}
                        {!contact.linkedApplicationId && !contact.linkedJobOfferId && (
                          <p className="text-sm font-semibold text-slate-500">Aucun dossier lie</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Suivi
                      </div>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {signal.daysSinceContact !== null
                          ? `Contacte il y a ${signal.daysSinceContact} jour${signal.daysSinceContact > 1 ? "s" : ""}`
                          : "Pas encore envoye"}
                      </p>
                      {contact.nextFollowUpAt && (
                        <p className="mt-1 text-xs font-bold text-amber-700">
                          Relance : {new Date(contact.nextFollowUpAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Message prepare
                      </div>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-violet-700">
                        non envoye
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-slate-700">
                      {contact.messageDraft || "Aucun message prepare."}
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {draftSuggestion.title}
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-violet-700">
                        suggestion
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-violet-900">
                      {draftSuggestion.body}
                    </p>
                  </div>
                </div>

                <aside className="border-t border-slate-100 bg-slate-50/80 p-5 lg:p-6 xl:border-l xl:border-t-0">
                  <div className={cn("rounded-2xl border p-4", signalTone[signal.level])}>
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">
                          Signal reseau
                        </p>
                        <p className="mt-1 text-base font-black leading-snug">{signal.label}</p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed opacity-85">
                          {signal.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <CopyDraftButton text={contact.messageDraft} />
                    <CopyDraftButton text={draftSuggestion.body} />
                    <button
                      onClick={() => startEdit(contact)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </button>
                    <button
                      onClick={() => confirmContacted(contact.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <Send className="h-3.5 w-3.5" />
                      J&apos;ai contacte
                    </button>
                    <button
                      onClick={() => markContactReplied(contact.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Reponse recue
                    </button>
                    <button
                      onClick={() => updateNetworkContact(contact.id, { status: "archived" })}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-400 transition-colors hover:bg-slate-50"
                    >
                      <UserRound className="h-3.5 w-3.5" />
                      Archiver
                    </button>
                  </div>
                </aside>
              </div>
            </PremiumCard>
          )
        })}
      </div>
    </PageShell>
  )
}
