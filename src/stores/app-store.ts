"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  ApplicationPack,
  JobOffer,
  Application,
  UserProfile,
  MasterCV,
  ActionItem,
  ApplicationEvent,
  NetworkContact,
  ApplicationEventType,
  MemoryItem,
  CVVersion,
} from "@/types"
import { mockOpportunities } from "@/data/mock-opportunities"
import { mockProfile } from "@/data/mock-profile"
import {
  mockApplications,
  mockApplicationEvents,
  mockNetworkContacts,
} from "@/data/mock-applications"
import { mockActions } from "@/data/mock-actions"
import { mockMemoryItems } from "@/data/mock-memory"
import { mockCVVersions, mockApplicationPacks } from "@/data/mock-cv"
import {
  createManualOpportunity,
  scoreManualOpportunity,
  type ManualOpportunityInput,
} from "@/lib/local-scoring"
import { createCVVersionFromTarget } from "@/lib/local-cv-version"
import type { TargetedCVResponse } from "@/lib/local-cv-targeting"

export type AppTheme = "light" | "dark"

function rescoreOpportunities(
  opportunities: JobOffer[],
  profile: UserProfile | null,
  networkContacts: NetworkContact[]
) {
  const scoringProfile = profile ?? mockProfile

  return opportunities.map((opportunity) => ({
    ...opportunity,
    score: scoreManualOpportunity(
      {
        title: opportunity.title,
        company: opportunity.company,
        location: opportunity.location,
        remoteType: opportunity.remoteType,
        source: opportunity.source,
        url: opportunity.url,
        description: opportunity.description,
      },
      scoringProfile,
      {
        networkContacts,
        jobOfferId: opportunity.id,
        postedAt: opportunity.postedAt,
      }
    ),
  }))
}

interface AppState {
  // Local trust mode
  appMode: "demo" | "real"
  setAppMode: (mode: "demo" | "real") => void
  resetDemoData: () => void
  startFresh: () => void

  // Global user controls
  aiEnabled: boolean
  aiConsentAcceptedAt: string | null
  enableAI: () => void
  disableAI: () => void
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void

  // Profile
  profile: UserProfile | null
  masterCV: MasterCV | null
  setProfile: (profile: UserProfile) => void
  saveProfileAndRescore: (profile: UserProfile) => void
  setMasterCV: (cv: MasterCV) => void

  // Opportunities
  opportunities: JobOffer[]
  selectedOpportunityId: string | null
  setSelectedOpportunity: (id: string | null) => void
  addManualOpportunity: (input: ManualOpportunityInput) => JobOffer
  batchAddScoutedOpportunities: (jobs: JobOffer[]) => number
  updateOpportunityStatus: (id: string, status: JobOffer["status"]) => void
  confirmOpportunityApplied: (jobOfferId: string) => void
  archiveOpportunity: (jobOfferId: string) => void

  // Applications
  applications: Application[]
  applicationEvents: ApplicationEvent[]
  updateApplicationStatus: (id: string, status: Application["status"]) => void
  recordUserAction: (applicationId: string, status: Application["status"]) => void
  addApplicationEvent: (event: Omit<ApplicationEvent, "id" | "createdAt">) => void

  // CV Versions
  cvVersions: CVVersion[]
  saveTargetedCVDraft: (jobOfferId: string, target: TargetedCVResponse) => CVVersion | null
  updateCVContent: (id: string, content: string) => void

  // Application Packs
  applicationPacks: Record<string, ApplicationPack>
  saveApplicationPack: (pack: ApplicationPack) => void

  // Network
  networkContacts: NetworkContact[]
  addNetworkContact: (contact: Omit<NetworkContact, "id">) => void
  updateNetworkContact: (contactId: string, patch: Partial<Omit<NetworkContact, "id">>) => void
  confirmContacted: (contactId: string) => void
  markContactReplied: (contactId: string) => void

  // Memory
  memoryItems: MemoryItem[]
  addMemoryItem: (item: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">) => void
  updateMemoryItem: (id: string, patch: Partial<Omit<MemoryItem, "id" | "createdAt">>) => void
  deleteMemoryItem: (id: string) => void

  // Actions
  actions: ActionItem[]
  completeAction: (id: string) => void
  skipAction: (id: string) => void

  // UI State
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Onboarding
  onboardingDone: boolean
  setOnboardingDone: (done: boolean) => void
  completeOnboarding: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Local trust mode
      appMode: "demo",
      setAppMode: (mode) => set({ appMode: mode }),
      aiEnabled: false,
      aiConsentAcceptedAt: null,
      enableAI: () =>
        set((state) => ({
          aiEnabled: true,
          aiConsentAcceptedAt: state.aiConsentAcceptedAt ?? new Date().toISOString(),
        })),
      disableAI: () => set({ aiEnabled: false }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      resetDemoData: () =>
        set({
          profile: mockProfile,
          masterCV: null,
          opportunities: mockOpportunities,
          selectedOpportunityId: null,
          applications: mockApplications,
          applicationEvents: mockApplicationEvents,
          networkContacts: mockNetworkContacts,
          memoryItems: mockMemoryItems,
          cvVersions: mockCVVersions,
          applicationPacks: mockApplicationPacks,
          actions: mockActions,
          onboardingDone: true,
          appMode: "demo",
          aiEnabled: false,
          aiConsentAcceptedAt: null,
          theme: "light",
        }),
      startFresh: () =>
        set((state) => ({
          profile: {
            id: "profile-real",
            name: "",
            targetTitles: [],
            targetIndustries: [],
            preferredLocations: [],
            strengths: [],
            skills: [],
            experiences: [],
            achievements: [],
            proofPoints: [],
            avoidRoles: [],
            positioningStatement: "",
            objections: [],
            missingCriticalInfo: [],
          },
          masterCV: null,
          opportunities: [],
          selectedOpportunityId: null,
          applications: [],
          applicationEvents: [],
          networkContacts: [],
          memoryItems: [],
          cvVersions: [],
          applicationPacks: {},
          actions: [],
          onboardingDone: false,
          appMode: "real",
          // preserve user preferences
          aiEnabled: state.aiEnabled,
          aiConsentAcceptedAt: state.aiConsentAcceptedAt,
          theme: state.theme,
        })),

      // Profile
      profile: mockProfile,
      masterCV: null,
      setProfile: (profile) => set({ profile }),
      saveProfileAndRescore: (profile) =>
        set((state) => ({
          profile,
          appMode: "real",
          opportunities: rescoreOpportunities(state.opportunities, profile, state.networkContacts),
        })),
      setMasterCV: (cv) => set({ masterCV: cv }),

      // Opportunities
      opportunities: mockOpportunities,
      selectedOpportunityId: null,
      setSelectedOpportunity: (id) => set({ selectedOpportunityId: id }),
      addManualOpportunity: (input) => {
        const createdOpportunity = createManualOpportunity(
          input,
          get().profile ?? mockProfile,
          new Date(),
          get().networkContacts
        )

        set((state) => {
          return {
            opportunities: [createdOpportunity, ...state.opportunities],
            selectedOpportunityId: createdOpportunity.id,
            appMode: "real",
          }
        })

        return createdOpportunity
      },
      batchAddScoutedOpportunities: (jobs) => {
        if (jobs.length === 0) return 0
        set((state) => ({
          opportunities: [...jobs, ...state.opportunities],
          appMode: "real",
        }))
        return jobs.length
      },
      updateOpportunityStatus: (id, status) =>
        set((state) => ({
          opportunities: state.opportunities.map((o) =>
            o.id === id ? { ...o, status } : o
          ),
        })),
      confirmOpportunityApplied: (jobOfferId) =>
        set((state) => {
          const now = new Date().toISOString()
          const existingApplication = state.applications.find((app) => app.jobOfferId === jobOfferId)
          const applicationId = existingApplication?.id ?? `app-${jobOfferId}`
          const event: ApplicationEvent = {
            id: crypto.randomUUID(),
            applicationId,
            type: "applied",
            statusAfter: "applied",
            createdAt: now,
            label: "Candidature confirmee",
            note: "Candidature confirmee depuis la fiche opportunite.",
            source: "manual",
          }

          return {
            opportunities: state.opportunities.map((o) =>
              o.id === jobOfferId ? { ...o, status: "applied" } : o
            ),
            applications: existingApplication
              ? state.applications.map((app) =>
                  app.id === existingApplication.id
                    ? {
                        ...app,
                        status: "applied",
                        appliedAt: app.appliedAt ?? now,
                        lastUserActionAt: now,
                      }
                    : app
                )
              : [
                  {
                    id: applicationId,
                    jobOfferId,
                    status: "applied",
                    appliedAt: now,
                    cvVersionId: null,
                    contactId: null,
                    notes: "Candidature creee depuis la fiche opportunite.",
                    feedback: "",
                    nextAction: "Attendre reponse ou identifier un contact",
                    nextActionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    lastUserActionAt: now,
                  },
                  ...state.applications,
                ],
            applicationEvents: [event, ...state.applicationEvents],
          }
        }),
      archiveOpportunity: (jobOfferId) =>
        set((state) => {
          const now = new Date().toISOString()
          const existingApplication = state.applications.find((app) => app.jobOfferId === jobOfferId)
          const event: ApplicationEvent | null = existingApplication
            ? {
                id: crypto.randomUUID(),
                applicationId: existingApplication.id,
                type: "archived",
                statusAfter: "archived",
                createdAt: now,
                label: "Archive",
                note: "Opportunite archivee manuellement.",
                source: "manual",
              }
            : null

          return {
            opportunities: state.opportunities.map((o) =>
              o.id === jobOfferId ? { ...o, status: "archived" } : o
            ),
            applications: existingApplication
              ? state.applications.map((app) =>
                  app.id === existingApplication.id
                    ? { ...app, status: "archived", lastUserActionAt: now }
                    : app
                )
              : state.applications,
            applicationEvents: event ? [event, ...state.applicationEvents] : state.applicationEvents,
          }
        }),

      // Applications
      applications: mockApplications,
      applicationEvents: mockApplicationEvents,
      updateApplicationStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        })),
      recordUserAction: (applicationId, status) =>
        set((state) => {
          const now = new Date().toISOString()
          const eventTypeByStatus: Partial<Record<Application["status"], ApplicationEventType>> = {
            applied: "applied",
            contacted: "contacted",
            follow_up_needed: "followed_up",
            response_received: "response_received",
            recruiter_interview: "interview_obtained",
            hiring_manager_interview: "interview_obtained",
            case_study: "interview_obtained",
            rejected: "rejected",
            ghosted: "ghosted",
            archived: "archived",
          }
          const labelByStatus: Partial<Record<Application["status"], string>> = {
            applied: "Candidature confirmee",
            contacted: "Contact confirme",
            follow_up_needed: "Relance confirmee",
            response_received: "Reponse recue",
            recruiter_interview: "Entretien obtenu",
            hiring_manager_interview: "Entretien manager obtenu",
            case_study: "Business case obtenu",
            rejected: "Refus confirme",
            ghosted: "Ghosting confirme",
            archived: "Archive",
          }
          const eventType = eventTypeByStatus[status] ?? "note"
          const event: ApplicationEvent = {
            id: crypto.randomUUID(),
            applicationId,
            type: eventType,
            statusAfter: status,
            createdAt: now,
            label: labelByStatus[status] ?? "Action confirmee",
            note: "Action confirmee manuellement par l'utilisateur.",
            source: "manual",
          }

          return {
            applications: state.applications.map((a) =>
              a.id === applicationId
                ? {
                    ...a,
                    status,
                    appliedAt: status === "applied" && !a.appliedAt ? now : a.appliedAt,
                    lastUserActionAt: now,
                  }
                : a
            ),
            applicationEvents: [event, ...state.applicationEvents],
          }
        }),
      addApplicationEvent: (event) =>
        set((state) => ({
          applicationEvents: [
            {
              ...event,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
            ...state.applicationEvents,
          ],
        })),

      // CV Versions
      cvVersions: mockCVVersions,
      updateCVContent: (id, content) =>
        set((state) => ({
          cvVersions: state.cvVersions.map((cv) =>
            cv.id === id ? { ...cv, content } : cv
          ),
        })),

      // Application Packs
      applicationPacks: mockApplicationPacks,
      saveApplicationPack: (pack) =>
        set((state) => ({
          applicationPacks: { ...state.applicationPacks, [pack.jobOfferId]: pack },
        })),

      saveTargetedCVDraft: (jobOfferId, target) => {
        const state = get()
        const opportunity = state.opportunities.find((item) => item.id === jobOfferId)
        const profile = state.profile
        if (!opportunity || !profile) return null

        const cvVersion = createCVVersionFromTarget({
          target,
          profile,
          opportunity,
        })

        set((state) => ({
          cvVersions: [cvVersion, ...state.cvVersions],
          appMode: "real",
        }))

        return cvVersion
      },

      // Network
      networkContacts: mockNetworkContacts,
      addNetworkContact: (contact) =>
        set((state) => {
          const networkContacts = [
            {
              ...contact,
              id: crypto.randomUUID(),
            },
            ...state.networkContacts,
          ]

          return {
            networkContacts,
            opportunities: rescoreOpportunities(state.opportunities, state.profile, networkContacts),
          }
        }),
      updateNetworkContact: (contactId, patch) =>
        set((state) => {
          const networkContacts = state.networkContacts.map((contact) =>
            contact.id === contactId ? { ...contact, ...patch } : contact
          )

          return {
            networkContacts,
            opportunities: rescoreOpportunities(state.opportunities, state.profile, networkContacts),
          }
        }),
      confirmContacted: (contactId) =>
        set((state) => {
          const now = new Date().toISOString()
          const contact = state.networkContacts.find((item) => item.id === contactId)
          const networkContacts: NetworkContact[] = state.networkContacts.map((contact): NetworkContact =>
            contact.id === contactId
              ? {
                  ...contact,
                  status: "contacted",
                  lastContactedAt: now,
                  nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                }
              : contact
          )
          const event: ApplicationEvent | null = contact?.linkedApplicationId
            ? {
                id: crypto.randomUUID(),
                applicationId: contact.linkedApplicationId,
                type: "contacted",
                statusAfter: "contacted",
                createdAt: now,
                label: "Contact confirme",
                note: `Message envoye a ${contact.name} chez ${contact.company}.`,
                source: "manual",
              }
            : null

          return {
            networkContacts,
            opportunities: rescoreOpportunities(state.opportunities, state.profile, networkContacts),
            applications: contact?.linkedApplicationId
              ? state.applications.map((application) =>
                  application.id === contact.linkedApplicationId
                    ? { ...application, status: "contacted", lastUserActionAt: now }
                    : application
                )
              : state.applications,
            applicationEvents: event ? [event, ...state.applicationEvents] : state.applicationEvents,
          }
        }),
      markContactReplied: (contactId) =>
        set((state) => {
          const now = new Date().toISOString()
          const contact = state.networkContacts.find((item) => item.id === contactId)
          const networkContacts: NetworkContact[] = state.networkContacts.map((contact): NetworkContact =>
            contact.id === contactId
              ? { ...contact, status: "replied", nextFollowUpAt: null }
              : contact
          )
          const event: ApplicationEvent | null = contact?.linkedApplicationId
            ? {
                id: crypto.randomUUID(),
                applicationId: contact.linkedApplicationId,
                type: "response_received",
                statusAfter: "response_received",
                createdAt: now,
                label: "Reponse reseau recue",
                note: `${contact.name} a repondu.`,
                source: "manual",
              }
            : null

          return {
            networkContacts,
            opportunities: rescoreOpportunities(state.opportunities, state.profile, networkContacts),
            applications: contact?.linkedApplicationId
              ? state.applications.map((application) =>
                  application.id === contact.linkedApplicationId
                    ? { ...application, status: "response_received", lastUserActionAt: now }
                    : application
                )
              : state.applications,
            applicationEvents: event ? [event, ...state.applicationEvents] : state.applicationEvents,
          }
        }),

      // Memory
      memoryItems: mockMemoryItems,
      addMemoryItem: (item) =>
        set((state) => {
          const now = new Date().toISOString()
          return {
            memoryItems: [
              {
                ...item,
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now,
              },
              ...state.memoryItems,
            ],
          }
        }),
      updateMemoryItem: (id, patch) =>
        set((state) => ({
          memoryItems: state.memoryItems.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
          ),
        })),
      deleteMemoryItem: (id) =>
        set((state) => ({
          memoryItems: state.memoryItems.filter((item) => item.id !== id),
        })),

      // Actions
      actions: mockActions,
      completeAction: (id) =>
        set((state) => ({
          actions: state.actions.map((a) =>
            a.id === id ? { ...a, status: "done" } : a
          ),
        })),
      skipAction: (id) =>
        set((state) => ({
          actions: state.actions.map((a) =>
            a.id === id ? { ...a, status: "skipped" } : a
          ),
        })),

      // UI
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Onboarding
      onboardingDone: true, // set false to show onboarding flow
      setOnboardingDone: (done) => set({ onboardingDone: done }),
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: "careerstudio-store",
      version: 2,
      partialize: (state) => ({
        onboardingDone: state.onboardingDone,
        appMode: state.appMode,
        profile: state.profile,
        opportunities: state.opportunities,
        applications: state.applications,
        applicationEvents: state.applicationEvents,
        networkContacts: state.networkContacts,
        memoryItems: state.memoryItems,
        cvVersions: state.cvVersions,
        applicationPacks: state.applicationPacks,
        actions: state.actions,
        sidebarCollapsed: state.sidebarCollapsed,
        masterCV: state.masterCV,
        aiEnabled: state.aiEnabled,
        aiConsentAcceptedAt: state.aiConsentAcceptedAt,
        theme: state.theme,
      }),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState
        }

        const state = persistedState as Partial<AppState>

        const rawProfile = state.profile ?? mockProfile
        const safeProfile: UserProfile = {
          ...rawProfile,
          achievements: Array.isArray((rawProfile as Partial<UserProfile>).achievements)
            ? rawProfile.achievements
            : [],
          proofPoints: Array.isArray((rawProfile as Partial<UserProfile>).proofPoints)
            ? rawProfile.proofPoints
            : [],
          experiences: Array.isArray((rawProfile as Partial<UserProfile>).experiences)
            ? rawProfile.experiences
            : [],
          objections: Array.isArray((rawProfile as Partial<UserProfile>).objections)
            ? rawProfile.objections
            : [],
          targetTitles: Array.isArray((rawProfile as Partial<UserProfile>).targetTitles)
            ? rawProfile.targetTitles
            : [],
          skills: Array.isArray((rawProfile as Partial<UserProfile>).skills)
            ? rawProfile.skills
            : [],
        }

        return {
          ...state,
          applications: Array.isArray(state.applications) ? state.applications : mockApplications,
          profile: safeProfile,
          opportunities: Array.isArray(state.opportunities) ? state.opportunities : mockOpportunities,
          applicationEvents: Array.isArray(state.applicationEvents)
            ? state.applicationEvents
            : mockApplicationEvents,
          networkContacts: Array.isArray(state.networkContacts)
            ? state.networkContacts
            : mockNetworkContacts,
          memoryItems: Array.isArray(state.memoryItems) ? state.memoryItems : mockMemoryItems,
          cvVersions: Array.isArray(state.cvVersions) ? state.cvVersions : mockCVVersions,
          applicationPacks:
            state.applicationPacks && typeof state.applicationPacks === "object"
              ? state.applicationPacks
              : mockApplicationPacks,
          actions: Array.isArray(state.actions) ? state.actions : mockActions,
          sidebarCollapsed:
            typeof state.sidebarCollapsed === "boolean" ? state.sidebarCollapsed : false,
          onboardingDone:
            typeof state.onboardingDone === "boolean" ? state.onboardingDone : true,
          appMode: state.appMode === "real" ? "real" : "demo",
          masterCV: state.masterCV ?? null,
          aiEnabled: typeof state.aiEnabled === "boolean" ? state.aiEnabled : false,
          aiConsentAcceptedAt:
            typeof state.aiConsentAcceptedAt === "string" ? state.aiConsentAcceptedAt : null,
          theme: state.theme === "dark" ? "dark" : "light",
        }
      },
    }
  )
)
