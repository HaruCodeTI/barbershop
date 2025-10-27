"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scissors, AlertCircle, ArrowLeft, Lock, Mail, Loader2 } from "lucide-react"
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
    <div className="min-h-screen gradient-animated flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div aria-hidden className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 glass-moderate px-4 py-2 rounded-full text-white/70 hover:text-white hover:glass-intense transition-all duration-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Voltar para Início</span>
        </Link>

        {/* Login Card */}
        <GlassCard className="glass-border-glow">
          <GlassCardHeader className="text-center pb-2">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="glass-intense rounded-full p-6 glow-primary-intense">
                <Scissors className="h-10 w-10 text-primary" />
              </div>
            </div>

            <GlassCardTitle className="text-3xl md:text-4xl mb-2">
              Login da Equipe
            </GlassCardTitle>
            <GlassCardDescription className="text-base">
              Acesse seu painel CortaAí
            </GlassCardDescription>
          </GlassCardHeader>

          <GlassCardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="glass-intense rounded-xl p-4 border border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white font-medium text-sm">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-12 h-12 glass-moderate border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/50 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-white font-medium text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 h-12 glass-moderate border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/50 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 text-base rounded-xl font-semibold mt-8"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Entrar no Painel
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="glass-moderate rounded-xl p-4 mt-6">
                <p className="text-xs text-white/60 text-center leading-relaxed">
                  🔒 Acesso restrito à equipe. Use suas credenciais fornecidas pelo gerente.
                </p>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}
