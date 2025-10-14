"use client"

import type React from "react"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, User, Mail, Phone, Clock, DollarSign, Loader2, Search } from "lucide-react"
import { createBooking, searchCustomer } from "@/lib/attendant"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "sonner"
import { useStore } from "@/lib/hooks/use-store"

function CreateBookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { store, loading: storeLoading } = useStore()

  const preselectedBarber = searchParams.get("barber") || ""
  const preselectedDate = searchParams.get("date") || ""
  const preselectedTime = searchParams.get("time") || ""

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    barberId: preselectedBarber,
    date: preselectedDate ? new Date(preselectedDate).toISOString().split("T")[0] : "",
    time: preselectedTime ? preselectedTime.split(":").slice(0, 2).join(":") : "",
    serviceIds: [] as string[],
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    loadBarbers()
    loadServices()
  }, [])

  const loadBarbers = async () => {
    if (!store) return
    const supabase = createClient()
    const { data } = await supabase
      .from("barbers")
      .select("id, name")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("name")

    if (data) setBarbers(data)
  }

  const loadServices = async () => {
    if (!store) return
    const supabase = createClient()
    const { data } = await supabase
      .from("services")
      .select("id, name, description, duration, price, category")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("name")

    if (data) setServices(data)
  }

  const handleSearchCustomer = async () => {
    if (!formData.customerPhone || formData.customerPhone.length < 10) {
      toast.error("Digite um telefone válido")
      return
    }

    if (!store) {
      toast.error("Loja não selecionada")
      return
    }

    setSearchingCustomer(true)
    const result = await searchCustomer(formData.customerPhone, store.id)

    if (result.success && result.customer) {
      setFormData({
        ...formData,
        customerId: result.customer.id,
        customerName: result.customer.name,
        customerEmail: result.customer.email || "",
      })
      toast.success("Cliente encontrado!")
    } else if (result.success && !result.customer) {
      toast.info("Cliente não encontrado. Preencha os dados para criar novo cliente.")
    } else {
      toast.error(result.error || "Erro ao buscar cliente")
    }

    setSearchingCustomer(false)
  }

  const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0)

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) newErrors.customerName = "Nome do cliente é obrigatório"
    if (!formData.customerPhone.trim()) newErrors.customerPhone = "Telefone é obrigatório"
    if (!formData.barberId) newErrors.barberId = "Selecione um barbeiro"
    if (!formData.date) newErrors.date = "Selecione uma data"
    if (!formData.time) newErrors.time = "Selecione um horário"
    if (formData.serviceIds.length === 0) newErrors.serviceIds = "Selecione pelo menos um serviço"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    if (!store) {
      toast.error("Loja não selecionada")
      return
    }

    setLoading(true)

    const result = await createBooking({
      customerId: formData.customerId || undefined,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || undefined,
      customerPhone: formData.customerPhone,
      barberId: formData.barberId,
      date: formData.date,
      time: `${formData.time}:00`,
      serviceIds: formData.serviceIds,
      notes: formData.notes || undefined,
      storeId: store.id,
    })

    if (result.success && result.appointmentId) {
      toast.success("Agendamento criado com sucesso!")
      router.push(`/attendant/booking-details?id=${result.appointmentId}`)
    } else {
      toast.error(result.error || "Erro ao criar agendamento")
    }

    setLoading(false)
  }

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Loja não encontrada.</p>
            <Link href="/login">
              <Button>Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/attendant/availability" className="cursor-pointer">
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Criar Novo Agendamento</h1>
              <p className="text-sm text-muted-foreground">Preencha os detalhes para criar um agendamento</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                  <CardDescription>Digite o telefone para buscar ou criar novo cliente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Telefone</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customerPhone"
                          type="tel"
                          placeholder="(11) 98765-4321"
                          className="pl-10"
                          value={formData.customerPhone}
                          onChange={(e) => handleChange("customerPhone", e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleSearchCustomer}
                        disabled={searchingCustomer}
                        className="cursor-pointer"
                      >
                        {searchingCustomer ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Buscar
                          </>
                        )}
                      </Button>
                    </div>
                    {errors.customerPhone && <p className="text-sm text-destructive">{errors.customerPhone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customerName"
                        placeholder="João Silva"
                        className="pl-10"
                        value={formData.customerName}
                        onChange={(e) => handleChange("customerName", e.target.value)}
                      />
                    </div>
                    {errors.customerName && <p className="text-sm text-destructive">{errors.customerName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email (opcional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="joao@email.com"
                        className="pl-10"
                        value={formData.customerEmail}
                        onChange={(e) => handleChange("customerEmail", e.target.value)}
                      />
                    </div>
                    {errors.customerEmail && <p className="text-sm text-destructive">{errors.customerEmail}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Agendamento</CardTitle>
                  <CardDescription>Selecione barbeiro, data e horário</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="barberId">Barbeiro</Label>
                    <select
                      id="barberId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      value={formData.barberId}
                      onChange={(e) => handleChange("barberId", e.target.value)}
                    >
                      <option value="">Selecione um barbeiro</option>
                      {barbers.map((barber) => (
                        <option key={barber.id} value={barber.id}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                    {errors.barberId && <p className="text-sm text-destructive">{errors.barberId}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        className="cursor-pointer"
                        value={formData.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                      {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Horário</Label>
                      <Input
                        id="time"
                        type="time"
                        className="cursor-pointer"
                        value={formData.time}
                        onChange={(e) => handleChange("time", e.target.value)}
                      />
                      {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Serviços</CardTitle>
                  <CardDescription>Escolha um ou mais serviços</CardDescription>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Carregando serviços...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-all hover:scale-[1.02] cursor-pointer"
                          onClick={() => toggleService(service.id)}
                        >
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={formData.serviceIds.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                            className="cursor-pointer"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`service-${service.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {service.name}
                            </label>
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.duration} min
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                R$ {Number(service.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.serviceIds && <p className="text-sm text-destructive mt-2">{errors.serviceIds}</p>}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações Adicionais</CardTitle>
                  <CardDescription>Solicitações especiais ou informações importantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Digite observações ou solicitações especiais..."
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={4}
                    className="cursor-text"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumo do Agendamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.customerName && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-foreground">Cliente</h4>
                      <p className="text-sm text-muted-foreground">{formData.customerName}</p>
                    </div>
                  )}

                  {formData.barberId && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-foreground">Barbeiro</h4>
                      <p className="text-sm text-muted-foreground">
                        {barbers.find((b) => b.id === formData.barberId)?.name}
                      </p>
                    </div>
                  )}

                  {formData.date && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-foreground">Data & Horário</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(formData.date).toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {formData.time && ` às ${formData.time}`}
                      </p>
                    </div>
                  )}

                  {selectedServices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-foreground">Serviços</h4>
                      <div className="space-y-1">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{service.name}</span>
                            <span className="text-foreground">R$ {Number(service.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedServices.length > 0 && (
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duração</span>
                        <span className="font-medium">{totalDuration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-primary text-lg">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full cursor-pointer" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Criando...
                      </>
                    ) : (
                      "Criar Agendamento"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function CreateBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateBookingContent />
    </Suspense>
  )
}
