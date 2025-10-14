"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

interface CustomerAuthGuardProps {
  children: React.ReactNode
}

export function CustomerAuthGuard({ children }: CustomerAuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login with return URL
      router.push(`/customer/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
