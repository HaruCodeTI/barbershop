"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles: ("attendant" | "barber" | "manager")[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem("user")

      if (!userStr) {
        router.push(`/login?redirect=${pathname}`)
        return
      }

      try {
        const user = JSON.parse(userStr)

        if (!allowedRoles.includes(user.role)) {
          router.push("/")
          return
        }

        setIsAuthorized(true)
      } catch {
        router.push(`/login?redirect=${pathname}`)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname, allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
