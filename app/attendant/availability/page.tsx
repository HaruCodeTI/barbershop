"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Plus, CalendarIcon, Loader2 } from "lucide-react"
import { getBarberAvailability, type BarberAvailability } from "@/lib/attendant"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/hooks/use-store"
import { useAuth } from "@/lib/contexts/auth-context"
import type { StaffUser } from "@/lib/auth"
import { StaffHeader } from "@/components/staff-header"
import { useRouter } from "next/navigation"
import { LoadingPage, LoadingCard } from "@/components/loading-state"

export default function AttendantAvailabilityPage() {
  const router = useRouter()
  const { user, userType, loading: authLoading } = useAuth()
  const staff = user && userType === "staff" ? (user as StaffUser) : null
  const { store, loading: storeLoading } = useStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ barberId: string; time: string } | null>(null)
  const [availability, setAvailability] = useState<BarberAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAvailability = useCallback(async () => {
    if (!store) return

    setLoading(true)
    setError(null)
    const dateStr = selectedDate.toISOString().split("T")[0]
    const result = await getBarberAvailability(store.id, dateStr)

    if (result.success && result.availability) {
      setAvailability(result.availability)
    } else {
      setError(result.error || "Erro ao carregar disponibilidade")
    }
    setLoading(false)
  }, [store, selectedDate])

  useEffect(() => {
    if (store) {
      loadAvailability()
    }
  }, [store, loadAvailability])

  const timeSlots = availability[0]?.slots.map((s) => s.time) || []

  const handleSlotClick = (barberId: string, time: string, status: string, appointmentId?: string) => {
    if (status === "available") {
      setSelectedSlot({ barberId, time })
    } else if (status === "booked" && appointmentId) {
      // Navigate to booking details page
      router.push(`/attendant/booking-details?id=${appointmentId}`)
    }
  }

  // Check auth and redirect if not attendant
  useEffect(() => {
    if (!authLoading && (!staff || staff.role !== "attendant")) {
      router.push("/login")
    }
  }, [authLoading, staff, router])

  if (authLoading || storeLoading) {
    return <LoadingPage />
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Loja não encontrada. Por favor, faça login novamente.</p>
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
        <div className="w-full px-2 sm:px-4 py-3 sm:py-4 max-w-full">
          <div className="flex items-center justify-between gap-2 max-w-full">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link href="/" className="flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Disponibilidade</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Link href="/attendant/create-booking" className="flex-shrink-0">
                <Button size="sm" className="h-8 px-2 sm:px-4">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="ml-1 text-xs sm:text-sm hidden xs:inline">Novo</span>
                </Button>
              </Link>
              {staff && (
                <div className="flex-shrink-0">
                  <StaffHeader
                    staffName={staff.name}
                    staffRole={staff.role as "manager" | "barber" | "attendant"}
                    avatarUrl={staff.avatar_url}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-4">
          {/* Date Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Data: {selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border scale-90 sm:scale-100 origin-top"
                  />
                </div>
                <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-primary flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-destructive flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-muted flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Bloqueado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Availability Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Clique nos horários disponíveis para criar um agendamento</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                {loading ? (
                  <LoadingCard />
                ) : error ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-destructive mb-4 text-sm">{error}</p>
                    <Button onClick={loadAvailability} variant="outline" size="sm">
                      Tentar Novamente
                    </Button>
                  </div>
                ) : availability.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-muted-foreground text-sm">Nenhum barbeiro disponível</p>
                  </div>
                ) : (
                  <>
                    <div className="sm:hidden text-center mb-2 px-4">
                      <p className="text-[10px] text-muted-foreground">← Deslize para ver todos os barbeiros →</p>
                    </div>
                    <div className="overflow-x-auto touch-pan-x scrollbar-thin">
                      <div className="min-w-max px-2 sm:px-0">
                      {/* Header Row */}
                      <div
                        className="grid gap-0.5 sm:gap-2 mb-1.5 sm:mb-2"
                        style={{ gridTemplateColumns: `60px repeat(${availability.length}, minmax(70px, 1fr))` }}
                      >
                        <div className="font-semibold text-[10px] sm:text-sm text-muted-foreground px-1">Hora</div>
                        {availability.map((barberAvail) => (
                          <div key={barberAvail.barberId} className="font-semibold text-[10px] sm:text-xs text-center text-foreground truncate px-0.5">
                            {barberAvail.barberName.split(" ")[0]}
                          </div>
                        ))}
                      </div>

                      {/* Time Slots Grid */}
                      <div className="space-y-0.5 sm:space-y-2">
                        {timeSlots.map((time) => {
                          // Format time for display (remove seconds)
                          const displayTime = time.split(":").slice(0, 2).join(":")

                          return (
                            <div
                              key={time}
                              className="grid gap-0.5 sm:gap-2"
                              style={{ gridTemplateColumns: `60px repeat(${availability.length}, minmax(70px, 1fr))` }}
                            >
                              <div className="flex items-center text-[10px] sm:text-sm font-medium text-muted-foreground px-1">
                                {displayTime}
                              </div>
                              {availability.map((barberAvail) => {
                                const slot = barberAvail.slots.find((s) => s.time === time)
                                if (!slot) return null

                                return (
                                  <button
                                    key={`${barberAvail.barberId}-${time}`}
                                    onClick={() => handleSlotClick(barberAvail.barberId, time, slot.status, slot.appointment?.id)}
                                    className={cn(
                                      "h-9 sm:h-12 rounded border-2 transition-all text-[9px] sm:text-xs font-medium touch-manipulation",
                                      slot.status === "available" &&
                                        "bg-primary/10 border-primary active:bg-primary/30 sm:hover:bg-primary/20 sm:hover:scale-105 cursor-pointer",
                                      slot.status === "booked" &&
                                        "bg-destructive/10 border-destructive cursor-pointer active:bg-destructive/30 sm:hover:bg-destructive/20 sm:hover:scale-105",
                                      slot.status === "blocked" && "bg-muted border-muted cursor-not-allowed opacity-50",
                                      selectedSlot?.barberId === barberAvail.barberId &&
                                        selectedSlot?.time === time &&
                                        "ring-2 ring-primary scale-105",
                                    )}
                                    disabled={slot.status === "blocked"}
                                    title={
                                      slot.status === "booked"
                                        ? `Ocupado: ${slot.appointment?.customerName} - Clique para ver detalhes`
                                        : slot.status === "blocked"
                                          ? "Horário bloqueado"
                                          : "Clique para agendar"
                                    }
                                  >
                                    <span className="hidden xs:inline sm:hidden">
                                      {slot.status === "available" && "Disp"}
                                      {slot.status === "booked" && "Ocup"}
                                      {slot.status === "blocked" && "Bloq"}
                                    </span>
                                    <span className="xs:hidden sm:inline">
                                      {slot.status === "available" && "✓"}
                                      {slot.status === "booked" && "●"}
                                      {slot.status === "blocked" && "✕"}
                                    </span>
                                    <span className="hidden sm:inline">
                                      {slot.status === "available" && "Disponível"}
                                      {slot.status === "booked" && "Ocupado"}
                                      {slot.status === "blocked" && "Bloqueado"}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    </div>
                  </>
                )}

                {selectedSlot && !loading && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/5 border border-primary rounded-lg transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">Horário Selecionado</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {availability.find((b) => b.barberId === selectedSlot.barberId)?.barberName} às{" "}
                          {selectedSlot.time.split(":").slice(0, 2).join(":")}
                        </p>
                      </div>
                      <Link
                        href={`/attendant/create-booking?barber=${selectedSlot.barberId}&date=${selectedDate.toISOString()}&time=${selectedSlot.time}`}
                        className="w-full sm:w-auto"
                      >
                        <Button className="cursor-pointer w-full sm:w-auto" size="sm">Criar Agendamento</Button>
                      </Link>
                    </div>
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
