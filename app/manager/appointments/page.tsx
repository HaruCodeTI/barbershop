"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, DollarSign, TrendingUp, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/hooks/use-store"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/manager/data-table"
import { StatusBadge } from "@/components/manager/status-badge"
import {
  getAppointments,
  getAppointmentStats,
  updateAppointmentStatus,
  cancelAppointment,
} from "@/lib/manager-appointments"
import type { AppointmentWithDetails } from "@/types/manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function AppointmentsPage() {
  const { store } = useStore()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    totalRevenue: 0,
    avgTicket: 0,
  })
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [cancelDialog, setCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [store])

  const loadData = async () => {
    if (!store) return
    setLoading(true)

    // Load appointments
    const aptResult = await getAppointments(store.id)
    if (aptResult.success && aptResult.data) {
      setAppointments(aptResult.data)
      setFilteredAppointments(aptResult.data)
    } else {
      toast.error(aptResult.error || "Erro ao carregar agendamentos")
    }

    // Load stats
    const statsResult = await getAppointmentStats(store.id)
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }

    setLoading(false)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === "all") {
      setFilteredAppointments(appointments)
    } else {
      setFilteredAppointments(appointments.filter((apt) => apt.status === tab))
    }
  }

  const handleStatusChange = async (appointmentId: string, newStatus: any) => {
    setProcessing(true)
    const result = await updateAppointmentStatus(appointmentId, newStatus)
    if (result.success) {
      toast.success("Status atualizado com sucesso!")
      loadData()
    } else {
      toast.error(result.error || "Erro ao atualizar status")
    }
    setProcessing(false)
  }

  const handleCancelClick = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
    setCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return
    setProcessing(true)

    const result = await cancelAppointment(selectedAppointment.id, cancelReason)
    if (result.success) {
      toast.success("Agendamento cancelado com sucesso!")
      setCancelDialog(false)
      setCancelReason("")
      setSelectedAppointment(null)
      loadData()
    } else {
      toast.error(result.error || "Erro ao cancelar agendamento")
    }
    setProcessing(false)
  }

  const columns: Column<AppointmentWithDetails>[] = [
    {
      key: "appointment_date",
      label: "Data/Hora",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium">
            {new Date(row.appointment_date).toLocaleDateString("pt-BR")}
          </div>
          <div className="text-sm text-muted-foreground">{row.appointment_time}</div>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Cliente",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium">{row.customer.name}</div>
          <div className="text-sm text-muted-foreground">{row.customer.phone}</div>
        </div>
      ),
    },
    {
      key: "barber",
      label: "Barbeiro",
      sortable: true,
      render: (row) => <span className="font-medium">{row.barber.name}</span>,
    },
    {
      key: "services",
      label: "Serviços",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.services.map((service, idx) => (
            <Badge key={`${service.id}-${idx}`} variant="outline" className="text-xs">
              {service.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "final_price",
      label: "Valor",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-primary">R$ {row.final_price.toFixed(2)}</span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      render: (row) => (
        <div className="flex gap-2">
          {row.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(row.id, "confirmed")}
              disabled={processing}
              className="cursor-pointer"
            >
              Confirmar
            </Button>
          )}
          {row.status === "confirmed" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStatusChange(row.id, "completed")}
              disabled={processing}
              className="cursor-pointer"
            >
              Concluir
            </Button>
          )}
          {(row.status === "pending" || row.status === "confirmed") && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleCancelClick(row)}
              disabled={processing}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager/dashboard" className="cursor-pointer">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Gestão de Agendamentos</h1>
                <p className="text-sm text-muted-foreground">Visualize e gerencie todos os agendamentos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Agendamentos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Users className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                  <p className="text-xs text-muted-foreground">Prontos para atender</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Receita</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {stats.totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ticket médio: R$ {stats.avgTicket.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs & Table */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmados ({stats.confirmed})</TabsTrigger>
                <TabsTrigger value="completed">Concluídos ({stats.completed})</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelados ({stats.cancelled})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <DataTable
                  data={filteredAppointments}
                  columns={columns}
                  searchPlaceholder="Buscar por cliente, telefone ou barbeiro..."
                  emptyMessage="Nenhum agendamento encontrado"
                  pageSize={25}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
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
                placeholder="Digite o motivo..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog(false)}
              disabled={processing}
              className="cursor-pointer"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={processing}
              className="cursor-pointer"
            >
              {processing ? (
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
