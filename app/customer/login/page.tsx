"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Phone, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useStore } from "@/lib/contexts/store-context"
import { toast } from "sonner"

function CustomerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { customerSignIn, loading: authLoading } = useAuth()
  const { store } = useStore()

  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Get store ID from context or localStorage
    const storeId = store?.id || localStorage.getItem("storeId")

    if (!storeId) {
      toast.error("Loja não selecionada. Por favor, selecione uma loja primeiro.")
      setLoading(false)
      router.push("/select-store")
      return
    }

    const result = await customerSignIn(phone, storeId)

    if (result.success) {
      if (result.isNewCustomer) {
        // New customer: redirect to complete profile
        toast.success("Cadastro iniciado! Complete seu perfil.")
        router.push("/customer/complete-profile")
      } else {
        // Existing customer: redirect to appointments
        toast.success("Login realizado com sucesso!")
        const redirect = searchParams.get("redirect") || "/customer/appointments"
        router.push(redirect)
      }
    } else {
      toast.error(result.error || "Erro ao fazer login")
    }

    setLoading(false)
  }

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "")

    // Format as (XX) XXXXX-XXXX
    if (cleaned.length <= 2) {
      return cleaned
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo</CardTitle>
          <CardDescription>Entre com seu telefone para agendar horários</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  className="pl-10"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  autoComplete="tel"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {store ? `Loja: ${store.name}` : "Nenhuma loja selecionada"}
              </p>
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                📱 Novo por aqui? Não se preocupe!
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Ao digitar seu telefone, você será automaticamente cadastrado. É rápido e fácil!
              </p>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-center text-sm text-muted-foreground">
              <p>Não está na loja certa?</p>
              <Link href="/select-store" className="text-primary hover:underline font-medium mt-1 inline-block">
                Trocar de loja
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CustomerLoginForm />
    </Suspense>
  )
}
