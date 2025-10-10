"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp } from "lucide-react"
import { mockBarbers, mockAppointments } from "@/lib/mock-data"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { cn } from "@/lib/utils"

export default function OccupancyReportPage() {
  // Calculate occupancy metrics
  const totalSlots = 20 * 7 // 20 slots per day, 7 days
  const bookedSlots = mockAppointments.length
  const occupancyRate = ((bookedSlots / totalSlots) * 100).toFixed(1)

  // Weekly occupancy data
  const weeklyData = [
    { day: "Monday", booked: 15, available: 5, rate: 75 },
    { day: "Tuesday", booked: 12, available: 8, rate: 60 },
    { day: "Wednesday", booked: 14, available: 6, rate: 70 },
    { day: "Thursday", booked: 16, available: 4, rate: 80 },
    { day: "Friday", booked: 18, available: 2, rate: 90 },
    { day: "Saturday", booked: 20, available: 0, rate: 100 },
    { day: "Sunday", booked: 0, available: 20, rate: 0 },
  ]

  // Barber occupancy
  const barberOccupancy = mockBarbers.map((barber) => {
    const appointments = mockAppointments.filter((apt) => apt.barberId === barber.id)
    const totalHours = appointments.reduce((sum, apt) => sum + apt.duration, 0) / 60
    const availableHours = 8 * 6 // 8 hours per day, 6 days
    const occupancyRate = ((totalHours / availableHours) * 100).toFixed(1)

    return {
      name: barber.name,
      appointments: appointments.length,
      hours: totalHours.toFixed(1),
      rate: Number.parseFloat(occupancyRate),
    }
  })

  // Peak hours data
  const peakHours = [
    { hour: "9:00", bookings: 2 },
    { hour: "10:00", bookings: 5 },
    { hour: "11:00", bookings: 8 },
    { hour: "12:00", bookings: 6 },
    { hour: "13:00", bookings: 4 },
    { hour: "14:00", bookings: 7 },
    { hour: "15:00", bookings: 9 },
    { hour: "16:00", bookings: 10 },
    { hour: "17:00", bookings: 8 },
    { hour: "18:00", bookings: 5 },
  ]

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
            <Link href="/manager/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Occupancy Report</h1>
              <p className="text-sm text-muted-foreground">Booking rates and capacity utilization</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overall Occupancy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", getOccupancyColor(Number.parseFloat(occupancyRate)))}>
                {occupancyRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Slots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalSlots}</div>
              <p className="text-xs text-muted-foreground mt-1">Available this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Booked Slots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{bookedSlots}</div>
              <p className="text-xs text-muted-foreground mt-1">{totalSlots - bookedSlots} remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Peak Day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">Saturday</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">100%</span> occupancy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Occupancy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weekly Occupancy Rate</CardTitle>
            <CardDescription>Booking rates by day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
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
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {weeklyData.map((entry, index) => (
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
          <Card>
            <CardHeader>
              <CardTitle>Barber Utilization</CardTitle>
              <CardDescription>Individual barber occupancy rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {barberOccupancy.map((barber) => (
                  <div key={barber.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{barber.name}</span>
                      <span className={cn("text-sm font-bold", getOccupancyColor(barber.rate))}>{barber.rate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{barber.appointments} appointments</span>
                      <span>{barber.hours} hours</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full",
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
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
              <CardDescription>Busiest times of the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-xs" angle={-45} textAnchor="end" height={60} />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
