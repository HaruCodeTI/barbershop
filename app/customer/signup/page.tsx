"use client"

import type React from "react"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Mail, Phone, User, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createCustomerAndAppointment, createAppointment } from "@/lib/appointments"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/hooks/use-store"
import { useAuth } from "@/lib/contexts/auth-context"
import type { Customer as AuthCustomer } from "@/lib/auth"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { store, loading: storeLoading } = useStore()
  const { user, userType, loading: authLoading } = useAuth()

  const serviceIds = searchParams.get("services")?.split(",") || []
  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const barberId = searchParams.get("barber") || ""
  const couponCode = searchParams.get("coupon")

  // Check if user is logged in
  const isCustomerLoggedIn = user && userType === "customer"
  const loggedInCustomer = isCustomerLoggedIn ? (user as AuthCustomer) : null

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    agreeToTerms: false,
    marketingEmails: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [barber, setBarber] = useState<any>(null)

  const formatPhone = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "")

    // Limita a 11 dígitos (DDD + número)
    if (numbers.length > 11) {
      return formData.phone
    }

    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    handleChange("phone", formatted)
  }

  // Fetch real data from Supabase
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase.from("services").select("*").in("id", serviceIds)
        if (servicesData) setServices(servicesData)
      }

      if (barberId) {
        const { data: barberData } = await supabase.from("barbers").select("*").eq("id", barberId).single()
        if (barberData) setBarber(barberData)
      }
    }
    fetchData()
  }, [])

  const selectedServices = services
  const selectedBarber = barber
  const selectedDate = date ? new Date(date) : null

  // Show loading state while store or auth is loading
  if (storeLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Show error if no store selected
  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Por favor, selecione uma loja primeiro
            </p>
            <Button onClick={() => router.push("/select-store")}>
              Selecionar Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "Nome é obrigatório"
    if (!formData.lastName.trim()) newErrors.lastName = "Sobrenome é obrigatório"
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de e-mail inválido"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório"
    } else if (!/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Número de telefone inválido (10-11 dígitos)"
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "Você deve concordar com os termos"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    if (!store) {
      setErrors({ submit: "Loja não selecionada. Por favor, retorne e selecione uma loja." })
      return
    }

    setCreating(true)
    setErrors({})

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`
      const cleanPhone = formData.phone.replace(/\D/g, "")

      const result = await createCustomerAndAppointment(
        {
          name: fullName,
          email: formData.email,
          phone: cleanPhone,
          storeId: store.id,
        },
        {
          barberId,
          serviceIds,
          date,
          time,
          couponCode,
          storeId: store.id,
        },
      )

      if (result.success) {
        router.push(`/customer/confirmation?appointmentId=${result.appointmentId}`)
      } else {
        setErrors({ submit: result.error || "Erro ao criar agendamento" })
        setCreating(false)
      }
    } catch (error) {
      setErrors({ submit: "Erro inesperado ao criar agendamento" })
      setCreating(false)
    }
  }

  // Handle appointment creation for logged-in customer
  const handleLoggedInSubmit = async () => {
    if (!store || !loggedInCustomer) return

    setCreating(true)
    setErrors({})

    try {
      const result = await createAppointment({
        customerId: loggedInCustomer.id,
        barberId,
        serviceIds,
        date,
        time,
        couponCode: couponCode || undefined,
        storeId: store.id,
      })

      if (result.success) {
        router.push(`/customer/confirmation?appointmentId=${result.appointmentId}`)
      } else {
        setErrors({ submit: result.error || "Erro ao criar agendamento" })
        setCreating(false)
      }
    } catch (error) {
      setErrors({ submit: "Erro inesperado ao criar agendamento" })
      setCreating(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/customer/datetime?services=${serviceIds.join(",")}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isCustomerLoggedIn ? "Confirmar Agendamento" : "Criar Conta"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isCustomerLoggedIn ? "Revise seus dados" : "Passo 3 de 4"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isCustomerLoggedIn ? (
              // Logged in customer - show confirmation
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <CardTitle>Olá, {loggedInCustomer?.name.split(" ")[0]}!</CardTitle>
                      <CardDescription>Confirme seus dados e finalize o agendamento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                        <p className="text-base font-semibold">{loggedInCustomer?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                        <p className="text-base font-semibold">{loggedInCustomer?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                      <p className="text-sm text-destructive">{errors.submit}</p>
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    onClick={handleLoggedInSubmit}
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando agendamento...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar e Finalizar Agendamento
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Not logged in - show signup form
              <Card>
                <CardHeader>
                  <CardTitle>Cadastro</CardTitle>
                  <CardDescription>Crie sua conta para completar o agendamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="João"
                          className="pl-10"
                          value={formData.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                        />
                      </div>
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          placeholder="Silva"
                          className="pl-10"
                          value={formData.lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                        />
                      </div>
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao.silva@exemplo.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleChange("agreeToTerms", checked as boolean)}
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Concordo com os Termos de Serviço e Política de Privacidade
                      </label>
                    </div>
                    {errors.agreeToTerms && <p className="text-sm text-destructive">{errors.agreeToTerms}</p>}

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="marketing"
                        checked={formData.marketingEmails}
                        onCheckedChange={(checked) => handleChange("marketingEmails", checked as boolean)}
                      />
                      <label
                        htmlFor="marketing"
                        className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enviar e-mails promocionais e ofertas especiais
                      </label>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                      <p className="text-sm text-destructive">{errors.submit}</p>
                    </div>
                  )}

                    <Button type="submit" className="w-full" size="lg" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando agendamento...
                        </>
                      ) : (
                        "Concluir Agendamento"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Detalhes do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServices.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Serviços</h4>
                    <div className="space-y-1">
                      {selectedServices.map((service) => (
                        <p key={service.id} className="text-sm text-muted-foreground">
                          {service.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBarber && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Barbeiro</h4>
                    <p className="text-sm text-muted-foreground">{selectedBarber.name}</p>
                  </div>
                )}

                {selectedDate && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Data e Horário</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">{time}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SignupContent />
    </Suspense>
  )
}
