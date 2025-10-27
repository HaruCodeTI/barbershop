"use client"

import { useState, Suspense, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { GlassButton } from "@/components/ui/glass-button"
import { Badge } from "@/components/ui/badge"
import { GlassBadge } from "@/components/ui/glass-badge"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, ArrowRight, Clock, User, Check, Star, Edit, Sparkles, Scissors, AlertCircle, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { createAppointment } from "@/lib/appointments"
import { updateAppointment } from "@/lib/customer"
import { useStore } from "@/lib/hooks/use-store"
import { getCurrentDateTimeBR, isDatePast } from "@/lib/utils/date-timezone"

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface Barber {
  id: string
  name: string
  avatar_url: string | null
  rating: number
  total_reviews: number
  specialties: string[]
}

interface Customer {
  id: string
  name: string
  loyalty_points: number
  favorite_barbers: string[]
}

function DateTimeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { store, loading: storeLoading } = useStore()
  const serviceIds = searchParams.get("services")?.split(",") || []
  const customerId = searchParams.get("customerId")
  const couponCode = searchParams.get("coupon")

  // Edit mode
  const isEditMode = searchParams.get("editMode") === "true"
  const appointmentId = searchParams.get("appointmentId")
  const editBarberId = searchParams.get("barberId")
  const editDate = searchParams.get("date")
  const editTime = searchParams.get("time")

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editDate ? new Date(editDate) : getCurrentDateTimeBR(),
  )
  const [selectedTime, setSelectedTime] = useState<string>(editTime || "")
  const [selectedBarber, setSelectedBarber] = useState<string>(editBarberId || "")

  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [customerData, setCustomerData] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .in("id", serviceIds)

      if (servicesData) {
        setServices(servicesData)
      }

      const { data: barbersData, error: barbersError } = await supabase
        .from("barbers")
        .select("id, name, avatar_url")
        .eq("role", "barber")
        .eq("is_active", true)

      if (barbersError) {
        console.error("[v0] Error fetching barbers:", barbersError)
      }

      if (barbersData) {
        const barbersWithDefaults = barbersData.map((barber: any) => ({
          id: barber.id,
          name: barber.name,
          avatar_url: barber.avatar_url,
          rating: 4.5,
          total_reviews: 0,
          specialties: ["Cortes", "Barba"],
        }))
        setBarbers(barbersWithDefaults)
      }

      if (customerId) {
        const { data: customer } = await supabase
          .from("customers")
          .select("id, name, loyalty_points")
          .eq("id", customerId)
          .single()

        if (customer) {
          const { data: appointments } = await supabase
            .from("appointments")
            .select("barber_id")
            .eq("customer_id", customerId)
            .eq("status", "completed")
            .limit(10)

          const favoriteBarberIds = appointments
            ? [...new Set(appointments.map((a: any) => a.barber_id))].slice(0, 3)
            : []

          setCustomerData({
            ...customer,
            favorite_barbers: favoriteBarberIds,
          })
        }
      }

      setLoading(false)
    }

    fetchData()
  }, []) // Empty dependency array - only run once

  const preferredBarberIds = customerData?.favorite_barbers || []

  const selectedServices = services
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0)

  // Generate time slots for the selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate) return []

    const slots = []
    const startHour = 9
    const endHour = 19

    for (let hour = startHour; hour < endHour; hour++) {
      for (const minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push({ time, available: true })
      }
    }

    return slots
  }, [selectedDate])

  const handleContinue = async () => {
    if (!selectedDate || !selectedTime || !selectedBarber) {
      return
    }

    setError("")
    setCreating(true)

    try {
      // Edit mode - update existing appointment
      if (isEditMode && appointmentId) {
        const dateStr = selectedDate.toISOString().split("T")[0]

        // Calculate new prices
        const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0)

        const result = await updateAppointment(appointmentId, {
          appointment_date: dateStr,
          appointment_time: selectedTime,
          barber_id: selectedBarber,
          service_ids: serviceIds,
          total_price: totalPrice,
          discount_amount: 0,
          final_price: totalPrice,
        })

        if (result.success) {
          // Add updated parameter to trigger reload and show success message
          router.push("/customer/appointments?updated=true")
        } else {
          setError(result.error || "Erro ao atualizar agendamento")
          setCreating(false)
        }
      }
      // Create new appointment
      else if (customerId) {
        if (!store) {
          setError("Loja não selecionada. Por favor, retorne e selecione uma loja.")
          setCreating(false)
          return
        }

        const result = await createAppointment({
          customerId,
          barberId: selectedBarber,
          serviceIds,
          date: selectedDate.toISOString(),
          time: selectedTime,
          couponCode: couponCode || undefined,
          storeId: store.id,
        })

        if (result.success) {
          router.push(`/customer/confirmation?appointmentId=${result.appointmentId}`)
        } else {
          setError(result.error || "Erro ao criar agendamento")
          setCreating(false)
        }
      } else {
        // No customer identified, go to signup
        const params = new URLSearchParams({
          services: serviceIds.join(","),
          date: selectedDate.toISOString(),
          time: selectedTime,
          barber: selectedBarber,
          ...(couponCode && { coupon: couponCode }),
        })
        router.push(`/customer/signup?${params}`)
        setCreating(false)
      }
    } catch (err) {
      setError(isEditMode ? "Erro inesperado ao atualizar agendamento" : "Erro inesperado ao criar agendamento")
      setCreating(false)
    }
  }

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time)
  }, [])

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime("") // Reset time when date changes
  }, [])

  const isComplete = selectedDate && selectedTime && selectedBarber

  if (loading || storeLoading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="glass-intense rounded-2xl p-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Clock className="relative h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          </div>
          <p className="text-white/70">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <GlassCard className="max-w-md">
          <GlassCardContent className="py-12 text-center">
            <div className="glass-moderate rounded-full p-4 inline-flex mb-4">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-white/70 mb-6">
              Por favor, selecione uma loja primeiro
            </p>
            <Button
              onClick={() => router.push("/select-store")}
              className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300"
            >
              Selecionar Loja
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-subtle border-b border-primary/20 sticky top-0 z-10 transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href={`/customer/services${customerId ? `?customerId=${customerId}` : ""}`}>
              <Button variant="ghost" size="icon" className="flex-shrink-0 glass-moderate hover:glass-intense rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0 flex items-center gap-3">
              <div className="glass-moderate rounded-full p-2 glow-primary">
                <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white truncate">
                  {isEditMode ? "Editar Data e Hora" : "Selecionar Data e Hora"}
                </h1>
                <p className="text-xs md:text-sm text-white/60">{isEditMode ? "Atualizar agendamento" : "Passo 2 de 4"}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isEditMode && (
          <GlassCard className="mb-8 border-blue-500/30">
            <GlassCardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full glass-moderate border border-blue-500/30">
                  <Edit className="h-6 w-6 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Editando Agendamento</h3>
                  <p className="text-sm text-white/70">
                    Selecione a nova data, horário e barbeiro para seu agendamento
                  </p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Barber Selection */}
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="glass-moderate rounded-full p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <GlassCardTitle className="text-2xl">Escolha Seu Barbeiro</GlassCardTitle>
                </div>
                <GlassCardDescription>
                  {preferredBarberIds.length > 0
                    ? "Seus barbeiros preferidos estão destacados"
                    : "Selecione seu barbeiro preferido"}
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {barbers.map((barber, index) => {
                    const isPreferred = preferredBarberIds.includes(barber.id)
                    return (
                      <GlassCard
                        key={barber.id}
                        className={`cursor-pointer group ${
                          selectedBarber === barber.id
                            ? "border-primary ring-2 ring-primary glow-primary"
                            : isPreferred
                              ? "border-yellow-500/50 glow-primary"
                              : "glass-hover-lift"
                        }`}
                        onClick={() => setSelectedBarber(barber.id)}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <GlassCardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className="relative">
                              <div className={`absolute inset-0 ${selectedBarber === barber.id ? 'bg-primary/20' : isPreferred ? 'bg-yellow-400/20' : 'bg-primary/10'} rounded-full blur-xl ${selectedBarber === barber.id || isPreferred ? 'animate-pulse' : ''}`} />
                              <Avatar className="relative h-20 w-20 border-2 border-white/10">
                                <AvatarImage src={barber.avatar_url || "/placeholder.svg"} alt={barber.name} />
                                <AvatarFallback className="text-lg">
                                  {barber.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {isPreferred && (
                                <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full glass-moderate border border-yellow-500/30 flex items-center justify-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-lg">{barber.name}</h3>
                              {isPreferred && (
                                <p className="text-xs text-yellow-400 font-medium mt-1">⭐ Seu preferido</p>
                              )}
                              <div className="flex items-center justify-center gap-1 text-sm text-white/60 mt-1">
                                <span>⭐ {barber.rating}</span>
                                <span>({barber.total_reviews})</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {barber.specialties.slice(0, 2).map((specialty) => (
                                <GlassBadge key={specialty} variant="default" className="text-xs">
                                  {specialty}
                                </GlassBadge>
                              ))}
                            </div>
                            {selectedBarber === barber.id && (
                              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                                <Check className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                        </GlassCardContent>
                      </GlassCard>
                    )
                  })}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Date Selection */}
            <GlassCard className="overflow-hidden glass-border-glow">
              <GlassCardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="glass-moderate rounded-full p-2 glow-primary">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <GlassCardTitle className="text-2xl">Selecionar Data</GlassCardTitle>
                </div>
                <GlassCardDescription>Escolha sua data preferida para o agendamento</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="flex justify-center p-3 md:p-6 overflow-x-auto">
                <div className="w-full max-w-full">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < getCurrentDateTimeBR() || date.getDay() === 0}
                    locale={ptBR}
                    className="rounded-xl border-2 border-white/10 glass-moderate mx-auto"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm md:text-base font-semibold text-white",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 md:h-9 md:w-9 glass-subtle hover:glass-moderate rounded-md transition-all",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-white/60 rounded-md w-9 md:w-12 font-medium text-xs md:text-sm uppercase",
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 md:h-12 md:w-12 p-0 font-medium text-xs md:text-sm text-white hover:glass-intense hover:scale-110 rounded-lg transition-all duration-200",
                    day_selected:
                      "bg-primary text-white hover:bg-primary focus:bg-primary shadow-lg scale-110 glow-primary",
                    day_today: "glass-moderate text-white font-bold ring-2 ring-primary/50",
                    day_outside: "text-white/20 opacity-50",
                    day_disabled: "text-white/10 opacity-30 cursor-not-allowed",
                    day_hidden: "invisible",
                  }}
                  />
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Time Selection */}
            {selectedDate && (
              <GlassCard className="overflow-hidden glass-border-glow">
                <GlassCardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="glass-moderate rounded-full p-2 glow-primary">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <GlassCardTitle className="text-2xl">Selecionar Horário</GlassCardTitle>
                  </div>
                  <GlassCardDescription>
                    Horários disponíveis para{" "}
                    {selectedDate.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent className="p-3 md:p-6">
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            className={`h-14 md:h-16 relative overflow-hidden transition-all duration-300 rounded-xl border-2 flex flex-col items-center justify-center ${
                              isSelected
                                ? "glass-intense border-primary scale-110 shadow-xl ring-2 ring-primary/50 glow-primary"
                                : "glass-moderate border-white/10 hover:scale-105 hover:border-primary/50 hover:glass-intense"
                            }`}
                            onClick={() => handleTimeSelect(slot.time)}
                          >
                            <Clock
                              className={`h-4 w-4 md:h-5 md:w-5 mb-1 ${isSelected ? "text-primary" : "text-white/60"}`}
                            />
                            <span className={`text-sm md:text-base font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>
                              {slot.time}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 animate-scale-in">
                                <Check className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="glass-moderate rounded-full p-6 inline-flex mb-4">
                        <Clock className="h-10 w-10 text-white/40" />
                      </div>
                      <p className="text-white font-semibold text-lg mb-2">Nenhum horário disponível para esta data</p>
                      <p className="text-sm text-white/60">Por favor, selecione outra data</p>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <GlassCard
              className="sticky top-24 glass-border-glow animate-scale-in"
              variant="intense"
              style={{ animationDelay: '0.4s' }}
            >
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary animate-pulse" />
                  Resumo do Agendamento
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-5">
                {/* Services List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-primary" />
                    Serviços
                  </h4>
                  <div className="space-y-2">
                    {selectedServices.map((service, index) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center text-sm p-2 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300"
                        style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                      >
                        <span className="text-white/80">{service.name}</span>
                        <span className="text-green-400 font-semibold">R$ {Number(service.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barber Info */}
                {selectedBarber && (
                  <div className="space-y-2 p-3 rounded-lg glass-subtle animate-scale-in">
                    <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary glow-primary" />
                      Barbeiro
                    </h4>
                    <p className="text-sm text-white/70 pl-6">
                      {barbers.find((b) => b.id === selectedBarber)?.name}
                    </p>
                  </div>
                )}

                {/* Date Info */}
                {selectedDate && (
                  <div className="space-y-2 p-3 rounded-lg glass-subtle animate-scale-in">
                    <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Data
                    </h4>
                    <p className="text-sm text-white/70 pl-6">
                      {selectedDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {/* Time Info */}
                {selectedTime && (
                  <div className="space-y-2 p-3 rounded-lg glass-subtle animate-scale-in">
                    <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary glow-primary" />
                      Horário
                    </h4>
                    <p className="text-sm text-white/70 pl-6">{selectedTime}</p>
                  </div>
                )}

                {/* Total Summary */}
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm p-2 rounded-lg glass-subtle">
                    <span className="text-white/70">Duração</span>
                    <span className="font-semibold text-white">{totalDuration} min</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg glass-moderate">
                    <span className="font-semibold text-white text-base">Total</span>
                    <span className="font-bold text-green-400 text-xl glow-primary">
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 glass-moderate border border-red-500/30 rounded-lg animate-scale-in">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <GlassButton
                  className="w-full text-base font-semibold group"
                  size="lg"
                  variant="primary"
                  onClick={handleContinue}
                  disabled={!isComplete || creating}
                >
                  {creating ? (
                    isEditMode ? (
                      <>
                        <Edit className="h-5 w-5 mr-2 animate-pulse" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Criando agendamento...
                      </>
                    )
                  ) : isEditMode ? (
                    <>
                      <Edit className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Atualizar Agendamento
                    </>
                  ) : customerId ? (
                    <>
                      <Check className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Finalizar Agendamento
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                      Continuar para Cadastro
                    </>
                  )}
                </GlassButton>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DateTimePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DateTimeContent />
    </Suspense>
  )
}
