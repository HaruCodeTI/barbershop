"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scissors, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    console.log("[Login] Form submitted")
    e.preventDefault()

    console.log("[Login] Email:", email)
    console.log("[Login] Password length:", password.length)

    setError("")
    setLoading(true)

    try {
      console.log("[Login] Calling API...")

      // Call API route (bcrypt works on server-side)
      const response = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("[Login] API response status:", response.status)

      const result = await response.json()

      console.log("[Login] API result:", result)

      // Check if staff needs to set up password (first access)
      if (result.requiresPasswordSetup && result.staffId) {
        console.log("[Login] First access detected, redirecting to setup password")
        window.location.href = `/setup-password?id=${result.staffId}&email=${encodeURIComponent(email)}`
        return
      }

      if (!result.success || !result.staff) {
        throw new Error(result.error || "Erro ao fazer login")
      }

      // Save token to localStorage
      if (result.token) {
        localStorage.setItem("auth_token", result.token)
        console.log("[Login] Token saved")
      }

      console.log("[Login] Staff role:", result.staff.role)

      // Fetch and save store information for StoreContext
      if (result.staff.store_id) {
        try {
          const { createClient } = await import("@/lib/supabase/client")
          const supabase = createClient()

          const { data: storeData, error: storeError } = await supabase
            .from("stores")
            .select("id, slug")
            .eq("id", result.staff.store_id)
            .single()

          if (!storeError && storeData) {
            localStorage.setItem("storeId", storeData.id)
            localStorage.setItem("storeSlug", storeData.slug)
            console.log("[Login] Store saved:", storeData.slug)
          } else {
            console.error("[Login] Failed to fetch store:", storeError)
          }
        } catch (storeErr) {
          console.error("[Login] Error fetching store:", storeErr)
        }
      }

      // Redirect based on role
      const redirectMap = {
        manager: "/manager/dashboard",
        barber: "/barber/daily-summary",
        attendant: "/attendant/availability",
      }

      const redirectUrl = redirectMap[result.staff.role as keyof typeof redirectMap]

      if (!redirectUrl) {
        throw new Error("Função de usuário inválida")
      }

      console.log("[Login] Redirecting to:", redirectUrl)

      // Immediate redirect
      window.location.href = redirectUrl
    } catch (err: unknown) {
      console.error("[Staff Login] Error:", err)
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Login da Equipe</CardTitle>
          <CardDescription>Acesse seu painel GoBarber</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center pt-4">
              <Link href="/" className="text-sm text-primary hover:underline">
                Voltar para Início
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
