"use client"

import { useState, Suspense, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Clock, User, Check, Star, Edit } from "lucide-react"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href={`/customer/services${customerId ? `?customerId=${customerId}` : ""}`}>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                {isEditMode ? "Editar Data e Hora" : "Selecionar Data e Hora"}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">{isEditMode ? "Atualizar agendamento" : "Passo 2 de 4"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isEditMode && (
          <Card className="mb-8 border-blue-500/50 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Editando Agendamento</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione a nova data, horário e barbeiro para seu agendamento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Barber Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Escolha Seu Barbeiro</CardTitle>
                <CardDescription>
                  {preferredBarberIds.length > 0
                    ? "Seus barbeiros preferidos estão destacados"
                    : "Selecione seu barbeiro preferido"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {barbers.map((barber) => {
                    const isPreferred = preferredBarberIds.includes(barber.id)
                    return (
                      <Card
                        key={barber.id}
                        className={`cursor-pointer transition-all ${
                          selectedBarber === barber.id
                            ? "border-primary ring-2 ring-primary"
                            : isPreferred
                              ? "border-warning/50 bg-warning/5"
                              : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedBarber(barber.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className="relative">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={barber.avatar_url || "/placeholder.svg"} alt={barber.name} />
                                <AvatarFallback>
                                  {barber.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {isPreferred && (
                                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-warning flex items-center justify-center">
                                  <Star className="h-3 w-3 text-background fill-background" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{barber.name}</h3>
                              {isPreferred && <p className="text-xs text-warning font-medium">Seu preferido</p>}
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                <span>⭐ {barber.rating}</span>
                                <span>({barber.total_reviews})</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {barber.specialties.slice(0, 2).map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                            {selectedBarber === barber.id && (
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  Selecionar Data
                </CardTitle>
                <CardDescription>Escolha sua data preferida para o agendamento</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-3 md:p-6 overflow-x-auto">
                <div className="w-full max-w-full">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < getCurrentDateTimeBR() || date.getDay() === 0}
                    locale={ptBR}
                    className="rounded-lg border-2 border-border/50 shadow-lg bg-card/50 backdrop-blur-sm mx-auto"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm md:text-base font-semibold text-foreground",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 md:h-9 md:w-9 bg-transparent hover:bg-primary/10 rounded-md transition-colors",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 md:w-12 font-medium text-xs md:text-sm uppercase",
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 md:h-12 md:w-12 p-0 font-medium text-xs md:text-sm hover:bg-primary/20 hover:text-primary-foreground rounded-lg transition-all duration-200 hover:scale-105",
                    day_selected:
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md scale-105",
                    day_today: "bg-accent/50 text-accent-foreground font-bold ring-2 ring-primary/30",
                    day_outside: "text-muted-foreground/40 opacity-50",
                    day_disabled: "text-muted-foreground/30 opacity-30 cursor-not-allowed",
                    day_hidden: "invisible",
                  }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            {selectedDate && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    Selecionar Horário
                  </CardTitle>
                  <CardDescription>
                    Horários disponíveis para{" "}
                    {selectedDate.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            className={`h-12 md:h-14 relative overflow-hidden transition-all duration-200 rounded-md border-2 flex flex-col items-center justify-center ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary scale-105 shadow-lg ring-2 ring-primary/50"
                                : "bg-background border-border hover:scale-105 hover:border-primary/50 hover:bg-primary/5"
                            }`}
                            onClick={() => handleTimeSelect(slot.time)}
                          >
                            <Clock
                              className={`h-3 w-3 md:h-4 md:w-4 mb-0.5 md:mb-1 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}
                            />
                            <span className="text-xs md:text-sm font-semibold">{slot.time}</span>
                            {isSelected && (
                              <div className="absolute top-1 right-1">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Nenhum horário disponível para esta data</p>
                      <p className="text-sm text-muted-foreground mt-2">Por favor, selecione outra data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumo do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground">Serviços</h4>
                  <div className="space-y-1">
                    {selectedServices.map((service) => (
                      <div key={service.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{service.name}</span>
                        <span className="text-success">R$ {Number(service.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedBarber && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Barbeiro
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {barbers.find((b) => b.id === selectedBarber)?.name}
                    </p>
                  </div>
                )}

                {selectedDate && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Data</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {selectedTime && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horário
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedTime}</p>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{totalDuration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-success text-lg">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContinue}
                  disabled={!isComplete || creating}
                >
                  {creating ? (
                    isEditMode ? (
                      <>
                        <Edit className="h-4 w-4 mr-2 animate-pulse" />
                        Atualizando...
                      </>
                    ) : (
                      "Criando agendamento..."
                    )
                  ) : isEditMode ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Atualizar Agendamento
                    </>
                  ) : customerId ? (
                    "Finalizar Agendamento"
                  ) : (
                    "Continuar para Cadastro"
                  )}
                </Button>
              </CardContent>
            </Card>
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
