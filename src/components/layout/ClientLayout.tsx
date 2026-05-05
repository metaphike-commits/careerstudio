"use client"

import { useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { CopilotPanel } from "@/components/copilot/CopilotPanel"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAppStore } from "@/stores/app-store"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background relative">
          {children}
        </main>
      </div>
      <CopilotPanel />
    </TooltipProvider>
  )
}
