"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, ArrowUpRight } from "lucide-react"
import { mockAppointments, mockBarbers } from "@/lib/mock-data"
import Link from "next/link"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export default function ManagerDashboardPage() {
  // Calculate metrics
  const totalRevenue = mockAppointments.reduce((sum, apt) => sum + apt.price, 0)
  const totalAppointments = mockAppointments.length
  const completedAppointments = mockAppointments.filter((apt) => apt.status === "completed").length
  const completionRate = ((completedAppointments / totalAppointments) * 100).toFixed(1)

  // Mock data for charts
  const revenueData = [
    { day: "Mon", revenue: 450 },
    { day: "Tue", revenue: 680 },
    { day: "Wed", revenue: 520 },
    { day: "Thu", revenue: 750 },
    { day: "Fri", revenue: 890 },
    { day: "Sat", revenue: 1200 },
    { day: "Sun", revenue: 0 },
  ]

  const barberPerformance = mockBarbers.map((barber) => {
    const barberAppointments = mockAppointments.filter((apt) => apt.barberId === barber.id)
    const revenue = barberAppointments.reduce((sum, apt) => sum + apt.price, 0)
    return {
      name: barber.name.split(" ")[0],
      appointments: barberAppointments.length,
      revenue,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Manager Dashboard</h1>
                <p className="text-sm text-muted-foreground">Business analytics and management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/manager/barbers">
                <Button variant="outline" className="bg-transparent">
                  Manage Barbers
                </Button>
              </Link>
              <Link href="/manager/services">
                <Button variant="outline" className="bg-transparent">
                  Manage Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalAppointments}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+8.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockBarbers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All barbers active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">{completedAppointments} completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
              <CardDescription>Revenue breakdown by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Barber Performance</CardTitle>
              <CardDescription>Appointments and revenue by barber</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barberPerformance}>
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
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/manager/reports/productivity">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Productivity Report
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>View detailed barber productivity metrics</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/manager/reports/revenue">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Revenue Report
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Analyze revenue trends and forecasts</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/manager/reports/occupancy">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Occupancy Report
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Track booking rates and availability</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
