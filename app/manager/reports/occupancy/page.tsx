"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Loader2 } from "lucide-react"
import { getOccupancyReport, type OccupancyReport } from "@/lib/reports"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// TODO: Get from auth
const STORE_ID = "hobnkfghduuspsdvhkla"

export default function OccupancyReportPage() {
  const [report, setReport] = useState<OccupancyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    setLoading(true)
    const result = await getOccupancyReport(STORE_ID)

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
          <p className="text-muted-foreground">Carregando relatório de ocupação...</p>
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

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-green-500"
    if (rate >= 60) return "text-primary"
    if (rate >= 40) return "text-amber-500"
    return "text-destructive"
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
              <h1 className="text-xl font-bold text-foreground">Relatório de Ocupação</h1>
              <p className="text-sm text-muted-foreground">Taxas de reserva e utilização de capacidade</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Ocupação Geral</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", getOccupancyColor(report.overallOccupancy))}>
                {report.overallOccupancy}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Total de Vagas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{report.totalSlots}</div>
              <p className="text-xs text-muted-foreground mt-1">Disponíveis esta semana</p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Vagas Reservadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{report.bookedSlots}</div>
              <p className="text-xs text-muted-foreground mt-1">{report.totalSlots - report.bookedSlots} restantes</p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Dia de Pico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{report.peakDay}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">Maior taxa</span> de ocupação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Occupancy */}
        <Card className="mb-6 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle>Taxa de Ocupação Semanal</CardTitle>
            <CardDescription>Taxas de reserva por dia da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Taxa"]}
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {report.weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.rate >= 80
                          ? "hsl(var(--chart-2))"
                          : entry.rate >= 60
                            ? "hsl(var(--primary))"
                            : "hsl(var(--chart-1))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Barber Occupancy */}
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Utilização por Barbeiro</CardTitle>
              <CardDescription>Taxas de ocupação individuais</CardDescription>
            </CardHeader>
            <CardContent>
              {report.barberOccupancy.length > 0 ? (
                <div className="space-y-4">
                  {report.barberOccupancy.map((barber) => (
                    <div key={barber.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{barber.name}</span>
                        <span className={cn("text-sm font-bold", getOccupancyColor(barber.rate))}>{barber.rate}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{barber.appointments} agendamentos</span>
                        <span>{barber.hours}h horas</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            barber.rate >= 80
                              ? "bg-green-500"
                              : barber.rate >= 60
                                ? "bg-primary"
                                : barber.rate >= 40
                                  ? "bg-amber-500"
                                  : "bg-destructive",
                          )}
                          style={{ width: `${barber.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum dado de barbeiro disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Horários de Pico</CardTitle>
              <CardDescription>Horários mais movimentados do dia</CardDescription>
            </CardHeader>
            <CardContent>
              {report.peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" angle={-45} textAnchor="end" height={60} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} agendamentos`, "Reservas"]}
                    />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum dado de horário disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
