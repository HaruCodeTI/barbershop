"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import { mockAppointments, mockServices } from "@/lib/mock-data"
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

export default function RevenueReportPage() {
  // Calculate revenue metrics
  const totalRevenue = mockAppointments.reduce((sum, apt) => sum + apt.price, 0)
  const avgRevenuePerAppointment = totalRevenue / mockAppointments.length

  // Mock monthly data
  const monthlyData = [
    { month: "Jan", revenue: 12500, appointments: 145 },
    { month: "Feb", revenue: 13200, appointments: 152 },
    { month: "Mar", revenue: 14800, appointments: 168 },
    { month: "Apr", revenue: 13900, appointments: 159 },
    { month: "May", revenue: 15600, appointments: 178 },
    { month: "Jun", revenue: 16200, appointments: 185 },
  ]

  // Service revenue breakdown
  const serviceRevenue = mockServices
    .map((service) => {
      const serviceAppointments = mockAppointments.filter((apt) => apt.serviceIds.includes(service.id))
      const revenue = serviceAppointments.length * service.price
      return {
        name: service.name,
        revenue,
        count: serviceAppointments.length,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]
  const growthRate = (((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100).toFixed(1)
  const isPositiveGrowth = Number.parseFloat(growthRate) > 0

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
              <h1 className="text-xl font-bold text-foreground">Revenue Report</h1>
              <p className="text-sm text-muted-foreground">Financial performance and trends</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Revenue (YTD)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${monthlyData.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${currentMonth.revenue.toLocaleString()}</div>
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
                vs last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg per Appointment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${avgRevenuePerAppointment.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Projected (Next Month)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${(currentMonth.revenue * 1.05).toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Based on 5% growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Revenue Breakdown */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Service</CardTitle>
              <CardDescription>Top performing services</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
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

          <Card>
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>Detailed breakdown by service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRevenue.map((service) => (
                  <div key={service.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                      <span className="text-sm font-bold text-primary">${service.revenue}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{service.count} bookings</span>
                      <span>${(service.revenue / service.count).toFixed(0)} avg</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(service.revenue / serviceRevenue[0].revenue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
