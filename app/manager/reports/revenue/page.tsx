"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { getRevenueReport, type RevenueReport } from "@/lib/reports"
import Link from "next/link"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import { toast } from "sonner"

// TODO: Get from auth
const STORE_ID = "hobnkfghduuspsdvhkla"

export default function RevenueReportPage() {
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    setLoading(true)
    const result = await getRevenueReport(STORE_ID, 6)

    if (result.success && result.report) {
      setReport(result.report)
    } else {
      toast.error(result.error || "Erro ao carregar relatório")
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatório de receita...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erro ao Carregar Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Não foi possível carregar os dados do relatório.</p>
            <Button className="w-full cursor-pointer" onClick={loadReport}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const growthRate = report.previousMonth.revenue > 0
    ? (((report.currentMonth.revenue - report.previousMonth.revenue) / report.previousMonth.revenue) * 100).toFixed(1)
    : "0.0"
  const isPositiveGrowth = Number.parseFloat(growthRate) > 0
  const totalRevenueYTD = report.monthlyData.reduce((sum, m) => sum + m.revenue, 0)
  const projectedNextMonth = report.currentMonth.revenue > 0 ? report.currentMonth.revenue * 1.05 : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/manager/dashboard" className="cursor-pointer">
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Relatório de Receita</h1>
              <p className="text-sm text-muted-foreground">Performance financeira e tendências</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Receita Total (Últimos {report.monthlyData.length} meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {totalRevenueYTD.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Mês Atual ({report.currentMonth.month})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {report.currentMonth.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {isPositiveGrowth ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={isPositiveGrowth ? "text-green-500" : "text-destructive"}>
                  {isPositiveGrowth ? "+" : ""}
                  {growthRate}%
                </span>
                vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Média por Agendamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {report.avgRevenuePerAppointment.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Projeção (Próximo Mês)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {projectedNextMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Baseado em 5% de crescimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend */}
        <Card className="mb-6 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle>Tendência de Receita</CardTitle>
            <CardDescription>Receita mensal nos últimos {report.monthlyData.length} meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Receita (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Revenue Breakdown */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Receita por Serviço</CardTitle>
              <CardDescription>Serviços com melhor performance</CardDescription>
            </CardHeader>
            <CardContent>
              {report.serviceRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.serviceRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum dado de serviço disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Performance dos Serviços</CardTitle>
              <CardDescription>Detalhamento por serviço</CardDescription>
            </CardHeader>
            <CardContent>
              {report.serviceRevenue.length > 0 ? (
                <div className="space-y-4">
                  {report.serviceRevenue.map((service) => (
                    <div key={service.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{service.name}</span>
                        <span className="text-sm font-bold text-primary">
                          R$ {service.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{service.count} agendamentos</span>
                        <span>R$ {service.avgRevenue.toFixed(2)} média</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(service.revenue / report.serviceRevenue[0].revenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum dado de serviço disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
