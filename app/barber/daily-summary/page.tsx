"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Phone,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { getDailySummary, completeAppointment, type DailySummary } from "@/lib/barber"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/contexts/auth-context"
import type { StaffUser } from "@/lib/auth"
import { StaffHeader } from "@/components/staff-header"
import { useRouter } from "next/navigation"

export default function BarberDailySummaryPage() {
  const router = useRouter()
  const { user, userType, loading: authLoading } = useAuth()
  const staff = user && userType === "staff" ? (user as StaffUser) : null
  const barberId = staff?.id || null
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingAppointment, setUpdatingAppointment] = useState<string | null>(null)

  useEffect(() => {
    if (barberId) {
      loadSummary()
    }
  }, [selectedDate, barberId])

  const loadSummary = async () => {
    if (!barberId) return
    setLoading(true)
    setError(null)
    const dateStr = selectedDate.toISOString().split("T")[0]
    const result = await getDailySummary(barberId, dateStr)

    if (result.success && result.summary) {
      setSummary(result.summary)
    } else {
      setError(result.error || "Erro ao carregar resumo")
    }
    setLoading(false)
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const handleCompleteAppointment = async (appointmentId: string) => {
    setUpdatingAppointment(appointmentId)
    const result = await completeAppointment(appointmentId)

    if (result.success) {
      toast.success("Agendamento marcado como concluído!")
      loadSummary()
    } else {
      toast.error(result.error || "Erro ao atualizar agendamento")
    }
    setUpdatingAppointment(null)
  }

  const statusColors = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500",
    confirmed: "bg-primary/10 text-primary border-primary",
    completed: "bg-green-500/10 text-green-500 border-green-500",
    cancelled: "bg-destructive/10 text-destructive border-destructive",
    no_show: "bg-gray-500/10 text-gray-500 border-gray-500",
  }

  const statusLabels = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Não Compareceu",
  }

  // Check auth and redirect if not barber
  useEffect(() => {
    if (!authLoading && (!staff || staff.role !== "barber")) {
      router.push("/login")
    }
  }, [authLoading, staff, router])

  if (authLoading || !staff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="cursor-pointer">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Resumo Diário</h1>
                <p className="text-sm text-muted-foreground">Seus agendamentos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/barber/week-overview" className="cursor-pointer">
                <Button variant="outline" className="bg-transparent cursor-pointer">
                  Visão Semanal
                </Button>
              </Link>
              {staff && (
                <StaffHeader
                  staffName={staff.name}
                  staffRole={staff.role as "manager" | "barber" | "attendant"}
                  avatarUrl={staff.avatar_url}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Date Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(-1)}
                className="bg-transparent cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
                </h2>
                <p className="text-muted-foreground">
                  {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
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
            <Button onClick={loadSummary} variant="outline" className="cursor-pointer">
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Agendamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{summary?.stats.total || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Concluídos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{summary?.stats.completed || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Horas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {summary?.stats.totalHours.toFixed(1) || 0}h
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Receita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    R$ {summary?.stats.revenue.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointments List */}
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos de Hoje</CardTitle>
                <CardDescription>Sua agenda para {selectedDate.toLocaleDateString("pt-BR")}</CardDescription>
              </CardHeader>
              <CardContent>
                {!summary || summary.appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {summary.appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-all hover:scale-[1.01]"
                      >
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-primary" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{appointment.customer_name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {appointment.customer_phone}
                              </div>
                            </div>
                            <Badge variant="outline" className={statusColors[appointment.status]}>
                              {statusLabels[appointment.status]}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.appointment_time.split(":").slice(0, 2).join(":")} ({appointment.duration}{" "}
                              min)
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              R$ {appointment.price.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {appointment.services.map((service) => (
                              <Badge key={service.id} variant="secondary">
                                {service.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {appointment.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                            disabled={updatingAppointment === appointment.id}
                            className="cursor-pointer"
                          >
                            {updatingAppointment === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Concluir
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
