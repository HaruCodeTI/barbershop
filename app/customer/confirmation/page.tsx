"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, MapPin, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { getAppointmentById } from "@/lib/appointments"
import { downloadAppointmentPDF, downloadAppointmentICS, AppointmentData } from "@/lib/appointment-utils"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")

  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [downloadingICS, setDownloadingICS] = useState(false)

  useEffect(() => {
    async function fetchAppointment() {
      if (!appointmentId) {
        setError("ID de agendamento não encontrado")
        setLoading(false)
        return
      }

      const result = await getAppointmentById(appointmentId)

      if (result.success && result.appointment) {
        setAppointment(result.appointment)
      } else {
        setError(result.error || "Erro ao buscar agendamento")
      }

      setLoading(false)
    }

    fetchAppointment()
  }, [appointmentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando confirmação...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Agendamento não encontrado"}</p>
            <Link href="/">
              <Button className="w-full">Voltar para Início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Map services with correct prices from appointment_services
  const selectedServices = appointment.appointment_services.map((as: any) => ({
    ...as.service,
    price: as.price, // Use price from appointment_services (price at booking time)
  }))
  const selectedBarber = appointment.barber
  const customer = appointment.customer
  const store = appointment.store
  const selectedDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
  const totalPrice = Number(appointment.final_price)
  const totalDuration = selectedServices.reduce((sum: number, s: any) => sum + s.duration, 0)

  const bookingReference = `GB${appointment.id.slice(-8).toUpperCase()}`

  // Handlers for download actions
  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    try {
      const appointmentData: AppointmentData = {
        id: appointment.id,
        bookingReference,
        customer: {
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
        },
        barber: {
          name: selectedBarber.name,
        },
        store: {
          name: store.name,
          address: store.address,
          phone: store.phone,
        },
        date: selectedDate,
        time: appointment.appointment_time,
        services: selectedServices,
        totalPrice,
        discountAmount: appointment.discount_amount > 0 ? Number(appointment.discount_amount) : undefined,
        duration: totalDuration,
      }

      await downloadAppointmentPDF(appointmentData)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Erro ao baixar comprovante. Por favor, tente novamente.")
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDownloadICS = () => {
    setDownloadingICS(true)
    try {
      const appointmentData: AppointmentData = {
        id: appointment.id,
        bookingReference,
        customer: {
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
        },
        barber: {
          name: selectedBarber.name,
        },
        store: {
          name: store.name,
          address: store.address,
          phone: store.phone,
        },
        date: selectedDate,
        time: appointment.appointment_time,
        services: selectedServices,
        totalPrice,
        discountAmount: appointment.discount_amount > 0 ? Number(appointment.discount_amount) : undefined,
        duration: totalDuration,
      }

      downloadAppointmentICS(appointmentData)
    } catch (error) {
      console.error("Error downloading ICS:", error)
      alert("Erro ao gerar evento de calendário. Por favor, tente novamente.")
    } finally {
      setDownloadingICS(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Agendamento Confirmado</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Message */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Agendamento Confirmado!</h2>
                  <p className="text-muted-foreground">
                    Obrigado, {customer.name.split(" ")[0]}! Seu agendamento foi realizado com sucesso.
                  </p>
                </div>
                <div className="bg-background px-4 py-2 rounded-md">
                  <p className="text-sm text-muted-foreground">Código de Referência</p>
                  <p className="text-lg font-mono font-bold text-primary">{bookingReference}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Agendamento</CardTitle>
              <CardDescription>Por favor, chegue 5 minutos antes do horário agendado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Data</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate?.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.appointment_time} ({totalDuration} minutos)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Barbeiro</p>
                    <p className="text-sm text-muted-foreground">{selectedBarber.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Localização</p>
                    <p className="text-sm text-muted-foreground">{store.address}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-foreground mb-3">Serviços</p>
                <div className="space-y-2">
                  {selectedServices.map((service: any) => (
                    <div key={service.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{service.name}</span>
                      <span className="text-foreground font-medium">R$ {Number(service.price).toFixed(2)}</span>
                    </div>
                  ))}
                  {appointment.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Desconto</span>
                      <span>- R$ {Number(appointment.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Suas Informações</CardTitle>
              <CardDescription>Detalhes de confirmação foram enviados para seu e-mail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Nome</p>
                  <p className="text-sm text-muted-foreground">{customer.name}</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">E-mail</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Telefone</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1 bg-transparent"
              size="lg"
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingPDF ? "Gerando PDF..." : "Baixar Comprovante"}
            </Button>
            <Button
              className="flex-1 bg-transparent"
              size="lg"
              variant="outline"
              onClick={handleDownloadICS}
              disabled={downloadingICS}
            >
              {downloadingICS ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              {downloadingICS ? "Gerando..." : "Adicionar ao Calendário"}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/">
              <Button variant="ghost">Voltar para Início</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}
