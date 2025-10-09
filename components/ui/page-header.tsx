"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  showBackButton?: boolean
  backHref?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, showBackButton = false, backHref, action }: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {showBackButton && (
          <Button variant="outline" size="icon" onClick={handleBack} className="shrink-0 mt-1 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-balance">{title}</h1>
          {description && <p className="text-muted-foreground mt-1 text-pretty">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
