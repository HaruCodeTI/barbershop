"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, TrendingUp, Clock, Users, Loader2 } from "lucide-react"
import { getProductivityReport, type ProductivityReport } from "@/lib/reports"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { toast } from "sonner"

// TODO: Get from auth
const STORE_ID = "hobnkfghduuspsdvhkla"

export default function ProductivityReportPage() {
  const [report, setReport] = useState<ProductivityReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    setLoading(true)
    const result = await getProductivityReport(STORE_ID)

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
          <p className="text-muted-foreground">Carregando relatório de produtividade...</p>
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
              <h1 className="text-xl font-bold text-foreground">Relatório de Produtividade</h1>
              <p className="text-sm text-muted-foreground">Performance e métricas de eficiência dos barbeiros</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Chart */}
        <Card className="mb-6 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle>Visão Geral de Conclusão de Agendamentos</CardTitle>
            <CardDescription>Total vs completados por barbeiro (últimos 30 dias)</CardDescription>
          </CardHeader>
          <CardContent>
            {report.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="appointments" fill="hsl(var(--primary))" name="Total" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Completados" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barber Stats */}
        {report.barberStats.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {report.barberStats.map((stat) => (
              <Card key={stat.id} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={stat.avatar_url || "/placeholder.svg"} alt={stat.name} />
                      <AvatarFallback>
                        {stat.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{stat.name}</CardTitle>
                      <CardDescription>⭐ {stat.avgRating.toFixed(1)} avaliação</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Total de Agendamentos</span>
                      </div>
                      <span className="font-semibold text-foreground">{stat.totalAppointments}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Taxa de Conclusão</span>
                      </div>
                      <span className="font-semibold text-green-500">{stat.completionRate}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Total de Horas</span>
                      </div>
                      <span className="font-semibold text-foreground">{stat.totalHours}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Nenhum barbeiro encontrado</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
