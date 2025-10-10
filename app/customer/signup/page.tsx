"use client"

import type React from "react"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Mail, Phone, User, Lock } from "lucide-react"
import { mockServices, mockBarbers } from "@/lib/mock-data"
import Link from "next/link"
import { createCustomerAndAppointment } from "@/lib/appointments"
import { createClient } from "@/lib/supabase/client"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const serviceIds = searchParams.get("services")?.split(",") || []
  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const barberId = searchParams.get("barber") || ""
  const couponCode = searchParams.get("coupon")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    marketingEmails: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [barber, setBarber] = useState<any>(null)

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
  const selectedBarber = barber || mockBarbers.find((b) => b.id === barberId)
  const selectedDate = date ? new Date(date) : null

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
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Número de telefone inválido"
    }
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres"
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem"
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

    setCreating(true)
    setErrors({})

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`

      const result = await createCustomerAndAppointment(
        {
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          storeId: "00000000-0000-0000-0000-000000000001", // TODO: Get from context or env
        },
        {
          barberId,
          serviceIds,
          date,
          time,
          couponCode,
          storeId: "00000000-0000-0000-0000-000000000001", // TODO: Get from context or env
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
              <h1 className="text-xl font-bold text-foreground">Criar Conta</h1>
              <p className="text-sm text-muted-foreground">Passo 3 de 4</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
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
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={formData.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                        />
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>
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
                    {creating ? "Criando agendamento..." : "Concluir Agendamento"}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
