"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, TrendingUp, Clock, Users } from "lucide-react"
import { mockBarbers, mockAppointments } from "@/lib/mock-data"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

export default function ProductivityReportPage() {
  const barberStats = mockBarbers.map((barber) => {
    const appointments = mockAppointments.filter((apt) => apt.barberId === barber.id)
    const completed = appointments.filter((apt) => apt.status === "completed")
    const totalHours = appointments.reduce((sum, apt) => sum + apt.duration, 0) / 60
    const completionRate = appointments.length > 0 ? (completed.length / appointments.length) * 100 : 0

    return {
      ...barber,
      totalAppointments: appointments.length,
      completedAppointments: completed.length,
      totalHours: totalHours.toFixed(1),
      completionRate: completionRate.toFixed(1),
      avgRating: barber.rating,
    }
  })

  const chartData = barberStats.map((stat) => ({
    name: stat.name.split(" ")[0],
    appointments: stat.totalAppointments,
    completed: stat.completedAppointments,
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/manager/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Productivity Report</h1>
              <p className="text-sm text-muted-foreground">Barber performance and efficiency metrics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Appointment Completion Overview</CardTitle>
            <CardDescription>Total vs completed appointments by barber</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Completed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Barber Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {barberStats.map((stat) => (
            <Card key={stat.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={stat.avatar || "/placeholder.svg"} alt={stat.name} />
                    <AvatarFallback>
                      {stat.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{stat.name}</CardTitle>
                    <CardDescription>⭐ {stat.avgRating} rating</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Total Appointments</span>
                    </div>
                    <span className="font-semibold text-foreground">{stat.totalAppointments}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Completion Rate</span>
                    </div>
                    <span className="font-semibold text-green-500">{stat.completionRate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Total Hours</span>
                    </div>
                    <span className="font-semibold text-foreground">{stat.totalHours}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
