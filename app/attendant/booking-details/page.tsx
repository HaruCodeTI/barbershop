"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { getBookingDetails, updateBookingStatus, type BookingDetails } from "@/lib/attendant"
import Link from "next/link"
import { toast } from "sonner"

function BookingDetailsContent() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("id")

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (appointmentId) {
      loadBookingDetails()
    } else {
      setError("ID do agendamento não fornecido")
      setLoading(false)
    }
  }, [appointmentId])

  const loadBookingDetails = async () => {
    if (!appointmentId) return

    setLoading(true)
    setError(null)

    const result = await getBookingDetails(appointmentId)

    if (result.success && result.booking) {
      setBooking(result.booking)
    } else {
      setError(result.error || "Erro ao carregar detalhes do agendamento")
    }

    setLoading(false)
  }

  const handleUpdateStatus = async (newStatus: "confirmed" | "cancelled" | "completed") => {
    if (!appointmentId) return

    setUpdating(true)

    const result = await updateBookingStatus(appointmentId, newStatus)

    if (result.success) {
      toast.success(
        newStatus === "confirmed"
          ? "Agendamento confirmado!"
          : newStatus === "cancelled"
            ? "Agendamento cancelado"
            : "Agendamento marcado como concluído",
      )
      loadBookingDetails() // Reload to get updated status
    } else {
      toast.error(result.error || "Erro ao atualizar status")
    }

    setUpdating(false)
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

  if (loading) {
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
                <h1 className="text-xl font-bold text-foreground">Detalhes do Agendamento</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !booking) {
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
                <h1 className="text-xl font-bold text-foreground">Detalhes do Agendamento</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadBookingDetails} variant="outline" className="cursor-pointer">
              Tentar Novamente
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const totalDuration = booking.services.reduce((sum, s) => sum + s.duration, 0)

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
              <h1 className="text-xl font-bold text-foreground">Detalhes do Agendamento</h1>
              <p className="text-sm text-muted-foreground">Referência #{booking.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Scissors className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{booking.customer.name}</h2>
                    <p className="text-sm text-muted-foreground">Agendamento #{booking.id.slice(0, 8)}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusColors[booking.status]}>
                  {statusLabels[booking.status]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Nome</p>
                    <p className="text-sm text-muted-foreground">{booking.customer.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Telefone</p>
                    <p className="text-sm text-muted-foreground">{booking.customer.phone}</p>
                  </div>
                </div>

                {booking.customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Email</p>
                      <p className="text-sm text-muted-foreground">{booking.customer.email}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Pontos de Fidelidade</p>
                  <p className="text-lg font-bold text-primary">{booking.customer.loyalty_points} pontos</p>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Barbeiro</p>
                    <p className="text-sm text-muted-foreground">{booking.barber.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Data</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.appointment_date).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.appointment_time.split(":").slice(0, 2).join(":")} ({totalDuration} minutos)
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-semibold text-foreground mb-1">Observações</p>
                    <p className="text-sm text-muted-foreground">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.duration} minutos</p>
                    </div>
                    <p className="font-semibold text-primary">R$ {service.price.toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t">
                  <div>
                    <p className="font-bold text-foreground">Total</p>
                    {booking.discount_amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Desconto: R$ {booking.discount_amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {booking.discount_amount > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        R$ {booking.total_price.toFixed(2)}
                      </p>
                    )}
                    <p className="font-bold text-primary text-lg">R$ {booking.final_price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {booking.status === "pending" && (
            <div className="flex gap-4">
              <Button
                className="flex-1 cursor-pointer"
                size="lg"
                onClick={() => handleUpdateStatus("confirmed")}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Confirmar Agendamento
              </Button>
              <Button
                variant="destructive"
                className="flex-1 cursor-pointer"
                size="lg"
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Cancelar Agendamento
              </Button>
            </div>
          )}

          {booking.status === "confirmed" && (
            <div className="flex gap-4">
              <Button
                className="flex-1 cursor-pointer"
                size="lg"
                onClick={() => handleUpdateStatus("completed")}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Marcar como Concluído
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function BookingDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BookingDetailsContent />
    </Suspense>
  )
}
