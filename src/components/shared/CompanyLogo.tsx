"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface CompanyLogoProps {
  company: string
  logoUrl?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "w-6 h-6 text-[8px]",
  md: "w-8 h-8 text-[10px]",
  lg: "w-10 h-10 text-xs",
}

const bgColors = [
  "#7c3aed", "#2563eb", "#059669", "#dc2626",
  "#d97706", "#4f46e5", "#0d9488", "#db2777",
]

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function getBgColor(name: string): string {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return bgColors[hash % bgColors.length]
}

export function CompanyLogo({ company, logoUrl, size = "sm", className }: CompanyLogoProps) {
  const [error, setError] = useState(false)

  if (logoUrl && !error) {
    return (
      <div
        className={cn(
          "rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center shrink-0",
          sizeClasses[size],
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={company}
          className="w-full h-full object-contain p-0.5"
          onError={() => setError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center font-bold text-white shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ background: getBgColor(company) }}
    >
      {getInitials(company)}
    </div>
  )
}
