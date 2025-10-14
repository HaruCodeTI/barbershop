"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Mail, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { updateCustomerProfile, type Customer } from "@/lib/auth"
import { toast } from "sonner"

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user, userType, loading: authLoading, refreshAuth } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Redirect if not customer or already has name
    if (!authLoading) {
      if (userType !== "customer" || !user) {
        router.push("/customer/login")
        return
      }

      const customer = user as Customer

      // If customer already has a proper name (not "Cliente"), redirect to appointments
      if (customer.name && customer.name !== "Cliente") {
        router.push("/customer/appointments")
        return
      }

      // Pre-fill form with existing data
      setFormData({
        name: customer.name === "Cliente" ? "" : customer.name,
        email: customer.email || "",
      })
    }
  }, [authLoading, user, userType, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!user) {
      toast.error("Usuário não autenticado")
      setLoading(false)
      return
    }

    const customer = user as Customer

    const result = await updateCustomerProfile(customer.id, {
      name: formData.name,
      email: formData.email || null,
    })

    if (result.success) {
      toast.success("Perfil completado com sucesso!")

      // Refresh auth context to get updated user data
      await refreshAuth()

      // Redirect to appointments
      router.push("/customer/appointments")
    } else {
      toast.error(result.error || "Erro ao atualizar perfil")
    }

    setLoading(false)
  }

  const handleSkip = () => {
    toast.info("Você pode completar seu perfil depois nas configurações")
    router.push("/customer/appointments")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (userType !== "customer" || !user) {
    return null
  }

  const customer = user as Customer

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Complete seu Perfil</CardTitle>
          <CardDescription>
            Adicione algumas informações para personalizar sua experiência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (já cadastrado)</Label>
              <Input
                id="phone"
                type="tel"
                value={customer.phone}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="João da Silva"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Adicione um email para receber confirmações de agendamento
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSkip}
                disabled={loading}
              >
                Pular
              </Button>
              <Button type="submit" className="flex-1 cursor-pointer" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 mt-4">
              <p className="text-xs text-muted-foreground text-center">
                💡 Suas informações são privadas e serão usadas apenas para melhorar seu atendimento
                e enviar notificações sobre seus agendamentos.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
