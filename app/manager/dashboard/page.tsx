"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import { getDashboardStats, type DashboardStats } from "@/lib/manager"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/hooks/use-store"
import { useAuth } from "@/lib/contexts/auth-context"
import { StaffHeader } from "@/components/staff-header"
import type { StaffUser } from "@/lib/auth"

export default function ManagerDashboardPage() {
  const { store, loading: storeLoading } = useStore()
  const { user, userType, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month")

  const staff = user && userType === "staff" ? (user as StaffUser) : null

  useEffect(() => {
    if (store) {
      loadDashboardStats()
    }
  }, [dateRange, store])

  const loadDashboardStats = async () => {
    if (!store) return

    setLoading(true)
    setError(null)

    // Calculate date range
    const now = new Date()
    let startDate: string
    let endDate: string

    switch (dateRange) {
      case "week":
        // Last 7 days from today
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = weekAgo.toISOString().split("T")[0]
        endDate = now.toISOString().split("T")[0]
        break
      case "month":
        // Full current month (from 1st to last day)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
        break
      case "year":
        // Full current year (from Jan 1st to Dec 31st)
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]
        break
    }

    const result = await getDashboardStats(store.id, startDate, endDate)

    if (result.success && result.stats) {
      setStats(result.stats)
    } else {
      setError(result.error || "Erro ao carregar estatísticas")
    }

    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatGrowth = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  if (storeLoading || loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-2">Carregando dashboard...</p>
        </div>
      </div>
    )
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link href="/" className="cursor-pointer flex-shrink-0">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-bold text-foreground truncate">Dashboard do Gerente</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Análises e gestão do negócio</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/manager/barbers" className="cursor-pointer hidden lg:inline-block">
                <Button variant="outline" size="sm" className="bg-transparent cursor-pointer">
                  Barbeiros
                </Button>
              </Link>
              <Link href="/manager/services" className="cursor-pointer hidden lg:inline-block">
                <Button variant="outline" size="sm" className="bg-transparent cursor-pointer">
                  Serviços
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

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 md:mb-6">
          <span className="text-xs md:text-sm font-medium text-muted-foreground">Período:</span>
          <div className="flex gap-2">
            {["week", "month", "year"].map((period) => (
              <Button
                key={period}
                variant={dateRange === period ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(period as typeof dateRange)}
                className="cursor-pointer flex-1 sm:flex-initial"
              >
                {period === "week" ? "Semana" : period === "month" ? "Mês" : "Ano"}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadDashboardStats} variant="outline" className="cursor-pointer">
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
              <Card className="transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs md:text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 flex-wrap">
                    {stats && stats.revenueGrowth >= 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">{formatGrowth(stats.revenueGrowth)}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">{formatGrowth(stats?.revenueGrowth || 0)}</span>
                      </>
                    )}
                    vs período anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs md:text-sm font-medium">Total de Agendamentos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-foreground">{stats?.totalAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {stats && stats.appointmentsGrowth >= 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">{formatGrowth(stats.appointmentsGrowth)}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">{formatGrowth(stats?.appointmentsGrowth || 0)}</span>
                      </>
                    )}
                    vs período anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs md:text-sm font-medium">Barbeiros Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-foreground">{stats?.activeBarbers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activeBarbers === 1 ? "barbeiro ativo" : "barbeiros ativos"}
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs md:text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {stats?.completionRate.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.completedAppointments || 0} concluídos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 mb-6 md:mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Resumo de Agendamentos</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Distribuição por status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-bold">{stats?.totalAppointments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Concluídos</span>
                    <span className="text-lg font-bold text-green-500">{stats?.completedAppointments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pendentes</span>
                    <span className="text-lg font-bold text-amber-500">
                      {(stats?.totalAppointments || 0) - (stats?.completedAppointments || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Receita Média</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Por agendamento concluído</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {stats && stats.completedAppointments > 0
                      ? formatCurrency(stats.totalRevenue / stats.completedAppointments)
                      : "R$ 0,00"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Baseado em {stats?.completedAppointments || 0} agendamentos concluídos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Performance</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Indicadores-chave</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa Conclusão</span>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        (stats?.completionRate || 0) >= 80 ? "text-green-500" : "text-amber-500",
                      )}
                    >
                      {stats?.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Crescimento</span>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        (stats?.revenueGrowth || 0) >= 0 ? "text-green-500" : "text-destructive",
                      )}
                    >
                      {formatGrowth(stats?.revenueGrowth || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Gestão Principal</h2>
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <Link href="/manager/appointments" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Agendamentos
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Visualizar e gerenciar todos os agendamentos</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/manager/customers" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Clientes
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Análise de clientes e recorrência</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/manager/barbers" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Barbeiros
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Adicionar, editar ou remover barbeiros</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/manager/services" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Serviços
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Adicionar, editar ou remover serviços</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/manager/coupons" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Cupons
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Gerenciar cupons de desconto</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/manager/loyalty" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Fidelidade
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Programa de fidelidade</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>

              <div>
                <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Configurações</h2>
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <Link href="/manager/settings" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Loja
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Informações e contato da loja</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/manager/hours" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Horários
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Horário de funcionamento</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/manager/users" className="cursor-pointer">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          Usuários
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Gerenciar permissões e funções</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
