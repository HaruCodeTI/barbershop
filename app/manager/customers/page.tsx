"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, TrendingUp, Star, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/hooks/use-store"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/manager/data-table"
import { getCustomers, getCustomerStats } from "@/lib/manager-customers"
import type { CustomerWithStats } from "@/types/manager"

export default function CustomersPage() {
  const { store } = useStore()
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
    returning: 0,
    vip: 0,
    avgLifetimeValue: 0,
    avgLoyaltyPoints: 0,
  })

  useEffect(() => {
    loadData()
  }, [store])

  const loadData = async () => {
    if (!store) return
    setLoading(true)

    const result = await getCustomers(store.id, { sortBy: "total_spent" })
    if (result.success && result.data) {
      setCustomers(result.data)
    } else {
      toast.error(result.error || "Erro ao carregar clientes")
    }

    const statsResult = await getCustomerStats(store.id)
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }

    setLoading(false)
  }

  const getRecurrenceBadge = (type: "new" | "returning" | "vip") => {
    const config = {
      new: { label: "Novo", className: "bg-blue-500/10 text-blue-600 border-blue-500" },
      returning: { label: "Recorrente", className: "bg-green-500/10 text-green-600 border-green-500" },
      vip: { label: "VIP", className: "bg-purple-500/10 text-purple-600 border-purple-500" },
    }
    const { label, className } = config[type]
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  const columns: Column<CustomerWithStats>[] = [
    {
      key: "name",
      label: "Cliente",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.phone}</div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.email || "Não informado"}</span>
      ),
    },
    {
      key: "total_appointments",
      label: "Agendamentos",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold">{row.total_appointments}</div>
          <div className="text-xs text-muted-foreground">{row.completed_appointments} concluídos</div>
        </div>
      ),
    },
    {
      key: "total_spent",
      label: "Total Gasto",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-primary">R$ {row.total_spent.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">
            Média: R$ {row.avg_ticket.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      key: "loyalty_points",
      label: "Pontos",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="font-semibold">{row.loyalty_points}</span>
        </div>
      ),
    },
    {
      key: "last_appointment_date",
      label: "Última Visita",
      sortable: true,
      render: (row) =>
        row.last_appointment_date ? (
          <span className="text-sm">
            {new Date(row.last_appointment_date).toLocaleDateString("pt-BR")}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Nunca</span>
        ),
    },
    {
      key: "recurrence_type",
      label: "Tipo",
      sortable: true,
      render: (row) => getRecurrenceBadge(row.recurrence_type),
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
                <h1 className="text-xl font-bold text-foreground">Gestão de Clientes</h1>
                <p className="text-sm text-muted-foreground">Analise o comportamento e recorrência dos clientes</p>
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
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">{stats.newThisMonth} novos este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Recorrentes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.returning}</div>
                  <p className="text-xs text-muted-foreground">2+ visitas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
                  <Star className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.vip}</div>
                  <p className="text-xs text-muted-foreground">10+ visitas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    R$ {stats.avgLifetimeValue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Média por cliente</p>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <DataTable
              data={customers}
              columns={columns}
              searchPlaceholder="Buscar por nome, telefone ou email..."
              emptyMessage="Nenhum cliente encontrado"
              pageSize={25}
            />
          </>
        )}
      </main>
    </div>
  )
}
