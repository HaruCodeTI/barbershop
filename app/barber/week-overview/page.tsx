"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react"
import { getWeekOverview, type WeekOverview } from "@/lib/barber"
import Link from "next/link"
import { cn } from "@/lib/utils"

// TODO: Get from auth
const BARBER_ID = "d6f5e4d3-c2b1-4a09-8f7e-6d5c4b3a2910"

export default function BarberWeekOverviewPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    return new Date(today.setDate(diff))
  })

  const [overview, setOverview] = useState<WeekOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWeekOverview()
  }, [currentWeekStart])

  const loadWeekOverview = async () => {
    setLoading(true)
    setError(null)
    const weekStartStr = currentWeekStart.toISOString().split("T")[0]
    const result = await getWeekOverview(BARBER_ID, weekStartStr)

    if (result.success && result.overview) {
      setOverview(result.overview)
    } else {
      setError(result.error || "Erro ao carregar visão semanal")
    }
    setLoading(false)
  }

  const changeWeek = (weeks: number) => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + weeks * 7)
    setCurrentWeekStart(newDate)
  }

  const statusColors = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500",
    confirmed: "bg-primary/10 text-primary border-primary",
    completed: "bg-green-500/10 text-green-500 border-green-500",
    cancelled: "bg-destructive/10 text-destructive border-destructive",
    no_show: "bg-gray-500/10 text-gray-500 border-gray-500",
  }

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/barber/daily-summary" className="cursor-pointer">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Visão Semanal</h1>
                <p className="text-sm text-muted-foreground">Seus agendamentos da semana</p>
              </div>
            </div>
            <Link href="/barber/time-blocking" className="cursor-pointer">
              <Button variant="outline" className="bg-transparent cursor-pointer">
                Gerenciar Disponibilidade
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Week Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeWeek(-1)}
                className="bg-transparent cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  {currentWeekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} -{" "}
                  {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeWeek(1)}
                className="bg-transparent cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadWeekOverview} variant="outline" className="cursor-pointer">
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            {/* Week Stats - Days Cards */}
            <div className="grid gap-4 md:grid-cols-7 mb-6">
              {overview?.days.map((day) => {
                const dayDate = new Date(day.date)
                const isToday = dayDate.toDateString() === new Date().toDateString()

                return (
                  <Card
                    key={day.date}
                    className={cn(
                      "transition-all hover:scale-105 cursor-pointer",
                      isToday && "border-primary ring-2 ring-primary/20",
                    )}
                  >
                    <CardHeader className="pb-3">
                      <CardDescription className={cn(isToday && "text-primary font-semibold")}>
                        {day.dayOfWeek.slice(0, 3)}
                      </CardDescription>
                      <CardTitle className="text-lg">
                        {dayDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Agend.</span>
                          <span className="font-semibold">{day.totalAppointments}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Receita</span>
                          <span className="font-semibold text-primary">R$ {day.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Detailed Day View */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {overview?.days.map((day) => {
                if (day.appointments.length === 0) return null

                return (
                  <Card key={day.date}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {new Date(day.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </CardTitle>
                      <CardDescription>{day.appointments.length} agendamentos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {day.appointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="p-2 rounded-lg border hover:bg-accent/50 transition-all text-sm"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <p className="font-medium text-foreground">{apt.customer_name}</p>
                                <p className="text-xs text-muted-foreground">{apt.time}</p>
                              </div>
                              <Badge variant="outline" className={cn("text-xs", statusColors[apt.status])}>
                                {apt.status === "pending"
                                  ? "Pend"
                                  : apt.status === "confirmed"
                                    ? "Conf"
                                    : apt.status === "completed"
                                      ? "Conc"
                                      : apt.status === "cancelled"
                                        ? "Canc"
                                        : "NS"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {apt.services.slice(0, 2).map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {service.length > 15 ? service.slice(0, 12) + "..." : service}
                                </Badge>
                              ))}
                              {apt.services.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{apt.services.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Empty State */}
            {overview && overview.days.every((d) => d.appointments.length === 0) && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum agendamento para esta semana</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Week Schedule Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Semanal</CardTitle>
                <CardDescription>Visão geral da sua agenda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div className="font-semibold text-sm text-muted-foreground">Horário</div>
                      {overview?.days.map((day) => {
                        const dayDate = new Date(day.date)
                        const isToday = dayDate.toDateString() === new Date().toDateString()
                        return (
                          <div
                            key={day.date}
                            className={cn(
                              "font-semibold text-sm text-center",
                              isToday ? "text-primary" : "text-foreground",
                            )}
                          >
                            {day.dayOfWeek.slice(0, 3)}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {dayDate.toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" })}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-1">
                      {timeSlots.map((time) => (
                        <div key={time} className="grid grid-cols-8 gap-2">
                          <div className="flex items-center text-xs font-medium text-muted-foreground">{time}</div>
                          {overview?.days.map((day) => {
                            const appointment = day.appointments.find((apt) => apt.time.startsWith(time))

                            return (
                              <div
                                key={`${day.date}-${time}`}
                                className={cn(
                                  "h-8 rounded border text-xs flex items-center justify-center transition-all",
                                  appointment
                                    ? "bg-primary/10 border-primary text-primary font-medium cursor-pointer hover:bg-primary/20 hover:scale-105"
                                    : "bg-muted/30 border-muted",
                                )}
                                title={appointment ? appointment.customer_name : undefined}
                              >
                                {appointment && appointment.customer_name.split(" ")[0]}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
