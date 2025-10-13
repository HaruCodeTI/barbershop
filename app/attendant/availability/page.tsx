"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Plus, CalendarIcon, Loader2 } from "lucide-react"
import { getBarberAvailability, type BarberAvailability } from "@/lib/attendant"
import Link from "next/link"
import { cn } from "@/lib/utils"

// TODO: Get from auth/context
const STORE_ID = "hobnkfghduuspsdvhkla"

export default function AttendantAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ barberId: string; time: string } | null>(null)
  const [availability, setAvailability] = useState<BarberAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAvailability()
  }, [selectedDate])

  const loadAvailability = async () => {
    setLoading(true)
    setError(null)
    const dateStr = selectedDate.toISOString().split("T")[0]
    const result = await getBarberAvailability(STORE_ID, dateStr)

    if (result.success && result.availability) {
      setAvailability(result.availability)
    } else {
      setError(result.error || "Erro ao carregar disponibilidade")
    }
    setLoading(false)
  }

  const timeSlots = availability[0]?.slots.map((s) => s.time) || []

  const handleSlotClick = (barberId: string, time: string, status: string) => {
    if (status === "available") {
      setSelectedSlot({ barberId, time })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Availability Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage barber schedules and bookings</p>
              </div>
            </div>
            <Link href="/attendant/create-booking">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Date Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary" />
                    <span className="text-sm text-muted-foreground">Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-destructive" />
                    <span className="text-sm text-muted-foreground">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-muted" />
                    <span className="text-sm text-muted-foreground">Bloqueado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Availability Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardTitle>
                <CardDescription>Click on available slots to create a booking</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button onClick={loadAvailability} variant="outline">
                      Tentar Novamente
                    </Button>
                  </div>
                ) : availability.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum barbeiro disponível</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      {/* Header Row */}
                      <div
                        className="grid gap-2 mb-2"
                        style={{ gridTemplateColumns: `120px repeat(${availability.length}, 1fr)` }}
                      >
                        <div className="font-semibold text-sm text-muted-foreground">Horário</div>
                        {availability.map((barberAvail) => (
                          <div key={barberAvail.barberId} className="font-semibold text-sm text-center text-foreground">
                            {barberAvail.barberName}
                          </div>
                        ))}
                      </div>

                      {/* Time Slots Grid */}
                      <div className="space-y-2">
                        {timeSlots.map((time) => {
                          // Format time for display (remove seconds)
                          const displayTime = time.split(":").slice(0, 2).join(":")

                          return (
                            <div
                              key={time}
                              className="grid gap-2"
                              style={{ gridTemplateColumns: `120px repeat(${availability.length}, 1fr)` }}
                            >
                              <div className="flex items-center text-sm font-medium text-muted-foreground">
                                {displayTime}
                              </div>
                              {availability.map((barberAvail) => {
                                const slot = barberAvail.slots.find((s) => s.time === time)
                                if (!slot) return null

                                return (
                                  <button
                                    key={`${barberAvail.barberId}-${time}`}
                                    onClick={() => handleSlotClick(barberAvail.barberId, time, slot.status)}
                                    className={cn(
                                      "h-12 rounded-md border-2 transition-all text-xs font-medium",
                                      slot.status === "available" &&
                                        "bg-primary/10 border-primary hover:bg-primary/20 hover:scale-105 cursor-pointer",
                                      slot.status === "booked" &&
                                        "bg-destructive/10 border-destructive cursor-not-allowed",
                                      slot.status === "blocked" && "bg-muted border-muted cursor-not-allowed",
                                      selectedSlot?.barberId === barberAvail.barberId &&
                                        selectedSlot?.time === time &&
                                        "ring-2 ring-primary scale-105",
                                    )}
                                    disabled={slot.status !== "available"}
                                    title={
                                      slot.status === "booked"
                                        ? `Ocupado: ${slot.appointment?.customerName}`
                                        : slot.status === "blocked"
                                          ? "Horário bloqueado"
                                          : "Clique para agendar"
                                    }
                                  >
                                    {slot.status === "available" && "Disponível"}
                                    {slot.status === "booked" && "Ocupado"}
                                    {slot.status === "blocked" && "Bloqueado"}
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {selectedSlot && !loading && (
                  <div className="mt-6 p-4 bg-primary/5 border border-primary rounded-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Horário Selecionado</p>
                        <p className="text-sm text-muted-foreground">
                          {availability.find((b) => b.barberId === selectedSlot.barberId)?.barberName} às{" "}
                          {selectedSlot.time.split(":").slice(0, 2).join(":")}
                        </p>
                      </div>
                      <Link
                        href={`/attendant/create-booking?barber=${selectedSlot.barberId}&date=${selectedDate.toISOString()}&time=${selectedSlot.time}`}
                      >
                        <Button className="cursor-pointer">Criar Agendamento</Button>
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
