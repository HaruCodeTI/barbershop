"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Download,
  X,
  Loader2,
  AlertCircle,
  CalendarX,
  Scissors,
  Edit,
  CalendarCheck,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getCustomerAppointments, cancelAppointment, type CustomerAppointment } from "@/lib/customer"
import { downloadAppointmentPDF, downloadAppointmentICS, type AppointmentData } from "@/lib/appointment-utils"

function AppointmentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<CustomerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("all")
  const [successMessage, setSuccessMessage] = useState<string>("")

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<CustomerAppointment | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)

  // Download states
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)
  const [downloadingICS, setDownloadingICS] = useState<string | null>(null)

  // Customer data from localStorage - must use state to avoid hydration errors
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [customerDataLoaded, setCustomerDataLoaded] = useState(false)

  // Load customer data from localStorage after mount
  useEffect(() => {
    setCustomerId(localStorage.getItem("customerId"))
    setCustomerName(localStorage.getItem("customerName"))
    setCustomerDataLoaded(true)
  }, [])

  // Memoized counters for tabs - updates automatically when appointments change
  const appointmentCounts = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      all: appointments.length,
      upcoming: appointments.filter(
        (apt) =>
          new Date(apt.appointment_date) >= today && ["pending", "confirmed"].includes(apt.status)
      ).length,
      past: appointments.filter(
        (apt) => new Date(apt.appointment_date) < today || apt.status === "completed"
      ).length,
      cancelled: appointments.filter((apt) => apt.status === "cancelled").length,
    }
  }, [appointments])

  useEffect(() => {
    async function fetchAppointments() {
      // Wait for customer data to be loaded from localStorage
      if (!customerDataLoaded) {
        return
      }

      if (!customerId) {
        setError("Cliente não identificado. Por favor, faça login.")
        setLoading(false)
        return
      }

      const result = await getCustomerAppointments(customerId)

      if (result.success && result.appointments) {
        // Remove duplicates based on appointment ID
        const uniqueAppointments = result.appointments.filter(
          (apt, index, self) => index === self.findIndex((a) => a.id === apt.id)
        )
        setAppointments(uniqueAppointments)
        filterAppointments(uniqueAppointments, activeFilter)
      } else {
        setError(result.error || "Erro ao buscar agendamentos")
      }

      setLoading(false)

      // Check if returning from an update
      const updated = searchParams.get("updated")
      if (updated === "true") {
        setSuccessMessage("Agendamento atualizado com sucesso!")
        // Clear the parameter from URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, "", newUrl)

        // Clear message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000)
      }
    }

    fetchAppointments()
  }, [customerId, searchParams, customerDataLoaded])

  const filterAppointments = (appts: CustomerAppointment[], filter: typeof activeFilter) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let filtered = appts

    if (filter === "upcoming") {
      filtered = appts.filter((apt) => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate >= today && ["pending", "confirmed"].includes(apt.status)
      })
    } else if (filter === "past") {
      filtered = appts.filter((apt) => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate < today || apt.status === "completed"
      })
    } else if (filter === "cancelled") {
      filtered = appts.filter((apt) => apt.status === "cancelled")
    }

    setFilteredAppointments(filtered)
  }

  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter)
    filterAppointments(appointments, filter)
  }

  const handleCancelClick = (appointment: CustomerAppointment) => {
    setAppointmentToCancel(appointment)
    setCancelDialogOpen(true)
    setCancelReason("")
  }

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return

    setCancelling(true)
    console.log("[DEBUG] Attempting to cancel appointment:", {
      appointmentId: appointmentToCancel.id,
      reason: cancelReason,
      appointmentDate: appointmentToCancel.appointment_date,
      appointmentTime: appointmentToCancel.appointment_time,
      currentStatus: appointmentToCancel.status,
    })

    const result = await cancelAppointment(appointmentToCancel.id, cancelReason)
    console.log("[DEBUG] Cancel appointment result:", result)

    if (result.success) {
      console.log("[DEBUG] Cancel successful - updating local state")
      // Update local state
      const updatedAppointments = appointments.map((apt) =>
        apt.id === appointmentToCancel.id ? { ...apt, status: "cancelled" as const } : apt,
      )
      setAppointments(updatedAppointments)
      filterAppointments(updatedAppointments, activeFilter)
      setCancelDialogOpen(false)
      setAppointmentToCancel(null)

      // Show success message
      setSuccessMessage("Agendamento cancelado com sucesso!")
      setTimeout(() => setSuccessMessage(""), 5000)
    } else {
      console.error("[DEBUG] Cancel failed:", result.error)
      alert(result.error || "Erro ao cancelar agendamento")
    }

    setCancelling(false)
  }

  const handleEditClick = (appointment: CustomerAppointment) => {
    // Navigate to services page with edit mode
    const serviceIds = appointment.appointment_services.map((as) => as.service_id).join(",")
    const params = new URLSearchParams({
      editMode: "true",
      appointmentId: appointment.id,
      services: serviceIds,
      barberId: appointment.barber.id,
      storeId: appointment.store.id,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      customerId: customerId || "",
    })
    router.push(`/customer/services?${params}`)
  }

  const handleDownloadPDF = async (appointment: CustomerAppointment) => {
    setDownloadingPDF(appointment.id)
    try {
      const services = appointment.appointment_services.map((as) => ({
        name: as.service.name,
        price: Number(as.price),
        duration: as.service.duration,
      }))

      const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)
      const bookingReference = `GB${appointment.id.slice(-8).toUpperCase()}`

      const appointmentData: AppointmentData = {
        id: appointment.id,
        bookingReference,
        customer: {
          name: customerName || "Cliente",
          phone: "", // TODO: Get from customer data
        },
        barber: {
          name: appointment.barber.name,
        },
        store: {
          name: appointment.store.name,
          address: appointment.store.address,
          phone: appointment.store.phone,
        },
        date: new Date(`${appointment.appointment_date}T${appointment.appointment_time}`),
        time: appointment.appointment_time,
        services,
        totalPrice: Number(appointment.final_price),
        discountAmount: appointment.discount_amount > 0 ? Number(appointment.discount_amount) : undefined,
        duration: totalDuration,
      }

      await downloadAppointmentPDF(appointmentData)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Erro ao baixar comprovante. Por favor, tente novamente.")
    } finally {
      setDownloadingPDF(null)
    }
  }

  const handleDownloadICS = (appointment: CustomerAppointment) => {
    setDownloadingICS(appointment.id)
    try {
      const services = appointment.appointment_services.map((as) => ({
        name: as.service.name,
        price: Number(as.price),
        duration: as.service.duration,
      }))

      const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)
      const bookingReference = `GB${appointment.id.slice(-8).toUpperCase()}`

      const appointmentData: AppointmentData = {
        id: appointment.id,
        bookingReference,
        customer: {
          name: customerName || "Cliente",
          phone: "",
        },
        barber: {
          name: appointment.barber.name,
        },
        store: {
          name: appointment.store.name,
          address: appointment.store.address,
          phone: appointment.store.phone,
        },
        date: new Date(`${appointment.appointment_date}T${appointment.appointment_time}`),
        time: appointment.appointment_time,
        services,
        totalPrice: Number(appointment.final_price),
        discountAmount: appointment.discount_amount > 0 ? Number(appointment.discount_amount) : undefined,
        duration: totalDuration,
      }

      downloadAppointmentICS(appointmentData)
    } catch (error) {
      console.error("Error downloading ICS:", error)
      alert("Erro ao gerar evento de calendário. Por favor, tente novamente.")
    } finally {
      setDownloadingICS(null)
    }
  }

  const statusConfig = {
    pending: {
      color: "bg-amber-500/10 text-amber-700 border-amber-500/30",
      label: "Pendente",
      icon: Clock,
    },
    confirmed: {
      color: "bg-blue-500/10 text-blue-700 border-blue-500/30",
      label: "Confirmado",
      icon: CalendarCheck,
    },
    completed: {
      color: "bg-green-500/10 text-green-700 border-green-500/30",
      label: "Concluído",
      icon: CalendarCheck,
    },
    cancelled: {
      color: "bg-red-500/10 text-red-700 border-red-500/30",
      label: "Cancelado",
      icon: X,
    },
    no_show: {
      color: "bg-gray-500/10 text-gray-700 border-gray-500/30",
      label: "Não Compareceu",
      icon: CalendarX,
    },
  }

  const isUpcoming = (appointment: CustomerAppointment) => {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
    const now = new Date()
    return appointmentDateTime > now && ["pending", "confirmed"].includes(appointment.status)
  }

  // Show loading while customer data is being loaded from localStorage
  if (!customerDataLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  // Show error if customer is not logged in (after data is loaded)
  if (!customerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Cliente Não Identificado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Você precisa estar logado para ver seus agendamentos.</p>
            <Link href="/customer/services">
              <Button className="w-full">Fazer um Agendamento</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meus Agendamentos</h1>
              <p className="text-sm text-muted-foreground">
                {appointments.length} {appointments.length === 1 ? "agendamento" : "agendamentos"} no total
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 animate-in slide-in-from-top">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
              <CalendarCheck className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-700">{successMessage}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSuccessMessage("")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Tabs value={activeFilter} onValueChange={(v) => handleFilterChange(v as typeof activeFilter)}>
          <TabsList className="grid w-full grid-cols-4 mb-8 h-auto">
            <TabsTrigger value="all" className="flex flex-col gap-1 py-3">
              <span className="font-semibold">Todos</span>
              <span className="text-xs text-muted-foreground">{appointmentCounts.all}</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex flex-col gap-1 py-3">
              <span className="font-semibold">Próximos</span>
              <span className="text-xs text-muted-foreground">{appointmentCounts.upcoming}</span>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex flex-col gap-1 py-3">
              <span className="font-semibold">Passados</span>
              <span className="text-xs text-muted-foreground">{appointmentCounts.past}</span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex flex-col gap-1 py-3">
              <span className="font-semibold">Cancelados</span>
              <span className="text-xs text-muted-foreground">{appointmentCounts.cancelled}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <CalendarX className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-muted-foreground mb-6">Você ainda não fez nenhum agendamento</p>
                  <Link href="/customer/services">
                    <Button size="lg">
                      <Scissors className="h-4 w-4 mr-2" />
                      Fazer um Agendamento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => {
                const StatusIcon = statusConfig[appointment.status].icon
                const upcoming = isUpcoming(appointment)

                return (
                  <Card
                    key={appointment.id}
                    className={`overflow-hidden transition-all hover:shadow-lg ${
                      upcoming ? "border-primary shadow-md" : ""
                    }`}
                  >
                    {upcoming && (
                      <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" />
                    )}
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Left Section - Date & Time */}
                        <div
                          className={`md:w-48 p-6 flex flex-col justify-center items-center md:border-r ${
                            upcoming ? "bg-primary/5" : "bg-muted/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl font-bold text-foreground">
                              {new Date(appointment.appointment_date).getDate()}
                            </div>
                            <div className="text-sm uppercase text-muted-foreground font-medium">
                              {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1 text-lg font-semibold text-primary">
                              <Clock className="h-4 w-4" />
                              {appointment.appointment_time}
                            </div>
                            <Badge variant="outline" className={`mt-3 ${statusConfig[appointment.status].color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[appointment.status].label}
                            </Badge>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 p-6">
                          <div className="space-y-4">
                            {/* Barber Info */}
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {appointment.barber.name
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold text-foreground">{appointment.barber.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{appointment.store.name}</span>
                                </div>
                              </div>
                            </div>

                            {/* Services */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Scissors className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">Serviços:</span>
                              </div>
                              {appointment.appointment_services.map((as, idx) => (
                                <div key={`${appointment.id}-service-${idx}`} className="flex justify-between text-sm items-center">
                                  <span className="text-muted-foreground">{as.service.name}</span>
                                  <span className="font-medium text-foreground">R$ {Number(as.price).toFixed(2)}</span>
                                </div>
                              ))}
                              {appointment.discount_amount > 0 && (
                                <div className="flex justify-between text-sm items-center text-green-600 border-t pt-2">
                                  <span className="font-medium">Desconto</span>
                                  <span className="font-semibold">- R$ {Number(appointment.discount_amount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-base border-t pt-2">
                                <span>Total</span>
                                <span className="text-primary">R$ {Number(appointment.final_price).toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(appointment)}
                                disabled={downloadingPDF === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingPDF === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-2" />
                                )}
                                Comprovante
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadICS(appointment)}
                                disabled={downloadingICS === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingICS === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Calendar className="h-4 w-4 mr-2" />
                                )}
                                Calendário
                              </Button>
                              {["pending", "confirmed"].includes(appointment.status) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
          <TabsContent value="upcoming" className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <CalendarX className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-muted-foreground mb-6">Você não tem agendamentos futuros</p>
                  <Link href="/customer/services">
                    <Button size="lg">
                      <Scissors className="h-4 w-4 mr-2" />
                      Fazer um Agendamento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => {
                const StatusIcon = statusConfig[appointment.status].icon
                const upcoming = isUpcoming(appointment)

                return (
                  <Card
                    key={appointment.id}
                    className={`overflow-hidden transition-all hover:shadow-lg ${
                      upcoming ? "border-primary shadow-md" : ""
                    }`}
                  >
                    {upcoming && (
                      <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" />
                    )}
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div
                          className={`md:w-48 p-6 flex flex-col justify-center items-center md:border-r ${
                            upcoming ? "bg-primary/5" : "bg-muted/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl font-bold text-foreground">
                              {new Date(appointment.appointment_date).getDate()}
                            </div>
                            <div className="text-sm uppercase text-muted-foreground font-medium">
                              {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1 text-lg font-semibold text-primary">
                              <Clock className="h-4 w-4" />
                              {appointment.appointment_time}
                            </div>
                            <Badge variant="outline" className={`mt-3 ${statusConfig[appointment.status].color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[appointment.status].label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {appointment.barber.name
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold text-foreground">{appointment.barber.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{appointment.store.name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Scissors className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">Serviços:</span>
                              </div>
                              {appointment.appointment_services.map((as, idx) => (
                                <div key={`${appointment.id}-service-${idx}`} className="flex justify-between text-sm items-center">
                                  <span className="text-muted-foreground">{as.service.name}</span>
                                  <span className="font-medium text-foreground">R$ {Number(as.price).toFixed(2)}</span>
                                </div>
                              ))}
                              {appointment.discount_amount > 0 && (
                                <div className="flex justify-between text-sm items-center text-green-600 border-t pt-2">
                                  <span className="font-medium">Desconto</span>
                                  <span className="font-semibold">- R$ {Number(appointment.discount_amount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-base border-t pt-2">
                                <span>Total</span>
                                <span className="text-primary">R$ {Number(appointment.final_price).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(appointment)}
                                disabled={downloadingPDF === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingPDF === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-2" />
                                )}
                                Comprovante
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadICS(appointment)}
                                disabled={downloadingICS === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingICS === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Calendar className="h-4 w-4 mr-2" />
                                )}
                                Calendário
                              </Button>
                              {["pending", "confirmed"].includes(appointment.status) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
          <TabsContent value="past" className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <CalendarX className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-muted-foreground mb-6">Você não tem agendamentos passados</p>
                  <Link href="/customer/services">
                    <Button size="lg">
                      <Scissors className="h-4 w-4 mr-2" />
                      Fazer um Agendamento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => {
                const StatusIcon = statusConfig[appointment.status].icon
                const upcoming = isUpcoming(appointment)

                return (
                  <Card
                    key={appointment.id}
                    className={`overflow-hidden transition-all hover:shadow-lg ${
                      upcoming ? "border-primary shadow-md" : ""
                    }`}
                  >
                    {upcoming && (
                      <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" />
                    )}
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div
                          className={`md:w-48 p-6 flex flex-col justify-center items-center md:border-r ${
                            upcoming ? "bg-primary/5" : "bg-muted/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl font-bold text-foreground">
                              {new Date(appointment.appointment_date).getDate()}
                            </div>
                            <div className="text-sm uppercase text-muted-foreground font-medium">
                              {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1 text-lg font-semibold text-primary">
                              <Clock className="h-4 w-4" />
                              {appointment.appointment_time}
                            </div>
                            <Badge variant="outline" className={`mt-3 ${statusConfig[appointment.status].color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[appointment.status].label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {appointment.barber.name
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold text-foreground">{appointment.barber.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{appointment.store.name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Scissors className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">Serviços:</span>
                              </div>
                              {appointment.appointment_services.map((as, idx) => (
                                <div key={`${appointment.id}-service-${idx}`} className="flex justify-between text-sm items-center">
                                  <span className="text-muted-foreground">{as.service.name}</span>
                                  <span className="font-medium text-foreground">R$ {Number(as.price).toFixed(2)}</span>
                                </div>
                              ))}
                              {appointment.discount_amount > 0 && (
                                <div className="flex justify-between text-sm items-center text-green-600 border-t pt-2">
                                  <span className="font-medium">Desconto</span>
                                  <span className="font-semibold">- R$ {Number(appointment.discount_amount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-base border-t pt-2">
                                <span>Total</span>
                                <span className="text-primary">R$ {Number(appointment.final_price).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(appointment)}
                                disabled={downloadingPDF === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingPDF === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-2" />
                                )}
                                Comprovante
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadICS(appointment)}
                                disabled={downloadingICS === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingICS === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Calendar className="h-4 w-4 mr-2" />
                                )}
                                Calendário
                              </Button>
                              {["pending", "confirmed"].includes(appointment.status) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
          <TabsContent value="cancelled" className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <CalendarX className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-muted-foreground mb-6">Você não tem agendamentos cancelados</p>
                  <Link href="/customer/services">
                    <Button size="lg">
                      <Scissors className="h-4 w-4 mr-2" />
                      Fazer um Agendamento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => {
                const StatusIcon = statusConfig[appointment.status].icon
                const upcoming = isUpcoming(appointment)

                return (
                  <Card
                    key={appointment.id}
                    className={`overflow-hidden transition-all hover:shadow-lg ${
                      upcoming ? "border-primary shadow-md" : ""
                    }`}
                  >
                    {upcoming && (
                      <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" />
                    )}
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div
                          className={`md:w-48 p-6 flex flex-col justify-center items-center md:border-r ${
                            upcoming ? "bg-primary/5" : "bg-muted/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl font-bold text-foreground">
                              {new Date(appointment.appointment_date).getDate()}
                            </div>
                            <div className="text-sm uppercase text-muted-foreground font-medium">
                              {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1 text-lg font-semibold text-primary">
                              <Clock className="h-4 w-4" />
                              {appointment.appointment_time}
                            </div>
                            <Badge variant="outline" className={`mt-3 ${statusConfig[appointment.status].color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[appointment.status].label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {appointment.barber.name
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold text-foreground">{appointment.barber.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{appointment.store.name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Scissors className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">Serviços:</span>
                              </div>
                              {appointment.appointment_services.map((as, idx) => (
                                <div key={`${appointment.id}-service-${idx}`} className="flex justify-between text-sm items-center">
                                  <span className="text-muted-foreground">{as.service.name}</span>
                                  <span className="font-medium text-foreground">R$ {Number(as.price).toFixed(2)}</span>
                                </div>
                              ))}
                              {appointment.discount_amount > 0 && (
                                <div className="flex justify-between text-sm items-center text-green-600 border-t pt-2">
                                  <span className="font-medium">Desconto</span>
                                  <span className="font-semibold">- R$ {Number(appointment.discount_amount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-base border-t pt-2">
                                <span>Total</span>
                                <span className="text-primary">R$ {Number(appointment.final_price).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(appointment)}
                                disabled={downloadingPDF === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingPDF === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-2" />
                                )}
                                Comprovante
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadICS(appointment)}
                                disabled={downloadingICS === appointment.id}
                                className="flex-1 sm:flex-none"
                              >
                                {downloadingICS === appointment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Calendar className="h-4 w-4 mr-2" />
                                )}
                                Calendário
                              </Button>
                              {["pending", "confirmed"].includes(appointment.status) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelClick(appointment)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Informe o motivo do cancelamento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  )
}
