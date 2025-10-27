"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { GlassButton } from "@/components/ui/glass-button"
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, MapPin, Download, Loader2, Home, Sparkles, ArrowLeft, AlertCircle } from "lucide-react"
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
      <div className="min-h-screen gradient-animated flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full text-center glass-border-glow animate-scale-in" variant="intense">
          <GlassCardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Clock className="h-16 w-16 text-primary animate-pulse glow-primary" />
                <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-white/80 text-lg">Carregando confirmação...</p>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full glass-border-glow animate-scale-in" variant="intense">
          <GlassCardHeader>
            <GlassCardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <p className="text-white/70">{error || "Agendamento não encontrado"}</p>
            <Link href="/">
              <GlassButton className="w-full" variant="primary">
                <Home className="h-4 w-4 mr-2" />
                Voltar para Início
              </GlassButton>
            </Link>
          </GlassCardContent>
        </GlassCard>
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
    <div className="min-h-screen gradient-animated">
      <header className="glass-subtle sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary glow-primary animate-pulse" />
            <h1 className="text-xl font-bold text-white">Agendamento Confirmado</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Message */}
          <GlassCard className="border-primary/50 glass-border-glow animate-scale-in" variant="intense">
            <GlassCardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full glass-moderate flex items-center justify-center border-2 border-primary/30 animate-scale-in">
                    <CheckCircle2 className="h-12 w-12 text-primary glow-primary-intense animate-pulse" />
                  </div>
                  <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Agendamento Confirmado!</h2>
                  <p className="text-white/70 text-lg">
                    Obrigado, <span className="text-primary font-semibold">{customer.name.split(" ")[0]}</span>!
                    Seu agendamento foi realizado com sucesso.
                  </p>
                </div>
                <div className="glass-moderate px-6 py-3 rounded-xl border border-primary/30 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <p className="text-sm text-white/60 mb-1">Código de Referência</p>
                  <p className="text-2xl font-mono font-bold text-primary glow-primary">{bookingReference}</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Appointment Details */}
          <GlassCard className="animate-scale-in" variant="moderate" style={{ animationDelay: '0.1s' }}>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary glow-primary" />
                Detalhes do Agendamento
              </GlassCardTitle>
              <GlassCardDescription className="text-white/60">
                Por favor, chegue 5 minutos antes do horário agendado
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300">
                  <Calendar className="h-5 w-5 text-primary mt-0.5 glow-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">Data</p>
                    <p className="text-sm text-white/70">
                      {selectedDate?.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300">
                  <Clock className="h-5 w-5 text-primary mt-0.5 glow-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">Horário</p>
                    <p className="text-sm text-white/70">
                      {appointment.appointment_time} ({totalDuration} minutos)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300">
                  <User className="h-5 w-5 text-primary mt-0.5 glow-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">Barbeiro</p>
                    <p className="text-sm text-white/70">{selectedBarber.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 glow-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">Localização</p>
                    <p className="text-sm text-white/70">{store.address}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-semibold text-white mb-3">Serviços</p>
                <div className="space-y-2">
                  {selectedServices.map((service: any, index: number) => (
                    <div
                      key={service.id}
                      className="flex justify-between items-center text-sm p-2 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300"
                      style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                    >
                      <span className="text-white/80">{service.name}</span>
                      <span className="text-white font-medium">R$ {Number(service.price).toFixed(2)}</span>
                    </div>
                  ))}
                  {appointment.discount_amount > 0 && (
                    <div className="flex justify-between text-sm p-2 rounded-lg glass-subtle text-green-400">
                      <span>Desconto</span>
                      <span>- R$ {Number(appointment.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10 p-3 rounded-lg glass-moderate">
                    <span className="text-white">Total</span>
                    <span className="text-primary text-xl glow-primary">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Contact Information */}
          <GlassCard className="animate-scale-in" variant="moderate" style={{ animationDelay: '0.2s' }}>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary glow-primary" />
                Suas Informações
              </GlassCardTitle>
              <GlassCardDescription className="text-white/60">
                Detalhes de confirmação foram enviados para seu e-mail
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300">
                <User className="h-5 w-5 text-primary glow-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Nome</p>
                  <p className="text-sm text-white/70">{customer.name}</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300">
                  <Mail className="h-5 w-5 text-primary glow-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">E-mail</p>
                    <p className="text-sm text-white/70">{customer.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg glass-subtle hover:glass-moderate transition-all duration-300">
                <Phone className="h-5 w-5 text-primary glow-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Telefone</p>
                  <p className="text-sm text-white/70">{customer.phone}</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <GlassButton
              className="flex-1 group"
              size="lg"
              variant="glass-intense"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              )}
              {downloadingPDF ? "Gerando PDF..." : "Baixar Comprovante"}
            </GlassButton>
            <GlassButton
              className="flex-1 group"
              size="lg"
              variant="glass-intense"
              onClick={handleDownloadICS}
              disabled={downloadingICS}
            >
              {downloadingICS ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              )}
              {downloadingICS ? "Gerando..." : "Adicionar ao Calendário"}
            </GlassButton>
          </div>

          <div className="text-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <Link href="/">
              <GlassButton variant="ghost" className="group">
                <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Voltar para Início
              </GlassButton>
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
