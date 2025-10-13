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

// TODO: Get from auth
const STORE_ID = "hobnkfghduuspsdvhkla"

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month")

  useEffect(() => {
    loadDashboardStats()
  }, [dateRange])

  const loadDashboardStats = async () => {
    setLoading(true)
    setError(null)

    // Calculate date range
    const now = new Date()
    let startDate: string
    let endDate = now.toISOString().split("T")[0]

    switch (dateRange) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = weekAgo.toISOString().split("T")[0]
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        break
    }

    const result = await getDashboardStats(STORE_ID, startDate, endDate)

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
                <h1 className="text-xl font-bold text-foreground">Dashboard do Gerente</h1>
                <p className="text-sm text-muted-foreground">Análises e gestão do negócio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/manager/barbers" className="cursor-pointer">
                <Button variant="outline" className="bg-transparent cursor-pointer">
                  Gerenciar Barbeiros
                </Button>
              </Link>
              <Link href="/manager/services" className="cursor-pointer">
                <Button variant="outline" className="bg-transparent cursor-pointer">
                  Gerenciar Serviços
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <div className="flex gap-2">
            {["week", "month", "year"].map((period) => (
              <Button
                key={period}
                variant={dateRange === period ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(period as typeof dateRange)}
                className="cursor-pointer"
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
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
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.totalAppointments || 0}</div>
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
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Barbeiros Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.activeBarbers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activeBarbers === 1 ? "barbeiro ativo" : "barbeiros ativos"}
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats?.completionRate.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.completedAppointments || 0} concluídos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Agendamentos</CardTitle>
                  <CardDescription>Distribuição por status</CardDescription>
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
                <CardHeader>
                  <CardTitle>Receita Média</CardTitle>
                  <CardDescription>Por agendamento concluído</CardDescription>
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
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>Indicadores-chave</CardDescription>
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
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/manager/barbers" className="cursor-pointer">
                <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Gerenciar Barbeiros
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Adicionar, editar ou remover barbeiros</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/manager/services" className="cursor-pointer">
                <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Gerenciar Serviços
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Adicionar, editar ou remover serviços</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/manager/coupons" className="cursor-pointer">
                <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-105">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Cupons e Promoções
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Gerenciar cupons de desconto</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
